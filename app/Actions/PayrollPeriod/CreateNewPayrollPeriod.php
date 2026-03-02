<?php

namespace App\Actions\PayrollPeriod;

use App\Models\PayrollPeriod;

class CreateNewPayrollPeriod
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $data): PayrollPeriod
    {
        return PayrollPeriod::create([
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'pay_date'=> $data['pay_date'],
            'payroll_per_status' => $data['payroll_per_status']
        ]);
    }
}
