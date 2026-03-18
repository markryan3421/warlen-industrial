<?php

namespace App\Http\Requests\PayrollPeriod;

use App\Concerns\PayrollPeriod\PayrollPeriodValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePayrollPeriodRequest extends FormRequest
{
    use PayrollPeriodValidationRules;
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
       return $this->payrollPeriodRules();
    }

    public function attributes(): array
    {
       return $this->payrollPeriodAttributes();
    }
}
