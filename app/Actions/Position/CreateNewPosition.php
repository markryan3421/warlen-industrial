<?php

namespace App\Actions\Position;

use App\Models\Position;

class CreateNewPosition
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $data): Position
    {
        return Position::create([
            'pos_name' => $data['pos_name'],
        ]);
    }
}
