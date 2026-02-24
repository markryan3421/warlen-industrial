<?php

namespace App\Repository;

use App\Concerns\Concerns\Trait\RateLimiterTraits;
use App\Models\Position;

class PositionRepository
{
      use RateLimiterTraits;
    public function __construct()
    {
        //
    }

    public function getPositions()
    {
        return Position::query()->get(['id', 'pos_name','basic_salary', 'pos_slug']);
            
    }

    /**
     * Get positions with filtering, pagination, and transformation
     */
   
   
}