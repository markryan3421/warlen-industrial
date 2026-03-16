// attendance-log.utils.ts
// ─────────────────────────────────────────────────────────────────────────────
// Pure functions — no React, no side effects, no imports from UI libraries.
// Every function here can be unit-tested in isolation with plain Node.
//
// Dependency flow (read top → bottom):
//
//   extractTime          ← lowest level; called by everything else
//   toMinutes            ← calls extractTime
//   parseRawLog          ← standalone; handles biometric merged strings
//   resolveTime          ← calls extractTime + parseRawLog
//   clampTimeIn          ← calls toMinutes; enforces the 07:30 floor rule
//   getSessionType       ← calls extractTime + toMinutes
//   isLate               ← calls extractTime + toMinutes
//   isHalfDay            ← calls getSessionType
//   isEarlyOut           ← calls extractTime + toMinutes + getSessionType
//   calculateDuration    ← calls extractTime + toMinutes + getSessionType + clampTimeIn
//   formatTimeDisplay    ← calls extractTime
//   getLogStatus         ← calls getSessionType + isLate + isEarlyOut
//
// ─────────────────────────────────────────────────────────────────────────────

import { T }                             from './attendance-log.constants';
import type { AttendanceLog, LogStatus, SessionType } from './attendance-log.types';

// ─── 1. extractTime ───────────────────────────────────────────────────────────
/**
 * Converts any time string the Laravel API / MySQL might send into a clean
 * "HH:MM" string, or returns null if the input is empty/unrecognisable.
 *
 * Why this exists:
 *   Laravel can cast datetime columns in multiple ways depending on whether
 *   `$casts` is set, the DB driver, and whether the value has been serialised
 *   through Carbon. Rather than fixing it in one place on the backend, this
 *   function acts as a normalisation gate — every other util calls this first
 *   so the rest of the codebase never has to worry about format variation.
 *
 * Supported formats:
 *   "07:32"                    → "07:32"   (already HH:MM — pass through)
 *   "07:32:00"                 → "07:32"   (HH:MM:SS — strip seconds)
 *   "2025-10-06T07:32:00"      → "07:32"   (ISO 8601 no timezone)
 *   "2025-10-06T07:32:00.000Z" → "07:32"   (ISO 8601 UTC)
 *   "2025-10-06 07:32:00"      → "07:32"   (MySQL DATETIME literal)
 */
export const extractTime = (raw: string | null): string | null => {
  if (!raw) return null;

  // ISO datetime — look for the 'T' separator then grab HH:MM after it
  const isoMatch = raw.match(/T(\d{2}):(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}:${isoMatch[2]}`;

  // MySQL datetime — "YYYY-MM-DD HH:MM:SS" — grab the time portion after the space
  const mysqlMatch = raw.match(/\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2})/);
  if (mysqlMatch) return `${mysqlMatch[1]}:${mysqlMatch[2]}`;

  // Plain time — "HH:MM" or "HH:MM:SS" — grab the first two groups
  const timeMatch = raw.match(/^(\d{2}):(\d{2})/);
  if (timeMatch) return `${timeMatch[1]}:${timeMatch[2]}`;

  return null; // unrecognised format — treat as no data
};


// ─── 2. toMinutes ─────────────────────────────────────────────────────────────
/**
 * Converts a "HH:MM" string into the total number of minutes since midnight.
 *
 * Example: "07:30" → 450,  "13:00" → 780,  "17:00" → 1020
 *
 * Calls extractTime internally so it also accepts raw ISO / MySQL strings —
 * useful when you need the numeric value without an intermediate variable.
 *
 * Used everywhere we need to compare two times arithmetically (isLate,
 * isEarlyOut, calculateDuration, getSessionType).
 */
export const toMinutes = (t: string): number => {
  const time = extractTime(t) ?? t; // extractTime handles ISO; fallback to t if already HH:MM
  return parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
};


// ─── 3. parseRawLog ───────────────────────────────────────────────────────────
/**
 * Parses a "merged" biometric string into separate time_in and time_out values.
 *
 * Some biometric devices emit a single concatenated string rather than two
 * separate fields. This function handles the three common forms:
 *
 *   "07:0217:01"   — no separator → split at character 5
 *   "07:02 17:01"  — space-separated
 *   "07:02-17:01"  — dash-separated
 *
 * Called by resolveTime() as a fallback when the log's `time_in` / `time_out`
 * fields are null but `raw_log` is present.
 */
export const parseRawLog = (raw: string): { time_in: string | null; time_out: string | null } => {
  if (!raw) return { time_in: null, time_out: null };

  const patterns = [
    /^(\d{2}:\d{2})(\d{2}:\d{2})$/,        // no separator
    /^(\d{2}:\d{2})\s+(\d{2}:\d{2})$/,     // space
    /^(\d{2}:\d{2})-(\d{2}:\d{2})$/,       // dash
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) return { time_in: match[1], time_out: match[2] };
  }

  return { time_in: null, time_out: null }; // unrecognised — both null
};


// ─── 4. resolveTime ───────────────────────────────────────────────────────────
/**
 * Extracts clean "HH:MM" time_in and time_out from any AttendanceLog record,
 * regardless of whether the data came from dedicated fields or a raw_log string.
 *
 * Resolution order:
 *   1. Use `log.time_in` / `log.time_out` directly (already normalised by extractTime)
 *   2. If null, fall back to parsing `log.raw_log` via parseRawLog
 *
 * All components call this instead of accessing `log.time_in` directly —
 * it is the single source of truth for time data throughout the UI.
 */
export const resolveTime = (log: AttendanceLog): { timeIn: string | null; timeOut: string | null } => {
  const rawIn  = log.time_in  ?? (log.raw_log ? parseRawLog(log.raw_log).time_in  : null);
  const rawOut = log.time_out ?? (log.raw_log ? parseRawLog(log.raw_log).time_out : null);
  return {
    timeIn : extractTime(rawIn),
    timeOut: extractTime(rawOut),
  };
};


// ─── 5. clampTimeIn ───────────────────────────────────────────────────────────
/**
 * Enforces the paid-hours floor: billable time never starts before 07:30.
 *
 * Rule: "Counting of total hours starts at 7:30 in the morning. So even if
 * you time-in at 7:29 or earlier, it is still counted as 7:30."
 *
 * Returns the later of the two: the actual time-in OR 07:30.
 *
 * Example:
 *   "07:10" → "07:30"   (too early — clamp to shift start)
 *   "07:30" → "07:30"   (exactly on time — no change)
 *   "07:45" → "07:45"   (late — keep actual time for docking)
 *
 * Only used inside calculateDuration. Status functions (isLate, getLogStatus)
 * always use the RAW time-in so the status label is accurate.
 */
export const clampTimeIn = (timeIn: string): string => {
  const m = toMinutes(timeIn);
  if (m < T.MORNING_ONTIME) {
    // Pad to "07:30"
    const h = Math.floor(T.MORNING_ONTIME / 60).toString().padStart(2, '0');
    const min = (T.MORNING_ONTIME % 60).toString().padStart(2, '0');
    return `${h}:${min}`;
  }
  return timeIn;
};


// ─── 6. getSessionType ───────────────────────────────────────────────────────
/**
 * Classifies which shift window an employee fell into, based solely on time-in.
 *
 * This is the central discriminant of the business logic. Every other
 * function (isLate, isEarlyOut, calculateDuration, getLogStatus) calls this
 * first to know which rule-set applies.
 *
 * Think of it as answering: "Which door did this person walk through today?"
 *
 *   'full'     — arrived ≤ 08:00 → morning window; works whole day
 *   'half'     — arrived 13:00–13:29 → PM-only window; half day
 *   'absent'   — arrived 08:01–12:59 OR ≥ 13:30 → no valid window
 *   'no-login' — null time-in → biometric never fired
 */
export const getSessionType = (timeIn: string | null): SessionType => {
  const ti = extractTime(timeIn);
  if (!ti) return 'no-login';
  try {
    const m = toMinutes(ti);
    if (m <= T.MORNING_LATE_MAX)                     return 'full';   // ≤ 08:00
    if (m >= T.LUNCH_END && m < T.PM_ABSENT_AT)      return 'half';   // 13:00–13:29
    return 'absent';                                                    // everything else
  } catch {
    return 'no-login';
  }
};


// ─── 7. isLate ───────────────────────────────────────────────────────────────
/**
 * Returns true when the employee arrived after the on-time cutoff (07:30) but
 * still within the last-allowed morning window (≤ 08:00).
 *
 * Note: This deliberately uses the RAW time-in (not the clamped one) so that
 * the status label "Late" appears even if the person arrived at 07:31.
 * The late minutes are reflected in calculateDuration via clampTimeIn.
 */
export const isLate = (timeIn: string | null): boolean => {
  const ti = extractTime(timeIn);
  if (!ti) return false;
  try {
    const m = toMinutes(ti);
    return m > T.MORNING_ONTIME && m <= T.MORNING_LATE_MAX;
  } catch { return false; }
};


// ─── 8. isHalfDay ────────────────────────────────────────────────────────────
/**
 * Convenience wrapper — returns true when getSessionType returns 'half'.
 * Used in UI components to conditionally render the "Half Day" label.
 */
export const isHalfDay = (timeIn: string | null): boolean =>
  getSessionType(timeIn) === 'half';


// ─── 9. isEarlyOut ───────────────────────────────────────────────────────────
/**
 * Returns true when a FULL-DAY employee left before 17:00.
 *
 * Half-day employees (session === 'half') are explicitly excluded — their PM
 * shift ends at 17:00 anyway, and they are never double-flagged.
 *
 * Requires BOTH timeOut AND timeIn because the session type (from timeIn)
 * determines whether the early-out rule even applies.
 */
export const isEarlyOut = (timeOut: string | null, timeIn: string | null = null): boolean => {
  const to = extractTime(timeOut);
  if (!to) return false;
  if (getSessionType(timeIn) !== 'full') return false; // only full-day workers are checked
  try { return toMinutes(to) < T.END_OF_DAY; }
  catch { return false; }
};


// ─── 10. calculateDuration ───────────────────────────────────────────────────
/**
 * Calculates the NET PAID duration for a single log record, formatted as "Xh Ym".
 *
 * Rules applied in order:
 *
 *   1. If either time is missing → '—'
 *   2. If session is 'absent' → '—' (no billable time regardless of clock)
 *   3. Clamp time-in to 07:30 (early arrivals don't earn extra pay)
 *   4. Calculate gross minutes (time_out − clamped time_in)
 *   5. Deduct 90 minutes for lunch IF:
 *        - session is 'full' (half-day has no morning session to lunch from)
 *        - AND clamped time-in ≤ LUNCH_START (11:30)
 *        - AND time-out ≥ LUNCH_END (13:00)
 *        (Condition: the shift must span the ENTIRE lunch window for the
 *         deduction to apply. Someone who leaves at 11:45 doesn't get docked.)
 *   6. Guard against zero/negative (edge case)
 *
 * Examples (with 07:30 floor):
 *   timeIn="07:10", timeOut="17:00"  → clamped to 07:30 → 9.5h − 1.5h = 8h 0m
 *   timeIn="07:30", timeOut="17:00"  → 9.5h − 1.5h = 8h 0m
 *   timeIn="07:45", timeOut="17:00"  → 9.25h − 1.5h = 7h 45m  (late, docked)
 *   timeIn="13:00", timeOut="17:00"  → 4h 0m  (half day, no lunch deduct)
 *   timeIn="07:30", timeOut="11:00"  → 3h 30m (left before lunch, no deduct)
 */
export const calculateDuration = (timeIn: string | null, timeOut: string | null): string => {
  const ti = extractTime(timeIn);
  const to = extractTime(timeOut);
  if (!ti || !to) return '—';

  if (getSessionType(timeIn) === 'absent') return '—'; // absent workers earn nothing

  try {
    const clampedIn = clampTimeIn(ti); // enforce 07:30 floor on paid start time
    const inMin     = toMinutes(clampedIn);
    const outMin    = toMinutes(to);

    let total = outMin - inMin;
    if (total < 0) total += 24 * 60; // overnight safety net

    // Deduct lunch only when the shift fully spans the 11:30–13:00 window
    if (
      getSessionType(timeIn) === 'full' &&
      inMin  <= T.LUNCH_START &&
      outMin >= T.LUNCH_END
    ) {
      total -= T.LUNCH_DEDUCT;
    }

    if (total <= 0) return '0h 0m';
    return `${Math.floor(total / 60)}h ${total % 60}m`;
  } catch {
    return '—';
  }
};


// ─── 11. formatTimeDisplay ───────────────────────────────────────────────────
/**
 * Formats a raw time string for display in the UI.
 *
 * Passes through extractTime so it handles any format (ISO, MySQL, plain).
 * Returns '—' (em dash) when the value is null/empty — consistent with how
 * calculateDuration signals missing data.
 */
export const formatTimeDisplay = (time: string | null): string => {
  const t = extractTime(time);
  return t ?? '—';
};


// ─── 12. getLogStatus ────────────────────────────────────────────────────────
/**
 * Derives the single LogStatus label for one attendance record.
 *
 * This is a pure decision function — it applies the business rules in strict
 * priority order (most severe → least severe) and returns as soon as it finds
 * a match. No two statuses are returned; the first matching condition wins.
 *
 * Priority waterfall:
 *   1. No data at all             → 'absent'
 *   2. Has time-out, no time-in   → 'missing-in'   (biometric glitch)
 *   3. getSessionType === 'absent'→ 'absent'        (out-of-window arrival)
 *   4. getSessionType === 'half'  → 'half-day'      (PM-only)
 *   5. No time-out                → 'missing-out'   (never clocked out)
 *   6. isLate                     → 'late'
 *   7. isEarlyOut                 → 'early-out'
 *   8. (none matched)             → 'on-time'
 *
 * Accepts already-normalised "HH:MM" strings (i.e. after resolveTime()).
 */
export const getLogStatus = (timeIn: string | null, timeOut: string | null): LogStatus => {
  // No records at all
  if (!timeIn && !timeOut) return 'absent';

  // Time-out present but no time-in → biometric glitch
  if (!timeIn && timeOut) return 'missing-in';

  const session = getSessionType(timeIn);

  // Arrived in a dead window (08:01–12:59 or ≥ 13:30)
  if (session === 'absent') return 'absent';

  // PM-only arrival — classified before missing-out so half-day isn't
  // accidentally flagged as missing-out when time-out is also absent
  if (session === 'half') return 'half-day';

  // Full-day from here on — check for missing clock-out
  if (!timeOut) return 'missing-out';

  if (isLate(timeIn))              return 'late';
  if (isEarlyOut(timeOut, timeIn)) return 'early-out';

  return 'on-time';
};