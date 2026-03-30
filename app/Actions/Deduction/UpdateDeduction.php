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

    public function update(array $data, Deduction $deduction)
    {
        $deduction->update([
            'payroll_period_id' => $data['payroll_period_id'],
            'deduction_name' => $data['deduction_name'],
            'deduction_amount' => $data['deduction_amount']
        ]);
        
        if (isset($data['employee_ids']) && !empty($data['employee_ids'])) {
            $deduction->employees()->sync($data['employee_ids']);
        }
        
        return $deduction;
    }
}
