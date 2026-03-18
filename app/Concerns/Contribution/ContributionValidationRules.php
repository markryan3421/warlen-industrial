<?php

namespace App\Concerns\Contribution;

use Illuminate\Validation\Rule;

trait ContributionValidationRules
{
    protected function contributionRules(): array
    {
        return [
            'type' => [
                'required',
                Rule::in(['sss', 'pagibig', 'philhealth'])
            ],
            'salary_ranges' => 'required|array|min:1',
            'salary_ranges.*.salary_from' => 'required|numeric|min:0',
            'salary_ranges.*.salary_to' => 'required|numeric|min:0|gt:salary_ranges.*.salary_from',
            'salary_ranges.*.employee_share' => 'required|numeric|min:0',
            'salary_ranges.*.employer_share' => 'required|numeric|min:0',
        ];
    }

    protected function contributionAttributes(): array
    {
        return [
            'type' => 'Contribution Type',
            // 'effective_from' => 'Effective From Date',
            // 'effective_to' => 'Effective To Date',
            'salary_ranges' => 'Salary Ranges',
            'salary_ranges.*.salary_from' => 'Salary From',
            'salary_ranges.*.salary_to' => 'Salary To',
            'salary_ranges.*.employee_share' => 'Employee Share',
            'salary_ranges.*.employer_share' => 'Employer Share',
        ];
    }
}
