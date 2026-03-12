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
        
        // Calculate overtime pay (25% additional rate) - handles decimal values correctly
        $overtimePay = $this->calculateOvertimePay($stats, $employee);
        
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
        
        // Get overtime days (as decimal, e.g., 0.02 = 2% of a day)
        $overtimeDecimal = isset($stats->overtime_work_day) ? (float)$stats->overtime_work_day : 0;
        
        // Regular days are the attended days minus the overtime decimal portion
        // If overtime is 0.02, that means 2% of a day was overtime, so regular days = attended days - 0.02
        $regularDays = max(0, $attendedDays - $overtimeDecimal);
        
        // Calculate base pay (daily rate × regular attended days)
        $basePay = round($dailyRate * $regularDays, 2);
        
        Log::info("Base pay calculation for {$employee->emp_code}: Status={$employee->employee_status}, " .
                 "Daily Rate={$dailyRate}, Total Attended Days={$attendedDays}, " .
                 "Overtime Decimal={$overtimeDecimal}, Regular Days={$regularDays}, Base Pay={$basePay}");
        
        return $basePay;
    }

    /**
     * Calculate overtime pay with 25% additional rate
     * Handles decimal values (e.g., 0.02 = 2% of a day) and multiplies by 1.25
     */
    protected function calculateOvertimePay(AttendancePeriodStat $stats, Employee $employee): float
    {
        // Get overtime as decimal (e.g., 0.02, 0.03 from your database)
        $overtimeDecimal = isset($stats->overtime_work_day) ? (float)$stats->overtime_work_day : 0;
        
        // if ($overtimeDecimal <= 0) {
        //     return 0;
        // }

        // Get daily rate from employee's position
        $dailyRate = (float)$employee->position->basic_salary;
        
        // if ($dailyRate <= 0) {
        //     Log::warning("Invalid daily rate for overtime calculation: {$employee->emp_code}");
        //     return 0;
        // }

        // Calculate overtime pay:
        // 1. Convert decimal to actual day portion (0.02 = 2% of a day)
        // 2. Multiply by daily rate to get base overtime pay
        // 3. Multiply by 1.25 for the 25% additional rate
        $overtimePay = round($dailyRate * $overtimeDecimal * 1.25, 2);
        
        // For display purposes, calculate the percentage
        $overtimePercentage = $overtimeDecimal * 100;
        
        Log::info("Overtime pay calculation for {$employee->emp_code}: " .
                 "Daily Rate={$dailyRate}, Overtime Decimal={$overtimeDecimal} ({$overtimePercentage}% of a day), " .
                 "Overtime Pay (with 25% additional)={$overtimePay}");
        return $overtimePay;
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
        $overtimeDecimal = isset($stats->overtime_work_day) ? (float)$stats->overtime_work_day : 0;
        $attendedDays = isset($stats->attended_days) ? (float)$stats->attended_days : 0;
        $regularDays = max(0, $attendedDays - $overtimeDecimal);
        
        // Calculate overtime percentage for display
        $overtimePercentage = $overtimeDecimal * 100;
        
        // Calculate overtime rate with 25% additional
        $overtimeRate = $employee->position->basic_salary * 1.25;
        
        // Earnings items with descriptions
        $earnings = [
            ['code' => 'BASE', 'type' => 'earning', 'amount' => $basePay, 
             'description' => "Basic Pay - " . number_format($regularDays, 3) . " days @ ₱" . number_format($employee->position->basic_salary, 2) . "/day"],
            ['code' => 'OVERTIME', 'type' => 'earning', 'amount' => $overtimePay, 
             'description' => "Overtime Pay - " . number_format($overtimeDecimal, 3) . " days ({$overtimePercentage}% of a day) @ ₱" . number_format($overtimeRate, 2) . "/day (includes 25% additional)"],
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
                    'description' => $deduction['description'] ?? null,
                ]);
            }
        }

        // Add summary info to log
        Log::info("Payroll items created for employee {$employee->emp_code} with status {$employee->employee_status}, " .
                 "position {$employee->position->pos_name} (Daily Rate: ₱{$employee->position->basic_salary})");
    }
}