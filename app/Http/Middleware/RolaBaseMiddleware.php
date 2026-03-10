<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class RolaBaseMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return $next($request);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Admin should not access employee routes and hr head routes
        if ($user->hasRole('admin') && ($request->routeIs('employee.dashboard', 'hr.dashboard', 'employee.application-leave.*'))) {
            // return redirect()->intended(route('dashboard'));
            abort(401);
        }

        // Employee should not access admin routes
        if (
            $user->hasRole('employee') &&
            $request->routeIs(
                'dashboard',
                'hr.dashboard',
                'branches.*',
                'positions.*',
                'employees.*',
                'permissions.*',
                'contribution-versions.*',
                'application-leave.*',
                'payroll-periods.*'
            )
        ) {
            // return redirect()->intended(route('employee.dashboard'));
            abort(401);
        }

        // HR head should not access admin and employee routes
        if (
            $user->hasRole('hr_head') &&
            $request->routeIs(
                'dashboard',
                'employee.dashboard',
                'branches.*',
                'positions.*',
                'employees.*',
                'permissions.*',
                'contribution-versions.*',
                'employee.application-leave.*'
            )
        ) {
            // return redirect()->intended(route('hr.dashboard'));
               abort(401);
        }

        return $next($request);
    }
}
