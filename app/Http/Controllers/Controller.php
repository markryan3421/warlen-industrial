<?php

namespace App\Http\Controllers;

use App\Concerns\Cache\CacheTrait;
use App\Concerns\Concerns\Trait\RateLimiterTraits;

abstract class Controller
{
    use CacheTrait, RateLimiterTraits;
}
