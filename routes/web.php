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

<<<<<<< HEAD
// Route::get('dashboard', function () {
//     return Inertia::render('dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth','verified'])->group(function () {

   Route::get('dashboard', function () {
       return Inertia::render('dashboard');
   })->name('dashboard');

   Route::resource('branches', BranchOrSiteController::class)->except(['show']);
   Route::resource('positions', PositionController::class)->except(['show']);

=======
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
>>>>>>> 88b644d23dd6037da9e66dc99df61ec307e2232c
});

require __DIR__.'/settings.php';