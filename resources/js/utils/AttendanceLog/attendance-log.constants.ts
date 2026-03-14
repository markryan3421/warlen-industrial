// attendance-log.constants.ts
// ─────────────────────────────────────────────────────────────────────────────
// All "magic numbers" and lookup tables in one place.
// Changing a policy (e.g. grace period, lunch length) means editing ONE line
// here — every function in utils.ts and every badge in components.tsx picks
// up the change automatically.
// ─────────────────────────────────────────────────────────────────────────────

import type { LogStatus } from './attendance-log.types';

// ─── Work-day schedule (all values are minutes since midnight) ────────────────
//
//  Full-day schedule
//  ┌─────────────────────────────────────────────────────────┐
//  │  07:30        11:30        13:00        17:00           │
//  │  Time-in  Lunch start  Lunch end   Time-out             │
//  │  (on-time)              (PM opens)  (end of day)        │
//  └─────────────────────────────────────────────────────────┘
//
//  Half-day schedule (PM only)
//  ┌──────────────────────────┐
//  │  13:00              17:00│
//  │  PM time-in      Time-out│
//  └──────────────────────────┘
//
//  Status rules:
//    time-in ≤ 07:30           → On Time   (full day)
//    time-in 07:31 – 08:00     → Late      (full day, docked minutes counted)
//    time-in 08:01 – 12:59     → Absent    (missed morning, PM hasn't opened)
//    time-in 13:00 – 13:29     → Half Day  (PM session)
//    time-in ≥ 13:30           → Absent    (too late even for PM)

export const T = {
  /** 07:30 — the on-time cutoff; arriving at or before this is "on time".
   *  Also the EARLIEST billable minute — if someone logs 07:15, their
   *  paid hours still start at 07:30 (see clampTimeIn in utils). */
  MORNING_ONTIME  : 7  * 60 + 30,  // 450 min

  /** 08:00 — last minute that still counts as a "late" full-day arrival.
   *  Arriving at 08:01 or later places the employee in the absent window
   *  (they missed too much of the morning session). */
  MORNING_LATE_MAX: 8  * 60 + 0,   // 480 min

  /** 11:30 — morning session ends, unpaid lunch begins.
   *  Lunch deduction only applies when the shift spans this boundary. */
  LUNCH_START     : 11 * 60 + 30,  // 690 min

  /** 13:00 — lunch ends and the PM session opens.
   *  Employees arriving exactly at 13:00 are classified as Half Day. */
  LUNCH_END       : 13 * 60 + 0,   // 780 min

  /** 13:30 — the PM session's own grace-period cutoff.
   *  Arriving here or later means the employee is absent for the whole day. */
  PM_ABSENT_AT    : 13 * 60 + 30,  // 810 min

  /** 17:00 — expected end of day.
   *  Leaving before this flags a full-day worker as Early Out. */
  END_OF_DAY      : 17 * 60 + 0,   // 1020 min

  /** 90 minutes — the unpaid lunch break deducted from full-day paid time.
   *  Only applied when the employee's shift spans the full lunch window
   *  (i.e. arrived ≤ LUNCH_START AND departed ≥ LUNCH_END). */
  LUNCH_DEDUCT    : 90,
} as const;


// ─── Status badge display metadata ───────────────────────────────────────────
//
// Maps each LogStatus to its human-readable label + Tailwind class strings.
// The `cls` key is the full className for the badge pill (background, text,
// border). The `dot` key is the className for the small color dot inside the
// badge. Keeping this as a lookup table means the badge component itself has
// zero conditional logic.

export const STATUS_META: Record<LogStatus, { label: string; cls: string; dot: string }> = {
  'absent': {
    label: 'Absent',
    // Orange — most severe; matches the 10% brand accent for exceptions
    cls  : 'bg-[#d85e39]/10 text-[#d85e39] border-[#d85e39]/25',
    dot  : 'bg-[#d85e39]',
  },
  'missing-in': {
    label: 'Missing In',
    // Amber — warning; data problem rather than policy violation
    cls  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30',
    dot  : 'bg-amber-400',
  },
  'missing-out': {
    label: 'Missing Out',
    cls  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/30',
    dot  : 'bg-amber-400',
  },
  'half-day': {
    label: 'Half Day',
    // Violet — distinct from both the warning amber and the error orange
    cls  : 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-700/30',
    dot  : 'bg-violet-400',
  },
  'late': {
    label: 'Late',
    // Orange (same as absent) — both are time-in violations
    cls  : 'bg-[#d85e39]/10 text-[#d85e39] border-[#d85e39]/25',
    dot  : 'bg-[#d85e39]',
  },
  'early-out': {
    label: 'Early Out',
    // Navy — mild; the employee was present, just left early
    cls  : 'bg-[#1d4791]/10 text-[#1d4791] border-[#1d4791]/20 dark:bg-[#1d4791]/20 dark:text-blue-300 dark:border-[#1d4791]/30',
    dot  : 'bg-[#1d4791]',
  },
  'on-time': {
    label: 'On Time',
    // Emerald — positive; the only truly "clean" status
    cls  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/30',
    dot  : 'bg-emerald-400',
  },
};


// ─── CSS keyframe animations ──────────────────────────────────────────────────
//
// Injected once via <style>{KEYFRAMES}</style> at the root of
// AttendanceLogTimeline. All animation: '...' inline styles in components.tsx
// reference these names.
//
//  slideDown  — page header entrance (drops in from above)
//  fadeUp     — cards, rows, list items (rise up from below, staggered)
//  scaleIn    — modals / detail panels (subtle zoom + rise)
//  countUp    — stat number pills (quick pop in, staggered)
//  barGrow    — timeline fill bar (grows left→right on mount)
//  shimmer    — reserved for skeleton loaders if needed
//  pulse-ring — loading state icon background ring

export const KEYFRAMES = `
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.97) translateY(4px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes barGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes shimmer {
    from { background-position: -200% 0; }
    to   { background-position:  200% 0; }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.4; }
    80%  { transform: scale(1.7); opacity: 0;   }
    100% { transform: scale(1.7); opacity: 0;   }
  }
`;