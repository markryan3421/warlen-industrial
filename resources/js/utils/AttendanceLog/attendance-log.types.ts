// attendance-log.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// All shared TypeScript interfaces and type aliases for the attendance log
// feature. Keeping types in one place means every other file can import from
// here instead of re-declaring or copy-pasting shapes.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One row from the `attendance_logs` table as sent by the Laravel API.
 *
 * `time_in` / `time_out` can arrive in several formats depending on how the
 * Eloquent model is configured (see attendance-log.utils.ts → extractTime).
 * `raw_log` is the original biometric string before it was parsed; it is used
 * as a fallback when `time_in` / `time_out` are null.
 */
export interface AttendanceLog {
  id          : number;
  employee_id : string;
  employee_name: string;
  department  : string;
  date        : string;        // ISO date string, e.g. "2025-10-06"
  time_in     : string | null; // e.g. "07:32", "07:32:00", "2025-10-06T07:32:00"
  time_out    : string | null;
  raw_log?    : string;        // e.g. "07:3217:01" — merged biometric string
}

/**
 * Props accepted by the top-level <AttendanceLogTimeline> component.
 *
 * All props are optional so the component can be dropped in with minimal
 * wiring. `logs` defaults to [] and `isLoading` defaults to false.
 */
export interface AttendanceLogTimelineProps {
  logs?            : AttendanceLog[] | null;
  onDateChange?    : (date: Date) => void;
  onEmployeeSelect?: (employeeId: string) => void;
  isLoading?       : boolean;
}

/**
 * Classifies an employee's attendance session based solely on their time-in.
 *
 * This is the central discriminant used by every status and duration function.
 * Think of it as answering: "Which shift window did this person actually make?"
 *
 *   'full'     — arrived ≤ 08:00 → worked (or partially worked) the morning
 *   'half'     — arrived 13:00–13:29 → PM-only session
 *   'absent'   — arrived in no valid window (08:01–12:59 or ≥ 13:30)
 *   'no-login' — no time-in record at all
 */
export type SessionType = 'full' | 'half' | 'absent' | 'no-login';

/**
 * All possible status labels for a single attendance record.
 * The order here mirrors the priority waterfall in getLogStatus().
 *
 *   'absent'      — no valid time-in (includes out-of-window arrivals)
 *   'missing-in'  — biometric glitch: time-out recorded, time-in missing
 *   'missing-out' — clocked in, never clocked out
 *   'half-day'    — PM-only arrival (13:00–13:29)
 *   'late'        — arrived 07:31–08:00
 *   'early-out'   — full-day worker left before 17:00
 *   'on-time'     — arrived ≤ 07:30, left ≥ 17:00
 */
export type LogStatus =
  | 'absent'
  | 'missing-in'
  | 'missing-out'
  | 'half-day'
  | 'late'
  | 'early-out'
  | 'on-time';