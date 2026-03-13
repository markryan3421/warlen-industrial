import {
  Calendar as CalendarIcon,
  ChevronRight,
  Filter,
  X,
  Clock,
  AlertTriangle,
  Users,
  TrendingDown,
  BarChart3,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AttendanceCalendar from '@/components/custom-calendar';
import { isoUtcToPhilippineTime } from '@/utils/timezone';
import { ScrollArea } from '../ui/scroll-area';

// ─── Brand tokens (60-30-10) ──────────────────────────────────────────────────
// 60% → slate/stone neutrals   — all surfaces, text, borders, dividers
// 30% → #1d4791  navy          — header bar, active states, primary accents
// 10% → #d85e39  burnt orange  — exceptions, alerts, totals, destructive cues

// ─── Keyframes injected once ──────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.97) translateY(4px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes pingOnce {
    0%   { transform: scale(1);    opacity: 0.4; }
    80%  { transform: scale(1.8);  opacity: 0;   }
    100% { transform: scale(1.8);  opacity: 0;   }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ExceptionStats {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;
  am_time_in: string | null;
  am_time_out: string | null;
  pm_time_in: string | null;
  pm_time_out: string | null;
  late_minutes: number | null;
  leave_early_minutes: number | null;
  absence_minutes: number | null;
  total_exception_minutes: number | null;
}

interface ExceptionStatsHybridProps {
  calendarData: ExceptionStats[];
  onDayClick?: (dateKey: string, records: ExceptionStats[]) => void;
  maxVisible?: number;
  title?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatMinutes = (minutes: number | null) => {
  if (!minutes || minutes === 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatUTCTime = (raw: string | null): string | null => {
  if (!raw) return null;
  if (raw.includes('T') && raw.includes('Z')) return isoUtcToPhilippineTime(raw);
  if (raw.includes(' ')) {
    const [date, time] = raw.split(' ');
    return isoUtcToPhilippineTime(`${date}T${time}.000000Z`);
  }
  if (raw.includes(':')) {
    const today = new Date().toISOString().split('T')[0];
    return isoUtcToPhilippineTime(`${today}T${raw}.000000Z`);
  }
  return raw;
};

type ExStatus = 'absent' | 'late' | 'early' | 'present';

const getStatus = (r: ExceptionStats): ExStatus => {
  if (r.absence_minutes && r.absence_minutes > 0) return 'absent';
  if (r.late_minutes && r.late_minutes > 0) return 'late';
  if (r.leave_early_minutes && r.leave_early_minutes > 0) return 'early';
  return 'present';
};

const STATUS_META: Record<ExStatus, { label: string; cls: string; dot: string; bar: string }> = {
  absent: { label: 'Absent', cls: 'bg-[#d85e39]/10 text-[#d85e39] border-[#d85e39]/20', dot: 'bg-[#d85e39]', bar: 'bg-[#d85e39]' },
  late: { label: 'Late', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30', dot: 'bg-amber-400', bar: 'bg-amber-400' },
  early: { label: 'Early Leave', cls: 'bg-[#1d4791]/10 text-[#1d4791] border-[#1d4791]/20 dark:bg-[#1d4791]/20 dark:text-blue-300 dark:border-[#1d4791]/30', dot: 'bg-[#1d4791]', bar: 'bg-[#1d4791]' },
  present: { label: 'Present', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/30', dot: 'bg-emerald-400', bar: 'bg-emerald-400' },
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string | null | undefined; size?: 'sm' | 'md' }) {
  const safe = name || 'Unknown';
  const initials = safe.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '??';
  let h = 0;
  for (let i = 0; i < safe.length; i++) h = safe.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  return (
    <div
      className={`${dim} rounded-full flex-shrink-0 flex items-center justify-center font-black text-white select-none`}
      style={{ backgroundColor: `hsl(${hue},50%,44%)` }}
    >
      {initials}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, accent, delay = 0 }: {
  label: string; value: string | number; accent?: boolean; delay?: number;
}) {
  return (
    <div
      className={`flex flex-col items-center px-4 py-2 rounded-xl border transition-transform duration-150 hover:scale-[1.04] cursor-default ${accent
        ? 'bg-[#d85e39]/10 border-[#d85e39]/20 dark:bg-[#d85e39]/15 dark:border-[#d85e39]/25'
        : 'bg-white/70 border-slate-200 dark:bg-slate-800/70 dark:border-slate-700'
        }`}
      style={{ animation: `countUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
    >
      <span className={`text-lg font-black leading-none ${accent ? 'text-[#d85e39]' : 'text-[#1d4791] dark:text-blue-300'}`}>
        {value}
      </span>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

// ─── Employee record card ─────────────────────────────────────────────────────
function EmployeeRecordCard({ record, index = 0 }: { record: ExceptionStats; index?: number }) {
  const status = getStatus(record);
  const meta = STATUS_META[status];
  const amIn = formatUTCTime(record.am_time_in);
  const amOut = formatUTCTime(record.am_time_out);
  const pmIn = formatUTCTime(record.pm_time_in);
  const pmOut = formatUTCTime(record.pm_time_out);

  const metrics = [
    { label: 'Late', value: formatMinutes(record.late_minutes), warn: (record.late_minutes ?? 0) > 0 },
    { label: 'Early Out', value: formatMinutes(record.leave_early_minutes), warn: (record.leave_early_minutes ?? 0) > 0 },
    { label: 'Absent', value: formatMinutes(record.absence_minutes), warn: (record.absence_minutes ?? 0) > 0 },
    { label: 'Total', value: formatMinutes(record.total_exception_minutes), warn: (record.total_exception_minutes ?? 0) > 0 },
  ];

  return (
    <div
      className="group rounded-xl border border-slate-100 dark:border-slate-700/70 bg-white dark:bg-slate-800/60 hover:border-[#1d4791]/30 dark:hover:border-[#1d4791]/50 hover:shadow-sm transition-all duration-200 overflow-hidden"
      style={{ animation: `fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) ${index * 50}ms both` }}
    >
      {/* Status accent bar */}
      <div className={`h-[3px] w-full ${meta.bar}`} />

      <div className="p-3">
        {/* Identity + status badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={record.employee_name} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">
                {record.employee_name}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                ID {record.employee_id}
                <span className="mx-1 opacity-40">·</span>
                {record.department}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${meta.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          {metrics.map(({ label, value, warn }) => (
            <div key={label} className="text-center px-1 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 transition-colors duration-150">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide leading-none mb-0.5">{label}</p>
              <p className={`text-xs font-black leading-none ${warn ? 'text-[#d85e39]' : 'text-slate-500 dark:text-slate-400'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Time stamps */}
        {(amIn || pmIn) && (
          <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {amIn && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-600 dark:text-slate-300">AM </span>
                  {amIn} → {amOut ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                </span>
              )}
              {pmIn && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-600 dark:text-slate-300">PM </span>
                  {pmIn} → {pmOut ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Employee summary row ─────────────────────────────────────────────────────
function EmployeeSummaryRow({ emp, records, onClick, index = 0 }: {
  emp: { id: string; name: string; department: string };
  records: ExceptionStats[];
  onClick: () => void;
  index?: number;
}) {
  const total = records.reduce((s, r) => s + (r.total_exception_minutes ?? 0), 0);
  const exceptions = records.filter(r => (r.total_exception_minutes ?? 0) > 0).length;
  const severity = total > 480 ? 'high' : total > 120 ? 'mid' : 'low';

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700/70 bg-white dark:bg-slate-800/60 hover:border-[#1d4791]/40 dark:hover:border-[#1d4791]/50 hover:shadow-sm hover:bg-[#1d4791]/[0.02] dark:hover:bg-[#1d4791]/10 cursor-pointer transition-all duration-200 group"
      style={{ animation: `fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) ${index * 40}ms both` }}
    >
      <Avatar name={emp.name} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#1d4791] dark:group-hover:text-blue-300 transition-colors duration-150">
          {emp.name}
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{emp.department}</p>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{exceptions} days</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">exceptions</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#1d4791] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all duration-150" />
      </div>
    </div>
  );
}

// ─── Detail panel empty state ─────────────────────────────────────────────────
function DetailEmptyState({ hasEmployee }: { hasEmployee: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[260px] px-6 text-center"
      style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div className="relative mb-5">
        {/* Gentle pulse ring */}
        <div
          className="absolute inset-0 rounded-2xl bg-[#1d4791]/15 dark:bg-[#1d4791]/20"
          style={{ animation: 'pingOnce 2s ease-out infinite' }}
        />
        <div className="relative w-16 h-16 rounded-2xl bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/15 dark:border-[#1d4791]/25 flex items-center justify-center">
          <CalendarIcon className="w-7 h-7 text-[#1d4791]/50 dark:text-blue-400/50" />
        </div>
      </div>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
        {hasEmployee ? 'Employee filter active' : 'No day selected'}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-[180px] leading-relaxed">
        {hasEmployee
          ? 'Click any highlighted day to see their records'
          : 'Click any day on the calendar to view attendance details'
        }
      </p>
    </div>
  );
}

// ─── No data state ────────────────────────────────────────────────────────────
function NoDataState() {
  return (
    <div
      className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
      style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/12 flex items-center justify-center mb-4">
        <BarChart3 className="w-6 h-6 text-[#1d4791]/40 dark:text-blue-400/40" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">No exception data available</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Records will appear here once data is loaded.</p>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ExceptionStatsHybrid({
  calendarData,
  onDayClick,
  maxVisible = 3,
  title = 'Attendance Exception Stats',
}: ExceptionStatsHybridProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateRecords, setSelectedDateRecords] = useState<ExceptionStats[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [detailKey, setDetailKey] = useState(0);

  const safeData = calendarData || [];

  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, { id: string; name: string; department: string }>();
    safeData.forEach(r => {
      if (r?.employee_id && !map.has(r.employee_id)) {
        map.set(r.employee_id, {
          id: r.employee_id,
          name: r.employee_name || 'Unknown',
          department: r.department || 'N/A',
        });
      }
    });
    return Array.from(map.values());
  }, [safeData]);

  const filteredCalendarData = useMemo(
    () => selectedEmployee ? safeData.filter(r => r.employee_id === selectedEmployee) : safeData,
    [safeData, selectedEmployee]
  );

  const globalStats = useMemo(() => ({
    absences: safeData.filter(r => (r.absence_minutes ?? 0) > 0).length,
    lates: safeData.filter(r => (r.late_minutes ?? 0) > 0).length,
    earlyLeaves: safeData.filter(r => (r.leave_early_minutes ?? 0) > 0).length,
    totalMins: safeData.reduce((s, r) => s + (r.total_exception_minutes ?? 0), 0),
  }), [safeData]);

  const exceptionSummary = useMemo(() => {
    if (!selectedDateRecords.length) return null;
    return selectedDateRecords.reduce(
      (acc, r) => {
        if ((r.absence_minutes ?? 0) > 0) acc.absences++;
        if ((r.late_minutes ?? 0) > 0) acc.lates++;
        if ((r.leave_early_minutes ?? 0) > 0) acc.earlyLeaves++;
        acc.totalMinutes += r.total_exception_minutes ?? 0;
        return acc;
      },
      { absences: 0, lates: 0, earlyLeaves: 0, totalMinutes: 0 }
    );
  }, [selectedDateRecords]);

  const handleDayClick = (dateKey: string, records: ExceptionStats[]) => {
    const filtered = selectedEmployee
      ? records.filter(r => r.employee_id === selectedEmployee)
      : records;
    setSelectedDate(dateKey);
    setSelectedDateRecords(filtered);
    setDetailKey(k => k + 1);   // bump key → card animations re-fire
    onDayClick?.(dateKey, records);
  };

  const clearFilters = () => {
    setSelectedEmployee(null);
    setSelectedDate(null);
    setSelectedDateRecords([]);
    setCalendarKey(k => k + 1);
  };

  const formatSelectedDate = (dk: string) => {
    const [y, m, d] = dk.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const hasFilters = !!(selectedDate || selectedEmployee);

  if (!safeData.length) return <NoDataState />;

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="space-y-4 min-h-0 h-full flex flex-col">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden border border-[#1d4791]/20 dark:border-[#1d4791]/30 shadow-sm flex-shrink-0"
          style={{ animation: 'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {/* Navy bar — 30% */}
          <div className="bg-[#1d4791] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
                <p className="text-[11px] text-blue-200/70 mt-0.5">
                  {safeData.length} records · {uniqueEmployees.length} employees
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 ${showFilters
                  ? 'bg-white text-[#1d4791] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                {selectedEmployee && (
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[#d85e39] text-white text-[10px] font-black">
                    1
                  </span>
                )}
              </button>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all duration-150 active:scale-95"
                  style={{ animation: 'fadeIn 0.2s ease both' }}
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Stats strip — 60% neutral surface */}
          <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 border-t border-[#1d4791]/10 flex flex-wrap items-center gap-2">
            <StatPill label="Employees" value={uniqueEmployees.length} delay={0} />
            <StatPill label="Absences" value={globalStats.absences} delay={60} accent />
            {/* <StatPill label="Late" value={globalStats.lates} delay={120} />
            <StatPill label="Early Out" value={globalStats.earlyLeaves} delay={180} /> */}
          </div>
        </div>

        {/* ── Filter panel ─────────────────────────────────────────────────── */}
        {showFilters && (
          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 shadow-sm flex-shrink-0"
            style={{ animation: 'slideDown 0.25s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Filter by Employee
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedEmployee(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 active:scale-95 ${!selectedEmployee
                  ? 'bg-[#1d4791] text-white border-[#1d4791] shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#1d4791]/50 dark:hover:border-[#1d4791]/40'
                  }`}
              >
                All Employees
              </button>

              {uniqueEmployees.map((emp, i) => (
                <button
                  key={`filter-${emp.id}`}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 active:scale-95 ${selectedEmployee === emp.id
                    ? 'bg-[#1d4791] text-white border-[#1d4791] shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-[#1d4791]/50 dark:hover:border-[#1d4791]/40'
                    }`}
                  style={{ animation: `fadeUp 0.2s cubic-bezier(0.16,1,0.3,1) ${i * 25}ms both` }}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 flex-1">

          {/* Calendar */}
          <div
            className="lg:col-span-7 min-w-0"
            style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 80ms both' }}
          >
            <AttendanceCalendar
              key={calendarKey}
              attendanceData={filteredCalendarData}
              onDayClick={handleDayClick}
              maxVisible={maxVisible}
              title={selectedEmployee ? 'Calendar — Filtered' : 'Exception Statistics Calendar'}
            />
          </div>

          {/* Detail panel */}
          <div
            className="lg:col-span-5 min-w-0"
            style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 120ms both' }}
          >
            {selectedDate ? (
              <div
                key={`panel-${selectedDate}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-900 shadow-sm flex flex-col h-full overflow-hidden"
                style={{ animation: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both' }}
              >
                {/* Panel header */}
                <div className="bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border-b border-[#1d4791]/10 px-4 py-4 flex-shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-[#1d4791] dark:text-blue-300 uppercase tracking-widest mb-0.5">
                        Selected Day
                      </p>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                        {formatSelectedDate(selectedDate)}
                      </h3>
                    </div>
                    <button
                      onClick={() => { setSelectedDate(null); setSelectedDateRecords([]); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150 active:scale-90 flex-shrink-0 mt-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day summary pills */}
                  {exceptionSummary && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <Users className="w-2.5 h-2.5" />
                        {selectedDateRecords.length} {selectedDateRecords.length === 1 ? 'employee' : 'employees'}
                      </span>
                      {exceptionSummary.absences > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d85e39]/10 border border-[#d85e39]/20 text-[10px] font-bold text-[#d85e39]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d85e39]" />
                          {exceptionSummary.absences} absent
                        </span>
                      )}
                      {exceptionSummary.lates > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {exceptionSummary.lates} late
                        </span>
                      )}
                      {exceptionSummary.earlyLeaves > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1d4791]/10 border border-[#1d4791]/20 dark:border-[#1d4791]/30 text-[10px] font-bold text-[#1d4791] dark:text-blue-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1d4791]" />
                          {exceptionSummary.earlyLeaves} early out
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Scrollable record list — cards re-animate on every new day click via detailKey */}
                <ScrollArea className="flex-1 min-h-0">
                  <div key={detailKey} className="p-3 space-y-2 pr-4">
                    {selectedDateRecords.length > 0 ? (
                      selectedDateRecords.map((record, i) => (
                        <EmployeeRecordCard key={`record-${record.id}`} record={record} index={i} />
                      ))
                    ) : (
                      <div
                        className="flex flex-col items-center justify-center py-16 text-center"
                        style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                          <CalendarIcon className="w-5 h-5 text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-400">No exceptions this day</p>
                        {selectedEmployee && (
                          <p className="text-xs text-slate-400 mt-1">Try clearing the employee filter</p>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Footer — total exception time */}
                {exceptionSummary && exceptionSummary.totalMinutes > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#d85e39]" />
                      Total exception time
                    </div>
                    <span className="text-sm font-black text-[#d85e39]">
                      {formatMinutes(exceptionSummary.totalMinutes)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 h-full min-h-[200px]">
                <DetailEmptyState hasEmployee={!!selectedEmployee} />
              </div>
            )}
          </div>
        </div>

        {/* ── Employee summary section ──────────────────────────────────────── */}
        {!selectedDate && !selectedEmployee && uniqueEmployees.length > 0 && (
          <div
            className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex-shrink-0"
            style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 160ms both' }}
          >
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700/60 bg-[#1d4791]/5 dark:bg-[#1d4791]/10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1d4791] dark:text-blue-300" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Exception Summary by Employee
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:block">
                Click a row to filter calendar
              </span>
            </div>

            {/* Column labels */}
            <div className="hidden sm:flex items-center px-5 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/60 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest gap-3">
              <span className="flex-1">Employee</span>
              <span className="w-28 text-right">Exception Days</span>
              <span className="w-24 text-right">Time Lost</span>
              <span className="w-4" />
            </div>

            {/* Rows */}
            <div className="p-3 space-y-1.5 max-h-[320px] overflow-y-auto">
              {uniqueEmployees.map((emp, i) => (
                <EmployeeSummaryRow
                  key={`emp-${emp.id}`}
                  emp={emp}
                  records={safeData.filter(r => r.employee_id === emp.id)}
                  index={i}
                  onClick={() => {
                    setSelectedEmployee(emp.id);
                    setShowFilters(false);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}