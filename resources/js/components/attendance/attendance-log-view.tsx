// attendance-log-view.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Root of the attendance log feature. Contains ONLY the two stateful components:
//
//   EmployeeDetailView    — drilled-in view for a single employee's history
//   AttendanceLogTimeline — the main exported component (page entry point)
//
// Everything else is imported from sibling files:
//
//   attendance-log.types.ts       → TypeScript interfaces / type aliases
//   attendance-log.constants.ts   → T (schedule constants), STATUS_META, KEYFRAMES
//   attendance-log.utils.ts       → all pure business-logic functions
//   attendance-log.components.tsx → all pure presentational sub-components
//
// Why this split?
//   A single file was ~1000 lines mixing types, constants, business rules, and
//   UI all together. Now each file has one responsibility:
//   types = shape, constants = policy, utils = compute, components = render pixels,
//   this file = manage React state.
// ─────────────────────────────────────────────────────────────────────────────
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Calendar } from '@/components/ui/calendar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { EmpAvatar, EmptyState, LoadingState, StatCard, StatusBadge, TimelineDayCard } from '@/utils/AttendanceLog/attendance-log.component';
import { KEYFRAMES } from '@/utils/AttendanceLog/attendance-log.constants';
import type { AttendanceLog, AttendanceLogTimelineProps } from '@/utils/AttendanceLog/attendance-log.types';
import { calculateDuration, formatTimeDisplay, getLogStatus, isEarlyOut, isHalfDay, isLate, resolveTime } from '@/utils/AttendanceLog/attendance-log.utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─── EmployeeDetailView ───────────────────────────────────────────────────────
/**
 * Drilled-in view shown when the user clicks an employee row in the timeline.
 *
 * Displays:
 *   - A navy header bar with a back button, avatar, name, ID, and department
 *   - A stat strip of 6 StatCard tiles (Total / On Time / Late / Half Day /
 *     Early Out / Missing), each with a staggered countUp animation
 *   - A scrollable list of all that employee's logs, grouped by week
 *
 * State: none — all data is passed in via props.
 * The parent (AttendanceLogTimeline) controls which employee is shown by
 * setting `selectedEmployee` state; clicking the back button sets it to null.
 *
 * logsByWeek memo:
 *   Groups `logs` by the ISO date of the Monday that starts each week.
 *   Sorted newest-week-first. Within each week, rows sorted oldest-date-first.
 *
 * stats memo:
 *   Iterates all logs once, calling getLogStatus on each to tally the counts.
 *   Re-runs only when `logs` reference changes.
 */
function EmployeeDetailView({
  employeeId,
  employeeName,
  department,
  logs,
  onBack,
}: {
  employeeId: string;
  employeeName: string;
  department: string;
  logs: AttendanceLog[];
  onBack: () => void;
}) {
  // ── Group logs by week (Monday as week start) ─────────────────────────────
  const logsByWeek = useMemo(() => {
    const grouped: Record<string, AttendanceLog[]> = {};

    logs.forEach(log => {
      const d = new Date(log.date);
      const ws = new Date(d);
      // Rewind to Monday: getDay() returns 0=Sun…6=Sat; Monday = day 1
      ws.setDate(d.getDate() - d.getDay() + 1);
      const key = ws.toISOString().split('T')[0]; // "YYYY-MM-DD" of the Monday

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });

    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])); // newest first
  }, [logs]);

  // ── Tally status counts for the stat strip ────────────────────────────────
  const stats = useMemo(() => {
    let onTime = 0, late = 0, halfDay = 0, earlyOut = 0, missing = 0;

    logs.forEach(log => {
      const { timeIn, timeOut } = resolveTime(log);
      const status = getLogStatus(timeIn, timeOut);
      if (status === 'on-time') onTime++;
      else if (status === 'late') late++;
      else if (status === 'half-day') halfDay++;
      else if (status === 'early-out') earlyOut++;
      else missing++; // absent + missing-in + missing-out
    });

    return { total: logs.length, onTime, late, halfDay, earlyOut, missing };
  }, [logs]);

  return (
    <div
      className="space-y-4"
      style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      {/* ── Navy header bar ──────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-[#1d4791]/20 shadow-sm">
        <div className="bg-[#1d4791] px-5 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-all duration-150 active:scale-90 flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/20" />
          <EmpAvatar name={employeeName} size="md" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight truncate">{employeeName}</h3>
            <p className="text-[11px] text-blue-200/70 mt-0.5">ID {employeeId} · {department}</p>
          </div>
        </div>

        {/* ── Stat strip — 6 tiles staggered 0→240ms ─────────────────────── */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 grid grid-cols-6 gap-2 border-t border-[#1d4791]/10">
          <StatCard label="Total" value={stats.total} variant="slate" delay={0} />
          <StatCard label="On Time" value={stats.onTime} variant="emerald" delay={60} />
          <StatCard label="Late" value={stats.late} variant="orange" delay={120} />
          <StatCard label="Half Day" value={stats.halfDay} variant="violet" delay={160} />
          <StatCard label="Early Out" value={stats.earlyOut} variant="amber" delay={200} />
          <StatCard label="Missing" value={stats.missing} variant="navy" delay={240} />
        </div>
      </div>

      {/* ── Weekly log list ───────────────────────────────────────────────── */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-4 pr-3">
          {logsByWeek.map(([weekStart, weekLogs], wi) => {
            const start = new Date(weekStart);
            const end = new Date(start);
            end.setDate(start.getDate() + 6); // Sunday of the same week

            return (
              <div
                key={weekStart}
                className="space-y-2"
                style={{ animation: `fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) ${wi * 60}ms both` }}
              >
                {/* Week label with horizontal rule on each side */}
                <div className="flex items-center gap-2 px-1">
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1d4791]/8 dark:bg-[#1d4791]/20 border border-[#1d4791]/15 dark:border-[#1d4791]/25 text-[#1d4791] dark:text-blue-300">
                    {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                </div>

                {/* Individual day rows inside the week */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                  {weekLogs
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((log, idx) => {
                      const { timeIn, timeOut } = resolveTime(log);
                      const late = isLate(timeIn);
                      const halfDay = isHalfDay(timeIn);
                      const earlyOut = isEarlyOut(timeOut, timeIn);
                      const d = new Date(log.date);

                      return (
                        <div
                          key={`${log.id}-${idx}`}
                          className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-[#1d4791]/[0.02] dark:hover:bg-[#1d4791]/10 transition-colors duration-150"
                          style={{ animation: `fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) ${idx * 35}ms both` }}
                        >
                          {/* Day-of-month column */}
                          <div className="w-12 text-center flex-shrink-0">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                              {d.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className="text-xl font-black text-[#1d4791] dark:text-blue-300 leading-none mt-0.5">
                              {d.getDate()}
                            </p>
                          </div>

                          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 flex-shrink-0" />

                          {/* Times */}
                          <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
                            <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                            <span className={`font-bold ${late ? 'text-[#d85e39]' : 'text-slate-600 dark:text-slate-300'}`}>
                              {formatTimeDisplay(timeIn)}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">→</span>
                            <span className={`font-bold ${earlyOut ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>
                              {formatTimeDisplay(timeOut)}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
                              {calculateDuration(timeIn, timeOut)}
                            </span>
                          </div>

                          <StatusBadge timeIn={timeIn} timeOut={timeOut} />
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}


// ─── AttendanceLogTimeline (main export) ──────────────────────────────────────
/**
 * The top-level component — drop this into any Inertia page that receives `logs`.
 *
 * State managed here:
 *   selectedDate      — the single day shown in Day View
 *   viewMode          — 'day' | 'week'
 *   selectedEmployee  — when set, renders EmployeeDetailView instead of timeline
 *   deptFilter        — active department filter ('all' = no filter)
 *   dateRange         — { start, end } for Week View (defaults to last 7 days)
 *   calendarOpen      — whether the date-picker Popover is open
 *
 * Memos (recomputed only when deps change):
 *   departments   — unique sorted department names for the filter dropdown
 *   filteredLogs  — safeLogs after deptFilter + date/range filter
 *   logsByDate    — filteredLogs grouped by date string, newest-first
 *                   (used to render one TimelineDayCard per date in week view)
 *
 * Navigation handlers:
 *   Day View  — shift selectedDate by ±1 day, fire onDateChange callback
 *   Week View — shift dateRange start+end by ±7 days
 *   Today     — reset both to the current moment
 *
 * Guard renders (short-circuit before main JSX):
 *   isLoading        → <LoadingState />
 *   no logs          → <EmptyState />
 *   selectedEmployee → <EmployeeDetailView />
 */
export function AttendanceLogTimeline({
  logs = [],
  onDateChange,
  onEmployeeSelect,
  isLoading = false,
}: AttendanceLogTimelineProps) {
  // Defensive normalisation — Inertia sometimes sends null instead of []
  const safeLogs = Array.isArray(logs) ? logs : [];

  // ── State ─────────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string; dept: string } | null>(null);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date(), start = new Date();
    start.setDate(end.getDate() - 6);
    return { start, end };
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // ── Auto-select most recent date with data ────────────────────────────────
  // If today has no records (weekend / holiday / old dataset), jump to the
  // most recent date that does so the user doesn't land on a blank day view.
  useEffect(() => {
    if (safeLogs.length > 0) {
      const todayStr = new Date().toDateString();
      const hasToday = safeLogs.some(l => new Date(l.date).toDateString() === todayStr);
      if (!hasToday) {
        const maxDate = new Date(Math.max(...safeLogs.map(l => new Date(l.date).getTime())));
        setSelectedDate(maxDate);
      }
    }
  }, [safeLogs]);

  // ── Memos ─────────────────────────────────────────────────────────────────

  const departments = useMemo(
    () => Array.from(new Set(safeLogs.map(l => l.department).filter(Boolean))).sort(),
    [safeLogs],
  );

  const filteredLogs = useMemo(() => safeLogs.filter(log => {
    if (deptFilter !== 'all' && log.department !== deptFilter) return false;
    const d = new Date(log.date);
    if (viewMode === 'day') return d.toDateString() === selectedDate.toDateString();
    return d >= dateRange.start && d <= dateRange.end;
  }), [safeLogs, deptFilter, viewMode, selectedDate, dateRange]);

  const logsByDate = useMemo(() => {
    const grouped: Record<string, AttendanceLog[]> = {};
    filteredLogs.forEach(log => {
      if (!grouped[log.date]) grouped[log.date] = [];
      grouped[log.date].push(log);
    });
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredLogs]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToPrevious = () => {
    if (viewMode === 'day') {
      const d = new Date(selectedDate); d.setDate(d.getDate() - 1);
      setSelectedDate(d); onDateChange?.(d);
    } else {
      const s = new Date(dateRange.start), e = new Date(dateRange.end);
      s.setDate(s.getDate() - 7); e.setDate(e.getDate() - 7);
      setDateRange({ start: s, end: e });
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      const d = new Date(selectedDate); d.setDate(d.getDate() + 1);
      setSelectedDate(d); onDateChange?.(d);
    } else {
      const s = new Date(dateRange.start), e = new Date(dateRange.end);
      s.setDate(s.getDate() + 7); e.setDate(e.getDate() + 7);
      setDateRange({ start: s, end: e });
    }
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    const start = new Date(today); start.setDate(today.getDate() - 6);
    setDateRange({ start, end: new Date() });
    onDateChange?.(today);
  };

  const handleEmployeeClick = (employeeId: string) => {
    const emp = safeLogs.find(l => l.employee_id === employeeId);
    if (emp) setSelectedEmployee({ id: employeeId, name: emp.employee_name, dept: emp.department });
    onEmployeeSelect?.(employeeId);
  };

  // ── Guard renders ─────────────────────────────────────────────────────────

  if (isLoading) return <><style>{KEYFRAMES}</style><LoadingState /></>;
  if (!safeLogs.length) return <><style>{KEYFRAMES}</style><EmptyState /></>;

  if (selectedEmployee) {
    const empLogs = safeLogs.filter(l => l.employee_id === selectedEmployee.id);
    return (
      <>
        <style>{KEYFRAMES}</style>
        <EmployeeDetailView
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          department={selectedEmployee.dept}
          logs={empLogs}
          onBack={() => setSelectedEmployee(null)}
        />
      </>
    );
  }

  const hasActiveFilter = deptFilter !== 'all';

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className="space-y-4">

        {/* ── Navy header bar ───────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden border border-[#1d4791]/20 dark:border-[#1d4791]/30 shadow-sm"
          style={{ animation: 'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div className="bg-[#1d4791] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">Attendance Log Timeline</h2>
                <p className="text-[11px] text-blue-200/70 mt-0.5">{safeLogs.length} total records</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-[170px] h-8 text-xs font-semibold bg-white/15 border-white/20 text-white hover:bg-white/25 focus:ring-white/30 transition-colors">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl">
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                onClick={() => setViewMode(v => v === 'day' ? 'week' : 'day')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 text-white hover:bg-white/25 transition-all duration-150 active:scale-95"
              >
                {viewMode === 'day' ? 'Week View' : 'Day View'}
              </button>

              {hasActiveFilter && (
                <button
                  onClick={() => setDeptFilter('all')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white hover:bg-white/20 transition-all duration-150 active:scale-95"
                  style={{ animation: 'slideDown 0.2s ease both' }}
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Navigation strip */}
          <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-2.5 border-t border-[#1d4791]/10 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button onClick={goToPrevious} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#1d4791]/40 hover:text-[#1d4791] dark:hover:text-blue-300 transition-all duration-150 active:scale-95">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button onClick={goToNext} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#1d4791]/40 hover:text-[#1d4791] dark:hover:text-blue-300 transition-all duration-150 active:scale-95">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={goToToday} className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#1d4791] dark:text-blue-300 hover:bg-[#1d4791]/8 dark:hover:bg-[#1d4791]/20 transition-all duration-150 active:scale-95">
                Today
              </button>

              {viewMode === 'day' && (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#1d4791]/40 hover:text-[#1d4791] dark:hover:text-blue-300 transition-all duration-150 active:scale-95">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {format(selectedDate, 'PPP')}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl border-slate-200 dark:border-slate-700 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={date => {
                        if (date) { setSelectedDate(date); onDateChange?.(date); setCalendarOpen(false); }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {viewMode === 'day'
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : `${dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              }
            </p>
          </div>
        </div>

        {/* ── Timeline content ──────────────────────────────────────────── */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-3 pr-3">
            {viewMode === 'day' ? (
              <TimelineDayCard
                date={selectedDate}
                logs={filteredLogs}
                index={0}
                onEmployeeClick={handleEmployeeClick}
              />
            ) : (
              logsByDate.length > 0 ? (
                logsByDate.map(([date, dayLogs], i) => (
                  <TimelineDayCard
                    key={date}
                    date={new Date(date)}
                    logs={dayLogs}
                    index={i}
                    onEmployeeClick={handleEmployeeClick}
                  />
                ))
              ) : (
                <EmptyState />
              )
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}