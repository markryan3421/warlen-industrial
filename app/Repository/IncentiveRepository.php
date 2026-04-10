<?php

namespace App\Repository;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Collection;

class IncentiveRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function getEmployees(): Collection
    {
        return Employee::with('user')
                ->where('employee_status', 'inactive')
                ->get(['id', 'user_id', 'employee_status', 'emp_code']);
    }
}
