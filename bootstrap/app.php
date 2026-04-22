<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Inertia\Middleware\EncryptHistory;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');  
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

       // $middleware->trustProxies(at:'*');

        $middleware->alias([
                'roleBase' => \App\Http\Middleware\RolaBaseMiddleware::class,
                'admin' => AdminMiddleware::class,
                'hr' => \App\Http\Middleware\HrMiddleware::class,
                'employee' => \App\Http\Middleware\EmployeeMiddleware::class,
                // 'adminhr' => \App\Http\Middleware\AdminHrMiddleware::class,
        ]);
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
           // EncryptHistory::class,
        ]);
    })

    //   ->withSchedule(function (Schedule $schedule) {
    //     // Run daily at midnight to update statuses
    //     $schedule->command('app:update-employee-statuses')->daily();
        
    //     // Or run more frequently if needed
    //     // $schedule->command('app:update-employee-statuses')->hourly();
        
    //     // Run every minute for testing (remove in production)
    //     // $schedule->command('app:update-employee-statuses')->everyMinute();
    // })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
