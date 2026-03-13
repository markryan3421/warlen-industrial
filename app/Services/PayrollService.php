<?php

namespace App\Services;

use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Collection;

class PayrollService
{
    /**
     * Get payrolls with relationships
     */
    public function getPayroll(): Collection
    {
        return Payroll::query()
            ->with(['payrollPeriod', 'employee.user', 'employee.position', 'payrollItems'])
            ->latest()
            ->get();
    }

    /**
     * Calculate total overtime pay
     */
    public function calculateTotalOvertimePay(Collection $payrolls): float
    {
        $totalOvertimePay = 0;
        
        foreach ($payrolls as $payroll) {
            if ($payroll->payrollItems) {
                $overtimeItems = $payroll->payrollItems->filter(function ($item) {
                    return $item->type === 'earning' &&
                        (str_contains(strtoupper($item->code), 'HOLIDAY OT') ||
                            str_contains(strtoupper($item->code), 'OVERTIME'));
                });
                $totalOvertimePay += $overtimeItems->sum('amount');
            }
        }
        
        return $totalOvertimePay;
    }

    /**
     * Calculate total overtime hours
     */
    public function calculateTotalOvertimeHours(Collection $payrolls): int
    {
        $totalOvertimeHours = 0;
        
        foreach ($payrolls as $payroll) {
            if ($payroll->payrollItems) {
                $overtimeItems = $payroll->payrollItems->filter(function ($item) {
                    return $item->type === 'earning' &&
                        (str_contains(strtoupper($item->code), 'HOLIDAY OT') ||
                            str_contains(strtoupper($item->code), 'OVERTIME'));
                });
                $totalOvertimeHours += $overtimeItems->count() * 8;
            }
        }
        
        return $totalOvertimeHours;
    }

    /**
     * Get active employee count
     */
    public function getActiveEmployeeCount(): int
    {
        return Employee::query()
            ->where('employee_status', 'active')
            ->count();
    }

    /**
     * Calculate total deductions
     */
    public function calculateTotalDeductions(Collection $payrolls): float
    {
        return $payrolls->sum('total_deduction');
    }

    /**
     * Calculate total net pay
     */
    public function calculateTotalNetPay(Collection $payrolls): float
    {
        return $payrolls->sum('net_pay');
    }

    /**
     * Calculate total gross pay
     */
    public function calculateTotalGrossPay(Collection $payrolls): float
    {
        return $payrolls->sum('gross_pay');
    }
}