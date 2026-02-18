<?php

namespace App\Actions\Employee;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class CreateNewEmployee
{
    public function create(array $data) 
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password'] ?? 'password'),
            ]);
            
            return Employee::create([
                'position_id' => $data['position_id'],
                'branch_or_site_id' => $data['branch_or_site_id'],
                'user_id' => $user->id,
                'employee_number' => $data['employee_number'],
                'emergency_contact_number' => $data['emergency_contact_number'],
                'department' => $data['department'],
                'employee_status' => $data['employee_status'],
            ]);
        });
    }
}