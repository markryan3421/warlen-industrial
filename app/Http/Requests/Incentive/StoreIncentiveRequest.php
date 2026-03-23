<?php

namespace App\Http\Requests\Incentive;

use App\Concerns\Incentive\IncentiveValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreIncentiveRequest extends FormRequest
{
    use IncentiveValidationRules;
    public function authorize(): bool
    {
        return true;
    }

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