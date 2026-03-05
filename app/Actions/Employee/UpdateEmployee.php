<?php

namespace App\Actions\Employee;

use App\Models\Employee;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class UpdateEmployee
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function update(array $data, Employee $employee): Employee
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

        $role = Role::firstOrCreate(['name' => 'employee']);
        $user->assignRole($role);

        //dd($data['employee_status']);
        $employee->update([
            'position_id' => $data['position_id'],
            'branch_id' => $data['branch_id'],
            'user_id' => $user->id,
            'site_id' => $data['site_id'],
            'employee_number' => $data['employee_number'],
            'emp_code' => $data['emp_code'],
            'slug_emp' => Str::slug($data['name']),
            'emergency_contact_number' => $data['emergency_contact_number'],
            'contract_start_date' => $data['contract_start_date'],
            'contract_end_date' => $data['contract_end_date'],
            'pay_frequency' => $data['pay_frequency'],
            'employee_status' => $data['employee_status'],
        ]);


        return $employee;
    }
}
