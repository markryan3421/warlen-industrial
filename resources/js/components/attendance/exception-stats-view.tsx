import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  X,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, addDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Field, FieldLabel } from '../ui/field';

interface ExceptionRecord {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;                // YYYY-MM-DD
  am_time_in: string | null;
  am_time_out: string | null;
  pm_time_in: string | null;
  pm_time_out: string | null;
  late_minutes: number | null;
  leave_early_minutes: number | null;
  absence_minutes: number | null;
  total_exception_minutes: number | null;
}

interface ExceptionStatsTimelineProps {
  exceptions: ExceptionRecord[];
  className?: string;
  onExceptionClick?: (exception: ExceptionRecord) => void;
}

interface DateRangePickerProps {
  value: { start: Date; end: Date };
  onChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{ from?: Date; to?: Date }>({
    from: value.start,
    to: value.end,
  });

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setTempRange(range ?? {});
  };

  const handleApply = () => {
    if (tempRange.from && tempRange.to) {
      onChange({ start: tempRange.from, end: tempRange.to });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start px-3 font-normal w-full sm:w-auto border-slate-200 hover:border-[#1d4791]/30 hover:text-[#1d4791] transition-colors',
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4 text-[#1d4791]" />
          <span className="truncate">
            {format(value.start, 'MMM dd, yyyy')} – {format(value.end, 'MMM dd, yyyy')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-slate-200" align="start">
        <div className="p-3">
          <CalendarComponent
            mode="range"
            defaultMonth={value.start}
            selected={tempRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="rounded-lg"
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!tempRange.from || !tempRange.to}
              className="bg-[#1d4791] hover:bg-[#1d4791]/90 text-white"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

type ExceptionType = 'all' | 'late' | 'on-time' | 'absent' | 'present';
type AttendanceLabel = 'on-time' | 'late' | 'absent' | 'partial' | 'half-day' | 'early' | 'present';

const MORNING_ON_TIME = 7 * 60 + 30;      // 07:30
const MORNING_LATE_END = 8 * 60;          // 08:00
const MORNING_ABSENT = 8 * 60 + 1;        // 08:01
const MORNING_OUT = 11 * 60 + 30;         // 11:30
const AFTERNOON_IN = 13 * 60;             // 13:00
const AFTERNOON_ABSENT = 13 * 60 + 30;    // 13:30
const AFTERNOON_OUT = 17 * 60;            // 17:00

const getAttendanceLabel = (record: ExceptionRecord): AttendanceLabel => {
  const amIn = toMinutes(record.am_time_in);
  const amOut = toMinutes(record.am_time_out);
  const pmIn = toMinutes(record.pm_time_in);
  const pmOut = toMinutes(record.pm_time_out);

  // ----- ABSENT -----
  if (!amIn && !pmIn) return 'absent';
  if (amIn && amIn >= MORNING_ABSENT) return 'absent';
  if (pmIn && pmIn >= AFTERNOON_ABSENT) return 'absent';

  // ----- ON‑TIME (full day, on time) -----
  if (amIn && amIn <= MORNING_ON_TIME && pmOut && pmOut >= AFTERNOON_OUT) {
    return 'on-time';
  }

  // ----- LATE (full day, late arrival, on‑time departure) -----
  if (amIn && amIn > MORNING_ON_TIME && amIn <= MORNING_LATE_END && pmOut && pmOut >= AFTERNOON_OUT) {
    return 'late';
  }

  // ----- EARLY LEAVE (full day, on‑time arrival, early departure) -----
  if (amIn && amIn <= MORNING_ON_TIME && pmOut && pmOut < AFTERNOON_OUT) {
    return 'early';
  }

  // ----- HALF‑DAY (morning only) -----
  if (amIn && amOut && amOut >= MORNING_OUT && !pmIn && !pmOut) {
    return 'half-day';
  }

  // ----- HALF‑DAY (afternoon only) -----
  if (pmIn && pmOut && pmOut >= AFTERNOON_OUT && !amIn && !amOut) {
    return 'half-day';
  }

  // ----- PARTIAL (missing either in or out in any shift) -----
  if ((amIn && !amOut) || (pmIn && !pmOut) || (amOut && !amIn) || (pmOut && !pmIn)) {
    return 'partial';
  }

  // ----- FALLBACK (shouldn't happen in exception stats) -----
  return 'present';
};

// Helper functions
const formatMinutes = (minutes: number | null) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatTime = (time: string | null) => {
  if (!time) return null;
  const t = time.includes(' ') ? time.split(' ')[1] : time;
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const toMinutes = (time: string | null): number | null => {
  if (!time) return null;
  // Extract HH:MM from any format (e.g., "2025-10-01 07:02:00" or "07:02")
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    return h * 60 + m;
  }
  return null;
};

// Timeline bar component for a single record
function ExceptionTimelineBar({ record }: { record: ExceptionRecord }) {
  const amIn = toMinutes(record.am_time_in);
  const amOut = toMinutes(record.am_time_out);
  const pmIn = toMinutes(record.pm_time_in);
  const pmOut = toMinutes(record.pm_time_out);

  const hasAnyPunch = amIn || amOut || pmIn || pmOut;

  // No punches → full‑day absent (red bar)
  if (!hasAnyPunch) {
    return (
      <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden mt-2">
        <div className="absolute inset-0 bg-rose-200/50" />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-rose-700">
          Absent
        </div>
      </div>
    );
  }

  // Define shift boundaries (same as in getAttendanceLabel)
  const MORNING_ON_TIME = 7 * 60 + 30;      // 07:30
  const AFTERNOON_OUT = 17 * 60;            // 17:00
  const startMinutes = 7 * 60;               // 7:00 AM (start of shift display)
  const endMinutes = 17 * 60;                 // 5:00 PM (end of shift display)
  const totalShiftMinutes = endMinutes - startMinutes;

  // Compute late minutes (if any)
  let lateMinutes = 0;
  if (amIn && amIn > MORNING_ON_TIME) {
    // Assume if amIn > MORNING_ON_TIME, it's late (up to 30 mins, beyond that is absent)
    lateMinutes = Math.min(amIn - MORNING_ON_TIME, 30);
  }

  // Compute early leave minutes (if any)
  let earlyMinutes = 0;
  if (pmOut && pmOut < AFTERNOON_OUT) {
    earlyMinutes = AFTERNOON_OUT - pmOut;
  }

  // Determine the worked period (for the light blue bar)
  const workStart = amIn || pmIn || startMinutes;
  const workEnd = pmOut || amOut || endMinutes;
  // Ensure workStart <= workEnd
  const safeWorkStart = Math.min(workStart, workEnd);
  const safeWorkEnd = Math.max(workStart, workEnd);

  return (
    <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden mt-2">
      {/* Worked period bar (light blue) */}
      <div
        className="absolute top-1 bottom-1 bg-[#1d4791]/20 rounded-full"
        style={{
          left: `${((safeWorkStart - startMinutes) / totalShiftMinutes) * 100}%`,
          width: `${((safeWorkEnd - safeWorkStart) / totalShiftMinutes) * 100}%`,
        }}
      />

      {/* Late marker (if any) */}
      {lateMinutes > 0 && amIn && (
        <div
          className="absolute top-0 bottom-0 bg-amber-400/30"
          style={{
            left: `${((amIn - startMinutes) / totalShiftMinutes) * 100}%`,
            width: `${(lateMinutes / totalShiftMinutes) * 100}%`,
          }}
        />
      )}

      {/* Early leave marker (if any) */}
      {earlyMinutes > 0 && pmOut && (
        <div
          className="absolute top-0 bottom-0 bg-blue-400/30"
          style={{
            left: `${((pmOut - startMinutes) / totalShiftMinutes) * 100}%`,
            width: `${(earlyMinutes / totalShiftMinutes) * 100}%`,
          }}
        />
      )}

      {/* Time markers (7am, 12pm, 5pm) */}
      <div className="absolute top-0 bottom-0 w-px bg-slate-300 left-0" />
      <div className="absolute top-0 bottom-0 w-px bg-slate-300 left-1/2" />
      <div className="absolute top-0 bottom-0 w-px bg-slate-300 right-0" />
    </div>
  );
}

// Main component
export function ExceptionStatsTimeline({
  exceptions = [],
  className,
  onExceptionClick,
}: ExceptionStatsTimelineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<ExceptionType>('all');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = subDays(end, 30);
    return { start, end };
  });
  const [showFilters, setShowFilters] = useState(false);

  const departments = useMemo(
    () => Array.from(new Set(exceptions.map(e => e.department).filter(Boolean))),
    [exceptions]
  );

  const filteredExceptions = useMemo(() => {
    return exceptions.filter(record => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!record.employee_name.toLowerCase().includes(term) &&
          !record.employee_id.toLowerCase().includes(term)) {
          return false;
        }
      }
      if (selectedDepartment !== 'all' && record.department !== selectedDepartment) {
        return false;
      }
      if (selectedType !== 'all') {
        const label = getAttendanceLabel(record);
        if (label !== selectedType) return false;
      }
      const recordDate = new Date(record.date);
      return recordDate >= dateRange.start && recordDate <= dateRange.end;
    });
  }, [exceptions, searchTerm, selectedDepartment, selectedType, dateRange]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ExceptionRecord[]> = {};
    filteredExceptions.forEach(record => {
      if (!groups[record.date]) groups[record.date] = [];
      groups[record.date].push(record);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredExceptions]);

  const stats = useMemo(() => {
    let total = 0, onTime = 0, late = 0, absent = 0;
    filteredExceptions.forEach(record => {
      total++;
      const label = getAttendanceLabel(record);
      if (label === 'on-time') onTime++;
      else if (label === 'late') late++;
      else if (label === 'absent') absent++;
    });
    return { total, onTime, late, absent };
  }, [filteredExceptions]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedType('all');
    setDateRange({ start: subDays(new Date(), 30), end: new Date() });
  };

  const hasActiveFilters = searchTerm || selectedDepartment !== 'all' || selectedType !== 'all';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1d4791]/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#1d4791]" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Exception Statistics</h2>
            {hasActiveFilters && (
              <Badge className="bg-[#d85e39] text-white border-0 ml-2">Filtered</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'gap-2 text-slate-600 hover:text-[#1d4791] hover:bg-[#1d4791]/5',
              showFilters && 'bg-[#1d4791]/10 text-[#1d4791]'
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-4 sm:px-5 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full sm:w-[180px] h-9">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ExceptionType)}>
                <SelectTrigger className="w-full sm:w-[150px] h-9">
                  <SelectValue placeholder="Exception Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="on-time">On Time</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-[#d85e39] hover:text-[#d85e39]/80 hover:bg-[#d85e39]/10 w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/50">
          <StatCard
            icon={<Users className="w-4 h-4" />}
            label="Total"
            value={stats.total}
            variant="navy"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="On Time"
            value={stats.onTime}
            variant="emerald"
          />
          <StatCard
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Late"
            value={stats.late}
            variant="amber"
          />
          <StatCard
            icon={<X className="w-4 h-4" />}
            label="Absent"
            value={stats.absent}
            variant="rose"
          />
        </div>
      </div>

      {/* Timeline List */}
      <ScrollArea className="h-[600px] rounded-xl border border-slate-200 bg-white shadow-sm">
        {groupedByDate.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">No exceptions found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groupedByDate.map(([date, records]) => (
              <div key={date} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                {/* Date Header */}
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-[#1d4791]" />
                  <Calendar className="w-4 h-4 text-[#1d4791]" />
                  <h3 className="text-sm font-semibold text-slate-700">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {records.length} {records.length === 1 ? 'exception' : 'exceptions'}
                  </Badge>
                </div>

                {/* Records */}
                <div className="space-y-2 pl-4">
                  {records.map(record => {
                    const label = getAttendanceLabel(record);
                    const badgeColor = {
                      'on-time': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      'late': 'bg-amber-100 text-amber-700 border-amber-200',
                      'absent': 'bg-rose-100 text-rose-700 border-rose-200',
                      'partial': 'bg-slate-100 text-slate-600 border-slate-200',
                      'half-day': 'bg-blue-100 text-blue-700 border-blue-200',
                      'early': 'bg-blue-100 text-blue-700 border-blue-200',
                      'present': 'bg-cyan-100 text-cyan-700 border-cyan-200',
                    }[label] || 'bg-slate-100 text-slate-600 border-slate-200';

                    return (
                      <div
                        key={record.id}
                        className="p-3 border rounded-lg hover:border-[#1d4791]/30 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() => onExceptionClick?.(record)}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8 border border-slate-200">
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                              {record.employee_name.replace(/[^A-Z]/g, '').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-[#1d4791] transition-colors">
                                {record.employee_name}
                              </p>
                              <Badge variant="outline" className={badgeColor}>
                                {label === 'on-time' ? 'On Time' :
                                  label === 'half-day' ? 'Half Day' :
                                    label === 'early' ? 'Early' :
                                      label === 'present' ? 'Present' :
                                        label.charAt(0).toUpperCase() + label.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mb-1">{record.department}</p>

                            {/* Timeline Bar */}
                            <ExceptionTimelineBar record={record} />

                            {/* Times */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              {record.am_time_in && (
                                <span className="font-medium">{formatTime(record.am_time_in)}</span>
                              )}
                              {record.pm_time_in && (
                                <span className="font-medium">{formatTime(record.pm_time_in)}</span>
                              )}
                              {!record.am_time_in && !record.pm_time_in && (
                                <span>No punches</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function StatCard({ icon, label, value, variant }: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  variant: 'navy' | 'amber' | 'emerald' | 'rose'
}) {
  const colors = {
    navy: 'bg-[#1d4791]/10 text-[#1d4791] border-[#1d4791]/20',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return (
    <div className={`flex flex-col p-3 rounded-lg border ${colors[variant]} bg-white hover:shadow-sm transition-shadow`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={`p-1 rounded-md ${colors[variant].split(' ')[0]}`}>{icon}</span>}
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-2xl font-black ${colors[variant].split(' ')[1]}`}>{value}</span>
    </div>
  );
}