<?php

namespace App\Actions\Incentive;

use App\Models\Incentive;
use Illuminate\Support\Facades\DB;

class CreateNewIncentive
{
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Create the incentive
            $incentive = Incentive::create([
                'payroll_period_id' => $data['payroll_period_id'],
                'incentive_name' => $data['incentive_name'],
                'incentive_amount' => $data['incentive_amount']
            ]);
            
            // Attach employees if provided
            if (isset($data['employee_ids']) && !empty($data['employee_ids'])) {
                $incentive->employeeIncentives()->sync($data['employee_ids']);
            }
            
            return $incentive;
        });
    }
}