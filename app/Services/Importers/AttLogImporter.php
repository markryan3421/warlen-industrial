<?php

namespace App\Services\Importers;

use App\Models\AttendanceLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * AttLogImporter
 *
 * Imports the "Att.log report" sheet from the biometric XLS export
 * into the `attendance_logs` table.
 *
 * ── CONFIRMED SHEET LAYOUT ────────────────────────────────────────────────────
 *
 *  Row 1 : "Attendance Record Report"            ← title, ignored
 *  Row 2 : (empty)
 *  Row 3 : col1="Att. Time"  colN="2025-10-01 ~ 2025-10-06"  ← date range string
 *          col7(ish)="Tabulation"  col8(ish)="2025-10-07"     ← 7th summary column
 *  Row 4 : col1=1  col2=2  col3=3  col4=4  col5=5  col6=6    ← day-index integers
 *  Row 5 : col1="ID:"  col3="1444"  col9="Name:"  col11="AllanB"  col19="Dept.:"  col21="WEEKENDER"
 *  Row 6 : col1="07:0217:01"  col2="07:3717:10" … col6="07:0620:00"  ← punch row
 *  Row 7 : col1="ID:" …  (next employee header)
 *  …repeat for all 14 employees…
 *
 * ── KEY FACTS ─────────────────────────────────────────────────────────────────
 *
 *  • The date range string appears somewhere in row 3 — we scan for it.
 *  • The day-index row (row 4) contains integers 1–6 (or 1–31 for longer periods).
 *    These map each COLUMN to a calendar date: col1=Oct1, col2=Oct2, etc.
 *  • We detect the day-index row DYNAMICALLY (rows 3–7) in case the device
 *    inserts extra rows (e.g. "Tabulation") that shift the layout down.
 *  • Each employee occupies exactly TWO rows: an ID: header row + one punch row.
 *  • Punch cells contain ALL of that day's punches concatenated with NO separator:
 *      "07:0217:01"           → punched in at 07:02, out at 17:01
 *      "07:3807:3817:10"      → duplicate in punch, deduplicated → in=07:38 out=17:10
 *      "07:4117:0419:01"      → three events → first=IN (07:41), last=OUT (19:01)
 *      "07:41"                → only clocked in, no clock-out
 *  • A cell that is empty means the employee was absent or on holiday that day.
 *  • The "Tabulation" column (col7 in this file) is a device summary column —
 *    it is ignored because buildDateMap() only picks up integers 1–31.
 *
 * ── KNOWN EDGE CASE — EdwinJ (ID 1262) ────────────────────────────────────────
 *
 *  EdwinJ was absent on Oct 1, 3, 5 — so those punch cells are empty.
 *  He punched in on Oct 2, 4, 6 only.
 *  The old parser skipped his entire block because extractEmployee() was reading
 *  his name cell at the wrong column. Fixed by the bounded label-to-label scan
 *  in extractEmployee() below.
 */
class AttLogImporter
{
    // =========================================================================
    // PUBLIC ENTRY POINT
    // =========================================================================

    /**
     * Run the import for the Att.log report sheet.
     *
     * @param  Spreadsheet $spreadsheet  Already-loaded PhpSpreadsheet object
     * @return array  ['imported' => int, 'skipped' => int, 'errors' => array]
     */
    public function import(Spreadsheet $spreadsheet): array
    {
        // ── Locate the sheet ──────────────────────────────────────────────────
        // Try both the short tab name and the full report title as fallbacks,
        // since the device may use either depending on the firmware version.
        $sheet = $spreadsheet->getSheetByName('Att.log report')
            ?? $spreadsheet->getSheetByName('Attendance Record Report');

        if (! $sheet) {
            // Sheet is missing entirely — log it and return a zero result
            // rather than throwing, so the other sheets can still import.
            Log::warning('AttLogImporter: sheet not found in workbook');
            return ['imported' => 0, 'skipped' => 0, 'errors' => []];
        }

        // Cache the sheet dimensions once — used throughout to bound all loops.
        $highestRow  = $sheet->getHighestRow();
        $highestColN = Coordinate::columnIndexFromString($sheet->getHighestColumn());

        // ── Step 1: Extract the period start date ─────────────────────────────
        // Somewhere in the first few rows there is a cell containing a string
        // like "2025-10-01 ~ 2025-10-06". We extract ONLY the start date here.
        // The end date is not needed — we derive all dates from the day-index row.
        $startDate = $this->findStartDate($sheet, $highestColN);

        if (! $startDate) {
            // Without a start date we cannot map columns to calendar dates.
            Log::error('AttLogImporter: date range string not found', [
                'dump' => $this->dumpRows($sheet, 1, 5),
            ]);
            return ['imported' => 0, 'skipped' => 0, 'errors' => [
                ['sheet' => 'Att.log report', 'error' => 'Date range string not found in sheet.'],
            ]];
        }

        // ── Step 2: Find the day-index row and build the column→date map ──────
        // The day-index row holds integers 1, 2, 3 … N where N = number of days.
        // We map: col_index => 'YYYY-MM-DD'
        // e.g. col1 => '2025-10-01', col2 => '2025-10-02', …, col6 => '2025-10-06'
        //
        // We scan rows 3–7 instead of assuming row 4, because some firmware
        // versions insert an extra blank row or a "Tabulation" header row.
        $dateMap = $this->buildDateMap($sheet, $highestColN, $startDate);

        if (empty($dateMap)) {
            Log::error('AttLogImporter: could not build column→date map', [
                'startDate' => $startDate->format('Y-m-d'),
                'dump'      => $this->dumpRows($sheet, 3, 6),
            ]);
            return ['imported' => 0, 'skipped' => 0, 'errors' => [
                ['sheet' => 'Att.log report', 'error' => 'Could not find day-index row.'],
            ]];
        }

        // ── Step 3: Walk rows below the day-index row ─────────────────────────
        // Two types of rows exist below the headers:
        //   a) Employee header row: col1 = "ID:"
        //   b) Punch row:           col1 starts with HH:MM (e.g. "07:02...")
        //
        // Pattern per employee: [ID: row] → [punch row] → [ID: row] → [punch row] → …
        $result     = ['imported' => 0, 'skipped' => 0, 'errors' => []];
        $currentEmp = null; // holds the current employee's id/name/dept until the next ID: row

        // $this->dayIndexRow is set during buildDateMap() — start scanning after it
        for ($rowN = $this->dayIndexRow + 1; $rowN <= $highestRow; $rowN++) {

            // Read column 1 of this row — this tells us what kind of row it is
            $col1 = $this->cellVal($sheet, 1, $rowN);

            // ── Employee header row ───────────────────────────────────────────
            if (strtolower(trim($col1)) === 'id:') {
                $currentEmp = $this->extractEmployee($sheet, $rowN, $highestColN);
                continue;
            }

            if (! $currentEmp) {
                continue;
            }

            // ── Non-punch row check ───────────────────────────────────────────
            // IMPORTANT: do NOT check col1 alone. An employee absent on day 1
            // has an EMPTY col1 — their first punch is in a later date column.
            // Confirmed from log: EdwinJ row 16 → col1="" but col2="07:3717:00"
            // Fix: scan ALL date columns for any valid HH:MM punch string.
            if (! $this->isDataRow($sheet, $rowN, $dateMap)) {
                continue;
            }

            // ── Punch row — iterate over each date column ─────────────────────
            // $dateMap is [colIndex => 'YYYY-MM-DD'], built from the day-index row.
            // For each date column: read the punch string, parse it, save to DB.
            foreach ($dateMap as $colN => $date) {

                // Read the raw punch string for this employee on this date.
                // An empty cell means the employee was absent / on holiday.
                $raw = $this->cellVal($sheet, $colN, $rowN);
                if ($raw === '') {
                    continue; // absent or holiday — no record to store
                }

                // Parse the concatenated punch string into time_in and time_out.
                // The device writes all punches together: "07:0217:01" → [07:02, 17:01]
                [$timeIn, $timeOut] = $this->parsePunches($raw);

                // If we couldn't extract even a time_in, skip this cell entirely.
                if (! $timeIn) {
                    continue;
                }

                try {
                    // updateOrCreate so re-importing the same file is idempotent.
                    // The unique key is (employee_id + date) — one row per employee per day.
                    AttendanceLog::updateOrCreate(
                        [
                            'employee_id' => $currentEmp['employee_id'],
                            'date'        => $date,
                        ],
                        [
                            'employee_name' => $currentEmp['employee_name'],
                            'department'    => $currentEmp['department'],
                            // Combine the date string and time string into a full timestamp
                            'time_in'       => Carbon::parse("{$date} {$timeIn}"),
                            'time_out'      => $timeOut
                                                ? Carbon::parse("{$date} {$timeOut}")
                                                : null,
                            'total_hours'   => $this->computeTotalHours($timeIn, $timeOut),
                            // is_overtime = true if the employee clocked out after 17:00
                            'is_overtime'   => $this->isOvertime($timeOut),
                        ]
                    );
                    $result['imported']++;

                } catch (\Throwable $e) {
                    // Catch per-row exceptions so one bad row doesn't abort the rest
                    $result['skipped']++;
                    $result['errors'][] = [
                        'sheet'       => 'Att.log report',
                        'employee_id' => $currentEmp['employee_id'],
                        'date'        => $date,
                        'error'       => $e->getMessage(),
                    ];
                }
            }

            // After saving the punch row, clear currentEmp so that if there is NO
            // following ID: row (malformed file), we don't accidentally attribute
            // the next stray row to this employee.
            // NOTE: we do NOT clear it here — the device always has an ID: row next,
            // and clearing would break the flow. Left as a comment for clarity.
            // $currentEmp = null;
        }

        return $result;
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Scan the sheet's first 5 rows for a date range string like:
     *   "2025-10-01 ~ 2025-10-06"
     * and return the START date as a Carbon instance.
     *
     * Returns null if not found.
     */
    private function findStartDate(Worksheet $sheet, int $maxColN): ?Carbon
    {
        // The range string is usually in row 2 or row 3, but we scan rows 1–5
        // to be safe against firmware differences.
        for ($rowN = 1; $rowN <= 5; $rowN++) {
            for ($colN = 1; $colN <= $maxColN; $colN++) {
                $val = $this->cellVal($sheet, $colN, $rowN);

                // Match "YYYY-MM-DD ~ YYYY-MM-DD" and capture only the start date
                if (preg_match('/(\d{4}-\d{2}-\d{2})\s*~/', $val, $m)) {
                    return Carbon::parse($m[1]);
                }
            }
        }
        return null;
    }

    /**
     * Find the day-index row and build a column → date map.
     *
     * The day-index row contains consecutive integers starting at 1
     * (e.g. 1, 2, 3, 4, 5, 6 for a 6-day period).
     * Each integer N maps its column to startDate + (N-1) days.
     *
     * We scan rows 3–7 dynamically instead of hardcoding row 4,
     * because some firmware versions insert extra rows before the indices.
     *
     * Sets $this->dayIndexRow so the caller knows where to start the data loop.
     *
     * Returns [] if no day-index row is found.
     */
    private int $dayIndexRow = 4; // default; overwritten by buildDateMap()

    private function buildDateMap(Worksheet $sheet, int $maxColN, Carbon $startDate): array
    {
        for ($rowN = 3; $rowN <= 7; $rowN++) {
            $map = [];

            for ($colN = 1; $colN <= $maxColN; $colN++) {
                $val = $this->cellVal($sheet, $colN, $rowN);

                // Accept any integer between 1 and 31 (valid day index)
                // This filters out empty cells, text labels, and the "Tabulation"
                // summary column which holds values outside this range.
                if (is_numeric($val) && (int)$val >= 1 && (int)$val <= 31) {
                    // Calculate the calendar date for this day index.
                    // Day 1 = startDate, day 2 = startDate+1, etc.
                    $map[$colN] = $startDate->copy()->addDays((int)$val - 1)->format('Y-m-d');
                }
            }

            if (! empty($map)) {
                // Found the day-index row — record it and return the map
                $this->dayIndexRow = $rowN;
                return $map;
            }
        }

        return []; // no day-index row found in rows 3–7
    }

    /**
     * Read an employee header row and extract the ID, Name, and Department.
     *
     * Row layout: "ID:" label … value … "Name:" label … value … "Dept.:" label … value
     * Exact column positions vary between exports, so we scan dynamically.
     *
     * IMPORTANT — bounded scan:
     * We first record the column of each label ("ID:", "Name:", "Dept.:"),
     * then read the VALUE for each label only within the range between
     * that label and the NEXT label. This prevents one label's value from
     * accidentally being read as another label's value when column offsets vary.
     *
     * Example of why this matters:
     *   Normal employee:  "ID:" col1 … "1444" col3 … "Name:" col9 … "AllanB" col11 …
     *   Problem employee: "ID:" col1 … "1262" col3 … "Name:" col9 … (name at col12, not col11)
     *   Without bounding, nextNonEmpty() from col9 would find "Dept.:" at col19 first
     *   if the name cell were somehow empty, returning the wrong value.
     */
    private function extractEmployee(Worksheet $sheet, int $rowN, int $maxColN): array
    {
        // Pass 1: find the exact column index of each label
        $labelCols = []; // ['id' => colN, 'name' => colN, 'dept' => colN]

        for ($colN = 1; $colN <= $maxColN; $colN++) {
            $lower = strtolower(trim($this->cellVal($sheet, $colN, $rowN)));

            if ($lower === 'id:')                                          $labelCols['id']   = $colN;
            if ($lower === 'name:')                                        $labelCols['name'] = $colN;
            if (in_array($lower, ['dept.:', 'dept:', 'department:']))      $labelCols['dept'] = $colN;
        }

        // Sort label positions ascending so we can find each label's upper boundary
        $sortedPositions = array_values($labelCols);
        sort($sortedPositions);

        /**
         * Helper: read the value for a given label key.
         * Scans only between this label's column+1 and the next label's column-1.
         * Returns the first non-empty cell in that range, or '' if none found.
         */
        $getValue = function(string $key) use ($sheet, $rowN, $maxColN, $labelCols, $sortedPositions): string {
            if (! isset($labelCols[$key])) return '';

            $start = $labelCols[$key] + 1; // one column right of the label itself

            // Find the upper boundary: the column just before the next label
            $end = $maxColN;
            foreach ($sortedPositions as $pos) {
                if ($pos > $labelCols[$key]) {
                    $end = $pos - 1; // stop before the next label
                    break;
                }
            }

            // Scan the bounded range for the first non-empty cell
            for ($colN = $start; $colN <= $end; $colN++) {
                $val = trim($this->cellVal($sheet, $colN, $rowN));
                if ($val !== '') return $val;
            }

            return '';
        };

        $empId   = $getValue('id');
        $empName = $getValue('name');
        $empDept = $getValue('dept');

        return [
            'employee_id'   => $empId   ?: 'UNKNOWN',
            'employee_name' => $empName ?: "Employee #{$empId}",
            'department'    => $empDept ?: 'Unknown',
        ];
    }

    /**
     * Check whether a row is a punch data row by scanning ALL date columns.
     *
     * We cannot check only col1 because an employee absent on the first day
     * of the period will have an empty col1 — their punches start in a later
     * column. (Confirmed: EdwinJ row 16 has col1="" but col2="07:3717:00".)
     *
     * A row is a data row if at least one date column contains a valid
     * HH:MM punch string. Blank rows and "Tabulation" summary rows will
     * have no valid punch strings in any date column.
     */
    private function isDataRow(Worksheet $sheet, int $rowN, array $dateMap): bool
    {
        foreach ($dateMap as $colN => $date) {
            $val = $this->cellVal($sheet, $colN, $rowN);
            if (preg_match('/^([01]\d|2[0-3]):[0-5]\d/', $val)) {
                return true; // found at least one valid punch — this is a data row
            }
        }
        return false; // no punch strings in any date column — skip this row
    }

    /**
     * Check whether col1 of a row contains a punch string.
     * Kept for reference but no longer used in the main loop.
     * @deprecated  Use isDataRow() instead
     */
    private function isPunchRow(string $col1): bool
    {
        return (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d/', $col1);
    }

    /**
     * Parse a concatenated punch string into [time_in, time_out].
     *
     * The biometric device writes all punch events for a day into a single cell
     * with NO separator between them. We extract all valid HH:MM tokens,
     * deduplicate (some devices double-write the same punch), then:
     *   first unique token = time_in
     *   last  unique token = time_out  (null if only one punch)
     *
     * Examples:
     *   "07:0217:01"           → ['07:02', '17:01']
     *   "07:3807:3817:10"      → ['07:38', '17:10']   (duplicate removed)
     *   "07:4117:0419:01"      → ['07:41', '19:01']   (middle punch ignored)
     *   "07:41"                → ['07:41', null]       (no clock-out)
     *   "06:5506:5517:12"      → ['06:55', '17:12']   (duplicate removed)
     */
    private function parsePunches(string $raw): array
    {
        // Extract every HH:MM token from the string
        preg_match_all('/([01]\d|2[0-3]):[0-5]\d/', $raw, $matches);
        $times = $matches[0] ?? [];

        // Remove consecutive duplicates while preserving order
        // (array_unique removes ALL duplicates — we use it here since
        //  the device never legitimately punches the same time twice)
        $unique = array_values(array_unique($times));

        if (empty($unique)) {
            return [null, null]; // no valid times found
        }

        $timeIn  = $unique[0];                                    // first punch = clock-in
        $timeOut = count($unique) > 1 ? end($unique) : null;     // last punch = clock-out

        return [$timeIn, $timeOut];
    }

    /**
     * Compute total hours worked as a signed decimal.
     *
     * Returns null if either time is missing (can't compute without both).
     * Returns a negative value when time_out is before time_in
     * (which happens when both are on the same day — the DB stores the raw value).
     */
    private function computeTotalHours(string $timeIn, ?string $timeOut): ?float
    {
        if (! $timeOut) {
            return null; // only clocked in — no total to compute
        }

        // Parse both times as Carbon objects anchored to the same arbitrary date
        // so that subtraction gives us the duration in hours
        $in  = Carbon::parse("2000-01-01 {$timeIn}");
        $out = Carbon::parse("2000-01-01 {$timeOut}");

        // Return hours as a signed decimal (e.g. 9.98, -9.30)
        // Negative values indicate the employee clocked out before clocking in
        // (data quality issue in the source file — we store as-is)
        return round($out->diffInMinutes($in, false) / 60, 2);
    }

    /**
     * Determine whether a shift is overtime.
     *
     * Overtime = clocked out after 17:00.
     * Returns false if time_out is null (no clock-out recorded).
     */
    private function isOvertime(?string $timeOut): bool
    {
        if (! $timeOut) {
            return false;
        }

        // Compare only the time portion — date doesn't matter here
        return Carbon::parse("2000-01-01 {$timeOut}")->format('H:i') > '17:00';
    }

    /**
     * Read a single cell and return a clean trimmed string.
     *
     * Handles three value types:
     *   1. null          → returns ''
     *   2. Excel time serial (float 0 < x < 1) → converts to "HH:MM"
     *      (the device sometimes stores punch times as Excel time fractions
     *       instead of plain text strings)
     *   3. Everything else → cast to string and trim
     */
    private function cellVal(Worksheet $sheet, int $colN, int $rowN): string
    {
        // Build the cell coordinate string (e.g. "A5", "C12")
        $coord = Coordinate::stringFromColumnIndex($colN) . $rowN;
        $val   = $sheet->getCell($coord)->getValue();

        if ($val === null) {
            return '';
        }

        // Excel stores time-of-day as a fraction of 24 hours.
        // Values between 0 and 1 (exclusive) are time serials.
        // e.g. 07:02 = 0.293... → we convert to "07:02"
        if (is_float($val) && $val > 0 && $val < 1) {
            return ExcelDate::excelToDateTimeObject($val)->format('H:i');
        }

        return trim((string) $val);
    }

    /**
     * Dump the first N rows of a sheet as an array for logging.
     * Only called on error paths — not in the normal import flow.
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