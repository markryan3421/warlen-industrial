<?php

use App\Http\Controllers\ApplicationLeaveController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\ContributionVersionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\IncentiveController;
use App\Http\Controllers\IncentiveTypeController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\EmployeeRole\ApplicationLeaveController as EmployeeApplicationLeaveController;
use App\Http\Controllers\PayrollPeriodController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Route::get('dashboard', function () {
//     return Inertia::render('dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified', 'roleBase'])->group(function () {

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

    Route::resource('branches', BranchController::class)->except(['show']); // admin only
    Route::resource('positions', PositionController::class)->except(['show']); // admin only
    Route::resource('employees', EmployeeController::class)->except(['show']); // admin only
    Route::resource('permissions', PermissionController::class); // admin only

    Route::resource('contribution-versions', ContributionVersionController::class)->except(['show']); // admin only
    Route::resource('application-leave', ApplicationLeaveController::class); //admin only

    Route::resource('employee/application-leave', EmployeeApplicationLeaveController::class)->only(['create', 'index', 'store', 'update', 'edit'])->names([
        'index' => 'employee.application-leave.index',
        'create' => 'employee.application-leave.create',
        'store' => 'employee.application-leave.store',
        'edit' => 'employee.application-leave.edit',
        'update' => 'employee.application-leave.update',
    ]); //employee only

    Route::resource('payroll-periods', PayrollPeriodController::class)->except(['show']); //admin and hr

    Route::get('/coming-soon', function () {
        return Inertia::render('coming-soon');
    });
});


require __DIR__ . '/settings.php';
