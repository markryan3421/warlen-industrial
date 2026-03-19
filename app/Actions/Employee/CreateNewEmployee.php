<?php

namespace App\Actions\Employee;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class CreateNewEmployee
{
    public function create(array $data): Employee
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => filter_var($data['email'], FILTER_SANITIZE_EMAIL),
                'password' => Hash::make($data['password'] ?? 'password'),
            ]);

            $role = Role::firstOrCreate(['name' => 'employee']);
            $user->assignRole($role);

            return Employee::create([
                'position_id' => $data['position_id'],
                'branch_id' => $data['branch_id'],
                'user_id' => $user->id,
                'site_id' => $data['site_id'],
                'slug_emp' => Str::slug($data['name'] . ' ' . $data['emp_code'],),
                'employee_number' => $data['employee_number'],
                'emp_code' => $data['emp_code'],
                'emergency_contact_number' => $data['emergency_contact_number'],
                'contract_start_date' => $data['contract_start_date'],
                'contract_end_date' => $data['contract_end_date'],
                'pay_frequency' => $data['pay_frequency'],
                'employee_status' => $data['employee_status'],
            ]);
        });
    }
}
