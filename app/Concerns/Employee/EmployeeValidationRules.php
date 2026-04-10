<?php

namespace App\Concerns\Employee;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

trait EmployeeValidationRules
{
    /**
     * Get the validation rules that apply to the employee.
     *
     * @return array
     */
    protected function empRules(): array
    {
        return [
            'emergency_contact_number' => [
                'required',
                'string',
                'min:11',
                'regex:/^(\+63|0)?9\d{9}$/'
            ],

            'name' => [
                'required',
                'string',
                'max:80',
                'min:3',
                'regex:/^[a-zA-Z\s\'-]+$/'
            ],

            'email' => [
                'required',
                'email',
                'max:80',
                Rule::unique('users', 'email')->ignore($this->route('employee')?->user_id)
            ],
            'password' => [
                'nullable',
                'string',
                Password::default()
                //'regex:/^[^\p{Emoji}]*$/u',
                // 'regex:/[A-Z]/',      // At least one uppercase letter
                // 'regex:/[a-z]/',      // At least one lowercase letter
                // 'regex:/[0-9]/',      // At least one number
                // 'regex:/[@$!%*#?&]/', // At least one special character
            ],

            'employee_number' => [
                'required',
                'string',
                'min:11',
                'regex:/^(\+63|0)?9\d{9}$/',
                Rule::unique('employees', 'employee_number')->ignore($this->route('employee')?->id),
            ],

            'emp_code' => [
                'required',
                Rule::unique('employees', 'emp_code')->ignore($this->route('employee')?->id),
            ],

            'contract_start_date' => [
                'required',
                'date'
            ],

            'contract_end_date' => [
                'required',
                'date',
                'after_or_equal:contract_start_date'
            ],

            'employee_status' => ['required'],

            'position_id' => [
                'nullable',
                'exists:positions,id',
                'sometimes
                  '
            ],

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

            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ];
    }

    protected function empMessages(): array
    {
        return [
            // Avatar Messsages
            'avatar.image' => 'The avatar must be an image.',
            'avatar.mimes' => 'The avatar must be a valid image file (jpeg, png, jpg, gif, webp).',
            'avatar.max' => 'The avatar must not exceed 2MB in size.',

            // Emergency Contact Number Messages
            'emergency_contact_number.required' => 'The emergency contact number is required.',
            'emergency_contact_number.numeric' => 'The emergency contact number must contain only numbers.',
            'emergency_contact_number.min' => 'The emergency contact number must be at least 11 digits.',
            'emergency_contact_number.starts_with' => 'The emergency contact number must start with 9 (e.g., 91234567890).',

            // Name Messages
            'name.required' => 'The employee name is required.',
            'name.string' => 'The employee name must be a valid string.',
            'name.max' => 'The employee name cannot exceed 80 characters.',
            'name.min' => 'The employee name must be at least 3 characters.',
            'name.regex' => 'The employee name may only contain letters, spaces, apostrophes, and hyphens. No numbers or special characters allowed.',

            // Email Messages
            'email.required' => 'The email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.max' => 'The email address cannot exceed 80 characters.',
            'email.unique' => 'This email address is already registered.',

            // Password Messages
            'password.min' => 'The password must be at least 8 characters long.',
            'password.regex' => 'The password cannot contain emojis.',
            'password.regex' => 'The password must contain at least one uppercase letter.',
            'password.regex' => 'The password must contain at least one lowercase letter.',
            'password.regex' => 'The password must contain at least one number.',
            'password.regex' => 'The password must contain at least one special character (@$!%*#?&).',

            // Employee Number Messages
            'employee_number.required' => 'The employee contact number is required.',
            'employee_number.numeric' => 'The employee contact number must contain only numbers.',
            'employee_number.min' => 'The employee contact number must be at least 11 digits.',
            'employee_number.regex' => 'The employee contact number must start with 9.',
            'employee_number.unique' => 'This employee contact number is already taken.',

            // Employee Code Messages
            'emp_code.required' => 'The employee code is required.',
            'emp_code.unique' => 'This employee code is already taken.',

            // Contract Start Date Messages
            'contract_start_date.required' => 'The contract start date is required.',
            'contract_start_date.date' => 'Please enter a valid contract start date.',

            // Contract End Date Messages
            'contract_end_date.required' => 'The contract end date is required.',
            'contract_end_date.date' => 'Please enter a valid contract end date.',
            'contract_end_date.after_or_equal' => 'The contract end date must be after or equal to the start date.',

            // Employee Status Messages
            'employee_status.required' => 'Please select an employee status.',

            // Position ID Messages
            'position_id.exists' => 'The selected position does not exist.',

            // Branch ID Messages
            'branch_id.required' => 'Please select a branch.',
            'branch_id.exists' => 'The selected branch does not exist.',

            // Pay Frequency Messages
            'pay_frequency.required' => 'Please select a pay frequency.',

            // Site ID Messages
            'site_id.exists' => 'The selected site does not exist.',
        ];
    }
}
