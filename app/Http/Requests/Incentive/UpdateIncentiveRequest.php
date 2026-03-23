<?php

namespace App\Http\Requests\Incentive;

use App\Concerns\Incentive\IncentiveValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdateIncentiveRequest extends FormRequest
{
    use IncentiveValidationRules;
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
        return $this->incentiveRules();
    }

    public function attributes(): array
    {
       return $this->incentiveAttributes();
    }

    public function messages(): array
    {
        return $this->incentivesMessages();
    }
}
