<?php

namespace App\Services;

use App\Models\Incentive;
use Illuminate\Support\Facades\Log;

class IncentiveService
{
    /**
     * Get incentives for an employee in a specific payroll period
     */
    public function getEmployeeIncentives(int $payrollPeriodId, int $employeeId): array
    {
        $incentives = [];
        
        try {
            // Get all incentives for this payroll period that are assigned to the employee
            $incentiveRecords = Incentive::where('payroll_period_id', $payrollPeriodId)
                ->whereHas('employees', function($query) use ($employeeId) {
                    $query->where('employee_id', $employeeId);
                })
                ->get();
            
            foreach ($incentiveRecords as $incentive) {
                $incentives[] = [
                    'id' => $incentive->id,
                    'name' => $incentive->incentive_name,
                    'amount' => (float) $incentive->incentive_amount,
                ];
                
                Log::info("Found incentive for employee {$employeeId}: {$incentive->incentive_name} - ₱{$incentive->incentive_amount}");
            }
            
        } catch (\Exception $e) {
            Log::error("Error fetching incentives for employee {$employeeId}: " . $e->getMessage());
        }
        
        return $incentives;
    }
    
    /**
     * Calculate total incentives amount for an employee
     */
    public function calculateTotalIncentives(array $incentives): float
    {
        return array_sum(array_column($incentives, 'amount'));
    }
}