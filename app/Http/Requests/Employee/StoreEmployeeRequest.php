<?php

namespace App\Http\Requests\Employee;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeRequest extends FormRequest
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
            'emergency_contact_number' => [
                'required',
                'numeric',
                'min:11'
            ],
            
            'employee_number' => [
                'required',
                'numeric',
                'min:11'
            ],

            'department' => ['required'],

            'employee_status' => ['required'],

            'position_id' => ['required', 'exists:positions,id'],

            'branch_or_site_id' => [
                'required',
                'exists:branch_or_sites,id'
            ],
            'user_id' => [
                'required',
                'exists:users,id'
            ],

        ];
    }
}
