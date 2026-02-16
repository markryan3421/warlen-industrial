<?php

use App\Http\Controllers\BranchOrSiteController;
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

});

require __DIR__.'/settings.php';
