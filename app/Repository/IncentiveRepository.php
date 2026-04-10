<?php

namespace App\Repository;

use App\Enums\PayrollPeriodStatusEnum;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\Incentive;
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

    public function getPayrollPeriods(): Collection
    {
        return PayrollPeriod::query()
            ->get([
                'id',
                'start_date',
                'end_date',
                'pay_date',
                'payroll_per_status',
            ]);
    }

    public function getIncentives(): Collection
    {
        return Incentive::query()
            ->with([
                'payroll_period',
                'employees',
                'employees.user',
                'employees.position',
                'employees.branch'
            ])
            ->get([
                'id',
                'payroll_period_id',
                'incentive_name',
                'incentive_amount',
            ]);
    }

    public function getOpenPayrollPeriods(): Collection
    {
        return PayrollPeriod::query()
            ->where('payroll_per_status', PayrollPeriodStatusEnum::OPEN->value)
            ->get(['id', 'start_date', 'end_date', 'pay_date', 'payroll_per_status']);
    }

    public function getActiveEmployeesForIncentive(): Collection
    {
        return Employee::with('user:id,name')
            ->where('employee_status', 'active')
            ->get(['id', 'user_id', 'employee_status', 'emp_code']);
    }

    public function getDeductions(): Collection
    {
        return Deduction::query()
            ->with(['payroll_period', 'employees', 'employees.user', 'employees.position', 'employees.branch'])
            ->get(['id', 'payroll_period_id', 'deduction_name', 'deduction_amount']);
    }
}
