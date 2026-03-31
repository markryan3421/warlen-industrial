<?php

namespace App\Actions\Deduction;

use App\Models\Deduction;
use Illuminate\Support\Facades\DB;

class CreateNewDeduction
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Create the incentive
            $deduction = Deduction::create([
                'payroll_period_id' => $data['payroll_period_id'],
                'deduction_name' => $data['deduction_name'],
                'deduction_amount' => $data['deduction_amount']
            ]);
            
            if (isset($data['employee_ids']) && !empty($data['employee_ids'])) {
                $deduction->employees()->sync($data['employee_ids']);
            }
            
            return $deduction;
        });
    }
}
