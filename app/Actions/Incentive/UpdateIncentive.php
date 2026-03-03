<?php

namespace App\Actions\Incentive;

use App\Models\Incentive;

class UpdateIncentive
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, Incentive $incentive)
    {
        $incentive->update([
            'payroll_period_id' => $data['payroll_period_id'],
            'incentive_name' => $data['incentive_name'],
            'incentive_amount' => $data['incentive_amount']
        ]);
        
        // Attach employees if provided
        if (isset($data['employee_ids']) && !empty($data['employee_ids'])) {
            $incentive->employees()->sync($data['employee_ids']);
        }
        
        return $incentive;
    }
}
