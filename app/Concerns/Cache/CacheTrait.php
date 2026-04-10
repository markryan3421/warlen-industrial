<?php

namespace App\Concerns\Cache;

use Illuminate\Support\Facades\Cache;

trait CacheTrait
{
    protected function cacheRemember(string $key,  int $ttl = 60, callable $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    protected function cacheRememberForever(string $key, callable $callback)
    {

        return Cache::rememberForever($key, $callback);
    }

    protected function cacheForget($keys)
    {
        if (is_array($keys)) {
            $results = [];
            foreach ($keys as $key) {
                $results[$key] = Cache::forget($key);
            }
            return $results;
        }

        return Cache::forget($keys);
    }
}
