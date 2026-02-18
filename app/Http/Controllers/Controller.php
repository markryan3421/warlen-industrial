<?php

namespace App\Http\Controllers;

use App\Concerns\Cache\CacheTrait;

abstract class Controller
{
    use CacheTrait;
}
