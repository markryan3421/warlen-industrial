<?php

namespace App\Actions\Employee;

use Illuminate\Support\Facades\Hash;

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
        $user = $employee->user;
        
        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (!empty($data['password'])) {
            $userData['password'] = Hash::make($data['password']);
        }

        $user->update($userData);

        $employee->update([
            'position_id' => $data['position_id'],
            'branch_id' => $data['branch_id'],
            'user_id' => $user->id,
            'employee_number' => $data['employee_number'],
            'emergency_contact_number' => $data['emergency_contact_number'],
            'department' => $data['department'],
            'employee_status' => $data['employee_status'],
        ]);

        return $employee;
    }
}
