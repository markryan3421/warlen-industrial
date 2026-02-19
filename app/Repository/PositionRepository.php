<?php

namespace App\Repository;

use App\Models\Position;
// use Illuminate\Database\Eloquent\Collection;

class PositionRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getPositions()
    {
        return Position::query()
            ->with(['deduction' => function ($query) {
                $query->deductionsOnly();
            }]);
            // ->get(['id', 'pos_name']);
    }
}
