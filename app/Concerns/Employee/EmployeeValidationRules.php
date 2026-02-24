<?php

namespace App\Concerns\Employee;

use Illuminate\Validation\Rule;

trait EmployeeValidationRules
{
    protected function empRules(): array
    {
        return [
            'emergency_contact_number' => [
                'required',
                'numeric',
                'min:11',
            ],

            'name' => ['required', 'string', 'max:80', 'min:3'],

            'email' => ['required', 'email', 'max:80', Rule::unique('users', 'email')->ignore($this->route('employee')?->user_id)],
            'password' => ['nullable', 'string', 'min:8'],

            'employee_number' => [
                'required',
                'numeric',
                'min:11',
                Rule::unique('employees', 'employee_number')->ignore($this->route('employee')?->id),
            ],

            'emp_code' => [
                'required',
                Rule::unique('employees', 'emp_code')->ignore($this->route('employee')?->id),
            ],

            'contract_start_date' => ['required', 'date'],

            'contract_end_date' => ['required', 'date', 'after_or_equal:contract_start_date'],

            'employee_status' => ['required'],

            'position_id' => ['nullable', 'exists:positions,id', 'sometimes'],

            'branch_id' => [
                'required',
                'exists:branches,id'
            ],
            'pay_frequency' => ['required'],

            'site_id' => [
                'exists:sites,id',
                'nullable',
                'sometimes',
            ],

        ];
    }
}
