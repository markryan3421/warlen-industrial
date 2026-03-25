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
        if ($user->hasRole('admin') && ($request->routeIs(
            'employee.dashboard',
            'hr.dashboard',
            'employee.application-leave.*',
            'hr.payroll.*',
            'hr.payroll-periods.*',
            'hr.attendances.*',
            'hr.attendance-logs',
            'hr.attendance-exception-stats',
            'hr.attendance-period-stats',
            'hr.attendance-schedules',
            'hr.employees.*'
        ))) {
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
                'payroll-periods.*',
                'hr.payroll.*',
                'hr.payroll-periods.*',
                'hr.attendances.*',
                'hr.attendance-logs',
                'hr.attendance-exception-stats',
                'hr.attendance-period-stats',
                'hr.attendance-schedules',
                'admin.attendance-logs',
                'admin.attendance-exception-stats',
                'admin.attendance-period-stats',
                'admin.attendance-schedules'
            )
        ) {
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
                'employee.index',
                'employee.store',
                'employee.update',
                'employee.edit',
                'employee.destroy',
                'permissions.*',
                'incentives.*',
                'contribution-versions.*',
                'employee.application-leave.*',
                'payroll-periods.*',
                'admin.attendance-logs',
                'admin.attendance-exception-stats',
                'admin.attendance-period-stats',
                'admin.attendance-schedules'
            )
        ) {
            abort(401);
        }

        return $next($request);
    }
}
