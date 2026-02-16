<?php

<<<<<<< HEAD
use App\Http\Controllers\EmployeeController;
=======
use App\Http\Controllers\BranchOrSiteController;
use App\Http\Controllers\PositionController;
>>>>>>> 7ea0aeb994732ea4a80c27d57a2f189673bbda94
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

   Route::resource('branches',BranchOrSiteController::class)->only(['index','create','store','edit','update','destroy']);
   Route::resource('positions',PositionController::class)->only(['index','create','store','edit','update','destroy']);

});

Route::resource('employees', EmployeeController::class)->middleware(['auth', 'verified']);

require __DIR__.'/settings.php';
