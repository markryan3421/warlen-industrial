<?php

namespace App\Concerns\Concerns\Trait;

use Illuminate\Support\Facades\RateLimiter;

trait RateLimiterTraits
{
    protected function limit(string $key, int $seconds, int $maxAttempts): bool
    {
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) { // Check if the key has exceeded the maximum attempts
           // $seconds = RateLimiter::availableIn($key);
            return true;
        }

        RateLimiter::hit($key, $seconds); // set the decay time for the key
        return false;
    }
}
