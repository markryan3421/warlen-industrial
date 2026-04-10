<?php

namespace App\Services;

use App\Models\AttendancePeriodStat;
use App\Models\Incentive;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\Log;

class IncentiveService
{
    /**
     * Get incentives for an employee in a specific payroll period
     * Calculates incentive amount based on attended days
     */
    public function getEmployeeIncentives(int $payrollPeriodId, int $employeeId, ?AttendancePeriodStat $attendanceStats = null): array
    {
        $incentives = [];
        
        try {
            // Get attendance stats if not provided
            if ($attendanceStats === null) {
                Log::info("Attendance stats not provided, fetching from database for employee {$employeeId}");
                $attendanceStats = $this->getAttendanceStats($payrollPeriodId, $employeeId);
            } else {
                Log::info("Attendance stats provided for employee {$employeeId}");
            }
            
            // If no attendance stats, return empty incentives
            if (!$attendanceStats) {
                Log::warning("No attendance stats found for employee {$employeeId} in period {$payrollPeriodId}");
                return [];
            }
            
            // Log attendance stats for debugging
            Log::info("Attendance stats for employee {$employeeId}:", [
                'attended_days' => $attendanceStats->attended_days,
                'scheduled_days' => $attendanceStats->scheduled_days,
                'absent_days' => $attendanceStats->absent_days,
                'period_start' => $attendanceStats->period_start,
                'period_end' => $attendanceStats->period_end,
            ]);
            
            // Get all incentives for this payroll period that are assigned to the employee
            $incentiveRecords = Incentive::where('payroll_period_id', $payrollPeriodId)
                ->whereHas('employees', function($query) use ($employeeId) {
                    $query->where('employee_id', $employeeId);
                })
                ->get();
            
            Log::info("Found " . $incentiveRecords->count() . " incentive records for employee {$employeeId}");
            
            foreach ($incentiveRecords as $incentive) {
                // Calculate based on attended days
                $attendedDays = (int) $attendanceStats->attended_days;
                $dailyIncentiveAmount = (float) $incentive->incentive_amount;
                $calculatedAmount = $dailyIncentiveAmount * $attendedDays;
                
                Log::info("Incentive calculation for {$employeeId}:", [
                    'incentive_name' => $incentive->incentive_name,
                    'daily_amount' => $dailyIncentiveAmount,
                    'attended_days' => $attendedDays,
                    'calculated_amount' => $calculatedAmount,
                    'formula' => "{$dailyIncentiveAmount} x {$attendedDays} = {$calculatedAmount}"
                ]);
                
                $incentives[] = [
                    'id' => $incentive->id,
                    'name' => $incentive->incentive_name,
                    'amount' => $calculatedAmount,
                    'attended_days' => $attendedDays,
                    'daily_rate' => $dailyIncentiveAmount,
                ];
            }
            
        } catch (\Exception $e) {
            Log::error("Error fetching incentives for employee {$employeeId}: " . $e->getMessage());
        }
        
        return $incentives;
    }
    
    /**
     * Get attendance statistics for employee in payroll period
     */
    protected function getAttendanceStats(int $payrollPeriodId, int $employeeId): ?AttendancePeriodStat
    {
        $payrollPeriod = PayrollPeriod::find($payrollPeriodId);
        
        if (!$payrollPeriod) {
            Log::error("Payroll period not found: {$payrollPeriodId}");
            return null;
        }
        
        Log::info("Looking for attendance stats:", [
            'employee_id' => $employeeId,
            'period_start' => $payrollPeriod->start_date,
            'period_end' => $payrollPeriod->end_date
        ]);
        
        $stats = AttendancePeriodStat::where('employee_id', $employeeId)
            ->where('period_start', $payrollPeriod->start_date)
            ->where('period_end', $payrollPeriod->end_date)
            ->first();
        
        if ($stats) {
            Log::info("Found attendance stats for employee {$employeeId}: attended_days = {$stats->attended_days}");
        } else {
            Log::warning("No attendance stats found for employee {$employeeId}");
        }
        
        return $stats;
    }
    
    /**
     * Calculate total incentives amount for an employee
     */
    public function calculateTotalIncentives(array $incentives): float
    {
        $total = array_sum(array_column($incentives, 'amount'));
        Log::info("Total incentives calculated: ₱{$total}", ['incentives' => $incentives]);
        return $total;
    }
}