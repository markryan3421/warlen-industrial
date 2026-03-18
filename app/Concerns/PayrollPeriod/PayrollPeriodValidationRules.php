<?php

namespace App\Concerns\PayrollPeriod;

use App\Enums\PayrollPeriodStatusEnum;
use Illuminate\Validation\Rule;

trait PayrollPeriodValidationRules
{

    protected function payrollPeriodRules(): array
    {
        return [
            'start_date' => 'required',
            'end_date' => 'required',
            'pay_date' => 'required',
            'payroll_per_status' => ['required', Rule::enum(PayrollPeriodStatusEnum::class)],
        ];
    }

    protected function payrollPeriodAttributes(): array
    {
        return [
            'name' => 'Payroll Period',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
        ];
    }
}
