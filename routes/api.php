<?php

use App\Http\Controllers\AttendanceImportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/attendance/import', [AttendanceImportController::class, 'store']);