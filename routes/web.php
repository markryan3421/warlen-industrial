<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\ApplicationLeaveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceImportController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ContributionVersionController;
use App\Http\Controllers\DeductionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeRole\ApplicationLeaveController as EmployeeApplicationLeaveController;
use App\Http\Controllers\HrRole\HRAttendanceController;
use App\Http\Controllers\HrRole\HRAttendanceImportController;
use App\Http\Controllers\HrRole\HREmployeeController;
use App\Http\Controllers\HrRole\HRIncentiveController;
use App\Http\Controllers\HrRole\PayrollController as HrPayrollController;
use App\Http\Controllers\HrRole\PayrollPeriodController as HrPayrollPeriodController;
use App\Http\Controllers\IncentiveController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollPeriodController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PositionController;
use Illuminate\Container\Attributes\DB;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
// use Laravel\Fortify\Features;

Route::get('/', function () {
    // return Inertia::render('welcome', [
    //     'canRegister' => Features::enabled(Features::registration()),
    // ]);
    return Inertia::render('auth/login');
})->name('home');


Route::middleware(['auth', 'verified', 'roleBase'])->group(function () {

    Route::get('payroll', function () {
        return Inertia::render('payroll/index');
    });

    //admin dashboard
    Route::get('dashboard',AdminDashboardController::class)->name('dashboard');

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
    Route::resource('employees', EmployeeController::class);
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

    Route::get('/attendances', [AttendanceController::class, 'attendanceManagement'])->name('attendances.index');
    Route::get('/attendance-schedules', [AttendanceController::class, 'attendanceSchedules']);
    Route::get('/attendance-period-stats', [AttendanceController::class, 'attendancePeriodStats']);
    Route::get('/attendance-logs', [AttendanceController::class, 'attendanceLogs']);
    Route::get('/attendance-exception-stats', [AttendanceController::class, 'attendanceExceptionStats']);

    Route::get('/coming-soon', function () {
        return Inertia::render('coming-soon');
    });
    Route::resource('/activity-logs', ActivityLogController::class)->only(['index']);
    Route::resource('/contributions', ContributionVersionController::class);
    Route::resource('/deductions', DeductionController::class);


    //intended for HR
    Route::get('/hr/attendance-logs', [HRAttendanceController::class, 'attendanceLogs'])->name('hr.attendance-logs');
    Route::get('/hr/attendance-exception-stats', [HRAttendanceController::class, 'attendanceExceptionStats'])->name('hr.attendance-exception-stats');
    Route::get('/hr/attendance-period-stats', [HRAttendanceController::class, 'attendancePeriodStats'])->name('hr.attendance-period-stats');
    Route::get('/hr/attendance-schedules', [HRAttendanceController::class, 'attendanceSchedules'])->name('hr.attendance-schedules');

    Route::get('hr/attendances', [HRAttendanceController::class, 'attendanceManagement'])->name('hr.attendances.index');

    // Route::resource('/hr/attendances', HRAttendanceImportController::class, [
    //     'as' => 'hr'
    // ]);

    Route::resource('hr/incentives', HRIncentiveController::class)->except(['show'])->names([
        'index' => 'hr.incentives.index',
        'create' => 'hr.incentives.create',
        'store' => 'hr.incentives.store',
        'edit' => 'hr.incentives.edit',
        'update' => 'hr.incentives.update',
        'destroy' => 'hr.incentives.destroy',
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

    Route::resource('hr/employees', HREmployeeController::class)->except(['show'])->names([
        'index' => 'hr.employees.index',
        'create' => 'hr.employees.create',
        'store' => 'hr.employees.store',
        'edit' => 'hr.employees.edit',
        'update' => 'hr.employees.update',
        'destroy' => 'hr.employees.destroy',
    ]);
});




require __DIR__ . '/settings.php';
