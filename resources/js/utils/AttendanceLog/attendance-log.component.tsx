// attendance-log.components.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Pure presentational sub-components used by the main attendance-log-view.tsx.
//
// Most components here are pure (no state, no side effects) and receive
// everything they need via props. The one exception is TimelineDayCard, which
// owns its own search query and pagination offset — kept local because each
// day card is independent and there's no reason to lift that state higher.
//
// Component inventory (render order in the page):
//   StatusBadge      — pill label for a single log's status
//   EmpAvatar        — round avatar with deterministic colour per employee name
//   TimelineBar      — horizontal 24h bar showing the work shift visually
//   LogRow           — one employee row inside a day card
//   TimelineDayCard  — card grouping all rows for a single calendar day
//   StatCard         — a number + label tile used in the employee detail header
//   LoadingState     — full-area spinner shown while data is fetching
//   EmptyState       — placeholder shown when the filtered result set is empty
// ─────────────────────────────────────────────────────────────────────────────

import { Calendar, CalendarIcon, ChevronRight, Clock, Loader2, Search, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { STATUS_META } from './attendance-log.constants';
import type { AttendanceLog } from './attendance-log.types';
import {
  calculateDuration,
  formatTimeDisplay,
  getLogStatus,
  isEarlyOut,
  isHalfDay,
  isLate,
  resolveTime,
  toMinutes,
} from './attendance-log.utils';

// ─── StatusBadge ─────────────────────────────────────────────────────────────
/**
 * Renders a coloured pill (dot + label) for a single log's attendance status.
 *
 * Accepts raw "HH:MM" timeIn/timeOut (already normalised via resolveTime).
 * Looks up STATUS_META to get the label and Tailwind classes — zero conditional
 * logic inside the component itself.
 */
export function StatusBadge({
  timeIn,
  timeOut,
}: {
  timeIn: string | null;
  timeOut: string | null;
}) {
  // getLogStatus is imported indirectly through STATUS_META lookup
  // — we import it from utils here to keep the badge self-contained
  const status = getLogStatus(timeIn, timeOut);
  const meta = STATUS_META[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}


// ─── EmpAvatar ───────────────────────────────────────────────────────────────
/**
 * Circular avatar showing the employee's initials on a deterministic colour.
 *
 * The colour is derived by hashing the employee's name using a simple bitwise
 * hash (same algorithm used across the other attendance components so the same
 * person always gets the same colour regardless of which component renders them).
 *
 * Hash → hue: Math.abs(hash) % 360 → hsl(hue, 50%, 44%)
 * The saturation (50%) and lightness (44%) are fixed so all colours are legible
 * with white text and feel consistent.
 *
 * Sizes:
 *   'sm' → w-7 h-7  (28px) — used in compact lists
 *   'md' → w-9 h-9  (36px) — default; used in LogRow
 *   'lg' → w-11 h-11 (44px) — used in detail view headers
 */
export function EmpAvatar({
  name,
  size = 'md',
}: {
  name: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}) {
  const safe = name || 'Unknown';
  const initials = safe.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '??';

  // djb2-style hash — cheap, stable, no dependencies
  let h = 0;
  for (let i = 0; i < safe.length; i++) h = safe.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;

  const dim = size === 'sm'
    ? 'w-7 h-7 text-[10px]'
    : size === 'lg'
      ? 'w-11 h-11 text-sm'
      : 'w-9 h-9 text-xs';

  return (
    <div
      className={`${dim} rounded-full flex-shrink-0 flex items-center justify-center font-black text-white select-none`}
      style={{ backgroundColor: `hsl(${hue},50%,44%)` }}
    >
      {initials}
    </div>
  );
}


// ─── TimelineBar ─────────────────────────────────────────────────────────────
/**
 * A horizontal miniature timeline spanning 24 hours, showing:
 *   - Three reference marker lines at 7 AM, 12 PM, 5 PM
 *   - A filled region between time-in and time-out (the working period)
 *   - A coloured vertical tick at time-in (orange if late, green if on-time)
 *   - A coloured vertical tick at time-out (amber if early, navy if normal)
 *
 * Position of each tick is: (minutes_since_midnight / 1440) * 100  (as %)
 *
 * The filled region uses a `barGrow` CSS animation (defined in KEYFRAMES) so
 * it animates left→right on mount, making the shift duration feel alive.
 *
 * Accepts already-normalised "HH:MM" strings.
 */
export function TimelineBar({
  timeIn,
  timeOut,
}: {
  timeIn: string | null;
  timeOut: string | null;
}) {
  const late = isLate(timeIn);
  const early = isEarlyOut(timeOut, timeIn);

  // Reference lines — positioned as percentage of 24h
  const markers = [
    { pct: (7 * 60) / (24 * 60) * 100, label: '7a' },
    { pct: (12 * 60) / (24 * 60) * 100, label: '12p' },
    { pct: (17 * 60) / (24 * 60) * 100, label: '5p' },
  ];

  const inPct = timeIn ? (toMinutes(timeIn) / (24 * 60)) * 100 : null;
  const outPct = timeOut ? (toMinutes(timeOut) / (24 * 60)) * 100 : null;

  return (
    <div className="relative h-6 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-hidden mt-2">
      {/* Reference lines */}
      {markers.map(({ pct, label }) => (
        <div
          key={label}
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${pct}%` }}
        >
          <div className="w-px h-full bg-slate-300/70 dark:bg-slate-600" />
          <span className="absolute bottom-0.5 text-[8px] text-slate-400 dark:text-slate-500 translate-x-1">
            {label}
          </span>
        </div>
      ))}

      {/* Working period fill — grows left→right via barGrow animation */}
      {inPct !== null && outPct !== null && (
        <div
          className="absolute top-1 bottom-1 rounded-full bg-[#1d4791]/20 dark:bg-[#1d4791]/30 origin-left"
          style={{
            left: `${inPct}%`,
            right: `${100 - outPct}%`,
            animation: 'barGrow 0.5s cubic-bezier(0.16,1,0.3,1) both',
          }}
        />
      )}

      {/* Time-in tick */}
      {inPct !== null && (
        <div
          className={`absolute top-0 bottom-0 w-1.5 rounded-full ${late ? 'bg-[#d85e39]' : 'bg-emerald-500'}`}
          style={{ left: `calc(${inPct}% - 3px)` }}
        />
      )}

      {/* Time-out tick */}
      {outPct !== null && (
        <div
          className={`absolute top-0 bottom-0 w-1.5 rounded-full ${early ? 'bg-amber-400' : 'bg-[#1d4791]'}`}
          style={{ left: `calc(${outPct}% - 3px)` }}
        />
      )}
    </div>
  );
}


// ─── LogRow ──────────────────────────────────────────────────────────────────
/**
 * Renders one employee's attendance record inside a TimelineDayCard.
 *
 * Layout (left → right):
 *   EmpAvatar | name + StatusBadge
 *              | department text
 *              | TimelineBar
 *              | time-in → time-out · duration  |  "View details →" (on hover)
 *
 * Animation: `fadeUp` with a staggered delay of `index * 45ms` so consecutive
 * rows cascade in rather than all appearing at once.
 *
 * The entire row is clickable; clicking fires `onEmployeeClick(log.employee_id)`
 * which causes the parent to switch to the EmployeeDetailView.
 */
export function LogRow({
  log,
  index,
  onEmployeeClick,
}: {
  log: AttendanceLog;
  index: number;
  onEmployeeClick?: (id: string) => void;
}) {
  const { timeIn, timeOut } = resolveTime(log);
  const late = isLate(timeIn);
  const earlyOut = isEarlyOut(timeOut, timeIn);
  const duration = calculateDuration(timeIn, timeOut);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 hover:bg-[#1d4791]/[0.03] dark:hover:bg-[#1d4791]/10 transition-colors duration-150 cursor-pointer group border-b border-slate-100 dark:border-slate-800 last:border-0"
      style={{ animation: `fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) ${index * 45}ms both` }}
      onClick={() => onEmployeeClick?.(log.employee_id)}
    >
      <EmpAvatar name={log.employee_name} size="md" />

      <div className="flex-1 min-w-0">
        {/* Name + status badge */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#1d4791] dark:group-hover:text-blue-300 transition-colors duration-150">
            {log.employee_name}
          </p>
          <StatusBadge timeIn={timeIn} timeOut={timeOut} />
        </div>

        {/* Department */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5">{log.department}</p>

        {/* Mini timeline */}
        <TimelineBar timeIn={timeIn} timeOut={timeOut} />

        {/* Time labels + duration */}
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            <span className={`font-semibold ${late ? 'text-[#d85e39]' : 'text-slate-600 dark:text-slate-300'}`}>
              {formatTimeDisplay(timeIn)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">→</span>
            <span className={`font-semibold ${earlyOut ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>
              {formatTimeDisplay(timeOut)}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-400 dark:text-slate-500">{duration}</span>
          </div>

          {/* Hover hint — invisible until the row is hovered */}
          <span className="text-[10px] font-semibold text-[#1d4791] dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 pr-1">
            View details
            <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}


// ─── TimelineDayCard ─────────────────────────────────────────────────────────
/**
 * Groups all LogRow entries for a single calendar day into a card.
 *
 * Header: date label + "Today" badge + employee count pill.
 *
 * Search bar (visible only when logs.length > PAGE_SIZE):
 *   - Filters the list instantly as the user types (client-side, no request)
 *   - Matches against employee_name and department (case-insensitive)
 *   - Typing resets pagination to page 1 so results appear immediately
 *   - A clear (×) button resets the query back to empty
 *
 * Pagination (visible only when not searching AND logs.length > PAGE_SIZE):
 *   - Shows PAGE_SIZE rows at a time (default: 10)
 *   - "Show X more" button appends another PAGE_SIZE rows
 *   - "Show less" collapses back to PAGE_SIZE, scrolling back to the top
 *   - When searching: pagination is bypassed — all matches are shown
 *
 * Design decision — why search-first, paginate-second:
 *   Pure pagination forces the user to click "show more" many times to reach
 *   someone near the end of a large list. With search, the user types 2–3
 *   characters and sees only relevant rows immediately — pagination is only
 *   needed for the "browsing with no filter" case.
 *
 * State owned here (not lifted — each day card is independent):
 *   query      — the current search string
 *   visibleCount — how many rows are currently shown (pagination offset)
 */

const PAGE_SIZE = 10; // rows shown per page before "Show more"

export function TimelineDayCard({
  date,
  logs,
  index = 0,
  onEmployeeClick,
}: {
  date: Date;
  logs: AttendanceLog[];
  index?: number;
  onEmployeeClick?: (id: string) => void;
}) {
  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const isToday = new Date().toDateString() === date.toDateString();

  // ── Local state ───────────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // ── Derived lists ─────────────────────────────────────────────────────────

  // Full sorted list — alphabetical by name, computed once per logs change
  const sorted = useMemo(
    () => [...logs].sort((a, b) => (a.employee_name || '').localeCompare(b.employee_name || '')),
    [logs],
  );

  // Search-filtered list — runs whenever query or sorted changes.
  // Normalise both sides to lowercase so "dan" matches "DanteM".
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => q
      ? sorted.filter(log =>
        (log.employee_name || '').toLowerCase().includes(q) ||
        (log.department || '').toLowerCase().includes(q),
      )
      : sorted,
    [sorted, q],
  );

  // Determine which rows to actually render:
  //   - If the user is searching → show all matches (no pagination cap)
  //   - Otherwise              → cap at visibleCount
  const isSearching = q.length > 0;
  const visibleLogs = isSearching ? filtered : filtered.slice(0, visibleCount);
  const hasMore = !isSearching && filtered.length > visibleCount;
  const hasLess = !isSearching && visibleCount > PAGE_SIZE;
  const hiddenCount = filtered.length - visibleCount; // rows behind "show more"

  // Reset pagination when the search query changes so the user always sees
  // results from the top, and restore it when they clear the search.
  const handleQueryChange = (val: string) => {
    setQuery(val);
    setVisibleCount(PAGE_SIZE); // always reset so first results are visible
  };

  const handleShowMore = () => setVisibleCount(n => n + PAGE_SIZE);
  const handleShowLess = () => setVisibleCount(PAGE_SIZE);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-sm ${isToday
        ? 'border-[#1d4791]/30 dark:border-[#1d4791]/40'
        : 'border-slate-200 dark:border-slate-700/60'
        } bg-white dark:bg-slate-900`}
      style={{ animation: `fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 60}ms both` }}
    >
      {/* ── Card header ──────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${isToday
        ? 'bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border-[#1d4791]/10'
        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60'
        }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-1 h-5 rounded-full ${isToday ? 'bg-[#1d4791]' : 'bg-slate-300 dark:bg-slate-600'}`} />
          <Calendar className={`w-3.5 h-3.5 ${isToday ? 'text-[#1d4791] dark:text-blue-300' : 'text-slate-400'}`} />
          <span className={`text-sm font-bold ${isToday ? 'text-[#1d4791] dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
            {dayStr}
          </span>
          {isToday && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-[#1d4791] text-white">
              Today
            </span>
          )}
        </div>

        {/* Employee count — updates to show filtered/total when searching */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
          <Users className="w-2.5 h-2.5" />
          {isSearching
            ? <>{filtered.length} <span className="text-slate-300 dark:text-slate-600 font-normal">of {logs.length}</span></>
            : <>{logs.length} {logs.length === 1 ? 'employee' : 'employees'}</>
          }
        </span>
      </div>

      {/* ── Search bar — only shown when there's enough data to need it ── */}
      {logs.length > PAGE_SIZE && (
        <div className={`px-4 py-2.5 border-b ${isToday
          ? 'bg-[#1d4791]/4 dark:bg-[#1d4791]/8 border-[#1d4791]/8'
          : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
          }`}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search by name or department…"
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#1d4791]/50 dark:focus:border-[#1d4791]/50 focus:ring-1 focus:ring-[#1d4791]/20 transition-all duration-150"
            />
            {query && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-100"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {logs.length === 0 ? (
        // No records for this day at all
        <div
          className="py-10 flex flex-col items-center justify-center text-center"
          style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-xs font-semibold text-slate-400">No records for this day</p>
        </div>
      ) : filtered.length === 0 ? (
        // Records exist but search query returned nothing
        <div
          className="py-10 flex flex-col items-center justify-center text-center"
          style={{ animation: 'scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mb-2">
            <Search className="w-4 h-4 text-slate-300 dark:text-slate-500" />
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No employees match <span className="text-[#1d4791] dark:text-blue-300">"{query}"</span>
          </p>
          <button
            onClick={() => handleQueryChange('')}
            className="mt-2 text-[10px] font-semibold text-slate-400 hover:text-[#1d4791] dark:hover:text-blue-300 transition-colors duration-150"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div>
          {/* Visible rows */}
          {visibleLogs.map((log, i) => (
            <LogRow
              key={`${log.employee_id}-${log.date}-${i}`}
              log={log}
              index={i}
              onEmployeeClick={onEmployeeClick}
            />
          ))}

          {/* ── Pagination footer ─────────────────────────────────────── */}
          {(hasMore || hasLess) && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
              {/* Progress indicator — "Showing X of Y" */}
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Showing{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300">{visibleLogs.length}</span>
                {' '}of{' '}
                <span className="font-bold text-slate-600 dark:text-slate-300">{filtered.length}</span>
              </span>

              <div className="flex items-center gap-2">
                {/* Show more — appends PAGE_SIZE more rows */}
                {hasMore && (
                  <button
                    onClick={handleShowMore}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#1d4791] dark:text-blue-300 bg-[#1d4791]/8 dark:bg-[#1d4791]/15 hover:bg-[#1d4791]/15 dark:hover:bg-[#1d4791]/25 border border-[#1d4791]/15 dark:border-[#1d4791]/25 transition-all duration-150 active:scale-95"
                    style={{ animation: 'fadeUp 0.2s cubic-bezier(0.16,1,0.3,1) both' }}
                  >
                    Show {Math.min(hiddenCount, PAGE_SIZE)} more
                    <span className="text-[#1d4791]/50 dark:text-blue-400/50 font-normal">
                      · {hiddenCount} remaining
                    </span>
                  </button>
                )}

                {/* Show less — collapses back to PAGE_SIZE */}
                {hasLess && (
                  <button
                    onClick={handleShowLess}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all duration-150 active:scale-95"
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ─── StatCard ────────────────────────────────────────────────────────────────
/**
 * A single metric tile: a large bold number over a small label.
 * Used in the EmployeeDetailView stat strip (Total, On Time, Late, …).
 *
 * `variant` maps to a colour scheme (background + text colour).
 * `delay` controls when the `countUp` animation fires relative to siblings —
 * pass a multiple of 60ms so tiles cascade in left→right.
 *
 * Variants:
 *   'navy'    → #1d4791 blue   (Total, Missing)
 *   'orange'  → #d85e39 burnt orange (Late)
 *   'amber'   → amber-600      (Early Out)
 *   'emerald' → emerald-600    (On Time)
 *   'slate'   → slate-600      (neutral / Total)
 *   'violet'  → violet-600     (Half Day)
 */
export function StatCard({
  label,
  value,
  variant,
  delay = 0,
}: {
  label: string;
  value: number;
  variant: 'navy' | 'orange' | 'amber' | 'emerald' | 'slate' | 'violet';
  delay?: number;
}) {
  const bgCls: Record<typeof variant, string> = {
    navy: 'bg-[#1d4791]/10 dark:bg-[#1d4791]/20 border-[#1d4791]/15',
    orange: 'bg-[#d85e39]/10 dark:bg-[#d85e39]/15 border-[#d85e39]/15',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30',
    slate: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700/30',
  };
  const textCls: Record<typeof variant, string> = {
    navy: 'text-[#1d4791] dark:text-blue-300',
    orange: 'text-[#d85e39]',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    slate: 'text-slate-600 dark:text-slate-300',
    violet: 'text-violet-600 dark:text-violet-400',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-3 rounded-xl border ${bgCls[variant]} transition-transform duration-150 hover:scale-[1.04]`}
      style={{ animation: `countUp 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
    >
      <span className={`text-2xl font-black leading-none ${textCls[variant]}`}>{value}</span>
      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">
        {label}
      </span>
    </div>
  );
}


// ─── LoadingState ─────────────────────────────────────────────────────────────
/**
 * Full-area placeholder rendered while `isLoading === true`.
 * A pulsing ring + spinner icon communicates that work is in progress.
 * The `pulse-ring` animation is defined in KEYFRAMES (attendance-log.constants.ts).
 */
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
      <div className="relative mb-4">
        <div
          className="absolute inset-0 rounded-2xl bg-[#1d4791]/15"
          style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
        />
        <div className="relative w-14 h-14 rounded-2xl bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/15 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#1d4791] dark:text-blue-400 animate-spin" />
        </div>
      </div>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Loading attendance logs</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Please wait a moment...</p>
    </div>
  );
}


// ─── EmptyState ──────────────────────────────────────────────────────────────
/**
 * Shown when the filtered log set is empty (no records match the current
 * date + department filter combination).
 * Prompts the user to adjust their filters rather than leaving a blank page.
 */
export function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center p-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
      style={{ animation: 'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#1d4791]/8 dark:bg-[#1d4791]/15 border border-[#1d4791]/12 dark:border-[#1d4791]/25 flex items-center justify-center mb-4">
        <CalendarIcon className="w-6 h-6 text-[#1d4791]/40 dark:text-blue-400/40" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">No attendance logs found</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your filters or date range</p>
    </div>
  );
}