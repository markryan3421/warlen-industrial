<?php

namespace App\Concerns\Incentive;

trait IncentiveValidationRules
{
    protected function incentiveRules(): array
    {
        return [
            'payroll_period_id' => [
                'required',
                'exists:payroll_periods,id'
            ],
            'incentive_name' => [
                'required',
                'string',
                'min:3',
                'max:255',
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
            ],
            'is_daily' => [
                'boolean',
            ],
            'incentive_amount' => [
                'required',
                'numeric',
                'min:100',
                'max:9999999.99',
            ],
            'employee_ids' => [
                'required',
                'array',
                'min:1'
            ],
            'employee_ids.*' => [
                'required',
                'exists:employees,id'
            ],
        ];
    }

    protected function incentiveAttributes(): array
    {
        return [
            'payroll_period_id' => 'Payroll Period',
            'incentive_name' => 'Incentive Name',
            'incentive_amount' => 'Incentive Amount',
            'is_daily' => 'Is Daily',
        ];
    }

    protected function incentivesMessages(): array
    {
        return [
            'employee_ids.required' => 'Please select at least one employee.',
            'employee_ids.min' => 'Please select at least one employee.',
            'is_daily.required' => 'The is daily field is required.',
        ];
    }
}
