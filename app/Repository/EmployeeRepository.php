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
                'position' => function($query) {
                    $query->withTrashed()->select('id', 'pos_name', 'deleted_at');
                },
                 'branch' => function($query) {
                    $query->select('id', 'branch_name', 'branch_address');
                },
                'branch.sites' => function($query) {
                    $query->select('id', 'branch_id', 'site_name');
                },
                'site' => function($query) {
                    $query->select('id', 'site_name');
                },
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
                'employee_number',
                'emp_code',
                'emergency_contact_number',
                'pay_frequency',
                'contract_start_date',
                'contract_end_date',
                'employee_status',
            ]);
    }

       public function getBranchesWithSites(): Collection
    {
        return Branch::query()
            ->with(['sites' => function($query) {
                $query->select('id', 'branch_id', 'site_name');
            }])
            ->select('id', 'branch_name', 'branch_address')
            ->orderBy('branch_name')
            ->get();
    }
}
