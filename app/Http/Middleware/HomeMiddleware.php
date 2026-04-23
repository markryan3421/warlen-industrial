<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class HomeMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check() && Auth::user()->hasRole('admin')) {
            return redirect()->route('dashboard');
        }

        if (Auth::check() && Auth::user()->hasRole('employee')) {
            return redirect()->route('employee.dashboard');
        }

        if (Auth::check() && Auth::user()->hasRole('hr_head')) {
            return redirect()->route('hr.dashboard');
        }
        return $next($request);
    }
}
