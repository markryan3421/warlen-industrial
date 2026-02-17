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

<<<<<<< HEAD
    public function attributes(): array
    {
        return $this->empAttributes();
=======
            'department' => ['required'],

            'employee_status' => ['required'],

            'position_id' => ['required', 'exists:positions,id'],

            'branch_or_site_id' => [
                'required',
                'exists:branch_or_sites,id'
            ],

            'name' => ['required','string','max:255'],
            'email' => ['required','string','email','max:255','unique:users'],
            'password' => ['nullable','string','min:8','max:255'],

        ];
>>>>>>> 88b644d23dd6037da9e66dc99df61ec307e2232c
    }
}
