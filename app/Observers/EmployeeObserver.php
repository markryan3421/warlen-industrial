<?php

namespace App\Observers;

use App\Models\Employee;
use Carbon\Carbon;

class EmployeeObserver
{
    /**
     * Handle the Employee "saving" event.
     */
    public function saving(Employee $employee): void
    {
        $today = Carbon::today();
        $startDate = $employee->contract_start_date ? Carbon::parse($employee->contract_start_date) : null;
        $endDate = $employee->contract_end_date ? Carbon::parse($employee->contract_end_date) : null;

        // If no contract dates are set, set as inactive
        if (!$startDate || !$endDate) {
            $employee->employee_status = 'inactive';
            return;
        }

        // Check if contract period is valid and today is within the contract period
        if ($startDate->lte($endDate) && $today->gte($startDate) && $today->lte($endDate)) {
            $employee->employee_status = 'active';
        } else {
            $employee->employee_status = 'inactive';
        }
    }

    /**
     * Handle the Employee "retrieved" event.
     */
    public function retrieved(Employee $employee): void
    {
        $this->updateStatusIfNeeded($employee);
    }

    /**
     * Handle the Employee "created" event.
     */
    public function created(Employee $employee): void
    {
        // Already handled by saving event
    }

    /**
     * Handle the Employee "updated" event.
     */
    public function updated(Employee $employee): void
    {
        // Already handled by saving event
    }

    /**
     * Update status if it doesn't match current date
     */
    private function updateStatusIfNeeded(Employee $employee): void
    {
        $today = Carbon::today();
        $startDate = $employee->contract_start_date ? Carbon::parse($employee->contract_start_date) : null;
        $endDate = $employee->contract_end_date ? Carbon::parse($employee->contract_end_date) : null;

        if (!$startDate || !$endDate) {
            if ($employee->employee_status !== 'inactive') {
                $employee->employee_status = 'inactive';
                $employee->saveQuietly();
            }
            return;
        }

        $shouldBeActive = $startDate->lte($endDate) && $today->gte($startDate) && $today->lte($endDate);
        
        if ($shouldBeActive && $employee->employee_status !== 'active') {
            $employee->employee_status = 'active';
            $employee->saveQuietly();
        } elseif (!$shouldBeActive && $employee->employee_status !== 'inactive') {
            $employee->employee_status = 'inactive';
            $employee->saveQuietly();
        }
    }
}