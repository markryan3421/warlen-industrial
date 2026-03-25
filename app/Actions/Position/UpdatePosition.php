<?php

namespace App\Actions\Position;

use App\Models\Position;
use Illuminate\Support\Str;

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
            'basic_salary' => $data['basic_salary'],
            'pos_slug' => Str::slug($data['pos_name']),
            'is_salary_fixed' => $data['is_salary_fixed']
        ]);

        return $position;
    }
}
