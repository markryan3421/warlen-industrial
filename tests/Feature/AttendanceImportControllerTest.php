<?php

use App\Models\User;
use App\Services\Importers\AttLogImporter;
use App\Services\Importers\ExceptionStatImporter;
use App\Services\Importers\PeriodStatImporter;
use App\Services\Importers\ScheduleImporter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

// Helper to create a minimal valid Excel file with required sheets
function createValidExcelFile(): UploadedFile
{
    $spreadsheet = new Spreadsheet();

    // Att.log sheet
    $attLogSheet = $spreadsheet->createSheet();
    $attLogSheet->setTitle('Att.log');
    $attLogSheet->setCellValue('A1', 'EmployeeID')->setCellValue('B1', 'LogTime');

    // Exception Stat. sheet
    $exceptionSheet = $spreadsheet->createSheet();
    $exceptionSheet->setTitle('Exception Stat.');
    $exceptionSheet->setCellValue('A1', 'EmployeeID')->setCellValue('B1', 'Date');

    // Att. Stat. sheet
    $statSheet = $spreadsheet->createSheet();
    $statSheet->setTitle('Att. Stat.');
    $statSheet->setCellValue('A1', 'EmployeeID')->setCellValue('B1', 'Period');

    // Schedule Infor. sheet
    $scheduleSheet = $spreadsheet->createSheet();
    $scheduleSheet->setTitle('Schedule Infor.');
    $scheduleSheet->setCellValue('A1', 'EmployeeID')->setCellValue('B1', 'Schedule');

    // Remove default "Worksheet" sheet
    $spreadsheet->removeSheetByIndex(0);

    $tempPath = tempnam(sys_get_temp_dir(), 'attendance_');
    $writer = new Xlsx($spreadsheet);
    $writer->save($tempPath);

    return new UploadedFile($tempPath, 'attendance.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
}

beforeEach(function () {
    $this->withoutVite();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $employeeRole = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);

    $this->admin = User::factory()->create(['name' => 'Admin User']);
    $this->admin->assignRole($adminRole);

    $this->unauthorizedUser = User::factory()->create(['name' => 'Regular User']);
    $this->unauthorizedUser->assignRole($employeeRole);

    Storage::fake('local');
});

// -----------------------------------------------------------------------------
// Authorization – only admin can access (route uses 'admin' middleware)
// -----------------------------------------------------------------------------
describe('Authorization', function () {
    it('allows admin to import attendance', function () {
        actingAs($this->admin);
        $file = createValidExcelFile();
        postJson('/attendance/import', ['file' => $file])->assertOk();
    });

    it('denies unauthorized user', function () {
        actingAs($this->unauthorizedUser);
        $file = createValidExcelFile();
        postJson('/attendance/import', ['file' => $file])->assertForbidden();
    });
});

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------
describe('Validation', function () {
    beforeEach(fn () => actingAs($this->admin));

    it('requires a file', function () {
        postJson('/attendance/import', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    });

    it('accepts only xls or xlsx files', function () {
        $file = UploadedFile::fake()->create('attendance.txt', 100);
        postJson('/attendance/import', ['file' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    });

    it('rejects files larger than 10MB', function () {
        $file = UploadedFile::fake()->create('attendance.xlsx', 11 * 1024);
        postJson('/attendance/import', ['file' => $file])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    });

    it('accepts valid sheet parameter values', function () {
        $file = createValidExcelFile();
        foreach (['all', 'attlog', 'exception', 'stat', 'schedule'] as $sheet) {
            $response = postJson('/attendance/import', ['file' => $file, 'sheet' => $sheet]);
            $response->assertJsonMissingValidationErrors('sheet');
        }
    });

    it('rejects invalid sheet parameter', function () {
        $file = createValidExcelFile();
        postJson('/attendance/import', ['file' => $file, 'sheet' => 'invalid'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('sheet');
    });
});

// -----------------------------------------------------------------------------
// Import logic (real file with empty data – expects 0 imported rows)
// -----------------------------------------------------------------------------
describe('Import logic', function () {
    beforeEach(fn () => actingAs($this->admin));

    it('imports all sheets when sheet=all (empty data → 0 records)', function () {
        $file = createValidExcelFile();

        Cache::shouldReceive('forget')->with('payroll_periods')->once();
        Cache::shouldReceive('forget')->with('employees_incentive')->once();

        $response = postJson('/attendance/import', ['file' => $file, 'sheet' => 'all']);
        $response->assertOk()
            ->assertJson([
                'message'  => 'Import completed.',
                'sheet'    => 'all',
                'imported' => 0,
                'skipped'  => 0,
                'errors'   => [],
            ]);
    });

    it('imports only the requested sheet (empty data)', function () {
        $file = createValidExcelFile();

        Cache::shouldReceive('forget')->with('payroll_periods')->once();
        Cache::shouldReceive('forget')->with('employees_incentive')->once();

        $response = postJson('/attendance/import', ['file' => $file, 'sheet' => 'attlog']);
        $response->assertOk()
            ->assertJson([
                'sheet'    => 'attlog',
                'imported' => 0,
            ]);
    });

    it('returns error when the Excel file is malformed', function () {
        // Create a file that is not a valid Excel document but still passes mime validation
        // We'll use a valid Excel file and corrupt its internal structure while keeping the file extension.
        $validFile = createValidExcelFile();
        $path = $validFile->getRealPath();

        // Overwrite a portion of the file to break the ZIP structure (Excel files are ZIP archives)
        $handle = fopen($path, 'r+');
        fwrite($handle, str_repeat('X', 1024));
        fclose($handle);

        $corruptedFile = new UploadedFile(
            $path,
            'attendance.xlsx',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true
        );

        $response = postJson('/attendance/import', ['file' => $corruptedFile, 'sheet' => 'attlog']);
        // The controller should catch the exception and return a 422 with a message.
        $response->assertStatus(422);
        $response->assertJsonStructure(['message']);
    });
});

// -----------------------------------------------------------------------------
// Cache invalidation
// -----------------------------------------------------------------------------
describe('Cache invalidation', function () {
    beforeEach(fn () => actingAs($this->admin));

    it('flushes payroll_periods and employees_incentive cache after successful import', function () {
        $file = createValidExcelFile();
        Cache::shouldReceive('forget')->with('payroll_periods')->once();
        Cache::shouldReceive('forget')->with('employees_incentive')->once();

        postJson('/attendance/import', ['file' => $file, 'sheet' => 'attlog'])->assertOk();
    });
});