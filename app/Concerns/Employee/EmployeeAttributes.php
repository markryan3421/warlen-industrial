<?php

namespace App\Concerns\Employee;

trait EmployeeAttributes
{
    /**
     * Returns an associative array of employee attributes where the key is the attribute name
     * and the value is a human-readable description of the attribute.
     *
     * @return array
     */
    protected function empAttributes(): array
    {
        return [
            'employee_number' => 'employee number',
            'emergency_contact_number' => 'emergency contact number',
            'emp_code' => 'emp code',
            'pay_frequency' => 'pay frequency',
            'contract_start_date' => 'contract start date',
            'contract_end_date' => 'contract end date',
            'employee_status' => 'employee status',
            'position_id' => 'position',
            'branch_id' => 'branch',
            'user_id' => 'user',
            'site_id' => 'site',
        ];
    }
}
