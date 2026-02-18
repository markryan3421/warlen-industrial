<?php

namespace App\Concerns\Cache;

use Illuminate\Support\Facades\Cache;

trait CacheTrait
{
    protected function cacheRemember(string $key,  int $ttl = 60, callable $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }
}
