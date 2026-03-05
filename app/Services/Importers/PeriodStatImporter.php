<?php

namespace App\Services\Importers;

use App\Models\AttendancePeriodStat;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * PeriodStatImporter
 *
 * Imports the "Att. Stat." sheet from the biometric XLS export
 * into the `attendance_period_stats` table.
 *
 * ── CONFIRMED SHEET LAYOUT ────────────────────────────────────────────────────
 *
 *  Row 1 : "Statistical Report of Attendance"        ← title, ignored
 *  Row 2 : "Stat.Date: 2025-10-01 ~ 2025-10-06"      ← period range string
 *  Row 3 : Parent headers (merged cells spanning multiple columns):
 *            "Name" | "Department" | "Work hour" | "Late" | "Leave early" |
 *            "Overtime hour" | "Att. Days (Nor./Real)" | "Out (Day)" |
 *            "Absent(Day)" | "AFL (Day)" | "Additem payment" |
 *            "Deduction payment" | "Real pay" | "Note"
 *  Row 4 : Sub-headers (leaf labels under each parent group):
 *            (under Work hour)    "Normal" | "Real"
 *            (under Late)         "Times"  | "Min"
 *            (under Leave early)  "Times"  | "Min"
 *            (under Overtime hour)"Workday" | "Holiday" | "Label"
 *            (under Additem)      "Overtime" | "Subsidy"
 *            (under Deduction)    "Late/Leave" | "AFL" | "Cutpayment"
 *  Row 5+: One data row per employee:
 *            "AllanB" | "WEEKENDER" | "48:00" | "48:00" | 0 | 0 | 0 | 0 |
 *            "0:00" | "0:00" | "0:00" | "6/6" | 0 | 0 | 0 | 0 | 0 | 0 | 0 | note
 *
 * ── KEY FACTS ─────────────────────────────────────────────────────────────────
 *
 *  • NO employee ID column — the sheet starts directly with Name | Department.
 *    We resolve the ID by cross-referencing names against the Att.log sheet.
 *    If no match is found, the employee name itself is used as the key.
 *
 *  • Work hours and overtime are stored as "HH:MM" strings (e.g. "48:00").
 *    We convert these to decimal hours (48.0) for DB storage.
 *
 *  • Attendance days are stored as "6/6" (scheduled/real).
 *    We split this into two separate integer columns.
 *
 *  • The headers span TWO rows. This requires a two-pass scan:
 *    Pass 1 finds parent headers and records which column each parent starts at.
 *    Pass 2 assigns sub-header leaf columns using parent ownership ranges.
 *
 * ── BUG THAT WAS FIXED ────────────────────────────────────────────────────────
 *
 *  header_row was being set on EVERY row that contained "Name" — both passes
 *  scan rows 1–8, so header_row kept getting overwritten on each pass and
 *  landed on a data row (an employee name). The data loop then started AFTER
 *  those first N employees, skipping them entirely.
 *  Fix: lock header_row on the FIRST occurrence of "Name" and never update it again.
 */
class PeriodStatImporter
{
    // =========================================================================
    // PUBLIC ENTRY POINT
    // =========================================================================

    /**
     * Run the import for the Att. Stat. sheet.
     *
     * @param  Spreadsheet $spreadsheet  Already-loaded PhpSpreadsheet object
     * @return array  ['imported' => int, 'skipped' => int, 'errors' => array]
     */
    public function import(Spreadsheet $spreadsheet): array
    {
        // ── Locate the sheet ──────────────────────────────────────────────────
        $sheet = $spreadsheet->getSheetByName('Att. Stat.')
            ?? $spreadsheet->getSheetByName('Statistical Report of Attendance');

        if (! $sheet) {
            Log::warning('PeriodStatImporter: sheet not found in workbook');
            return ['imported' => 0, 'skipped' => 0, 'errors' => []];
        }

        $highestRow  = $sheet->getHighestRow();
        $highestColN = Coordinate::columnIndexFromString($sheet->getHighestColumn());

        // ── Step 1: Extract the period date range ─────────────────────────────
        // Row 2 contains "Stat.Date: 2025-10-01 ~ 2025-10-06".
        // We extract both dates — they become the unique key alongside employee_id.
        [$periodStart, $periodEnd] = $this->findPeriodRange($sheet, $highestColN);

        // ── Step 2: Build the column map from the two-row header ──────────────
        // Returns a map of semantic keys → column indices, e.g.:
        //   'name' => 1, 'dept' => 2, 'normal_hours' => 3, 'real_hours' => 4 …
        $colMap = $this->buildColMap($sheet, $highestRow, $highestColN);

        if ($colMap['header_row'] === null) {
            Log::error('PeriodStatImporter: could not find header row', [
                'dump' => $this->dumpRows($sheet, 1, 6),
            ]);
            return ['imported' => 0, 'skipped' => 0, 'errors' => [
                ['sheet' => 'Att. Stat.', 'error' => 'Could not locate column headers.'],
            ]];
        }

        // ── Step 3: Walk all data rows ────────────────────────────────────────
        // Data starts immediately after the last header row.
        // header_row is the PARENT header row (row 3 in this file).
        // The sub-header row (row 4) sits between header_row and the data.
        // So data starts at header_row + 2.
        $result = ['imported' => 0, 'skipped' => 0, 'errors' => []];

        for ($rowN = $colMap['header_row'] + 2; $rowN <= $highestRow; $rowN++) {

            // ── Read and validate the employee name ───────────────────────────
            // The name column is the first data column (col1 in this sheet).
            // Skip rows where the name is empty or numeric (blank / sub-header rows).
            $nameVal = $this->cellVal($sheet, $colMap['name'], $rowN);

            if ($nameVal === '' || is_numeric($nameVal)) {
                continue; // blank row or stray numeric cell — not an employee row
            }

            // ── Resolve the employee ID ───────────────────────────────────────
            // This sheet has no ID column, so we look up the name in the Att.log
            // sheet which has both ID and Name on the same row.
            // Falls back to using the name string itself if no match is found.
            $empId = $this->resolveEmployeeId($spreadsheet, $nameVal) ?? $nameVal;

            // Department is in col2
            $empDept = $this->cellVal($sheet, $colMap['dept'], $rowN);

            // ── Shorthand closure for safe column reads ───────────────────────
            // Returns '' for any column that was not found during header scan
            // (e.g. AFL column missing from some export versions).
            $col = fn(?int $c): string => $c !== null
                ? $this->cellVal($sheet, $c, $rowN)
                : '';

            // ── Work hours — "HH:MM" strings converted to decimal ─────────────
            // "48:00" = 48 hours normal work for a 6-day period
            $normalHours = $this->hhmmToDecimal($col($colMap['normal_hours']));
            $realHours   = $this->hhmmToDecimal($col($colMap['real_hours']));

            // ── Late and leave-early counts and minutes ───────────────────────
            $lateTimes       = (int) $col($colMap['late_times']);
            $lateMin         = (int) $col($colMap['late_min']);
            $leaveEarlyTimes = (int) $col($colMap['leave_early_times']);
            $leaveEarlyMin   = (int) $col($colMap['leave_early_min']);

            // ── Overtime hours per category — also "HH:MM" strings ───────────
            $otWorkday = $this->hhmmToDecimal($col($colMap['ot_workday']));
            $otHoliday = $this->hhmmToDecimal($col($colMap['ot_holiday']));
            $otLabel   = $this->hhmmToDecimal($col($colMap['ot_label']));

            // ── Attendance days — "6/6" → [scheduled => 6, attended => 6] ─────
            // The device writes this as "Nor./Real" meaning Nor.=scheduled, Real=actual
            [$scheduledDays, $attendedDays] = $this->parseSlashPair(
                $col($colMap['att_days']) ?: '0/0'
            );

            // ── Absence/out/AFL day counts — plain decimals ───────────────────
            $outDays    = (float) $col($colMap['out_days']);
            $absentDays = (float) $col($colMap['absent_days']);
            $aflDays    = (float) $col($colMap['afl_days']);

            // ── Payment columns — plain decimals ──────────────────────────────
            $otPay   = (float) $col($colMap['pay_overtime']);
            $subsidy = (float) $col($colMap['pay_subsidy']);
            $dedLate = (float) $col($colMap['ded_late']);
            $dedAfl  = (float) $col($colMap['ded_afl']);
            $cutPay  = (float) $col($colMap['cut_payment']);
            $realPay = (float) $col($colMap['real_pay']);
            $note    =         $col($colMap['note']);

            // ── Save to database ──────────────────────────────────────────────
            // Unique key: (employee_id + period_start + period_end).
            // One row per employee per import period.
            try {
                AttendancePeriodStat::updateOrCreate(
                    [
                        'employee_id'  => $empId,
                        'period_start' => $periodStart,
                        'period_end'   => $periodEnd,
                    ],
                    [
                        'employee_name'        => $nameVal,
                        'department'           => $empDept,
                        'normal_work_hours'    => $normalHours,
                        'real_work_hours'      => $realHours,
                        'late_times'           => $lateTimes,
                        'late_minutes'         => $lateMin,
                        'leave_early_times'    => $leaveEarlyTimes,
                        'leave_early_minutes'  => $leaveEarlyMin,
                        'overtime_workday'     => $otWorkday,
                        'overtime_holiday'     => $otHoliday,
                        'overtime_label'       => $otLabel,
                        'scheduled_days'       => $scheduledDays,
                        'attended_days'        => $attendedDays,
                        'out_days'             => $outDays,
                        'absent_days'          => $absentDays,
                        'afl_days'             => $aflDays,
                        'overtime_pay'         => $otPay,
                        'subsidy_pay'          => $subsidy,
                        'late_leave_deduction' => $dedLate,
                        'afl_deduction'        => $dedAfl,
                        'cut_payment'          => $cutPay,
                        'real_pay'             => $realPay,
                        'note'                 => $note,
                    ]
                );
                $result['imported']++;

            } catch (\Throwable $e) {
                $result['skipped']++;
                $result['errors'][] = [
                    'sheet'    => 'Att. Stat.',
                    'employee' => $nameVal,
                    'error'    => $e->getMessage(),
                ];
            }
        }

        return $result;
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Scan the first 5 rows for a string like "2025-10-01 ~ 2025-10-06"
     * and return [startDate, endDate] as formatted "YYYY-MM-DD" strings.
     *
     * Returns ['', ''] if not found — the caller stores them as empty strings
     * rather than crashing, so partial data is still saved.
     */
    private function findPeriodRange(Worksheet $sheet, int $maxColN): array
    {
        for ($rowN = 1; $rowN <= 5; $rowN++) {
            for ($colN = 1; $colN <= $maxColN; $colN++) {
                $val = $this->cellVal($sheet, $colN, $rowN);

                // Match "YYYY-MM-DD ~ YYYY-MM-DD" and capture both dates
                if (preg_match('/(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/', $val, $m)) {
                    return [$m[1], $m[2]];
                }
            }
        }

        return ['', ''];
    }

    /**
     * Build the full column map for this sheet's two-row header structure.
     *
     * ── WHY TWO PASSES? ───────────────────────────────────────────────────────
     * The header uses MERGED cells: "Work hour" spans cols 3–4, "Late" spans
     * cols 5–6, etc. The sub-header row below has "Normal", "Real" under Work hour,
     * "Times", "Min" under Late, and so on.
     *
     * A single-pass scan loses the parent context when it moves to the sub-header
     * row. Two passes solve this:
     *   Pass 1 — finds every parent header and records its START column.
     *   Pass 2 — finds every sub-header and determines which parent owns it
     *             by finding the nearest parent start column to the left.
     *
     * ── header_row BUG FIX ────────────────────────────────────────────────────
     * header_row must be locked on the FIRST row where "Name" appears (row 3).
     * Without `&& $colMap['header_row'] === null`, the check fires on every row
     * that contains a name-like value — including employee data rows — and
     * header_row ends up pointing deep into the data section, causing the first
     * N employees to be skipped.
     */
    private function buildColMap(Worksheet $sheet, int $maxRow, int $maxCol): array
    {
        // Pre-fill all keys as null — safe default for the $col closure in import()
        $colMap = [
            'header_row'        => null,
            'name'              => null,
            'dept'              => null,
            'normal_hours'      => null,
            'real_hours'        => null,
            'late_times'        => null,
            'late_min'          => null,
            'leave_early_times' => null,
            'leave_early_min'   => null,
            'ot_workday'        => null,
            'ot_holiday'        => null,
            'ot_label'          => null,
            'att_days'          => null,
            'out_days'          => null,
            'absent_days'       => null,
            'afl_days'          => null,
            'pay_overtime'      => null,
            'pay_subsidy'       => null,
            'ded_late'          => null,
            'ded_afl'           => null,
            'cut_payment'       => null,
            'real_pay'          => null,
            'note'              => null,
        ];

        // Pass 1 — scan rows 1–8 for parent headers and single-row leaf headers.
        // $parentStarts maps colN => semantic parent key for every parent found.
        $parentStarts = [];

        for ($rowN = 1; $rowN <= min($maxRow, 8); $rowN++) {
            for ($colN = 1; $colN <= $maxCol; $colN++) {
                $lower = strtolower(trim($this->cellVal($sheet, $colN, $rowN)));

                // ── Detect parent-level group headers ─────────────────────────
                // These are merged cells that span multiple columns.
                // We only record the START column — ownership range is inferred later.
                $parentKey = match (true) {
                    str_contains($lower, 'work hour')     => 'work_hour',
                    // Match "late" EXACTLY to avoid matching "late/leave" (a sub-col)
                    $lower === 'late'                      => 'late',
                    str_contains($lower, 'leave early')   => 'leave_early',
                    str_contains($lower, 'overtime hour') => 'overtime',
                    str_contains($lower, 'additem')       => 'additem',
                    str_contains($lower, 'deduction')     => 'deduction',
                    default                                => null,
                };

                if ($parentKey !== null) {
                    $parentStarts[$colN] = $parentKey;
                }

                // ── Detect single-row leaf headers ────────────────────────────
                // These appear in row 3 and map directly without needing a parent.
                match (true) {
                    $lower === 'name'                   => $colMap['name']        = $colN,
                    $lower === 'department'             => $colMap['dept']        = $colN,
                    // "Att. Days" written as "att. days" or "att.days"
                    str_contains($lower, 'att. days')   => $colMap['att_days']   = $colN,
                    str_contains($lower, 'att.days')    => $colMap['att_days']   = $colN,
                    // "Out (Day)" — guard: starts with "out" to avoid matching "overtime"
                    preg_match('/^out/', $lower) === 1  => $colMap['out_days']   = $colN,
                    str_contains($lower, 'absent')      => $colMap['absent_days'] = $colN,
                    str_contains($lower, 'real pay')    => $colMap['real_pay']   = $colN,
                    str_contains($lower, 'note')        => $colMap['note']       = $colN,
                    default                              => null,
                };

                // Lock header_row to the FIRST row where "name" is found.
                // This must use a null guard — without it, any later row containing
                // an employee name (a data row) would overwrite header_row and
                // cause the first N employees to be skipped on import.
                if ($colMap['name'] !== null && $colMap['header_row'] === null) {
                    $colMap['header_row'] = $rowN;
                }
            }
        }

        // ── Build the parent ownership helper ─────────────────────────────────
        // For any given column, this returns the semantic key of the parent that
        // owns it (i.e. the nearest parent start column to the left or equal).
        ksort($parentStarts);
        $parentStartCols = array_keys($parentStarts);

        $getParent = function (int $colN) use ($parentStarts, $parentStartCols): string {
            $owner = '';
            // Walk parent starts in ascending order — last one that is <= colN wins
            foreach ($parentStartCols as $startCol) {
                if ($colN >= $startCol) {
                    $owner = $parentStarts[$startCol];
                } else {
                    break; // gone past our column — stop
                }
            }
            return $owner;
        };

        // Pass 2 — scan rows 1–8 again for sub-header leaf cells.
        // Each sub-header is assigned using its parent ownership from Pass 1.
        for ($rowN = 1; $rowN <= min($maxRow, 8); $rowN++) {
            for ($colN = 1; $colN <= $maxCol; $colN++) {
                $lower  = strtolower(trim($this->cellVal($sheet, $colN, $rowN)));
                $parent = $getParent($colN);

                match (true) {
                    // Work hour sub-headers
                    $lower === 'normal'  && $parent === 'work_hour'    => $colMap['normal_hours']      = $colN,
                    $lower === 'real'    && $parent === 'work_hour'    => $colMap['real_hours']        = $colN,
                    // Late sub-headers
                    $lower === 'times'   && $parent === 'late'         => $colMap['late_times']        = $colN,
                    $lower === 'min'     && $parent === 'late'         => $colMap['late_min']          = $colN,
                    // Leave early sub-headers
                    $lower === 'times'   && $parent === 'leave_early'  => $colMap['leave_early_times'] = $colN,
                    $lower === 'min'     && $parent === 'leave_early'  => $colMap['leave_early_min']   = $colN,
                    // Overtime hour sub-headers
                    $lower === 'workday' && $parent === 'overtime'     => $colMap['ot_workday']        = $colN,
                    $lower === 'holiday' && $parent === 'overtime'     => $colMap['ot_holiday']        = $colN,
                    $lower === 'label'   && $parent === 'overtime'     => $colMap['ot_label']          = $colN,
                    // AFL — standalone column (no parent group), guard: parent must be empty
                    str_contains($lower, 'afl') && $parent === ''      => $colMap['afl_days']          = $colN,
                    // Additem payment sub-headers
                    $lower === 'overtime' && $parent === 'additem'     => $colMap['pay_overtime']      = $colN,
                    $lower === 'subsidy'  && $parent === 'additem'     => $colMap['pay_subsidy']       = $colN,
                    // Deduction sub-headers
                    str_contains($lower, 'late/leave')                  => $colMap['ded_late']          = $colN,
                    $lower === 'afl'      && $parent === 'deduction'   => $colMap['ded_afl']           = $colN,
                    str_contains($lower, 'cutpayment')                  => $colMap['cut_payment']       = $colN,
                    default                                              => null,
                };
            }
        }

        return $colMap;
    }

    /**
     * Resolve an employee's numeric ID by searching the Att.log sheet.
     *
     * The Att.log sheet has both ID and Name on the same row ("ID:" rows).
     * We scan all "ID:" rows and match by name (case-insensitive).
     * Returns null if not found — caller falls back to using the name as the key.
     */
    private function resolveEmployeeId(Spreadsheet $spreadsheet, string $name): ?string
    {
        // Look for the Att.log sheet — it may have either tab name
        $logSheet = $spreadsheet->getSheetByName('Att.log report')
            ?? $spreadsheet->getSheetByName('Attendance Record Report');

        if (! $logSheet) {
            return null; // Att.log sheet missing — can't resolve IDs
        }

        $highestRow  = $logSheet->getHighestRow();
        $highestColN = Coordinate::columnIndexFromString($logSheet->getHighestColumn());

        for ($rowN = 1; $rowN <= $highestRow; $rowN++) {
            // Only process rows that start with "ID:" — these are employee header rows
            if (strtolower(trim($this->cellVal($logSheet, 1, $rowN))) !== 'id:') {
                continue;
            }

            // col3 = employee ID, col11 = employee name (confirmed from debug log)
            // We use the same bounded label scan as AttLogImporter for safety
            $rowId   = trim($this->cellVal($logSheet, 3,  $rowN)); // col3 = ID value
            $rowName = trim($this->cellVal($logSheet, 11, $rowN)); // col11 = Name value

            if (strtolower($rowName) === strtolower(trim($name))) {
                return $rowId; // found a match
            }
        }

        return null; // no match found
    }

    /**
     * Convert an "HH:MM" hours string to a decimal float.
     *
     * Examples:
     *   "48:00" → 48.0    (normal week total)
     *   "9:30"  →  9.5    (9 hours 30 minutes)
     *   "0:00"  →  0.0
     *   ""      →  0.0    (column not found or cell empty)
     */
    private function hhmmToDecimal(string $val): float
    {
        if ($val === '' || $val === '0:00') {
            return 0.0;
        }

        $parts = explode(':', $val);
        $hours = (int) ($parts[0] ?? 0);
        $mins  = (int) ($parts[1] ?? 0);

        return round($hours + $mins / 60, 2);
    }

    /**
     * Parse an "N/M" slash-pair into two integers.
     *
     * Used for the attendance days column: "6/6" → scheduled=6, real=6.
     * "6/5" → scheduled=6, real=5 (one day missed).
     * Returns [0, 0] for empty or malformed values.
     */
    private function parseSlashPair(string $val): array
    {
        if (str_contains($val, '/')) {
            $parts = explode('/', $val, 2);
            return [(int) trim($parts[0]), (int) trim($parts[1])];
        }

        return [0, 0];
    }

    /**
     * Read a single cell and return a clean trimmed string.
     *
     * Handles:
     *   null              → ''
     *   Excel time serial → "HH:MM"   (float between 0 and 1)
     *   Anything else     → cast to string and trim
     */
    private function cellVal(Worksheet $sheet, ?int $colN, int $rowN): string
    {
        if ($colN === null) {
            return ''; // guard: column was not found during header scan
        }

        $coord = Coordinate::stringFromColumnIndex($colN) . $rowN;
        $val   = $sheet->getCell($coord)->getValue();

        if ($val === null) {
            return '';
        }

        // Excel time serial: float between 0 and 1 represents time of day
        if (is_float($val) && $val > 0 && $val < 1) {
            return ExcelDate::excelToDateTimeObject($val)->format('H:i');
        }

        return trim((string) $val);
    }

    /**
     * Dump the first N rows of a sheet as an array for error logging.
     * Only called on error paths — not during normal import.
     */
    private function dumpRows(Worksheet $sheet, int $fromRow, int $toRow): array
    {
        $dump    = [];
        $maxColN = Coordinate::columnIndexFromString($sheet->getHighestColumn());

        for ($rowN = $fromRow; $rowN <= $toRow; $rowN++) {
            $row = [];
            for ($colN = 1; $colN <= $maxColN; $colN++) {
                $val = $this->cellVal($sheet, $colN, $rowN);
                if ($val !== '') {
                    $row['c' . $colN] = $val;
                }
            }
            $dump['row' . $rowN] = $row;
        }

        return $dump;
    }
}