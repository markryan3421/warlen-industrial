<?php

namespace App\Repository;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Collection;

class EmployeeRepository
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
        return Employee::query()
            ->with([
                'position',
                'branch',
                'sites',
                'user' => fn($query) => $query->getUserName()
            ])
            ->latest()
            ->get([
                'id',
                'position_id',
                'branch_id',
                'user_id',
                'site_id',
                'employee_number',
                'emp_code',
                'emergency_contact_number',
                'contract_start_date',
                'contract_end_date',
                'pay_frequency',
                'employee_status',
            ]);
    }
}
