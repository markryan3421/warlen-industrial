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
                'incentive_name' => $data['incentive_name'],
                'incentive_amount' => $data['incentive_amount'],
                'payroll_period_id' => $data['payroll_period_id'],
                'is_daily' => $data['is_daily'] ?? false,
            ]);

            if (!empty($data['employee_ids'])) {
                $incentive->employees()->attach($data['employee_ids']);
            }

            $incentive->save();

            return $incentive;
        });
    }
}
