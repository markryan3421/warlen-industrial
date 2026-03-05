<?php

namespace App\Services\Importers;

use App\Models\AttendanceSchedule;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * ScheduleImporter
 *
 * Imports the "Schedule Infor." sheet from the biometric XLS export
 * into the `attendance_schedules` table.
 *
 * ── CONFIRMED SHEET LAYOUT ────────────────────────────────────────────────────
 *
 *  Row 1 : "Schedule Information Report"                          ← title, ignored
 *  Row 2 : "Stat.Date: 2025-10-01 ~ 2025-10-066"                 ← period range
 *  Row 3 : "Special shifts: 25=Ask for leave, 26=Out, Null=Holiday"  ← legend
 *  Row 4 : col1="Name" | col2="Department" | col3=1 | col4=2 | col5=3 | col6=4 | col7=5 | col8=6
 *           └─ header row with name/dept labels and day-index integers in one row
 *  Row 5+: col1="AllanB" | col2="WEEKENDER" | col3=<shift> | col4=<shift> …
 *
 * ── SHIFT CODE MEANINGS ───────────────────────────────────────────────────────
 *
 *  Empty / null = Holiday      (employee is not scheduled)
 *  25           = Ask for Leave
 *  26           = Out          (employee is marked as out/absent)
 *  Any other integer = a shift template ID representing a normal working shift
 *                      (the specific template number varies by device config)
 *
 * ── KEY FACTS ─────────────────────────────────────────────────────────────────
 *
 *  • This is the SIMPLEST of the four sheets — single-row header, no merges.
 *  • The header row (row 4) contains BOTH the "Name"/"Department" labels AND
 *    the day-index integers (1, 2, 3 … 6) all in the same row.
 *    This means we can build the dateMap and find name/dept columns in one pass.
 *  • The day-index integers map each column to a calendar date, same as Att.log.
 *    col3=day1=Oct1, col4=day2=Oct2, … col8=day6=Oct6.
 *  • One DB row is created per employee per day — 14 employees × 6 days = 84 rows.
 *  • The employee ID is resolved by cross-referencing names against the Att.log sheet.
 */
class ScheduleImporter
{
    // =========================================================================
    // PUBLIC ENTRY POINT
    // =========================================================================

    /**
     * Run the import for the Schedule Infor. sheet.
     *
     * @param  Spreadsheet $spreadsheet  Already-loaded PhpSpreadsheet object
     * @return array  ['imported' => int, 'skipped' => int, 'errors' => array]
     */
    public function import(Spreadsheet $spreadsheet): array
    {
        // ── Locate the sheet ──────────────────────────────────────────────────
        $sheet = $spreadsheet->getSheetByName('Schedule Infor.')
            ?? $spreadsheet->getSheetByName('Schedule Information Report');

        if (! $sheet) {
            Log::warning('ScheduleImporter: sheet not found in workbook');
            return ['imported' => 0, 'skipped' => 0, 'errors' => []];
        }

        $highestRow  = $sheet->getHighestRow();
        $highestColN = Coordinate::columnIndexFromString($sheet->getHighestColumn());

        // ── Step 1: Extract the period start date ─────────────────────────────
        // Row 2 contains "Stat.Date: 2025-10-01 ~ 2025-10-06".
        // We extract only the start date — day-index integers in the header row
        // do the rest of the date mapping.
        $startDate = $this->findStartDate($sheet, $highestColN);

        if (! $startDate) {
            Log::error('ScheduleImporter: date range string not found', [
                'dump' => $this->dumpRows($sheet, 1, 4),
            ]);
            return ['imported' => 0, 'skipped' => 0, 'errors' => [
                ['sheet' => 'Schedule Infor.', 'error' => 'Date range string not found.'],
            ]];
        }

        // ── Step 2: Find the header row and build column map + date map ───────
        // The header row (row 4) contains "Name", "Department", and then
        // day-index integers (1, 2, 3 …) all in the SAME row.
        // We scan rows 1–8 and build everything in a single pass.
        [$headerRowN, $nameCol, $deptCol, $dateMap] =
            $this->findHeaderAndDateMap($sheet, $highestRow, $highestColN, $startDate);

        if ($headerRowN === null || empty($dateMap)) {
            Log::error('ScheduleImporter: could not find header row or day-index columns', [
                'dump' => $this->dumpRows($sheet, 1, 5),
            ]);
            return ['imported' => 0, 'skipped' => 0, 'errors' => [
                ['sheet' => 'Schedule Infor.', 'error' => 'Could not find schedule header row.'],
            ]];
        }

        // ── Step 3: Walk all data rows ────────────────────────────────────────
        // Each row below the header is one employee.
        // For each employee we create one DB row per date column.
        $result = ['imported' => 0, 'skipped' => 0, 'errors' => []];

        // Shift code → human-readable label map.
        // Source: the legend in row 3: "25=Ask for leave, 26=Out, Null=Holiday"
        $shiftLabels = [
            '25' => 'Ask for Leave',
            '26' => 'Out',  
        ];

        for ($rowN = $headerRowN + 1; $rowN <= $highestRow; $rowN++) {

            // ── Read employee name ─────────────────────────────────────────────
            // Skip rows where the name is empty — these are blank separator rows.
            $empName = $this->cellVal($sheet, $nameCol, $rowN);
            if ($empName === '') {
                continue;
            }

            // ── Read department ────────────────────────────────────────────────
            $empDept = $this->cellVal($sheet, $deptCol, $rowN);

            // ── Resolve employee ID ────────────────────────────────────────────
            // This sheet has no ID column — look up the name in the Att.log sheet.
            // Falls back to using the name itself if no match is found.
            $empId = $this->resolveEmployeeId($spreadsheet, $empName) ?? $empName;

            // ── Save one DB row per date column ───────────────────────────────
            foreach ($dateMap as $colN => $date) {

                // Read the shift code for this employee on this date.
                // Empty cell = Holiday (employee is not scheduled to work).
                $shiftCode = $this->cellVal($sheet, $colN, $rowN);

                // Determine the human-readable label:
                //   known code (25/26) → use the label map
                //   empty cell         → "Holiday"
                //   any other number   → "Normal" (standard working shift)
                $shiftLabel = match (true) {
                    isset($shiftLabels[$shiftCode])  => $shiftLabels[$shiftCode],
                    $shiftCode === ''                 => 'Holiday',
                    default                           => 'Normal',
                };

                try {
                    // One row per employee per day — re-import is safe (idempotent).
                    AttendanceSchedule::updateOrCreate(
                        [
                            'employee_id' => $empId,
                            'date'        => $date,
                        ],
                        [
                            'employee_name' => $empName,
                            'department'    => $empDept,
                            // Store null for empty cells (Holiday) rather than ''
                            // so the DB can distinguish "no code" from "code 0"
                            'shift_code'    => $shiftCode !== '' ? $shiftCode : null,
                            'shift_label'   => $shiftLabel,
                        ]
                    );
                    $result['imported']++;

                } catch (\Throwable $e) {
                    $result['skipped']++;
                    $result['errors'][] = [
                        'sheet'    => 'Schedule Infor.',
                        'employee' => $empName,
                        'date'     => $date,
                        'error'    => $e->getMessage(),
                    ];
                }
            }
        }

        return $result;
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Scan the first 5 rows for a date range string like "2025-10-01 ~ 2025-10-06"
     * and return the START date as a Carbon instance.
     *
     * Returns null if not found.
     */
    private function findStartDate(Worksheet $sheet, int $maxColN): ?Carbon
    {
        for ($rowN = 1; $rowN <= 5; $rowN++) {
            for ($colN = 1; $colN <= $maxColN; $colN++) {
                $val = $this->cellVal($sheet, $colN, $rowN);

                // Capture the start date from "YYYY-MM-DD ~ YYYY-MM-DD"
                if (preg_match('/(\d{4}-\d{2}-\d{2})\s*~/', $val, $m)) {
                    return Carbon::parse($m[1]);
                }
            }
        }

        return null;
    }

    /**
     * Find the header row and build both the name/dept column indices
     * and the column → date map, all in a single pass.
     *
     * The header row is the one that contains "Name" AND day-index integers
     * in the same row — unique to this sheet vs the others.
     *
     * Returns: [$headerRowN, $nameCol, $deptCol, $dateMap]
     * All values are null / empty array if not found.
     */
    private function findHeaderAndDateMap(
        Worksheet $sheet,
        int $maxRow,
        int $maxCol,
        Carbon $startDate
    ): array {
        for ($rowN = 1; $rowN <= min($maxRow, 8); $rowN++) {

            $nameCol    = null;
            $deptCol    = null;
            $dateMap    = [];

            for ($colN = 1; $colN <= $maxCol; $colN++) {
                $val   = $this->cellVal($sheet, $colN, $rowN);
                $lower = strtolower($val);

                // Detect the "Name" label
                if ($lower === 'name') {
                    $nameCol = $colN;
                }

                // Detect the "Department" label
                if (in_array($lower, ['department', 'dept'])) {
                    $deptCol = $colN;
                }

                // Detect day-index integers (1–31).
                // These are in the SAME row as "Name" — not a separate row like Att.log.
                if (is_numeric($val) && (int)$val >= 1 && (int)$val <= 31) {
                    // Map this column to its calendar date:
                    //   day index 1 → startDate + 0 days
                    //   day index 2 → startDate + 1 day
                    //   …
                    $dateMap[$colN] = $startDate->copy()
                        ->addDays((int)$val - 1)
                        ->format('Y-m-d');
                }
            }

            // This is the header row if we found both "Name" AND at least one date column.
            // (Some rows may have standalone integers that aren't day indices —
            //  requiring both "Name" and integers together filters those out.)
            if ($nameCol !== null && ! empty($dateMap)) {
                return [$rowN, $nameCol, $deptCol ?? $nameCol + 1, $dateMap];
            }
        }

        return [null, null, null, []];
    }

    /**
     * Resolve an employee's numeric ID by searching the Att.log sheet.
     *
     * The Att.log sheet has both ID and Name on every "ID:" header row.
     * We scan those rows and match by name (case-insensitive).
     * Returns null if not found — caller falls back to using the name as the key.
     *
     * Note: col3 = employee ID, col11 = employee name.
     * These positions were confirmed from the debug log dump.
     */
    private function resolveEmployeeId(Spreadsheet $spreadsheet, string $name): ?string
    {
        $logSheet = $spreadsheet->getSheetByName('Att.log report')
            ?? $spreadsheet->getSheetByName('Attendance Record Report');

        if (! $logSheet) {
            return null;
        }

        $highestRow  = $logSheet->getHighestRow();
        $highestColN = Coordinate::columnIndexFromString($logSheet->getHighestColumn());

        for ($rowN = 1; $rowN <= $highestRow; $rowN++) {
            // Only process "ID:" rows — these are employee header rows in Att.log
            if (strtolower(trim($this->cellVal($logSheet, 1, $rowN))) !== 'id:') {
                continue;
            }

            // col3 = employee ID value, col11 = employee name value
            // (confirmed positions from the debug log)
            $rowId   = trim($this->cellVal($logSheet, 3,  $rowN));
            $rowName = trim($this->cellVal($logSheet, 11, $rowN));

            if (strtolower($rowName) === strtolower(trim($name))) {
                return $rowId;
            }
        }

        return null;
    }

    /**
     * Read a single cell and return a clean trimmed string.
     *
     * Handles:
     *   null              → ''
     *   Excel time serial → "HH:MM"  (float between 0 and 1)
     *   Anything else     → cast to string and trim
     */
    private function cellVal(Worksheet $sheet, ?int $colN, int $rowN): string
    {
        if ($colN === null) {
            return '';
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
     * Dump the first N rows of a sheet for error logging.
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