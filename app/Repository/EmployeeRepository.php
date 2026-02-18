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
                'branchOrSite',
                'user' => fn($query) => $query->getUserName()
            ])
            ->latest()
            ->get([
                'id',
                'position_id',
                'branch_or_site_id',
                'user_id',
                'employee_number',
                'emergency_contact_number',
                'department',
                'employee_status',
            ]);
    }
}
