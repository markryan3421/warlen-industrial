<?php

namespace App\Concerns\Contribution;

use Illuminate\Validation\Rule;

trait ContributionValidationRules
{
        protected function contributionRules(): array
    {
        $isSSS = request()->input('type') === 'sss';
        
        return [
            'type' => 'required|in:sss,pagibig,philhealth',
            'salary_ranges' => $isSSS ? 'required|array|min:1' : 'nullable|array',
            'salary_ranges.*.salary_from' => $isSSS ? 'required|numeric|min:0' : 'nullable|numeric|min:0',
            'salary_ranges.*.salary_to' => $isSSS ? 'required|numeric|min:0|gt:salary_ranges.*.salary_from' : 'nullable|numeric|min:0',
            'salary_ranges.*.employee_share' => $isSSS ? 'required|numeric|min:0|max:100' : 'nullable|numeric|min:0|max:100',
            'salary_ranges.*.employer_share' => $isSSS ? 'required|numeric|min:0|max:100' : 'nullable|numeric|min:0|max:100',
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
