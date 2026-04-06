<?php

namespace App\Http\Requests\Deduction;

use App\Concerns\Deduction\DeductionValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDeductionRequest extends FormRequest
{
    use DeductionValidationRules;
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->deductionRules();
    }

    public function attributes(): array
    {
        return $this->deductionAttributes();
    }

    public function messages(): array
    {
        return $this->deductionsMessages();
    }
}
