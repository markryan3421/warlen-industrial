import {
  ChevronDown, ChevronUp, ChevronsUpDown,
  Search, X, Users, Clock, AlertTriangle,
  TrendingDown, TrendingUp, ChevronDown as LoadIcon,
  CalendarDays,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ─── Brand tokens (60-30-10) ──────────────────────────────────────────────────
// 60% → slate/stone neutrals   — surfaces, text, borders
// 30% → #1d4791  navy          — header, active sort, accents
// 10% → #d85e39  burnt orange  — violations, absences, late alerts

// ─── Keyframes ────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes barGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
`;

// ─── Constants ────────────────────────────────────────────────────────────────
/**
 * PAGE_SIZE — rows rendered per batch.
 * Clicking "Load more" appends another PAGE_SIZE rows.
 * Keeps the DOM lean regardless of dataset size.
 */
const PAGE_SIZE = 25;

// ─── Types ────────────────────────────────────────────────────────────────────
interface PeriodStat {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  period_start: string;
  period_end: string;
  normal_work_hours: number | null;
  real_work_hours: number | null;
  late_times: number | null;
  late_minutes: number | null;
  leave_early_times: number | null;
  leave_early_minutes: number | null;
  overtime_work_days: number | null;
  overtime_holidays: number | null;
  scheduled_days: number | null;
  attended_days: number | null;
  out_days: number | null;
  absent_days: number | null;
  afl_days: number | null;
  real_pay: number | null;
}

interface Props {
  stats: PeriodStat[];
  className?: string;
}

type SortKey = keyof PeriodStat | null;
type SortDir = 'asc' | 'desc';

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * formatHours — converts a decimal hours value to a compact display string.
 * e.g. 7.5 → "7h 30m", 8.0 → "8h", null/0 → "—"
 */
const formatHours = (hours: number | null): string => {
  if (!hours || hours === 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/**
 * formatCurrency — formats a number as Philippine Peso.
 * Returns "—" for null/zero values.
 */
const formatCurrency = (value: number | null): string => {
  if (!value || value === 0) return '—';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
};

/**
 * formatPeriod — converts "YYYY-MM-DD" to "MMM D, YYYY" for display.
 */
const formatPeriod = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

/**
 * attendanceRate — safe division returning a 0–100 number.
 */
const attendanceRate = (attended: number | null, scheduled: number | null): number => {
  if (!scheduled || scheduled === 0) return 0;
  return ((attended ?? 0) / scheduled) * 100;
};

// ─── Mini Avatar ──────────────────────────────────────────────────────────────
/**
 * Deterministic colour avatar using a djb2-style name hash.
 * Consistent with the other components in the attendance system.
 */
function RowAvatar({ name }: { name: string }) {
  const safe = name || 'Unknown';
  const initials = safe.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '??';
  let h = 0;
  for (let i = 0; i < safe.length; i++) h = safe.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return (
    <div
      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white select-none"
      style={{ backgroundColor: `hsl(${hue},50%,44%)` }}
    >
      {initials}
    </div>
  );
}

// ─── Attendance Rate Bar ──────────────────────────────────────────────────────
/**
 * Visual progress bar showing attendance rate with colour coding:
 *   ≥ 95%  → emerald (excellent)
 *   ≥ 85%  → amber   (acceptable)
 *   < 85%  → orange  (#d85e39, our 10% brand accent for violations)
 *
 * The `barGrow` animation fires on mount via CSS animation.
 */
function AttendanceBar({ attended, scheduled }: { attended: number | null; scheduled: number | null }) {
  const rate = attendanceRate(attended, scheduled);
  const pct = Math.min(rate, 100);
  const color = rate >= 95 ? 'bg-emerald-500' : rate >= 85 ? 'bg-amber-400' : 'bg-[#d85e39]';
  const text = rate >= 95 ? 'text-emerald-600 dark:text-emerald-400'
    : rate >= 85 ? 'text-amber-600 dark:text-amber-400'
      : 'text-[#d85e39]';

  return (
    <div className="flex flex-col items-center gap-1 min-w-[80px]">
      <span className={`text-sm font-black leading-none ${text}`}>
        {rate.toFixed(1)}%
      </span>
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full origin-left ${color}`}
          style={{
            width: `${pct}%`,
            animation: 'barGrow 0.6s cubic-bezier(0.16,1,0.3,1) both',
          }}
        />
      </div>
      <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">
        {attended ?? 0}/{scheduled ?? 0} days
      </span>
    </div>
  );
}

// ─── Late Cell ────────────────────────────────────────────────────────────────
/**
 * Shows late minutes with colour severity and the occurrence count below.
 *   > 60 min  → orange (#d85e39) — serious
 *   > 30 min  → amber            — moderate
 *   ≤ 30 min  → slate            — minor
 */
function LateCell({ minutes, times }: { minutes: number | null; times: number | null }) {
  if (!minutes || minutes === 0) return <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>;
  const cls = minutes > 60
    ? 'bg-[#d85e39]/10 text-[#d85e39] border-[#d85e39]/20'
    : minutes > 30
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30'
      : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
        {minutes}m
      </span>
      {(times ?? 0) > 0 && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{times}×</span>
      )}
    </div>
  );
}

// ─── Early-Out Cell ───────────────────────────────────────────────────────────
function EarlyOutCell({ minutes, times }: { minutes: number | null; times: number | null }) {
  if (!minutes || minutes === 0) return <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border bg-[#1d4791]/10 text-[#1d4791] border-[#1d4791]/20 dark:bg-[#1d4791]/20 dark:text-blue-300 dark:border-[#1d4791]/30">
        {minutes}m
      </span>
      {(times ?? 0) > 0 && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{times}×</span>
      )}
    </div>
  );
}

// ─── Sortable Column Header ───────────────────────────────────────────────────
/**
 * Renders a table header cell with a sort indicator.
 * Active sort column highlights in navy; inactive columns show a neutral icon.
 */
function SortHead({
  label, sortKey, currentKey, currentDir, onSort, align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'center' | 'right';
}) {
  const isActive = currentKey === sortKey;
  const Icon = isActive
    ? currentDir === 'asc' ? ChevronUp : ChevronDown
    : ChevronsUpDown;

  return (
    <th
      onClick={() => sortKey && onSort(sortKey)}
      className={cn(
        'px-4 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap select-none',
        sortKey ? 'cursor-pointer' : 'cursor-default',
        isActive ? 'text-[#1d4791] dark:text-blue-300' : 'text-slate-500 dark:text-slate-400',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        sortKey && 'hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150',
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey && <Icon className="w-3 h-3 flex-shrink-0" />}
      </span>
    </th>
  );
}

// ─── Summary Stat Pill ────────────────────────────────────────────────────────
function SummaryPill({
  label, value, accent = false, delay = 0,
}: {
  label: string; value: string | number; accent?: boolean; delay?: number;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center px-4 py-2 rounded-xl border transition-transform duration-150 hover:scale-[1.04] cursor-default',
        accent
          ? 'bg-[#d85e39]/10 border-[#d85e39]/20 dark:bg-[#d85e39]/15 dark:border-[#d85e39]/25'
          : 'bg-white/70 border-slate-200 dark:bg-slate-800/70 dark:border-slate-700',
      )}
      style={{ animation: `countUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
    >
      <span className={cn(
        'text-lg font-black leading-none',
        accent ? 'text-[#d85e39]' : 'text-[#1d4791] dark:text-blue-300',
      )}>
        {value}
      </span>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * AttendancePeriodStatView
 *
 * Renders a full attendance period summary table with:
 *
 *   Header bar     — navy, shows title + period range + 4 aggregate stat pills
 *   Toolbar        — search by name/dept, department filter dropdown, row count
 *   Table          — sortable columns, visual attendance bar, colour-coded cells
 *   Pagination     — renders PAGE_SIZE rows; "Load more" appends the next batch
 *                    Animations only fire on the first batch (staggered fadeUp)
 *                    so loading 1000+ rows never animates all at once.
 *
 * Performance:
 *   All filtering and sorting runs on the in-memory `stats` array (already
 *   loaded by Inertia). Only `visibleCount` rows are rendered in the DOM at
 *   any time, keeping layout cost constant regardless of dataset size.
 *
 * Sorting:
 *   Each SortHead column stores a `sortKey` matching a PeriodStat field name.
 *   Clicking toggles asc → desc → (next column). Null keys (e.g. Employee)
 *   sort by employee_name.
 *
 * State:
 *   query        — search input string
 *   deptFilter   — selected department or 'all'
 *   sortKey      — active sort column
 *   sortDir      — 'asc' | 'desc'
 *   visibleCount — how many filtered rows to render (grows by PAGE_SIZE)
 */
export function AttendancePeriodStatView({ stats, className }: Props) {
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('employee_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ── Derived: unique departments for dropdown ──────────────────────────────
  const departments = useMemo(
    () => Array.from(new Set(stats.map(s => s.department).filter(Boolean))).sort(),
    [stats],
  );

  // ── Derived: period range from the data ──────────────────────────────────
  const period = useMemo(() => {
    if (!stats.length) return null;
    const starts = stats.map(s => s.period_start).filter(Boolean).sort();
    const ends = stats.map(s => s.period_end).filter(Boolean).sort();
    return {
      start: starts[0] ? formatPeriod(starts[0]) : null,
      end: ends[ends.length - 1] ? formatPeriod(ends[ends.length - 1]) : null,
    };
  }, [stats]);

  // ── Derived: aggregate summary stats (whole dataset, not just visible) ──
  const summary = useMemo(() => {
    let totalAbsent = 0, totalLate = 0, totalEarlyOut = 0, totalPay = 0;
    stats.forEach(s => {
      totalAbsent += s.absent_days ?? 0;
      totalLate += s.late_minutes ?? 0;
      totalEarlyOut += s.leave_early_minutes ?? 0;
      totalPay += s.real_pay ?? 0;
    });
    return { totalAbsent, totalLate, totalEarlyOut, totalPay };
  }, [stats]);

  // ── Sort handler — toggle direction if same key, else switch key + asc ──
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setVisibleCount(PAGE_SIZE); // reset pagination on sort change
  };

  // ── Filter + sort pipeline ───────────────────────────────────────────────
  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();

    // 1. Filter by search query (name or employee_id)
    let result = q
      ? stats.filter(s =>
        (s.employee_name ?? '').toLowerCase().includes(q) ||
        (s.employee_id ?? '').toLowerCase().includes(q) ||
        (s.department ?? '').toLowerCase().includes(q),
      )
      : stats;

    // 2. Filter by department
    if (deptFilter !== 'all') {
      result = result.filter(s => s.department === deptFilter);
    }

    // 3. Sort
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc'
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return result;
  }, [stats, query, deptFilter, sortKey, sortDir]);

  // ── Pagination slice ──────────────────────────────────────────────────────
  const visibleRows = processed.slice(0, visibleCount);
  const hiddenCount = processed.length - visibleCount;
  const hasMore = hiddenCount > 0;

  // Reset pagination when filters change
  const handleSearch = (v: string) => { setQuery(v); setVisibleCount(PAGE_SIZE); };
  const handleDept = (v: string) => { setDeptFilter(v); setVisibleCount(PAGE_SIZE); };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!stats.length) {
    return (
      <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="w-14 h-14 rounded-2xl bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/12 flex items-center justify-center mb-4">
          <CalendarDays className="w-6 h-6 text-[#1d4791]/40 dark:text-blue-400/40" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">No period stats available</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Records will appear here once data is loaded.</p>
      </div>
    );
  }

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className={cn('space-y-4', className)}>

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden border border-[#1d4791]/20 dark:border-[#1d4791]/30 shadow-sm"
          style={{ animation: 'slideDown 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {/* Navy title row */}
          <div className="bg-[#1d4791] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">Attendance Period Summary</h2>
                <p className="text-[11px] text-blue-200/70 mt-0.5">
                  {stats.length} employees
                  {period?.start && period?.end && ` · ${period.start} – ${period.end}`}
                </p>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="bg-slate-50 dark:bg-slate-800/80 px-5 py-3 border-t border-[#1d4791]/10 flex flex-wrap items-center gap-2">
            <SummaryPill label="Employees" value={stats.length} delay={0} />
            <SummaryPill label="Absent Days" value={summary.totalAbsent} delay={60} accent />
            <SummaryPill label="Late (min)" value={summary.totalLate > 0 ? `${summary.totalLate}m` : '0m'} delay={120} />
            <SummaryPill label="Early (min)" value={summary.totalEarlyOut > 0 ? `${summary.totalEarlyOut}m` : '0m'} delay={180} />
            <SummaryPill label="Total Pay"
              value={new Intl.NumberFormat('en-PH', { notation: 'compact', style: 'currency', currency: 'PHP' }).format(summary.totalPay)}
              delay={240} />
          </div>
        </div>

        {/* ── Toolbar: search + department filter ─────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
          style={{ animation: 'fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) 80ms both' }}
        >
          {/* Search */}
          <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name, ID, or department…"
              className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#1d4791]/50 focus:ring-1 focus:ring-[#1d4791]/20 transition-all duration-150"
            />
            {query && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-100"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Department filter */}
          <Select value={deptFilter} onValueChange={handleDept}>
            <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <SelectValue placeholder="Pay Frequency" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-xl">
              <SelectItem value="all">Pay Frequency</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Row count */}
          <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-auto">
            {processed.length === stats.length
              ? `${stats.length} records`
              : `${processed.length} of ${stats.length} records`}
          </span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
             MOBILE  (< md)  — stacked employee cards.
             One card per row. All data visible without any horizontal scroll.
             Cards have a navy-tint header, 2-col data grid body, and a pay footer.
        ═══════════════════════════════════════════════════════════════ */}
        <div
          className="block md:hidden space-y-3"
          style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 120ms both' }}
        >
          {processed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-16 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Search className="w-4 h-4 text-slate-300 dark:text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-400">
                No results{query && <> for <span className="text-[#1d4791] dark:text-blue-300">"{query}"</span></>}
              </p>
              <button
                onClick={() => { handleSearch(''); handleDept('all'); }}
                className="text-xs font-semibold text-slate-400 hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {visibleRows.map((stat, i) => {
                const overtimeTotal = (stat.overtime_work_days ?? 0) + (stat.overtime_holidays ?? 0);
                const animStyle = i < PAGE_SIZE
                  ? { animation: `fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 35}ms both` }
                  : undefined;
                return (
                  <div
                    key={stat.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                    style={animStyle}
                  >
                    {/* Card header */}
                    <div className="bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border-b border-[#1d4791]/10 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <RowAvatar name={stat.employee_name} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                            {stat.employee_name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{stat.employee_id}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1d4791]/10 border border-[#1d4791]/20 text-[#1d4791] dark:text-blue-300 whitespace-nowrap flex-shrink-0">
                        {stat.department || '—'}
                      </span>
                    </div>

                    {/* Data grid — 2 columns */}
                    <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Attendance</p>
                        <AttendanceBar attended={stat.attended_days} scheduled={stat.scheduled_days} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Work Hours</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatHours(stat.real_work_hours)}</p>
                        {stat.normal_work_hours != null && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">of {formatHours(stat.normal_work_hours)}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Late</p>
                        <LateCell minutes={stat.late_minutes} times={stat.late_times} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Early Out</p>
                        <EarlyOutCell minutes={stat.leave_early_minutes} times={stat.leave_early_times} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Overtime</p>
                        {overtimeTotal > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-400">
                              {overtimeTotal}d
                            </span>
                            {(stat.overtime_holidays ?? 0) > 0 && (
                              <span className="text-[10px] text-slate-400">{stat.overtime_holidays} holiday</span>
                            )}
                          </div>
                        ) : <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Absent</p>
                        {(stat.absent_days ?? 0) > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#d85e39]/10 border border-[#d85e39]/20 text-[#d85e39]">
                            {stat.absent_days}d
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>}
                      </div>
                    </div>

                    {/* Card footer — pay */}
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Real Pay</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                        {formatCurrency(stat.real_pay)}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Mobile pagination */}
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(n => n + PAGE_SIZE)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-[#1d4791] dark:text-blue-300 bg-white dark:bg-slate-900 border border-[#1d4791]/20 dark:border-[#1d4791]/30 hover:bg-[#1d4791]/5 dark:hover:bg-[#1d4791]/10 transition-all duration-150 active:scale-[0.98]"
                >
                  <LoadIcon className="w-4 h-4" />
                  Load {Math.min(hiddenCount, PAGE_SIZE)} more
                  <span className="text-[#1d4791]/50 font-normal">· {hiddenCount} remaining</span>
                </button>
              )}
              {!hasMore && processed.length > PAGE_SIZE && (
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-2">
                  All <span className="font-bold">{processed.length}</span> records loaded
                </p>
              )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════
             TABLET + DESKTOP  (md+)  — responsive table.

             Column visibility by breakpoint:
               md+  : Employee (with dept badge subtitle), Attendance,
                      Work Hours, Exceptions (Late+EarlyOut merged), Absent, Pay
               lg+  : Dept (separate col), Late (split), Early Out (split),
                      Overtime — all the condensed columns expand back out

             The Employee cell always carries a dept badge on md (tablet) so
             no information is lost when the Dept column is hidden.
        ═══════════════════════════════════════════════════════════════ */}
        <div
          className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-700/70 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) 120ms both' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">

              {/* ── Sticky column headers ────────────────────────────── */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border-b border-[#1d4791]/10">

                  {/* Employee — always visible on md+ */}
                  <SortHead label="Employee" sortKey="employee_name" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />

                  {/* Dept — lg+ only; on md it lives inside the Employee cell */}
                  <th
                    className="hidden lg:table-cell px-4 py-3 text-[11px] font-bold uppercase tracking-widest cursor-pointer text-slate-500 dark:text-slate-400 hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150"
                    style={{ color: sortKey === 'department' ? '#1d4791' : undefined }}
                    onClick={() => handleSort('department')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Dept
                      {sortKey === 'department'
                        ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
                        : <ChevronsUpDown className="w-3 h-3" />}
                    </span>
                  </th>

                  {/* Attendance — always on md+ */}
                  <SortHead label="Attendance" sortKey="attended_days" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />

                  {/* Hours — always on md+ */}
                  <SortHead label="Hours" sortKey="real_work_hours" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />

                  {/* Late — lg+ only */}
                  <th
                    className="hidden lg:table-cell px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center cursor-pointer text-slate-500 dark:text-slate-400 hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150"
                    style={{ color: sortKey === 'late_minutes' ? '#1d4791' : undefined }}
                    onClick={() => handleSort('late_minutes')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Late
                      {sortKey === 'late_minutes'
                        ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
                        : <ChevronsUpDown className="w-3 h-3" />}
                    </span>
                  </th>

                  {/* Exceptions (Late+EarlyOut merged) — md only (tablet) */}
                  <th className="table-cell lg:hidden px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Exceptions
                  </th>

                  {/* Early Out — lg+ only */}
                  <th
                    className="hidden lg:table-cell px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center cursor-pointer text-slate-500 dark:text-slate-400 hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150"
                    style={{ color: sortKey === 'leave_early_minutes' ? '#1d4791' : undefined }}
                    onClick={() => handleSort('leave_early_minutes')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Early Out
                      {sortKey === 'leave_early_minutes'
                        ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
                        : <ChevronsUpDown className="w-3 h-3" />}
                    </span>
                  </th>

                  {/* Overtime — lg+ only */}
                  <th
                    className="hidden lg:table-cell px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-center cursor-pointer text-slate-500 dark:text-slate-400 hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150"
                    style={{ color: sortKey === 'overtime_work_days' ? '#1d4791' : undefined }}
                    onClick={() => handleSort('overtime_work_days')}
                  >
                    <span className="inline-flex items-center gap-1">
                      OT
                      {sortKey === 'overtime_work_days'
                        ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
                        : <ChevronsUpDown className="w-3 h-3" />}
                    </span>
                  </th>

                  {/* Absent — always on md+ */}
                  <SortHead label="Absent" sortKey="absent_days" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="center" />

                  {/* Pay — always on md+ */}
                  <SortHead label="Pay" sortKey="real_pay" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} align="right" />
                </tr>
              </thead>

              {/* ── Body rows ────────────────────────────────────────── */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {processed.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div
                        className="flex flex-col items-center gap-3"
                        style={{ animation: 'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Search className="w-4 h-4 text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-400">
                          No results{query && <> for <span className="text-[#1d4791] dark:text-blue-300">"{query}"</span></>}
                        </p>
                        <button
                          onClick={() => { handleSearch(''); handleDept('all'); }}
                          className="text-xs font-semibold text-slate-400 hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150"
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((stat, i) => {
                    const overtimeTotal = (stat.overtime_work_days ?? 0) + (stat.overtime_holidays ?? 0);
                    const animStyle = i < PAGE_SIZE
                      ? { animation: `fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 30}ms both` }
                      : undefined;

                    return (
                      <tr
                        key={stat.id}
                        className="hover:bg-[#1d4791]/[0.025] dark:hover:bg-[#1d4791]/10 transition-colors duration-150 group"
                        style={animStyle}
                      >
                        {/* Employee — always visible.
                            On tablet (md, < lg) the dept badge shows here
                            since the Dept column is hidden at that breakpoint. */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <RowAvatar name={stat.employee_name} />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-[#1d4791] dark:group-hover:text-blue-300 transition-colors duration-150">
                                {stat.employee_name}
                              </p>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500">{stat.employee_id}</p>
                              {/* Dept badge — visible only on tablet (md), hidden on lg+ where the Dept column exists */}
                              <span className="lg:hidden inline-flex items-center mt-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/15 dark:border-[#1d4791]/25 text-[#1d4791] dark:text-blue-300">
                                {stat.department || '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Dept — lg+ only */}
                        <td className="hidden lg:table-cell px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/15 dark:border-[#1d4791]/25 text-[#1d4791] dark:text-blue-300 whitespace-nowrap">
                            {stat.department || '—'}
                          </span>
                        </td>

                        {/* Attendance bar — always on md+ */}
                        <td className="px-4 py-3 text-center">
                          <AttendanceBar attended={stat.attended_days} scheduled={stat.scheduled_days} />
                        </td>

                        {/* Work hours — always on md+ */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {formatHours(stat.real_work_hours)}
                            </span>
                            {stat.normal_work_hours != null && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                of {formatHours(stat.normal_work_hours)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Late — lg+ only */}
                        <td className="hidden lg:table-cell px-4 py-3 text-center">
                          <LateCell minutes={stat.late_minutes} times={stat.late_times} />
                        </td>

                        {/* Exceptions: Late + Early Out merged — tablet (md) only */}
                        <td className="table-cell lg:hidden px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            {(stat.late_minutes ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">L</span>
                                <LateCell minutes={stat.late_minutes} times={stat.late_times} />
                              </div>
                            )}
                            {(stat.leave_early_minutes ?? 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">E</span>
                                <EarlyOutCell minutes={stat.leave_early_minutes} times={stat.leave_early_times} />
                              </div>
                            )}
                            {!(stat.late_minutes ?? 0) && !(stat.leave_early_minutes ?? 0) && (
                              <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                            )}
                          </div>
                        </td>

                        {/* Early Out — lg+ only */}
                        <td className="hidden lg:table-cell px-4 py-3 text-center">
                          <EarlyOutCell minutes={stat.leave_early_minutes} times={stat.leave_early_times} />
                        </td>

                        {/* Overtime — lg+ only */}
                        <td className="hidden lg:table-cell px-4 py-3 text-center">
                          {overtimeTotal > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-400">
                                {overtimeTotal}d
                              </span>
                              {(stat.overtime_holidays ?? 0) > 0 && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{stat.overtime_holidays}hol</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                          )}
                        </td>

                        {/* Absent — always on md+ */}
                        <td className="px-4 py-3 text-center">
                          {(stat.absent_days ?? 0) > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#d85e39]/10 border border-[#d85e39]/20 text-[#d85e39]">
                              {stat.absent_days}d
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-sm">—</span>
                          )}
                        </td>

                        {/* Real pay — always on md+ */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                            {formatCurrency(stat.real_pay)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination footer ──────────────────────────────────── */}
          {hasMore && (
            <div
              className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-4"
              style={{ animation: 'fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both' }}
            >
              <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                Showing{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300">{visibleRows.length}</span>
                {' '}of{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300">{processed.length}</span>
                {' '}records
              </span>
              <button
                onClick={() => setVisibleCount(n => n + PAGE_SIZE)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold text-[#1d4791] dark:text-blue-300 bg-[#1d4791]/8 dark:bg-[#1d4791]/15 hover:bg-[#1d4791]/15 dark:hover:bg-[#1d4791]/25 border border-[#1d4791]/15 dark:border-[#1d4791]/25 transition-all duration-150 active:scale-95"
              >
                <LoadIcon className="w-3 h-3" />
                Load {Math.min(hiddenCount, PAGE_SIZE)} more
                <span className="text-[#1d4791]/50 dark:text-blue-400/50 font-normal">
                  · {hiddenCount} remaining
                </span>
              </button>
            </div>
          )}

          {!hasMore && processed.length > 0 && processed.length > PAGE_SIZE && (
            <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 text-center">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                All <span className="font-bold text-slate-500 dark:text-slate-400">{processed.length}</span> records loaded
              </span>
            </div>
          )}
        </div>

      </div>
    </>
  );
}