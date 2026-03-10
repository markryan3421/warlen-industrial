<?php

namespace App\Services\Importers;

use App\Models\AttendanceExceptionStat;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * ExceptionStatImporter
 *
 * Imports the "Exception Stat." sheet from the biometric XLS export
 * into the `attendance_exception_stats` table.
 *
 * ── CONFIRMED SHEET LAYOUT (from laravel.log cell dump) ───────────────────────
 *
 *  Row 1 : "Exception Statistic Report"              ← title, ignored
 *  Row 2 : col1="Stat.Date:"  col2="2025-10-01 ~ 2025-10-06"  ← date range
 *  Row 3 : col1="ID"  col2="Name"  col3="Department"  col4="Date"
 *          col5="First time zone"  col7="Second time zone"
 *          col9="Late time(Min)"  col10="Leave early(Min)"
 *          col11="Absence(Min)"  col12="Total(Min)"  col13="Note"
 *  Row 4 : col5="On-duty"  col6="Off-duty"  col7="On-duty"  col8="Off-duty"
 *          (sub-headers for the two time zones — these give us the exact columns)
 *  Row 5+: FLAT DATA — one row per employee per date:
 *          col1="1100"  col2="JOLISA"  col3="UPHD"  col4="2025-10-01"
 *          col5=null    col6=null      col7=null     col8=null
 *          col9=0       col10=0        col11=480     col12=480
 *
 * ── KEY FACTS ─────────────────────────────────────────────────────────────────
 *
 *  • This is a FLAT TABLE — NO "ID:" block headers like Att.log.
 *    Every data row contains the full employee ID, name, dept, and date.
 *  • col1 = employee ID (plain numeric string: "1100", "1262", etc.)
 *  • col4 = date string "YYYY-MM-DD" — present on EVERY row.
 *  • Time columns (col5–col8) store "HH:MM" strings when present, null when absent.
 *  • Penalty columns (col9–col12) store plain integers (minutes).
 *  • The header spans TWO rows (row 3 = parent labels, row 4 = sub-labels).
 *    We detect row 3 as the parent header (it contains "Date"),
 *    then scan row 4 for "On-duty" / "Off-duty" to get exact time column positions.
 *
 * ── WHAT USED TO BREAK ────────────────────────────────────────────────────────
 *
 *  1. header_row was set to row 8 instead of row 3 — the scanner kept overwriting
 *     it on every row it visited, landing on the last scanned row (a data row).
 *     Fix: break out of the scan the moment "Date" is found.
 *
 *  2. The old parser looked for an "ID:" label (like Att.log) — it doesn't exist
 *     here. currentEmp was never set so every data row was skipped.
 *     Fix: read ID, name, dept, date directly from each row's columns.
 */
class ExceptionStatImporter
{
    // =========================================================================
    // PUBLIC ENTRY POINT
    // =========================================================================

    /**
     * Run the import for the Exception Stat. sheet.
     *
     * @param  Spreadsheet $spreadsheet  Already-loaded PhpSpreadsheet object
     * @return array  ['imported' => int, 'skipped' => int, 'errors' => array]
     */
    public function import(Spreadsheet $spreadsheet): array
    {
        // ── Locate the sheet ──────────────────────────────────────────────────
        $sheet = $spreadsheet->getSheetByName('Exception Stat.')
            ?? $spreadsheet->getSheetByName('Exception Statistic Report');

        if (! $sheet) {
            Log::warning('ExceptionStatImporter: sheet not found in workbook');
            return ['imported' => 0, 'skipped' => 0, 'errors' => []];
        }

        $highestRow  = $sheet->getHighestRow();
        $highestColN = Coordinate::columnIndexFromString($sheet->getHighestColumn());

        // ── Step 1: Find the header row and build the column map ──────────────
        // We scan rows 1–6 for the row that contains "Date" — that is the main
        // header row (row 3 in this file). Once found we immediately scan the
        // NEXT row for "On-duty" / "Off-duty" sub-headers.
        $colMap = $this->buildColMap($sheet, $highestRow, $highestColN);

        if ($colMap['header_row'] === null || $colMap['date'] === null) {
            Log::error('ExceptionStatImporter: could not find header row', [
                'colMap' => $colMap,
                'dump'   => $this->dumpRows($sheet, 1, 6),
            ]);
            return ['imported' => 0, 'skipped' => 0, 'errors' => [
                ['sheet' => 'Exception Stat.', 'error' => 'Could not locate column headers.'],
            ]];
        }

        // ── Step 2: Walk all data rows ────────────────────────────────────────
        // Data starts at header_row + 2:
        //   +1 to skip the sub-header row (On-duty/Off-duty)
        //   +1 to land on the first actual data row
        $result    = ['imported' => 0, 'skipped' => 0, 'errors' => []];
        $dataStart = $colMap['header_row'] + 2;

        for ($rowN = $dataStart; $rowN <= $highestRow; $rowN++) {

            // ── Read and validate the employee ID ─────────────────────────────
            // col1 must be a numeric employee ID (e.g. "1262").
            // Non-numeric values mean blank rows or stray rows — skip them.
            $empId = trim($this->cellVal($sheet, $colMap['id'], $rowN));

            if ($empId === '' || ! ctype_digit($empId)) {
                continue; // blank separator row or non-data row
            }

            // ── Read employee name and department ─────────────────────────────
            $empName = $this->cellVal($sheet, $colMap['name'], $rowN);
            $empDept = $this->cellVal($sheet, $colMap['dept'], $rowN);

            // ── Read and validate the date ────────────────────────────────────
            // col4 holds the date string "YYYY-MM-DD" for every data row.
            $date = $this->cellVal($sheet, $colMap['date'], $rowN);

            if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                continue; // date missing or malformed — skip
            }

            // ── Read time columns ─────────────────────────────────────────────
            // These are standalone "HH:MM" strings (not concatenated like Att.log).
            // They are null when the employee was absent for that time zone.
            $amIn  = $this->readTimeCell($sheet, $colMap['am_in'],  $rowN);
            $amOut = $this->readTimeCell($sheet, $colMap['am_out'], $rowN);
            $pmIn  = $this->readTimeCell($sheet, $colMap['pm_in'],  $rowN);
            $pmOut = $this->readTimeCell($sheet, $colMap['pm_out'], $rowN);

            // ── Read penalty minute columns ───────────────────────────────────
            // Plain integers: 0 = no exception, 480 = fully absent (8-hour shift).
            // The $safeInt closure returns 0 for null/empty columns.
            $safeInt = fn(?int $col) => $col !== null
                ? (int) $this->cellVal($sheet, $col, $rowN)
                : 0;

            $lateMin       = $safeInt($colMap['late']);
            $leaveEarlyMin = $safeInt($colMap['leave_early']);
            $absenceMin    = $safeInt($colMap['absence']);
            $totalMin      = $safeInt($colMap['total']);

            // ── Save to database ──────────────────────────────────────────────
            // Unique key: (employee_id + date) — one exception record per person per day.
            // updateOrCreate makes re-importing the same file safe (idempotent).
            try {
                AttendanceExceptionStat::updateOrCreate(
                    [
                        'employee_id' => $empId,
                        'date'        => $date,
                    ],
                    [
                        'employee_name'  => $empName,
                        'department'     => $empDept,
                        // Combine date + time string into a full timestamp, or null if absent
                        'am_time_in'     => $amIn  ? Carbon::parse("{$date} {$amIn}")  : null,
                        'am_time_out'    => $amOut ? Carbon::parse("{$date} {$amOut}") : null,
                        'pm_time_in'     => $pmIn  ? Carbon::parse("{$date} {$pmIn}")  : null,
                        'pm_time_out'    => $pmOut ? Carbon::parse("{$date} {$pmOut}") : null,
                        'late_minutes'            => $lateMin,
                        'leave_early_minutes'     => $leaveEarlyMin,
                        'absence_minutes'         => $absenceMin,
                        'total_exception_minutes' => $totalMin,
                    ]
                );
                $result['imported']++;

            } catch (\Throwable $e) {
                $result['skipped']++;
                $result['errors'][] = [
                    'sheet'       => 'Exception Stat.',
                    'employee_id' => $empId,
                    'date'        => $date,
                    'error'       => $e->getMessage(),
                ];
            }
        }

        return $result;
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Scan the sheet headers (rows 1–6) and build a column index map.
     *
     * Returns an array with these keys (all default to null if not found):
     *   header_row  — the row number of the main header (the one with "Date")
     *   id          — column for employee ID
     *   name        — column for employee name
     *   dept        — column for department
     *   date        — column for the date string
     *   am_in       — column for First time zone On-duty
     *   am_out      — column for First time zone Off-duty
     *   pm_in       — column for Second time zone On-duty
     *   pm_out      — column for Second time zone Off-duty
     *   late        — column for Late time (minutes)
     *   leave_early — column for Leave early (minutes)
     *   absence     — column for Absence (minutes)
     *   total       — column for Total exception (minutes)
     *
     * ── TWO-PASS APPROACH ────────────────────────────────────────────────────
     * Pass 1: scan rows 1–6 for the parent header row (contains "Date").
     *         Stop immediately once found — prevents header_row from being
     *         overwritten by later rows (which are data rows, not headers).
     * Pass 2: scan the very next row for "On-duty" / "Off-duty" sub-headers
     *         to get the exact time column positions.
     */
    private function buildColMap(Worksheet $sheet, int $maxRow, int $maxCol): array
    {
        // Pre-fill all keys as null so callers can safely use ?? without isset()
        $colMap = [
            'header_row'  => null,
            'id'          => null,  // col1 — employee ID number
            'name'        => null,  // col2 — employee name
            'dept'        => null,  // col3 — department
            'date'        => null,  // col4 — date string YYYY-MM-DD
            'am_in'       => null,  // col5 — First time zone On-duty
            'am_out'      => null,  // col6 — First time zone Off-duty
            'pm_in'       => null,  // col7 — Second time zone On-duty
            'pm_out'      => null,  // col8 — Second time zone Off-duty
            'late'        => null,  // col9  — Late time (Min)
            'leave_early' => null,  // col10 — Leave early (Min)
            'absence'     => null,  // col11 — Absence (Min)
            'total'       => null,  // col12 — Total (Min)
        ];

        // ── Pass 1: find the parent header row ────────────────────────────────
        for ($rowN = 1; $rowN <= min($maxRow, 6); $rowN++) {
            $foundDate = false;

            for ($colN = 1; $colN <= $maxCol; $colN++) {
                $lower = strtolower(trim($this->cellVal($sheet, $colN, $rowN)));

                // Map each recognised label to its semantic column key
                if (in_array($lower, ['id', 'no', 'no.']))         $colMap['id']          = $colN;
                elseif ($lower === 'name')                          $colMap['name']        = $colN;
                elseif (in_array($lower, ['department', 'dept']))   $colMap['dept']        = $colN;
                elseif ($lower === 'date') {
                    $colMap['date'] = $colN;
                    $foundDate      = true; // signal that this is the header row
                }
                elseif (str_contains($lower, 'late time'))          $colMap['late']        = $colN;
                elseif (str_contains($lower, 'leave early'))        $colMap['leave_early'] = $colN;
                elseif (str_contains($lower, 'absence'))            $colMap['absence']     = $colN;
                elseif (str_contains($lower, 'total'))              $colMap['total']       = $colN;
            }

            if ($foundDate) {
                // Lock in the header row and immediately stop scanning.
                // Without this break the scanner would continue to data rows,
                // overwriting header_row with a row number deep inside the data.
                $colMap['header_row'] = $rowN;

                // ── Pass 2: scan the sub-header row (rowN+1) ──────────────────
                // The sub-header row has "On-duty" and "Off-duty" labels
                // directly under the "First time zone" and "Second time zone"
                // parent headers. We count occurrences to assign am vs pm.
                $onDutyCount  = 0;
                $offDutyCount = 0;

                for ($colN = 1; $colN <= $maxCol; $colN++) {
                    $lower = strtolower(trim($this->cellVal($sheet, $colN, $rowN + 1)));

                    if (str_contains($lower, 'on-duty') || $lower === 'on duty') {
                        // First occurrence = AM (First time zone), second = PM (Second time zone)
                        $onDutyCount === 0
                            ? ($colMap['am_in'] = $colN)
                            : ($colMap['pm_in'] = $colN);
                        $onDutyCount++;
                    }

                    if (str_contains($lower, 'off-duty') || $lower === 'off duty') {
                        $offDutyCount === 0
                            ? ($colMap['am_out'] = $colN)
                            : ($colMap['pm_out'] = $colN);
                        $offDutyCount++;
                    }
                }

                break; // stop after finding the header row — don't scan further
            }
        }

        return $colMap;
    }

    /**
     * Read a time cell and return "HH:MM" or null.
     *
     * Returns null if:
     *   - $colN is null (column was not found during header scan)
     *   - the cell is empty
     *   - the cell value does not match HH:MM format
     *
     * Also handles Excel time serials (float 0–1) which the device occasionally
     * writes instead of a plain "HH:MM" string.
     */
    private function readTimeCell(Worksheet $sheet, ?int $colN, int $rowN): ?string
    {
        if ($colN === null) {
            return null; // column wasn't found in the header — treat as absent
        }

        $val = $this->cellVal($sheet, $colN, $rowN);

        // Accept standard "HH:MM" format (24-hour clock)
        if (preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $val)) {
            return $val;
        }

        return null; // empty or unrecognised format
    }

    /**
     * Read a single cell and return a clean trimmed string.
     *
     * Handles:
     *   null              → ''
     *   Excel time serial → "HH:MM"   (float between 0 and 1)
     *   Anything else     → (string) trimmed
     */
    private function cellVal(Worksheet $sheet, ?int $colN, int $rowN): string
    {
        if ($colN === null) {
            return ''; // guard against null column indices from buildColMap
        }

        $coord = Coordinate::stringFromColumnIndex($colN) . $rowN;
        $val   = $sheet->getCell($coord)->getValue();

        if ($val === null) {
            return '';
        }

        // Excel stores time-of-day as a decimal fraction of 24 hours (0 < x < 1)
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