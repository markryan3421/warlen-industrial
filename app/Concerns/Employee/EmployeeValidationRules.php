<?php

namespace App\Concerns\Employee;

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

            'employee_number' => [
                'required',
                'numeric',
                'min:11',
            ],

            'department' => ['required'],

            'employee_status' => ['required'],

            'position_id' => ['required', 'exists:positions,id'],

            'branch_or_site_id' => [
                'required',
                'exists:branch_or_sites,id'
            ],

            'name' => ['required', 'string', 'max:255'],

            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],

        ];
    }
}
