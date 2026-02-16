<?php

use App\Http\Controllers\BranchOrSiteController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PositionController; // Added missing import
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    Route::resource('branches', BranchOrSiteController::class)
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        
    Route::resource('positions', PositionController::class)
        ->only(['index', 'create', 'store', 'edit', 'update', 'destroy']);
        
    Route::resource('employees', EmployeeController::class);
});

require __DIR__.'/settings.php';