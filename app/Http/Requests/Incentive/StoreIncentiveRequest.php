<?php

namespace App\Http\Requests\Incentive;

use Illuminate\Foundation\Http\FormRequest;

class StoreIncentiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payroll_period_id' => ['required', 'exists:payroll_periods,id'],
            'incentive_name' => ['required', 'string', 'max:255'],
            'incentive_amount' => ['required', 'numeric', 'min:0'],
            'employee_ids' => ['required', 'array', 'min:1'],
            'employee_ids.*' => ['required', 'exists:employees,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'employee_ids.required' => 'Please select at least one employee.',
            'employee_ids.min' => 'Please select at least one employee.',
        ];
    }
}