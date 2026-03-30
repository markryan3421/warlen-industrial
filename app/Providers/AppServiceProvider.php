<?php

namespace App\Providers;

use App\Events\PayrollProcessingEvent;
use App\Listeners\PayrollPeriodProcessingListener;
use App\Listeners\PayrollProcessingListener;
use App\Models\ApplicationLeave;
use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Observers\ApplicationLeaveObserver;
use App\Observers\AttendancePeriodStatObserver;
use App\Observers\PayrollPeriodObserver;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        $this->configureRateLimiting();

        Employee::observe(new \App\Observers\EmployeeObserver());

        $this->observer();
       // $this->events();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn(): ?Password => app()->isProduction()
                ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
                : null
        );
    }

    private function events(): void
    {
        Event::listen(
            PayrollProcessingEvent::class,
            PayrollProcessingListener::class
        );
    }



    private function observer(): void
    {
        AttendancePeriodStat::observe(AttendancePeriodStatObserver::class);
       // PayrollPeriod::observe(PayrollPeriodObserver::class);

        ApplicationLeave::observe(ApplicationLeaveObserver::class);
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('limit-actions', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
