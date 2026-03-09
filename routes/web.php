<?php

use App\Http\Controllers\ApplicationLeaveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceImportController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ContributionVersionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeRole\ApplicationLeaveController as EmployeeApplicationLeaveController;
use App\Http\Controllers\IncentiveController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollPeriodController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PositionController;
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

Route::middleware(['auth', 'verified', 'throttle:limit-actions' , 'roleBase'])->group(function () {

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

    Route::get('/attendance-schedules', [AttendanceController::class, 'attendanceSchedules']);
    Route::get('/attendance-period-stats', [AttendanceController::class, 'attendancePeriodStats']);
    Route::get('/attendance-logs', [AttendanceController::class, 'attendanceLogs']);
    Route::get('/attendance-exception-stats', [AttendanceController::class, 'attendanceExceptionStats']);


    Route::get('/coming-soon', function () {
        return Inertia::render('coming-soon');
    });
});


require __DIR__ . '/settings.php';
