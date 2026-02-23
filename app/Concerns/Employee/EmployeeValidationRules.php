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

            'department' => ['required'],

            'employee_status' => ['required'],

            'position_id' => ['required', 'exists:positions,id'],

            'branch_id' => [
                'required',
                'exists:branches,id'
            ],

            'site_id' => [
                'exists:sites,id',
                'nullable',
                'sometimes',
            ],
            // 'user_id' => [
            //     'required',
            //     'exists:users,id'
            // ],

        ];
    }
}
