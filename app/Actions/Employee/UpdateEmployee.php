<?php

namespace App\Actions\Employee;

class UpdateEmployee
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, $employee) 
    {
        $employee->update([
            'position_id' => $data['position_id'],
            'branch_or_site_id' =>$data['branch_or_site_id'],
            'user_id' => $data['user_id'],
            'employee_number' =>$data['employee_number'],
            'emergency_contact_number' => $data['emergency_contact_number'],
            'department' => $data['department'],
            'employee_status' => $data['employee_status'],
        ]);
        return $employee;
    }
}
