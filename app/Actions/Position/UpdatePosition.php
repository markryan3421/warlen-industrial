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

        $position->deduction()->update([
            'salary_rate' => $data['salary_rate'],
            'reg_overtime_rate' => $data['reg_overtime_rate'],
            'special_overtime_rate' => $data['special_overtime_rate'],
            'sss_rate' => $data['sss_rate'],
            'philhealth_rate' => $data['philhealth_rate'],
            'pagibig_rate' => $data['pagibig_rate'],
        ]);

        return $position;
    }
}
