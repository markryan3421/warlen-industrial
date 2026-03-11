<?php

namespace App\Services;

use App\Events\PayrollEvent;
use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayrollProcessingService
{
    /**
     * Process payroll for a given period based on attendance data
     */
   public function processPayrollForPeriod(PayrollPeriod $payrollPeriod): void
    {
        try {
            DB::beginTransaction();

            // Get all attendance period stats for this payroll period
            $attendanceStats = AttendancePeriodStat::where('period_start', $payrollPeriod->start_date)
                ->where('period_end', $payrollPeriod->end_date)
                ->get();

            if ($attendanceStats->isEmpty()) {
                Log::warning("No attendance data found for payroll period: {$payrollPeriod->id}");
                $payrollPeriod->update(['payroll_per_status' => 'completed']);
                
                // Dispatch event even if no data (still completed)
                broadcast(new PayrollEvent($payrollPeriod, "Payroll period {$payrollPeriod->period_name} completed with no attendance data"));
                
                DB::commit();
                return;
            }

            // Delete any existing payroll records for this period (to avoid duplicates)
            $payrollPeriod->payrolls()->delete();

            $processedCount = 0;
            $skippedCount = 0;

            // Process each employee's attendance stats
            foreach ($attendanceStats as $stats) {
                $result = $this->createPayrollForEmployee($payrollPeriod, $stats);
                if ($result) {
                    $processedCount++;
                } else {
                    $skippedCount++;
                }
            }

            // Update payroll period status
            if ($processedCount > 0) {
                $payrollPeriod->update(['payroll_per_status' => 'completed']);
                Log::info("Payroll processed for period: {$payrollPeriod->id}. Processed: {$processedCount}, Skipped: {$skippedCount}");
                
                // DISPATCH EVENT HERE - Payroll period completed successfully
                broadcast(new PayrollEvent($payrollPeriod, "Payroll period {$payrollPeriod->period_name} completed successfully"));
                
            } else {
                Log::warning("No employees were processed for period: {$payrollPeriod->id}. All {$skippedCount} were skipped.");
                $payrollPeriod->update(['payroll_per_status' => 'pending']);
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Payroll processing failed for period {$payrollPeriod->id}: " . $e->getMessage());
            $payrollPeriod->update(['payroll_per_status' => 'failed']);
            
            // You could also dispatch a failure event if needed
            // event(new PayrollEvent($payrollPeriod, "Payroll period {$payrollPeriod->period_name} failed: " . $e->getMessage()));
            
            throw $e;
        }
    }

    /**
     * Create payroll for a single employee based on their attendance stats
     */
    protected function createPayrollForEmployee(PayrollPeriod $payrollPeriod, AttendancePeriodStat $stats): bool
    {
        // Get all employees with their positions loaded
        static $employees = null;
        static $employeeMap = [];
        
        if ($employees === null) {
            // Eager load the position relationship
            $employees = Employee::with(['user', 'position'])->get();
            
            // Create a more flexible mapping
            foreach ($employees as $emp) {
                // Store by emp_code
                $empCode = (string)$emp->emp_code;
                $employeeMap[$empCode] = $emp;
                
                // Also store by employee_number if available
                if (!empty($emp->employee_number)) {
                    $empNumber = (string)$emp->employee_number;
                    $employeeMap[$empNumber] = $emp;
                }
                
                // Store by the last 3-4 digits (in case attendance uses partial codes)
                if (strlen($empCode) >= 3) {
                    $last3 = substr($empCode, -3);
                    $last4 = substr($empCode, -4);
                    $employeeMap[$last3] = $emp;
                    $employeeMap[$last4] = $emp;
                }
                
                // Store by employee name parts if available
                if ($emp->user && !empty($emp->user->name)) {
                    $nameParts = explode(' ', $emp->user->name);
                    foreach ($nameParts as $part) {
                        if (strlen($part) > 2) {
                            $employeeMap[strtolower($part)] = $emp;
                        }
                    }
                }
            }
            
            Log::info("Loaded " . count($employees) . " employees with flexible mapping");
        }

        // Clean the identifier
        $identifier = trim((string)$stats->employee_id);
        $originalIdentifier = $identifier;
        
        // Try multiple strategies to find the employee
        $employee = null;
        
        // Strategy 1: Direct match
        if (isset($employeeMap[$identifier])) {
            $employee = $employeeMap[$identifier];
            Log::info("Found employee by direct match: {$identifier}");
        }
        // Strategy 2: Try as integer (remove leading zeros)
        elseif (is_numeric($identifier)) {
            $asInt = (int)$identifier;
            $asIntStr = (string)$asInt;
            if (isset($employeeMap[$asIntStr])) {
                $employee = $employeeMap[$asIntStr];
                Log::info("Found employee by integer conversion: {$asIntStr}");
            }
        }
        // Strategy 3: Try to find by partial match in employee codes
        else {
            foreach ($employeeMap as $code => $emp) {
                // Check if identifier contains the code or vice versa
                if (strpos((string)$code, $identifier) !== false || strpos($identifier, (string)$code) !== false) {
                    $employee = $emp;
                    Log::info("Found employee by partial match: {$code} matches identifier {$identifier}");
                    break;
                }
            }
        }

        if (!$employee) {
            // Last resort: try to find by name from the stats
            if (!empty($stats->employee_name)) {
                $nameIdentifier = strtolower(trim($stats->employee_name));
                foreach ($employeeMap as $code => $emp) {
                    if ($emp->user && !empty($emp->user->name) && strpos(strtolower($emp->user->name), $nameIdentifier) !== false) {
                        $employee = $emp;
                        Log::info("Found employee by name match: {$emp->user->name} matches {$stats->employee_name}");
                        break;
                    }
                }
            }
        }

        if (!$employee) {
            Log::warning("Could not find employee for identifier: '{$originalIdentifier}' (name: " . ($stats->employee_name ?? 'N/A') . ")");
            return false;
        }

        Log::info("Processing payroll for employee: {$employee->emp_code} (ID: {$employee->id}, Name: " . ($employee->user->name ?? 'N/A') . ", Status: {$employee->employee_status})");

        // Check if employee has a position with salary
        if (!$employee->position) {
            Log::warning("Employee {$employee->emp_code} has no position assigned. Skipping payroll.");
            return false;
        }

        if (!$employee->position->basic_salary || $employee->position->basic_salary <= 0) {
            Log::warning("Employee {$employee->emp_code} position '{$employee->position->pos_name}' has no valid salary. Skipping payroll.");
            return false;
        }

        // Calculate base pay using position salary based on employee status
        $basePay = $this->calculateBasePay($stats, $employee);
        
        // Get attendance values with defaults
        $overtimePay = $stats->overtime_pay ?? 0;
        $subsidyPay = $stats->subsidy_pay ?? 0;
        
        // Calculate late deduction based on employee status
        $lateMinutes = $stats->late_minutes ?? 0;
        $lateDeduction = $this->calculateLateDeduction($lateMinutes, $employee);
        
        $aflDeduction = $stats->afl_deduction ?? 0;
        $cutPayment = $stats->cut_payment ?? 0;
        
        // Calculate gross and net pay
        $grossPay = $basePay + $overtimePay + $subsidyPay;
        $totalDeductions = $lateDeduction + $aflDeduction + $cutPayment;
        $netPay = $grossPay - $totalDeductions;

        // Create payroll record
        $payroll = Payroll::create([
            'payroll_period_id' => $payrollPeriod->id,
            'employee_id' => $employee->id,
            'gross_pay' => $grossPay,
            'total_deduction' => $totalDeductions,
            'net_pay' => $netPay,
        ]);

        // Create payroll items
        $this->createPayrollItems($payroll, $stats, $basePay, $overtimePay, $subsidyPay, 
                                 $lateDeduction, $aflDeduction, $cutPayment, $employee, $lateMinutes);
        
        return true;
    }

    /**
     * Calculate base pay based on attendance using position salary and employee status
     */
    protected function calculateBasePay(AttendancePeriodStat $stats, Employee $employee): float
    {
        // Get daily rate from employee's position
        $dailyRate = (float)$employee->position->basic_salary;
        
        if ($dailyRate <= 0) {
            Log::warning("Invalid daily rate for employee: {$employee->emp_code}, Position: {$employee->position->pos_name}");
            return 0;
        }

        // Get attended days from stats
        $attendedDays = isset($stats->attended_days) ? (float)$stats->attended_days : 0;
        
        // Calculate base pay (daily rate × attended days)
        $basePay = round($dailyRate * $attendedDays, 2);
        
        // Get expected working days based on employee status
        $expectedDays = $this->getExpectedWorkingDays($employee, $stats);
        
        Log::info("Base pay calculation for {$employee->emp_code}: Status={$employee->employee_status}, Daily Rate={$dailyRate}, Attended Days={$attendedDays}, Expected Days={$expectedDays}, Base Pay={$basePay}");
        
        return $basePay;
    }

    /**
     * Get expected working days based on employee status
     */
    protected function getExpectedWorkingDays(Employee $employee, AttendancePeriodStat $stats): int
    {
        // You can calculate this based on the period length
        // For now, return appropriate values based on status
        switch ($employee->employee_status) {
            case 'weekender':
                return 6; // Weekenders work 6 days
            case 'semi-monthly':
                return 12; // Semi-monthly employees work 12 days per half month
            case 'monthly':
                return 24; // Monthly employees work 24 days per month
            default:
                return 22; // Default fallback
        }
    }

    /**
     * Calculate late deduction based on employee status
     * 1 peso per minute late
     */
    protected function calculateLateDeduction(int $lateMinutes, Employee $employee): float
    {
        if ($lateMinutes <= 0) {
            return 0;
        }
        
        // Simple calculation: 1 peso per minute late
        $deduction = (float)$lateMinutes;
        
        Log::info("Late deduction for {$employee->emp_code}: {$lateMinutes} minutes late = {$deduction} pesos deduction");
        
        return $deduction;
    }

    /**
     * Calculate hourly rate from daily rate
     */
    protected function calculateHourlyRate(Employee $employee): float
    {
        $dailyRate = (float)$employee->position->basic_salary;
        // Assuming 8 hours per day
        return round($dailyRate / 8, 2);
    }

    /**
     * Calculate daily rate (already stored in position->basic_salary)
     */
    protected function getDailyRate(Employee $employee): float
    {
        return (float)$employee->position->basic_salary;
    }

    /**
     * Create detailed payroll items breakdown
     */
    protected function createPayrollItems(
        Payroll $payroll, 
        AttendancePeriodStat $stats,
        float $basePay,
        float $overtimePay,
        float $subsidyPay,
        float $lateDeduction,
        float $aflDeduction,
        float $cutPayment,
        Employee $employee,
        int $lateMinutes = 0
    ): void {
        // Earnings items with descriptions
        $earnings = [
            ['code' => 'BASE', 'type' => 'earning', 'amount' => $basePay, 
             'description' => "Basic Pay - {$stats->attended_days} days @ ₱" . number_format($employee->position->basic_salary, 2) . "/day"],
            ['code' => 'OVERTIME', 'type' => 'earning', 'amount' => $overtimePay, 
             'description' => 'Overtime Pay'],
            ['code' => 'SUBSIDY', 'type' => 'earning', 'amount' => $subsidyPay, 
             'description' => 'Subsidy'],
        ];

        foreach ($earnings as $earning) {
            if ($earning['amount'] > 0) {
                PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'code' => $earning['code'],
                    'type' => $earning['type'],
                    'amount' => $earning['amount'],
                    'description' => $earning['description'] ?? null,
                ]);
            }
        }

        // Deduction items with descriptions
        $deductions = [
            ['code' => 'LATE', 'type' => 'deduction', 'amount' => $lateDeduction, 
             'description' => "Late Deduction - {$lateMinutes} minutes @ ₱1.00/minute"],
            ['code' => 'AFL', 'type' => 'deduction', 'amount' => $aflDeduction, 
             'description' => 'AFL Deduction'],
            ['code' => 'CUT', 'type' => 'deduction', 'amount' => $cutPayment, 
             'description' => 'Cut Payment'],
        ];

        foreach ($deductions as $deduction) {
            if ($deduction['amount'] > 0) {
                PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'code' => $deduction['code'],
                    'type' => $deduction['type'],
                    'amount' => $deduction['amount'],
                ]);
            }
        }

        // Add summary info to log
        Log::info("Payroll items created for employee {$employee->emp_code} with status {$employee->employee_status}, " .
                 "position {$employee->position->pos_name} (Daily Rate: ₱{$employee->position->basic_salary})");
    }
}