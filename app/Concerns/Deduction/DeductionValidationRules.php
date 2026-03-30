<?php

namespace App\Concerns\Deduction;

trait DeductionValidationRules
{
    //
    public function deductionRules(): array
    {
        return [
            'payroll_period_id' => [
                'required',
                'exists:payroll_periods,id'
            ],
            'deduction_name' => [
                'required',
                'string',
                'min:3',
                'max:255',
                'regex:/^[a-zA-Z0-9\s\-_\.&,()@]+$/',
            ],
            'deduction_amount' => [
                'required',
                'numeric',
                'min:100'
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

    public function deductionAttributes(): array
    {
        return [
            'payroll_period_id' => 'Payroll Period',
            'deduction_name' => 'Deduction Name',
            'deduction_amount' => 'Deduction Amount',
        ];
    }

    public function deductionsMessages(): array
    {
        return [
            'employee_ids.required' => 'Please select at least one employee.',
            'employee_ids.min' => 'Please select at least one employee.',
        ];
    }
}
