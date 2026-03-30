<?php

namespace App\Services;

use App\Models\Deduction;
use Illuminate\Support\Facades\Log;

class DeductionService
{
    /**
     * Get deductions for an employee in a specific payroll period
     */
    public function getEmployeeDeductions(int $payrollPeriodId, int $employeeId): array
    {
        $deductions = [];
        
        try {
            // Get all deductions for this payroll period that are assigned to the employee
            $deductionRecords = Deduction::where('payroll_period_id', $payrollPeriodId)
                ->whereHas('employees', function($query) use ($employeeId) {
                    $query->where('employee_id', $employeeId);
                })
                ->get();
            
            foreach ($deductionRecords as $deduction) {
                $deductions[] = [
                    'id' => $deduction->id,
                    'name' => $deduction->deduction_name,
                    'amount' => (float) $deduction->deduction_amount,
                ];
                
                Log::info("Found deduction for employee {$employeeId}: {$deduction->deduction_name} - ₱{$deduction->deduction_amount}");
            }
            
        } catch (\Exception $e) {
            Log::error("Error fetching deductions for employee {$employeeId}: " . $e->getMessage());
        }
        
        return $deductions;
    }
    
    /**
     * Calculate total deductions amount for an employee
     */
    public function calculateTotalDeductions(array $deductions): float
    {
        return array_sum(array_column($deductions, 'amount'));
    }
}