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
use Illuminate\Database\Eloquent\Relations\Relation;
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

        $this->observer();

        $this->enforceMorphMap();
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

    private function enforceMorphMap(): void
    {
        Relation::enforceMorphMap([
            // User & Authentication
            'user' => 'App\Models\User',
            'role' => 'App\Models\Role',
            'permission' => 'App\Models\Permission',

            // Employees
            'employee' => 'App\Models\Employee',
            'position' => 'App\Models\Position',
            'branch' => 'App\Models\Branch',
            'site' => 'App\Models\Site',

            // Leave & Attendance
            'application_leave' => 'App\Models\ApplicationLeave',
            'attendance' => 'App\Models\Attendance',
            'attendance_exception_stat' => 'App\Models\AttendanceExceptionStat',
            'attendance_log' => 'App\Models\AttendanceLog',
            'attendance_period_stat' => 'App\Models\AttendancePeriodStat',
            'attendance_schedule' => 'App\Models\AttendanceSchedule',

            // Payroll
            'payroll' => 'App\Models\Payroll',
            'payroll_item' => 'App\Models\PayrollItem',
            'payroll_period' => 'App\Models\PayrollPeriod',
            'deduction' => 'App\Models\Deduction',
            'incentive' => 'App\Models\Incentive',

            // Contributions
            'contribution_bracket' => 'App\Models\ContributionBracket',
            'contribution_version' => 'App\Models\ContributionVersion',
        ]);
    }



    private function observer(): void
    {
        AttendancePeriodStat::observe(AttendancePeriodStatObserver::class);
        // PayrollPeriod::observe(PayrollPeriodObserver::class);

        ApplicationLeave::observe(ApplicationLeaveObserver::class);
        // Employee::observe(new \App\Observers\EmployeeObserver());
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('limit-actions', function (Request $request) {
            return $request->user()
                ? Limit::perMinute(15)->by($request->user()->id)
                : Limit::perMinute(5)->by($request->ip());
        });
    }
}
