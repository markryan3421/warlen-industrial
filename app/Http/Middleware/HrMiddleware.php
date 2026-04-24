<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class HrMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return redirect()->route('login');
        }

        if (Auth::check() && Auth::user()->hasRole('hr_head')) {
            // session()->put('url.intended', url()->previous());
            // return redirect()->route('maintenance');
            return $next($request);
        }

        abort(403, 'Unauthorized access. HR privileges required.');
    }
}
