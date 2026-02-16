<?php

namespace App\Actions\Position;

use App\Models\Position;

class UpdatePosition
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, Position $position): Position
    {
        $position->update([
            'pos_name' => $data['pos_name'],
        ]);

        return $position;
    }
}
