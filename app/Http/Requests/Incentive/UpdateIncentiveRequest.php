<?php

namespace App\Http\Requests\Incentive;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIncentiveRequest extends FormRequest
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
            'payroll_period_id' => 'required|exists:payroll_periods,id',
            'incentive_name' => 'required|string|max:255|min:3',
            'incentive_amount' => 'required|numeric|min:0',
        ];
    }

    public function attributes(): array
    {
        return [
            'payroll_period_id' => 'Payroll Period',
            'incentive_name' => 'Incentive Name',
            'incentive_amount' => 'Incentive Amount',
        ];
    }
}
