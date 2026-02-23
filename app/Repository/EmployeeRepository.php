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
=======
                'site',
>>>>>>> 3ada93cb3b978db72f1a0dd768adf1c1d1f2e8bf
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
                'emergency_contact_number',
                'department',
                'employee_status',
            ]);
    }
}
