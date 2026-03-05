<?php

use App\Http\Controllers\ApplicationLeaveController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceImportController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ContributionVersionController;
use App\Http\Controllers\EmployeeController;
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

Route::middleware(['auth', 'verified', 'throttle:limit-actions'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('branches', BranchController::class)->except(['show']);
    Route::resource('positions', PositionController::class)->except(['show']);
    Route::resource('employees', EmployeeController::class)->except(['show']);
    Route::resource('permissions', PermissionController::class);

    Route::resource('contribution-versions', ContributionVersionController::class)->except(['show']);
    Route::resource('application-leave', ApplicationLeaveController::class);
    Route::resource('attendances', AttendanceImportController::class);

    Route::get('/attendance-schedules', [AttendanceController::class, 'attendanceSchedules']);
    Route::get('/attendance-period-stats', [AttendanceController::class, 'attendancePeriodStats']);
    Route::get('/attendance-logs', [AttendanceController::class, 'attendanceLogs']);
    Route::get('/attendance-exception-stats', [AttendanceController::class, 'attendanceExceptionStats']);

    Route::get('/coming-soon', function () {
        return Inertia::render('coming-soon');
    });
});

require __DIR__.'/settings.php';
