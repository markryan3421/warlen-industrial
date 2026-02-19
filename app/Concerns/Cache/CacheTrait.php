<?php

namespace App\Concerns\Cache;

use Illuminate\Support\Facades\Cache;

trait CacheTrait
{
    protected function cacheRemember(string $key,  int $ttl = 60, callable $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    protected function cacheRememberForever(string $key, callable $callback){

        return Cache::rememberForever($key, $callback);
        
    }

    protected function cacheForget(string $key)
    {
       return Cache::forget($key);
    }
}
