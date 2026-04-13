<?php

namespace App\Repository;

use App\Enums\PayrollPeriodStatusEnum;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use Illuminate\Database\Eloquent\Collection;

class IncentiveRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getEmployees(): Collection
    {
        return Employee::with('user')
            ->where('employee_status', 'active')
            ->get(['id', 'user_id', 'employee_status', 'emp_code']);
    }

    public function getDeductions(): Collection
    {
        return Deduction::query()
            ->get([
                'id',
                'payroll_period_id',
                'deduction_name',
                'deduction_amount'
            ]);
    }

    public function getOpenPayrollPeriods(): Collection
    {
        return PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get([
                'id',
                'start_date',
                'end_date',
                'pay_date',
                'payroll_per_status'
            ]);
    }
}
