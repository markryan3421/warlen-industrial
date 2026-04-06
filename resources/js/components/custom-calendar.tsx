// components/schedule/schedule-calendar.tsx
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Search,
  X,
  Filter,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────
interface ScheduleRecord {
  date: string;               // YYYY-MM-DD
  employee_id: string;
  employee_name: string;
  department: string;
  shift_code: string | null;  // e.g. "1", "2", "25", "26", null = holiday
  shift_label: string | null; // e.g. "Regular", "Weekender", "Ask for Leave", "Out", "Holiday"
}

interface ScheduleCalendarProps {
  schedules: ScheduleRecord[];
  onDayClick?: (date: Date, records: ScheduleRecord[]) => void;
  className?: string;
  maxVisible?: number;        // max chips per day cell before showing +X more
  title?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// 60-30-10 color scheme
const COLORS = {
  navy: '#1d4791',
  orange: '#d85e39',
};

// Deterministic color per employee (soft pastels)
const EMPLOYEE_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
  { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', dot: 'bg-cyan-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500' },
];

function getEmployeeColor(employeeName: string) {
  let hash = 0;
  for (let i = 0; i < employeeName.length; i++) {
    hash = employeeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EMPLOYEE_COLORS[Math.abs(hash) % EMPLOYEE_COLORS.length];
}

// Shift badge colors (using 30% navy and 10% orange as accents)
const shiftBadgeColors: Record<string, string> = {
  '1': 'bg-blue-100 text-blue-800 border-blue-200',                 // Regular
  '2': 'bg-emerald-100 text-emerald-800 border-emerald-200',       // Weekender
  '25': 'bg-amber-100 text-amber-800 border-amber-200',            // Ask for leave
  '26': 'bg-rose-100 text-rose-800 border-rose-200',               // Out
  'null': 'bg-slate-100 text-slate-500 border-slate-200',          // Holiday
};

// ─── Helper functions ───────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7; // Monday = 0
}
function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function todayKey() {
  return toDateKey(new Date());
}

// ─── Components ─────────────────────────────────────────────────────────
function EmployeeChip({ record, compact = false }: { record: ScheduleRecord; compact?: boolean }) {
  const color = getEmployeeColor(record.employee_name);
  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight truncate max-w-full animate-in fade-in slide-in-from-top-1 duration-200',
          color.bg,
          color.text
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', color.dot)} />
        <span className="truncate">{record.employee_name.substring(0, 2).toUpperCase()}</span>
      </span>
    );
  }
  // Full detail for dialog
  return (
    <div
      className="flex items-center gap-3 p-3 border rounded-lg bg-white hover:border-[#1d4791]/30 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
    >
      <div
        className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold',
          color.bg,
          color.text
        )}
      >
        {record.employee_name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '??'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{record.employee_name}</p>
      </div>
      <Badge variant="outline" className={cn('ml-auto', shiftBadgeColors[record.shift_code ?? 'null'])}>
        {record.department}
      </Badge>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────
export function ScheduleCalendar({
  schedules = [],
  onDayClick,
  className,
  maxVisible = 3,
  title = 'Schedule Calendar',
}: ScheduleCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    if (schedules.length > 0) {
      const firstDate = new Date(schedules[0].date);
      return { year: firstDate.getFullYear(), month: firstDate.getMonth() };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });
  const [selectedDayRecords, setSelectedDayRecords] = useState<ScheduleRecord[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { year, month } = viewDate;

  // Get unique departments for filter
  const departments = useMemo(() => {
    const deps = new Set(schedules.map(s => s.department).filter(Boolean));
    return Array.from(deps);
  }, [schedules]);

  // Apply filters
  const filteredSchedules = useMemo(() => {
    return schedules.filter(record => {
      const matchesSearch = searchTerm === '' ||
        record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDepartment === 'all' || record.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [schedules, searchTerm, selectedDepartment]);

  // Group filtered schedules by date
  const schedulesByDate = useMemo(() => {
    const map: Record<string, ScheduleRecord[]> = {};
    filteredSchedules.forEach(s => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [filteredSchedules]);

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInMonth = getDaysInMonth(year, month);
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);
    const cells: { dateKey: string; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const key = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateKey: key, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateKey: key, isCurrentMonth: true });
    }
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    let trail = 1;
    while (cells.length < 42) {
      const key = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(trail).padStart(2, '0')}`;
      cells.push({ dateKey: key, isCurrentMonth: false });
      trail++;
    }
    return cells;
  }, [year, month]);

  const goToPrevMonth = useCallback(() => {
    setViewDate(({ year, month }) => ({
      year: month === 0 ? year - 1 : year,
      month: month === 0 ? 11 : month - 1,
    }));
  }, []);

  const goToNextMonth = useCallback(() => {
    setViewDate(({ year, month }) => ({
      year: month === 11 ? year + 1 : year,
      month: month === 11 ? 0 : month + 1,
    }));
  }, []);

  const goToToday = useCallback(() => {
    setViewDate({ year: today.getFullYear(), month: today.getMonth() });
  }, []);

  const handleDayClick = (dateKey: string, records: ScheduleRecord[]) => {
    setSelectedDayRecords(records);
    setDialogOpen(true);
    if (onDayClick) {
      const [y, m, d] = dateKey.split('-').map(Number);
      onDayClick(new Date(y, m - 1, d), records);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedDepartment !== 'all';

  return (
    <>
      <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden', className)}>
        {/* Header with title and filter toggle */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1d4791]/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-[#1d4791]" />
            </div>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            {hasActiveFilters && (
              <Badge className="bg-[#d85e39] text-white border-0 ml-2">
                Filtered
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'gap-2 text-slate-600',
              showFilters && 'bg-[#1d4791]/10 text-[#1d4791]'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filter bar (conditionally visible) */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
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
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 px-3 text-[#d85e39] hover:text-[#d85e39]/80 hover:bg-[#d85e39]/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            {MONTHS[month]} {year}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs font-semibold text-[#1d4791] border border-[#1d4791]/30 rounded-md hover:bg-[#1d4791]/5 transition-colors"
            >
              today
            </button>
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
              <button
                onClick={goToPrevMonth}
                aria-label="Previous month"
                className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={goToNextMonth}
                aria-label="Next month"
                className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(day => (
            <div
              key={day}
              className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarGrid.map(({ dateKey, isCurrentMonth }) => {
            const records = schedulesByDate[dateKey] || [];
            const isToday = dateKey === todayKey();
            const visible = records.slice(0, maxVisible);
            const overflow = records.length - maxVisible;

            return (
              <div
                key={dateKey}
                onClick={() => records.length > 0 && handleDayClick(dateKey, records)}
                className={cn(
                  'relative min-h-[90px] p-1.5 border-b border-r border-slate-100 transition-all duration-150',
                  isCurrentMonth ? 'bg-white' : 'bg-slate-50/60',
                  records.length > 0
                    ? 'cursor-pointer hover:bg-slate-50 hover:shadow-sm group'
                    : 'cursor-default',
                  'hover:z-10'
                )}
              >
                {/* Date number */}
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold transition-colors',
                      isToday
                        ? 'bg-[#1d4791] text-white shadow-sm shadow-[#1d4791]/30'
                        : isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-300'
                    )}
                  >
                    {dateKey.split('-')[2].replace(/^0/, '')}
                  </span>
                  {records.length > 0 && (
                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-[#d85e39] transition-colors mt-1">
                      {records.length}
                    </span>
                  )}
                </div>

                {/* Chips */}
                <div className="space-y-0.5">
                  {visible.map((record, i) => (
                    <EmployeeChip key={`${record.employee_id}-${i}`} record={record} compact />
                  ))}
                  {overflow > 0 && (
                    <span className="inline-block text-[10px] font-semibold text-[#d85e39] bg-[#d85e39]/10 px-1.5 py-0.5 rounded animate-in fade-in zoom-in-50 duration-200">
                      +{overflow} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with record count */}
        <div className="px-5 py-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400 flex items-center justify-between">
          <span>
            Showing {filteredSchedules.length} of {schedules.length} records
          </span>
          {hasActiveFilters && (
            <Button
              variant="link"
              size="sm"
              onClick={clearFilters}
              className="text-[#d85e39] h-auto p-0 text-xs font-semibold"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Day detail dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1d4791]">
              <CalendarIcon className="w-5 h-5" />
              {selectedDayRecords && selectedDayRecords.length > 0 && (
                <>
                  {new Date(selectedDayRecords[0].date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {selectedDayRecords?.length || 0} employee(s) scheduled
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-2">
              {selectedDayRecords?.map((record, idx) => (
                <EmployeeChip key={idx} record={record} compact={false} />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}