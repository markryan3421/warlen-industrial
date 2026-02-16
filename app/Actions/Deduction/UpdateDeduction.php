<?php

namespace App\Actions\Deduction;

use App\Models\Deduction;

class UpdateDeduction
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, Deduction $deduction): Deduction
    {
        $deduction->update([
            'position_id' => $data['position_id'],
            'salary_rate' => $data['salary_rate'],
            'reg_overtime_rate' => $data['reg_overtime_rate'],
            'special_overtime_rate' => $data['special_overtime_rate'],
            'sss_rate' => $data['sss_rate'],
            'philhealth_rate' => $data['philhealth_rate'],
            'pagibig_rate' => $data['pagibig_rate'],
        ]);

        return $deduction;
    }
}
