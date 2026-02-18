<?php

namespace App\Actions\Employee;

use App\Models\Employee;

class EditEmployee
{
    public function __construct()
    {
        //
    }
    public function edit(Employee $employee): Employee
    {
        return $employee->load(['position', 'branch', 'user']);
    }
}