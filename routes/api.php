<?php

use App\Http\Controllers\AIInsightController;
use App\Http\Controllers\AttendanceImportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Route::post('/attendance/import', [AttendanceImportController::class, 'store']);

// Route::middleware(['auth', 'admin'])->prefix('ai')->group(function () {
//     Route::get('/dashboard', [AIInsightController::class, 'dashboard'])->name('ai.dashboard');
//     Route::get('/insights', [AIInsightController::class, 'getInsights']);
//     Route::post('/deep-analysis', [AIInsightController::class, 'deepAnalysis']);
// });