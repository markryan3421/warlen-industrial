<?php

namespace App\Http\Controllers;

use App\Services\Importers\AttLogImporter;
use App\Services\Importers\ExceptionStatImporter;
use App\Services\Importers\PeriodStatImporter;
use App\Services\Importers\ScheduleImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * AttendanceImportController
 *
 * Handles the biometric XLS file upload and delegates to the appropriate
 * sheet importer(s).
 *
 * Supports an optional `sheet` parameter so each importer can be tested
 * individually without running the full import pipeline.
 *
 * ── ROUTES ────────────────────────────────────────────────────────────────────
 *   POST /api/attendance/import
 *
 * ── REQUEST BODY (multipart/form-data) ───────────────────────────────────────
 *   file  (required)  The .xls or .xlsx file exported from the biometric device.
 *   sheet (optional)  Which sheet to import. Defaults to "all".
 *                     Accepted values:
 *                       "all"       — run all four importers in sequence
 *                       "attlog"    — Att.log report   → attendance_logs
 *                       "exception" — Exception Stat.  → attendance_exception_stats
 *                       "stat"      — Att. Stat.       → attendance_period_stats
 *                       "schedule"  — Schedule Infor.  → attendance_schedules
 *
 * ── RESPONSE (JSON) ───────────────────────────────────────────────────────────
 *   {
 *     "message":  "Import completed.",
 *     "sheet":    "attlog",
 *     "imported": 84,
 *     "skipped":  0,
 *     "errors":   []
 *   }
 */
class AttendanceImportController extends Controller
{
    public function index() {
        return Inertia::render('attendances/index');
    }

    public function store(Request $request): JsonResponse
    {
        // ── Validate the incoming request ─────────────────────────────────────
        $request->validate([
            'file'  => ['required', 'file', 'mimes:xls,xlsx', 'max:10240'],
            // sheet is optional — defaults to "all" if not provided
            'sheet' => ['nullable', 'string', 'in:all,attlog,exception,stat,schedule'],
        ]);

        // ── Store the uploaded file temporarily ───────────────────────────────
        $relativePath = $request->file('file')->store('biometric-imports', 'local');
        $absolutePath = Storage::disk('local')->path($relativePath);

        $sheet = $request->input('sheet', 'all');

        try {
            // Load the spreadsheet once — pass it to whichever importer(s) run.
            // Loading is expensive so we do it once here, not inside each importer.
            $spreadsheet = IOFactory::load($absolutePath);

            $result = $this->runImport($spreadsheet, $sheet);

            return response()->json([
                'message'  => 'Import completed.',
                'sheet'    => $sheet,
                'imported' => $result['imported'],
                'skipped'  => $result['skipped'],
                'errors'   => $result['errors'],
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Import failed: ' . $e->getMessage(),
                'sheet'   => $sheet,
            ], 422);

        } finally {
            // Always delete the temp file — even if an exception occurred
            Storage::disk('local')->delete($relativePath);
        }
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Run one or all importers and return a merged result.
     *
     * Map of sheet keys → importer factories.
     * Uncomment each line as the corresponding importer is built and verified.
     */
    private function runImport($spreadsheet, string $sheet): array
    {
        $result = ['imported' => 0, 'skipped' => 0, 'errors' => []];

        $importers = [
            'attlog'    => fn() => (new AttLogImporter())->import($spreadsheet),
            'exception' => fn() => (new ExceptionStatImporter())->import($spreadsheet),
            'stat'      => fn() => (new PeriodStatImporter())->import($spreadsheet),
            'schedule'  => fn() => (new ScheduleImporter())->import($spreadsheet),
        ];

        $toRun = $sheet === 'all' ? array_keys($importers) : [$sheet];

        foreach ($toRun as $key) {
            if (! isset($importers[$key])) {
                $result['errors'][] = [
                    'sheet' => $key,
                    'error' => "Importer for '{$key}' is not built yet.",
                ];
                continue;
            }

            $sheetResult     = ($importers[$key])();
            $result['imported'] += $sheetResult['imported'] ?? 0;
            $result['skipped']  += $sheetResult['skipped']  ?? 0;
            $result['errors']    = array_merge($result['errors'], $sheetResult['errors'] ?? []);
        }

        return $result;
    }
}