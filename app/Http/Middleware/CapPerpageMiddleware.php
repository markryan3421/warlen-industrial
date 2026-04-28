<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CapPerpageMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, $max = 100): Response
    {
        if ($request->has('perPage')) {
            $originalPerPage = (int) $request->perPage;
            $cappedPerPage = min($originalPerPage, $max);
            $cappedPerPage = max($cappedPerPage, 1);

            if ($originalPerPage !== $cappedPerPage) {
                $request->merge(['perPage' => $cappedPerPage]);
                $request->query->set('perPage', $cappedPerPage);

                // Optional: Log that capping occurred for debugging
                //logger("PerPage capped from {$originalPerPage} to {$cappedPerPage}");
            }
        }

        $response = $next($request);

        // Optional: Add header to indicate capping happened
        if (isset($originalPerPage) && $originalPerPage > $max) {
            $response->headers->set('X-PerPage-Capped', 'true');
        }

        return $response;
    }
}
