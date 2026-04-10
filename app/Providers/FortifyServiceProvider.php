<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {

        $this->intendedRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn(Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn(Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn(Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn(Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn() => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn() => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn() => Inertia::render('auth/confirm-password'));
    }

    private function intendedRoutes(): void
    {
        $this->app->singleton(LoginResponse::class, function () {
            return new class implements LoginResponse {
                public function toResponse($request)
                {
                    $user = $request->user();

                    if ($user->hasRole('admin')) {
                        return redirect()->intended(route('dashboard'));
                    }

                    if ($user->hasRole('employee')) {
                        if ($user->employee && $user->employee->employee_status === 'active' && !$user->employee->deleted_at) {
                            return redirect()->intended(route('employee.dashboard'));
                        }
                        Auth::logout();
                         $request->session()->invalidate();
                         $request->session()->regenerateToken();
                        return redirect()->route('login')->withErrors([
                            'email' => 'Your account is inactive or has been moved to archived. Please contact administrator.',
                        ]);
                    }

                    // Check if HR head exists and is active
                    if ($user->hasRole('hr_head')) {
                        if ($user->employee && $user->employee->employee_status === 'active' && !$user->employee->deleted_at) {
                            return redirect()->intended(route('hr.dashboard'));
                        }

                        Auth::logout();
                         $request->session()->invalidate();
                         $request->session()->regenerateToken();
                        return redirect()->route('login')->withErrors([
                            'email' => 'Your account is inactive or has been moved to archived. Please contact administrator.',
                        ]);
                    }

                    abort(403, 'Unauthorized access.');
                }
            };
        });
    }

    // private function intendedRoutes(): void
    // {
    //     $this->app->singleton(LoginResponse::class, function () {
    //         return new class implements LoginResponse {
    //             public function toResponse($request)
    //             {
    //                 $user = $request->user();

    //                 $role = match (true) {
    //                     $user->hasRole('admin') => 'admin',
    //                     $user->hasRole('employee') => 'employee',
    //                     $user->hasRole('hr_head') => 'hr_head',
    //                     default => null,
    //                 };

    //                 if (!$role) {
    //                     abort(403, 'Unauthorized access.');
    //                 }

    //                 // Check employee status for non-admin roles
    //                 if ($role !== 'admin') {
    //                     $isValid = $user->employee
    //                         && $user->employee->employee_status === 'active'
    //                         && !$user->employee->deleted_at;

    //                     if (!$isValid) {
    //                         Auth::logout();
    //                         $request->session()->invalidate();
    //                         $request->session()->regenerateToken();
    //                         return redirect()->route('login')->withErrors([
    //                             'email' => 'Your account is inactive or has been moved to archived. Please contact administrator.',
    //                         ]);
    //                     }
    //                 }

    //                 $routeMap = [
    //                     'admin' => 'dashboard',
    //                     'employee' => 'employee.dashboard',
    //                     'hr_head' => 'hr.dashboard',
    //                 ];

    //                 return redirect()->intended(route($routeMap[$role]));
    //             }
    //         };
    //     });
    // }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())) . '|' . $request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
