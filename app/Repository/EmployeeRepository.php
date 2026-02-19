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
<<<<<<< HEAD
                'sites',
                'user' => fn($query) => $query->getUserName()
=======
                'user' => fn($query) => $query->getUserName(),
                'site',

>>>>>>> 7ef705fb18a446cb8121ddbc25d8b9bdfd7ca1ab
            ])
            ->latest()
            ->get([
                'id',
                'position_id',
                'branch_id',
                'user_id',
                'site_id',
                'employee_number',
                'emergency_contact_number',
                'department',
                'employee_status',
            ]);
    }
}
