<?php

namespace App\Concerns\Employee;

trait EmployeeAttributes
{
    protected function empAttributes(): array
    {
        return [
            'employee_number' => 'employee number',
            'emergency_contact_number' => 'emergency contact number',
            'department' => 'department',
            'employee_status' => 'employee status',
            'position_id' => 'position',
            'branch_or_site_id' => 'branch or site',
            'user_id' => 'user',
        ];
    }
}
