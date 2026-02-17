<?php

namespace App\Http\Requests\Position;

use App\Concerns\Position\PositionAttributes;
use App\Concerns\Position\PositionValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StorePositionRequest extends FormRequest
{
    use PositionValidationRules, PositionAttributes;
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
        return $this->storeRules();
    }

    public function attributes(): array
    {
        return $this->positionAttributes();
    }
}
