<?php

namespace App\Repository;

use App\Models\Branch;
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
                'position' => fn($query) => $query->getPosition(),
                'branch' => fn($query) => $query->getBranch(),
                'branch.sites' => fn($query) => $query->getSiteName(),
                'site' => fn($query) => $query->getSiteName(),
                'user' => fn($query) => $query->getUserName(),
            ])
            ->latest()
            ->get([
                'id',
                'position_id',
                'branch_id',
                'user_id',
                'site_id',
                'slug_emp',
                'avatar',
                'employee_number',
                'emp_code',
                'emergency_contact_number',
                'pay_frequency',
                'contract_start_date',
                'contract_end_date',
                'sss_number',
                'pagibig_number',
                'philhealth_number',
                'employee_status',
            ]);
    }

    public function getBranchesWithSites(): Collection
    {
        return Branch::query()
            ->with(['sites' => function ($query) {
                $query->getSiteName();
            }])
            ->select('id', 'branch_name', 'branch_address')
            ->orderBy('branch_name')
            ->get();
    }

    public function getDeletedEmployees(): Collection
    {
        return Employee::query()
            ->onlyTrashed()
            ->with([
                'position' => fn($query) => $query->getPosition(),
                'branch' => fn($query) => $query->getBranch(),
                'site' => fn($query) => $query->getSiteName(),
                'user' => fn($query) => $query->getUserName(),
            ])
            ->latest()
            ->get([
                'id',
                'position_id',
                'branch_id',
                'user_id',
                'site_id',
                'slug_emp',
                'avatar',
                'employee_number',
                'emp_code',
                'emergency_contact_number',
                'pay_frequency',
                'contract_start_date',
                'contract_end_date',
                'employee_status',
            ]);
    }
}
