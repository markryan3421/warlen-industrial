<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SettingsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if it's a two-factor route
        if ($request->route() && str_starts_with($request->route()->getName(), 'two-factor.')) {

            // Allow AJAX, JSON, and Inertia requests (from your modal)
            if ($request->ajax() || $request->wantsJson() || $request->header('X-Inertia')) {
                return $next($request);
            }

            // Block direct browser navigation for authenticated users with roles
            if (Auth::check() && Auth::user()->hasAnyRole(['admin', 'hr_head', 'employee'])) {
                return back()->with('error', 'Direct access not allowed. Please use the settings page.');
            }
        }

        return $next($request);
    }
}
