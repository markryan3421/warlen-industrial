<?php

namespace App\Actions\PayrollPeriod;

use App\Models\PayrollPeriod;

class UpdatePayrollPeriod
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, PayrollPeriod $payrollPeriod): PayrollPeriod
    {
        $payrollPeriod->update([
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'pay_date' => $data['pay_date'],
            'payroll_per_status' => $data['payroll_per_status'],
            'is_paid' => $data['is_paid']
        ]);

        return $payrollPeriod;  
    }
}
