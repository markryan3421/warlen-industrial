<?php

use App\Http\Controllers\BranchController;
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

// Route::get('dashboard', function () {
//     return Inertia::render('dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth','verified'])->group(function () {

   Route::get('dashboard', function () {
       return Inertia::render('dashboard');
   })->name('dashboard');

   Route::resource('branches', BranchController::class)->except(['show']);
   Route::resource('positions', PositionController::class)->except(['show']);
   Route::resource('employees', EmployeeController::class)->except(['show']);

   Route::get('/coming-soon', function() {
    return Inertia::render('coming-soon');
   });
});

require __DIR__.'/settings.php';