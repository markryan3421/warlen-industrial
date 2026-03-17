<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ApplicationLeaveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceImportController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ContributionVersionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeRole\ApplicationLeaveController as EmployeeApplicationLeaveController;
use App\Http\Controllers\HrRole\HRAttendanceController;
use App\Http\Controllers\HrRole\HRAttendanceImportController;
use App\Http\Controllers\HrRole\PayrollController as HrPayrollController;
use App\Http\Controllers\HrRole\PayrollPeriodController as HrPayrollPeriodController;
use App\Http\Controllers\IncentiveController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollPeriodController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PositionController;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Route::get('dashboard', function () {
//     return Inertia::render('dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified', 'throttle:limit-actions', 'roleBase'])->group(function () {

    Route::get('payroll', function () {
        return Inertia::render('payroll/index');
    });

    Route::get('multipletables', function () {
        return Inertia::render('multipletables/index');
    });
    //admin dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    //employee dashboard
    Route::get('employee/dashboard', function () {
        return Inertia::render('employee-role/dashboard');
    })->name('employee.dashboard');

    //hr dashboard
    Route::get('hr/dashboard', function () {
        return Inertia::render('HR/dashboard');
    })->name('hr.dashboard');

    Route::resource('branches', BranchController::class)->except(['show']);
    Route::delete('/branches/{branch:branch_slug}', [BranchController::class, 'destroy'])->name('branches.destroy');
    Route::resource('positions', PositionController::class)->except(['show']);
    Route::resource('employees', EmployeeController::class)->except(['show']);
    Route::resource('permissions', PermissionController::class);
    Route::resource('incentives', IncentiveController::class)->except(['show']);

    Route::resource('contribution-versions', ContributionVersionController::class)->except(['show']);
    Route::resource('application-leave', ApplicationLeaveController::class);
    Route::resource('attendances', AttendanceImportController::class);

    Route::resource('employee/application-leave', EmployeeApplicationLeaveController::class)->only(['create', 'index', 'store', 'update', 'edit'])->names([
        'index' => 'employee.application-leave.index',
        'create' => 'employee.application-leave.create',
        'store' => 'employee.application-leave.store',
        'edit' => 'employee.application-leave.edit',
        'update' => 'employee.application-leave.update',
    ]); //employee only

    Route::resource('payroll-periods', PayrollPeriodController::class)->except(['show']);

    Route::resource('payrolls', PayrollController::class)->except(['show']);

    Route::get('/attendance-schedules', [AttendanceController::class, 'attendanceSchedules'])->name('admin.attendance-schedules');
    Route::get('/attendance-period-stats', [AttendanceController::class, 'attendancePeriodStats'])->name('admin.attendance-period-stats');
    Route::get('/attendance-logs', [AttendanceController::class, 'attendanceLogs'])->name('admin.attendance-logs');
    Route::get('/attendance-exception-stats', [AttendanceController::class, 'attendanceExceptionStats'])->name('admin.attendance-exception-stats');

    Route::get('/coming-soon', function () {
        return Inertia::render('coming-soon');
    });
    Route::resource('/activity-logs', ActivityLogController::class)->only(['index']);



    //intended for HR
    Route::get('/hr/attendance-logs', [HRAttendanceController::class, 'attendanceLogs'])->name('hr.attendance-logs');
    Route::get('/hr/attendance-exception-stats', [HRAttendanceController::class, 'attendanceExceptionStats'])->name('hr.attendance-exception-stats');
    Route::get('/hr/attendance-period-stats', [HRAttendanceController::class, 'attendancePeriodStats'])->name('hr.attendance-period-stats');
    Route::get('/hr/attendance-schedules', [HRAttendanceController::class, 'attendanceSchedules'])->name('hr.attendance-schedules');

    Route::resource('/hr/attendances', HRAttendanceImportController::class, [
        'as' => 'hr'
    ]);

    Route::resource('/hr/payroll', HrPayrollController::class)->names([
        'index' => 'hr.payroll.index',
        'create' => 'hr.payroll.create',
        'store' => 'hr.payroll.store',
        'edit' => 'hr.payroll.edit',
        'update' => 'hr.payroll.update',
    ]);
    Route::resource('/hr/payroll-periods', HrPayrollPeriodController::class)->names([
        'index' => 'hr.payroll-periods.index',
        'create' => 'hr.payroll-periods.create',
        'store' => 'hr.payroll-periods.store',
        'edit' => 'hr.payroll-periods.edit',
        'update' => 'hr.payroll-periods.update',
        'destroy' => 'hr.payroll-periods.destroy',
    ]);
});


require __DIR__ . '/settings.php';
