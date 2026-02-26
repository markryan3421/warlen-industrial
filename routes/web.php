<?php

use App\Http\Controllers\ApplicationLeaveController;
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

Route::middleware(['auth', 'verified', 'roleBase'])->group(function () {

    //admin dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    //employee dashboard
    Route::get('employee/dashboard', function () {
        return Inertia::render('employee/dashboard');
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

    Route::get('/coming-soon', function () {
        return Inertia::render('coming-soon');
    });
});


require __DIR__ . '/settings.php';
