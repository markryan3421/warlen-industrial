import { useState, useMemo, useCallback, useEffect, useRef } from "react";

// ─── Utility helpers ──────────────────────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  // 0=Sun…6=Sat → convert to Mon-based (0=Mon…6=Sun)
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7;
}
function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function today() {
  return toDateKey(new Date());
}

// Deterministic color per employee name
const CHIP_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  { bg: "bg-violet-100", text: "text-violet-800", dot: "bg-violet-500" },
  { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-500" },
];
function getEmployeeColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return CHIP_COLORS[Math.abs(hash) % CHIP_COLORS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Format "HH:MM:SS" or full datetime "YYYY-MM-DD HH:MM:SS" → "H:MM AM/PM"
function formatTime(raw) {
  if (!raw) return null;
  const timePart = raw.includes(" ") ? raw.split(" ")[1] : raw;
  const [h, m] = timePart.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Derive attendance status from time data
function getAttendanceStatus(record) {
  const hasAnyIn = record.amTimeIn || record.pmTimeIn;
  const hasAnyOut = record.amTimeOut || record.pmTimeOut;
  if (!hasAnyIn && !hasAnyOut) return { label: "Absent", color: "bg-red-50 text-red-600 border-red-100" };
  if (hasAnyIn && !hasAnyOut) return { label: "Partial", color: "bg-amber-50 text-amber-600 border-amber-100" };
  return { label: "Present", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
}

// Clock icon SVG (inline, no dep)
function ClockIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.5" />
      <path strokeLinecap="round" d="M8 5v3.5l2 1.5" />
    </svg>
  );
}

/** Single employee attendance chip — compact mode for calendar cells */
function EmployeeChip({ record, compact = false }) {
  const color = getEmployeeColor(record.employeeName);
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight ${color.bg} ${color.text} truncate max-w-full`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
        <span className="truncate">{record.employeeName}</span>
      </span>
    );
  }

  // Full card — used inside modal
  const amIn = formatTime(record.amTimeIn);
  const amOut = formatTime(record.amTimeOut);
  const pmIn = formatTime(record.pmTimeIn);
  const pmOut = formatTime(record.pmTimeOut);
  const status = getAttendanceStatus(record);
  const initials = record.employeeName
    ? record.employeeName.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()
    : "??";
  const accentDot = color.dot;

  return (
    <div className="group flex items-stretch gap-0 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-150 overflow-hidden">
      {/* Left accent bar */}
      <div className={`w-1 flex-shrink-0 ${accentDot}`} />

      {/* Avatar + identity */}
      <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${color.bg} ${color.text}`}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{record.employeeName}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ID {record.employeeId}
            <span className="mx-1.5 opacity-40">·</span>
            {record.department}
          </p>
        </div>
      </div>

      {/* Time columns */}
      <div className="flex items-center divide-x divide-slate-100 border-l border-slate-100 flex-shrink-0">
        {/* AM */}
        <div className="px-4 py-3 text-center min-w-[90px]">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">AM</p>
          <div className="flex items-center gap-1 justify-center">
            <ClockIcon className="w-3 h-3 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-600">{amIn ?? <span className="text-slate-300">—</span>}</span>
          </div>
          <div className="flex items-center gap-1 justify-center mt-0.5">
            <ClockIcon className="w-3 h-3 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400">{amOut ?? <span className="text-slate-300">—</span>}</span>
          </div>
        </div>

        {/* PM */}
        <div className="px-4 py-3 text-center min-w-[90px]">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">PM</p>
          <div className="flex items-center gap-1 justify-center">
            <ClockIcon className="w-3 h-3 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-600">{pmIn ?? <span className="text-slate-300">—</span>}</span>
          </div>
          <div className="flex items-center gap-1 justify-center mt-0.5">
            <ClockIcon className="w-3 h-3 text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400">{pmOut ?? <span className="text-slate-300">—</span>}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="px-4 py-3 flex items-center justify-center min-w-[88px]">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wide ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Day detail modal */
function DayPopover({ dateKey, records, onClose, renderEvent }) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "long" });
  const monthLabel = MONTHS[month - 1];

  const presentCount = records.filter(r => r.amTimeIn || r.pmTimeIn).length;
  const absentCount = records.length - presentCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" />

      {/* Panel — animate in */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100"
        style={{ animation: "modalIn 0.18s cubic-bezier(0.16,1,0.3,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(8px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0)   scale(1);    }
          }
        `}</style>

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Date badge */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/8 border border-primary/12 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-none">{monthLabel.slice(0, 3)}</span>
              <span className="text-2xl font-black text-primary leading-tight">{day}</span>
            </div>

            {/* Title + meta */}
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{weekday}</p>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Attendance — {monthLabel} {day}, {year}
              </h2>
              {/* Summary pills */}
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {presentCount} present
                </span>
                {absentCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-[10px] font-bold text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    {absentCount} absent
                  </span>
                )}
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] font-medium text-slate-400">{records.length} total</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-sm mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* ── Column headers ── */}
        {records.length > 0 && (
          <div className="flex items-center gap-0 px-6 py-2 bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex-1">Employee</span>
            <span className="w-[90px] text-center">AM</span>
            <span className="w-[90px] text-center">PM</span>
            <span className="w-[88px] text-center">Status</span>
          </div>
        )}

        {/* ── Record list ── */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1.5">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 text-xl mb-3">📅</div>
              <p className="text-sm font-medium text-slate-400">No attendance records for this day.</p>
            </div>
          ) : (
            records.map((record, i) =>
              renderEvent ? (
                <div key={i}>{renderEvent(record)}</div>
              ) : (
                <EmployeeChip key={i} record={record} />
              )
            )
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-[11px] text-slate-400">
            Showing <span className="font-semibold text-slate-600">{records.length}</span> {records.length === 1 ? "record" : "records"}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Single calendar day cell */
function DayCell({ dateKey, records, isCurrentMonth, onDayClick, renderEvent, maxVisible = 3 }) {
  const isToday = dateKey === today();
  const visible = records.slice(0, maxVisible);
  const overflow = records.length - maxVisible;

  return (
    <div
      onClick={() => records.length > 0 && onDayClick(dateKey, records)}
      className={[
        "relative min-h-[90px] p-1.5 border-b border-r border-slate-100 transition-colors",
        isCurrentMonth ? "bg-white" : "bg-slate-50/60",
        records.length > 0 ? "cursor-pointer hover:bg-slate-50 group" : "cursor-default",
      ].join(" ")}
    >
      {/* Date number */}
      <div className="flex items-start justify-between mb-1">
        <span
          className={[
            "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold transition-colors",
            isToday
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-300"
              : isCurrentMonth
                ? "text-slate-700"
                : "text-slate-300",
          ].join(" ")}
        >
          {dateKey.split("-")[2].replace(/^0/, "")}
        </span>
        {records.length > 0 && (
          <span className="text-[10px] font-medium text-slate-400 group-hover:text-indigo-500 transition-colors mt-1">
            {records.length}
          </span>
        )}
      </div>

      {/* Chips */}
      <div className="space-y-0.5">
        {visible.map((r, i) =>
          renderEvent ? (
            <div key={i}>{renderEvent(r, true)}</div>
          ) : (
            <EmployeeChip key={i} record={r} compact />
          )
        )}
        {overflow > 0 && (
          <span className="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * AttendanceCalendar
 *
 * @prop {Array}    attendanceData   - Array of attendance records
 *                                    Each record: { date: "YYYY-MM-DD", employeeId, employeeName, department, absenceMinutes, totalExceptionMinutes }
 * @prop {Function} onDayClick       - (dateKey, records) => void — fired when a day cell is clicked
 * @prop {Function} onNewClick       - () => void — fired when "+ New" is clicked
 * @prop {Function} renderEvent      - Optional: (record, compact) => ReactNode — custom chip renderer
 * @prop {number}   maxVisible       - Max chips per cell before overflow (default 3)
 * @prop {string}   title            - Calendar header title (default "Attendance Calendar")
 */
export default function AttendanceCalendar({
  attendanceData = SAMPLE_DATA,
  onDayClick,
  onNewClick,
  renderEvent,
  maxVisible = 3,
  title = "Attendance Calendar",
}) {
  const now = new Date();

  // Normalize records: accept both snake_case (from Laravel/Inertia) and
  // camelCase keys so the component works regardless of how data is passed in.
  const normalizedData = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) return [];
    return attendanceData.map(r => ({
      date: r.date,
      employeeId: r.employeeId ?? r.employee_id,
      employeeName: r.employeeName ?? r.employee_name,
      department: r.department,
      amTimeIn: r.amTimeIn ?? r.am_time_in ?? null,
      amTimeOut: r.amTimeOut ?? r.am_time_out ?? null,
      pmTimeIn: r.pmTimeIn ?? r.pm_time_in ?? null,
      pmTimeOut: r.pmTimeOut ?? r.pm_time_out ?? null,
      absenceMinutes: r.absenceMinutes ?? r.absence_minutes ?? 0,
      totalExceptionMinutes: r.totalExceptionMinutes ?? r.total_exception_minutes ?? 0,
    }));
  }, [attendanceData]);

  // Derive the starting view month from the latest date in the dataset.
  // Re-runs whenever normalizedData changes (e.g. Inertia loads data after mount).
  const resolvedStart = useMemo(() => {
    if (normalizedData.length > 0) {
      const latest = normalizedData.reduce((max, r) => (r.date > max ? r.date : max), normalizedData[0].date);
      const [y, m] = latest.split("-").map(Number);
      return { year: y, month: m - 1 }; // month is 0-indexed internally
    }
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [normalizedData]);

  // ✅ Single state object — year + month always update atomically in one render.
  // useEffect syncs the view whenever the resolved start changes (data load/change).
  const [view, setView] = useState(resolvedStart);
  const viewYear = view.year;
  const viewMonth = view.month;
  const [popover, setPopover] = useState(null);

  // Sync view when data first arrives from Inertia (component may mount before data loads)
  const hasAutoNavigated = useRef(false);
  useEffect(() => {
    if (!hasAutoNavigated.current && normalizedData.length > 0) {
      setView(resolvedStart);
      hasAutoNavigated.current = true;
    }
  }, [normalizedData, resolvedStart]);

  // Index normalized records by date key for O(1) cell lookup
  const recordsByDate = useMemo(() => {
    const map = {};
    for (const record of normalizedData) {
      if (!map[record.date]) map[record.date] = [];
      map[record.date].push(record);
    }
    return map;
  }, [normalizedData]);

  // Build calendar grid (always 6 rows × 7 cols)
  const calendarGrid = useMemo(() => {
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);

    const cells = [];
    // Leading days from prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const key = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateKey: key, isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ dateKey: key, isCurrentMonth: true });
    }
    // Trailing days
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    let trail = 1;
    while (cells.length < 42) {
      const key = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(trail).padStart(2, "0")}`;
      cells.push({ dateKey: key, isCurrentMonth: false });
      trail++;
    }
    return cells;
  }, [viewYear, viewMonth]);

  const goToPrev = useCallback(() => {
    setView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }, []);
  const goToNext = useCallback(() => {
    setView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }, []);
  const goToToday = useCallback(() => {
    setView({ year: now.getFullYear(), month: now.getMonth() });
  }, []);

  const handleDayClick = useCallback((dateKey, records) => {
    setPopover({ dateKey, records });
    onDayClick?.(dateKey, records);
  }, [onDayClick]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
        {/* ── Header ── */}
        {/* <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
          <button
            onClick={onNewClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-indigo-200"
          >
            <span className="text-base leading-none">+</span> New
          </button>
        </div> */}

        {/* ── Month nav ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">
            {MONTHS[viewMonth]} {viewYear}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              today
            </button>
            <div className="flex items-center border border-slate-200 rounded-md overflow-hidden">
              <button
                onClick={goToPrev}
                aria-label="Previous month"
                className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-200"
              >
                ‹
              </button>
              <button
                onClick={goToNext}
                aria-label="Next month"
                className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* ── Day-of-week headers ── */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* ── Calendar grid ── */}
        <div className="grid grid-cols-7">
          {calendarGrid.map(({ dateKey, isCurrentMonth }) => (
            <DayCell
              key={dateKey}
              dateKey={dateKey}
              records={recordsByDate[dateKey] || []}
              isCurrentMonth={isCurrentMonth}
              onDayClick={handleDayClick}
              renderEvent={renderEvent}
              maxVisible={maxVisible}
            />
          ))}
        </div>
      </div>

      {/* ── Day detail popover ── */}
      {popover && (
        <DayPopover
          dateKey={popover.dateKey}
          records={popover.records}
          onClose={() => setPopover(null)}
          renderEvent={renderEvent}
        />
      )}
    </>
  );
}

// ─── Sample data (mirrors your table) ────────────────────────────────────────
const SAMPLE_DATA = [
  { date: "2025-10-02", employeeId: 1272, employeeName: "LhenieJaneS", department: "REGULAR", absenceMinutes: 473, totalExceptionMinutes: 480 },
  { date: "2025-10-04", employeeId: 1272, employeeName: "LhenieJaneS", department: "REGULAR", absenceMinutes: 469, totalExceptionMinutes: 480 },
  { date: "2025-10-03", employeeId: 754, employeeName: "JuluwieV", department: "WEEKENDER", absenceMinutes: 457, totalExceptionMinutes: 480 },
  { date: "2025-10-03", employeeId: 1272, employeeName: "LhenieJaneS", department: "REGULAR", absenceMinutes: 466, totalExceptionMinutes: 480 },
  { date: "2025-10-02", employeeId: 754, employeeName: "JuluwieV", department: "WEEKENDER", absenceMinutes: 457, totalExceptionMinutes: 480 },
  { date: "2025-10-06", employeeId: 1264, employeeName: "IrishSandraB", department: "REGULAR", absenceMinutes: 480, totalExceptionMinutes: 480 },
  { date: "2025-10-04", employeeId: 754, employeeName: "JuluwieV", department: "WEEKENDER", absenceMinutes: 457, totalExceptionMinutes: 480 },
  { date: "2025-10-07", employeeId: 1264, employeeName: "IrishSandraB", department: "REGULAR", absenceMinutes: 470, totalExceptionMinutes: 480 },
  { date: "2025-10-07", employeeId: 754, employeeName: "JuluwieV", department: "WEEKENDER", absenceMinutes: 460, totalExceptionMinutes: 480 },
  { date: "2025-10-07", employeeId: 1272, employeeName: "LhenieJaneS", department: "REGULAR", absenceMinutes: 455, totalExceptionMinutes: 480 },
  { date: "2025-10-08", employeeId: 1264, employeeName: "IrishSandraB", department: "REGULAR", absenceMinutes: 480, totalExceptionMinutes: 480 },
  { date: "2025-10-08", employeeId: 754, employeeName: "JuluwieV", department: "WEEKENDER", absenceMinutes: 457, totalExceptionMinutes: 480 },
];