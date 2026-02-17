<?php

namespace App\Http\Requests\Employee;

use App\Concerns\Employee\EmployeeAttributes;
use App\Concerns\Employee\EmployeeValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
{
    use EmployeeValidationRules, EmployeeAttributes;
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
        return $this->empRules();
    }


   public function attributes(): array
    {
        return $this->empAttributes();
    }
}
