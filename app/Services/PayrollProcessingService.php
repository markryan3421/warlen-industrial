<?php

namespace App\Services;

use App\Models\PayrollPeriod;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\AttendancePeriodStat;
use App\Models\Employee;
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
                // Still update status to completed with no data
                $payrollPeriod->update(['payroll_per_status' => 'completed']);
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

            // Update payroll period status - use only allowed status values
            if ($processedCount > 0) {
                $payrollPeriod->update(['payroll_per_status' => 'completed']);
                Log::info("Payroll processed for period: {$payrollPeriod->id}. Processed: {$processedCount}, Skipped: {$skippedCount}");
            } else {
                Log::warning("No employees were processed for period: {$payrollPeriod->id}. All {$skippedCount} were skipped.");
                // Use a valid status from your database constraint
                $payrollPeriod->update(['payroll_per_status' => 'pending']);
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Payroll processing failed for period {$payrollPeriod->id}: " . $e->getMessage());
            // Use a valid status
            $payrollPeriod->update(['payroll_per_status' => 'failed']);
            throw $e;
        }
    }

    /**
     * Create payroll for a single employee based on their attendance stats
     */
    protected function createPayrollForEmployee(PayrollPeriod $payrollPeriod, AttendancePeriodStat $stats): bool
    {
        // Get all employees
        static $employees = null;
        static $employeeMap = [];
        
        if ($employees === null) {
            $employees = Employee::with('user')->get();
            
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

        Log::info("Processing payroll for employee: {$employee->emp_code} (ID: {$employee->id}, Name: " . ($employee->user->name ?? 'N/A') . ")");

        // Calculate base pay
        $basePay = $this->calculateBasePay($stats, $employee);
        $overtimePay = $stats->overtime_pay ?? 0;
        $subsidyPay = $stats->subsidy_pay ?? 0;
        
        $grossPay = $basePay + $overtimePay + $subsidyPay;

        // Calculate total deductions
        $lateDeduction = $stats->late_leave_deduction ?? 0;
        $aflDeduction = $stats->afl_deduction ?? 0;
        $cutPayment = $stats->cut_payment ?? 0;
        
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
                                 $lateDeduction, $aflDeduction, $cutPayment);
        
        return true;
    }

    /**
     * Calculate base pay based on attendance
     */
    protected function calculateBasePay(AttendancePeriodStat $stats, Employee $employee): float
    {
        // Get employee's salary from user relationship
        if ($employee->user && isset($employee->user->salary) && $employee->user->salary > 0) {
            $monthlySalary = (float)$employee->user->salary;
        } else {
            Log::warning("No salary found for employee: {$employee->emp_code}");
            return 0;
        }

        // Calculate daily rate (adjust working days per month as needed)
        $dailyRate = $monthlySalary / 26;
        $attendedDays = isset($stats->attended_days) ? (float)$stats->attended_days : 0;
        
        return round($dailyRate * $attendedDays, 2);
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
        float $cutPayment
    ): void {
        // Earnings items
        $earnings = [
            ['code' => 'BASE', 'type' => 'earning', 'amount' => $basePay],
            ['code' => 'OVERTIME', 'type' => 'earning', 'amount' => $overtimePay],
            ['code' => 'SUBSIDY', 'type' => 'earning', 'amount' => $subsidyPay],
        ];

        foreach ($earnings as $earning) {
            if ($earning['amount'] > 0) {
                PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'code' => $earning['code'],
                    'type' => $earning['type'],
                    'amount' => $earning['amount'],
                ]);
            }
        }

        // Deduction items
        $deductions = [
            ['code' => 'LATE', 'type' => 'deduction', 'amount' => $lateDeduction],
            ['code' => 'AFL', 'type' => 'deduction', 'amount' => $aflDeduction],
            ['code' => 'CUT', 'type' => 'deduction', 'amount' => $cutPayment],
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
    }
}