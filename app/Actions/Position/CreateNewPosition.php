<?php

namespace App\Actions\Position;

use App\Models\Position;
use Illuminate\Support\Str;

class CreateNewPosition
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        
    }

    public function create(array $data): Position
    {
       // dd($data);
        $position = Position::create([
            'pos_name' => $data['pos_name'],
            'basic_salary' => $data['basic_salary'],
            'pos_slug' => Str::slug($data['pos_name']),
            'is_salary_fixed' => $data['is_salary_fixed']
        ]);

        return $position;
    }
}
