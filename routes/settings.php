<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Middleware\SettingsMiddleware;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit')->middleware(SettingsMiddleware::class);
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit')->middleware(SettingsMiddleware::class);

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit')->middleware(SettingsMiddleware::class);

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show')->middleware(SettingsMiddleware::class);

    
});

Route::middleware(['auth', 'verified', SettingsMiddleware::class])->group(function () {
    
    Route::get('user/two-factor-qr-code', [\Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::class, 'show'])
        ->name('two-factor.qr-code');
    
    Route::get('user/two-factor-recovery-codes', [\Laravel\Fortify\Http\Controllers\RecoveryCodeController::class, 'index'])
        ->name('two-factor.recovery-codes');
    
    Route::get('user/two-factor-secret-key', [\Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::class, 'show'])
        ->name('two-factor.secret-key');
});
