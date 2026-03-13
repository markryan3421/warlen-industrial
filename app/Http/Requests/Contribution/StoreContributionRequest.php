<?php

namespace App\Http\Requests\Contribution;

use Illuminate\Foundation\Http\FormRequest;

class StoreContributionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => 'required|string',
            // 'effective_from' => 'required|date',
            // 'effective_to' => 'required|date|after:effective_from',
            'salary_ranges' => 'required|array|min:1',
            'salary_ranges.*.salary_from' => 'required|numeric|min:0',
            'salary_ranges.*.salary_to' => 'required|numeric|min:0|gt:salary_ranges.*.salary_from',
            'salary_ranges.*.employee_share' => 'required|numeric|min:0',
            'salary_ranges.*.employer_share' => 'required|numeric|min:0',
        ];
    }

    public function attributes(): array
    {
        return [
            'type' => 'Contribution Type',
            'effective_from' => 'Effective From Date',
            'effective_to' => 'Effective To Date',
            'salary_ranges' => 'Salary Ranges',
            'salary_ranges.*.salary_from' => 'Salary From',
            'salary_ranges.*.salary_to' => 'Salary To',
            'salary_ranges.*.employee_share' => 'Employee Share',
            'salary_ranges.*.employer_share' => 'Employer Share',
        ];
    }
}
