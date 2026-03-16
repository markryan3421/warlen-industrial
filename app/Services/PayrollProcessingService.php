<?php

namespace App\Services;

use App\Events\PayrollEvent;
use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use App\Models\ContributionVersion;
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
            $employees = Employee::with(['user', 'position'])->where('employee_status', 'active')->get();

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

        // Calculate holiday overtime pay (30% additional rate)
        $holidayOvertimePay = $this->calculateHolidayOvertimePay($stats, $employee);

        $subsidyPay = $stats->subsidy_pay ?? 0;

        // Calculate late deduction based on employee status
        $lateMinutes = $stats->late_minutes ?? 0;
        $lateDeduction = $this->calculateLateDeduction($lateMinutes, $employee);

        $aflDeduction = $stats->afl_deduction ?? 0;
        $cutPayment = $stats->cut_payment ?? 0;

        // Calculate gross and net pay (include holiday overtime)
        $grossPay = $basePay + $overtimePay + $holidayOvertimePay + $subsidyPay;
        
        // Calculate government contributions based on gross pay
        $contributions = $this->calculateGovernmentContributions($grossPay, $payrollPeriod);
        
        $totalDeductions = $lateDeduction + $aflDeduction + $cutPayment + 
                          $contributions['sss']['employee'] + 
                          $contributions['pagibig']['employee'] + 
                          $contributions['philhealth']['employee'];
        
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
        $this->createPayrollItems(
            $payroll,
            $stats,
            $basePay,
            $overtimePay,
            $holidayOvertimePay,
            $subsidyPay,
            $lateDeduction,
            $aflDeduction,
            $cutPayment,
            $employee,
            $lateMinutes,
            $contributions // Pass contributions to payroll items
        );

        return true;
    }

    /**
 * Calculate government contributions (SSS, Pag-IBIG, PhilHealth) based on salary range
 */
protected function calculateGovernmentContributions(float $grossPay, PayrollPeriod $payrollPeriod): array
{
    // Initialize contributions array
    $contributions = [
        'sss' => ['employee' => 0, 'employer' => 0],
        'pagibig' => ['employee' => 0, 'employer' => 0],
        'philhealth' => ['employee' => 0, 'employer' => 0],
    ];

    try {
        // Get the latest contribution versions (without date filtering)
        $sssVersion = ContributionVersion::where('type', 'sss')
            // ->latest('effective_from')
            ->first();

        $pagibigVersion = ContributionVersion::where('type', 'pagibig')
            // ->latest('effective_from')
            ->first();

        $philhealthVersion = ContributionVersion::where('type', 'philhealth')
            // ->latest('effective_from')
            ->first();

        // Calculate SSS (percentage based)
        if ($sssVersion) {
            $sssBracket = $sssVersion->contributionBrackets()
                ->where('salary_from', '<=', $grossPay)
                ->where('salary_to', '>=', $grossPay)
                ->first();
            
            if ($sssBracket) {
                // Convert percentage to actual amount
                $employeePercentage = (float) $sssBracket->employee_share;
                $employerPercentage = (float) $sssBracket->employer_share;
                
                $contributions['sss'] = [
                    'employee' => round($grossPay * ($employeePercentage / 100), 2),
                    'employer' => round($grossPay * ($employerPercentage / 100), 2),
                ];
            } else {
                // If salary is outside all brackets, use the nearest bracket
                $nearestBracket = $this->findNearestBracket($sssVersion, $grossPay);
                if ($nearestBracket) {
                    $employeePercentage = (float) $nearestBracket->employee_share;
                    $employerPercentage = (float) $nearestBracket->employer_share;
                    
                    $contributions['sss'] = [
                        'employee' => round($grossPay * ($employeePercentage / 100), 2),
                        'employer' => round($grossPay * ($employerPercentage / 100), 2),
                    ];
                }
            }
            
            Log::info("SSS Calculation:", [
                'gross_pay' => $grossPay,
                'employee_percentage' => $employeePercentage ?? 0,
                'employee_amount' => $contributions['sss']['employee'],
                'employer_amount' => $contributions['sss']['employer']
            ]);
        }

        // Calculate Pag-IBIG (percentage based - same as SSS and PhilHealth)
        if ($pagibigVersion) {
            $pagibigBracket = $pagibigVersion->contributionBrackets()
                ->where('salary_from', '<=', $grossPay)
                ->where('salary_to', '>=', $grossPay)
                ->first();
            
            if ($pagibigBracket) {
                // Convert percentage to actual amount
                $employeePercentage = (float) $pagibigBracket->employee_share;
                $employerPercentage = (float) $pagibigBracket->employer_share;
                
                $contributions['pagibig'] = [
                    'employee' => round($grossPay * ($employeePercentage / 100), 2),
                    'employer' => round($grossPay * ($employerPercentage / 100), 2),
                ];
            } else {
                // If salary is outside all brackets, use the nearest bracket
                $nearestBracket = $this->findNearestBracket($pagibigVersion, $grossPay);
                if ($nearestBracket) {
                    $employeePercentage = (float) $nearestBracket->employee_share;
                    $employerPercentage = (float) $nearestBracket->employer_share;
                    
                    $contributions['pagibig'] = [
                        'employee' => round($grossPay * ($employeePercentage / 100), 2),
                        'employer' => round($grossPay * ($employerPercentage / 100), 2),
                    ];
                }
            }
            
            Log::info("Pag-IBIG Calculation:", [
                'gross_pay' => $grossPay,
                'employee_percentage' => $employeePercentage ?? 0,
                'employee_amount' => $contributions['pagibig']['employee'],
                'employer_amount' => $contributions['pagibig']['employer']
            ]);
        }

        // Calculate PhilHealth (percentage based)
        if ($philhealthVersion) {
            $philhealthBracket = $philhealthVersion->contributionBrackets()
                ->where('salary_from', '<=', $grossPay)
                ->where('salary_to', '>=', $grossPay)
                ->first();
            
            if ($philhealthBracket) {
                // Convert percentage to actual amount
                $employeePercentage = (float) $philhealthBracket->employee_share;
                $employerPercentage = (float) $philhealthBracket->employer_share;
                
                $contributions['philhealth'] = [
                    'employee' => round($grossPay * ($employeePercentage / 100), 2),
                    'employer' => round($grossPay * ($employerPercentage / 100), 2),
                ];
            } else {
                // If salary is outside all brackets, use the nearest bracket
                $nearestBracket = $this->findNearestBracket($philhealthVersion, $grossPay);
                if ($nearestBracket) {
                    $employeePercentage = (float) $nearestBracket->employee_share;
                    $employerPercentage = (float) $nearestBracket->employer_share;
                    
                    $contributions['philhealth'] = [
                        'employee' => round($grossPay * ($employeePercentage / 100), 2),
                        'employer' => round($grossPay * ($employerPercentage / 100), 2),
                    ];
                }
            }
            
            Log::info("PhilHealth Calculation:", [
                'gross_pay' => $grossPay,
                'employee_percentage' => $employeePercentage ?? 0,
                'employee_amount' => $contributions['philhealth']['employee'],
                'employer_amount' => $contributions['philhealth']['employer']
            ]);
        }

    } catch (\Exception $e) {
        Log::error("Error calculating government contributions: " . $e->getMessage());
    }

    return $contributions;
}
    /**
     * Find the nearest contribution bracket for a given salary
     */
    protected function findNearestBracket($version, float $salary)
    {
        // Try to find the bracket with salary_to closest to the given salary
        $bracket = $version->contributionBrackets()
            ->orderByRaw('ABS(salary_to - ?)', [$salary])
            ->first();
        
        return $bracket;
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
     * Only calculates if overtime is 1 hour or more (converted to decimal days)
     */
    protected function calculateOvertimePay(AttendancePeriodStat $stats, Employee $employee): float
    {
        // Get overtime workday (in hours:minutes format)
        $overtimeWorkday = $stats->overtime_workday ?? '0:00';

        // Convert hours:minutes to decimal days (assuming 8-hour workday)
        // First, parse the time format
        $overtimeDecimal = 0;

        if (!empty($overtimeWorkday) && $overtimeWorkday != '0:00') {
            $parts = explode(':', $overtimeWorkday);
            $hours = (int)$parts[0];
            $minutes = isset($parts[1]) ? (int)$parts[1] : 0;

            // Convert to total hours with decimal
            $totalHours = $hours + ($minutes / 60);

            // ENFORCE 1-HOUR MINIMUM RULE
            // If less than 1 hour, return 0 (don't calculate)
            if ($totalHours < 1) {
                Log::info("Overtime below 1 hour threshold for {$employee->emp_code}: {$totalHours} hours - not calculating");
                return 0;
            }

            // Convert to decimal days (assuming 8-hour workday)
            // Example: 1 hour = 1/8 = 0.125 days
            $workingDayHours = 8;
            $overtimeDecimal = round($totalHours / $workingDayHours, 4);
        }

        // If overtime is 0 or less, return 0
        if ($overtimeDecimal <= 0) {
            return 0;
        }

        // Get daily rate from employee's position
        $dailyRate = (float)$employee->position->basic_salary;

        if ($dailyRate <= 0) {
            Log::warning("Invalid daily rate for overtime calculation: {$employee->emp_code}");
            return 0;
        }

        // Calculate overtime pay (25% additional):
        $overtimePay = round($dailyRate * $overtimeDecimal * 1.25, 2);

        // For display purposes, calculate the hours
        $totalHours = $overtimeDecimal * 8;

        Log::info("Overtime pay calculation for {$employee->emp_code}: " .
            "Raw Time={$overtimeWorkday}, Hours={$totalHours}hrs, " .
            "Decimal Days={$overtimeDecimal}, Daily Rate={$dailyRate}, " .
            "Overtime Pay (with 25% additional)={$overtimePay}");

        return $overtimePay;
    }

    /**
     * Calculate holiday overtime pay with 30% additional rate
     * Only calculates if holiday overtime is 1 hour or more (converted to decimal days)
     */
    protected function calculateHolidayOvertimePay(AttendancePeriodStat $stats, Employee $employee): float
    {
        // Get holiday overtime (in hours:minutes format)
        $holidayOvertime = $stats->overtime_holiday ?? '0:00';

        // Convert hours:minutes to decimal days (assuming 8-hour workday)
        // First, parse the time format
        $holidayDecimal = 0;

        if (!empty($holidayOvertime) && $holidayOvertime != '0:00') {
            $parts = explode(':', $holidayOvertime);
            $hours = (int)$parts[0];
            $minutes = isset($parts[1]) ? (int)$parts[1] : 0;

            // Convert to total hours with decimal
            $totalHours = $hours + ($minutes / 60);

            // ENFORCE 1-HOUR MINIMUM RULE
            // If less than 1 hour, return 0 (don't calculate)
            if ($totalHours < 1) {
                Log::info("Holiday overtime below 1 hour threshold for {$employee->emp_code}: {$totalHours} hours - not calculating");
                return 0;
            }

            // Convert to decimal days (assuming 8-hour workday)
            $workingDayHours = 8;
            $holidayDecimal = round($totalHours / $workingDayHours, 4);
        }

        // If holiday overtime is 0 or less, return 0
        if ($holidayDecimal <= 0) {
            return 0;
        }

        // Get daily rate from employee's position
        $dailyRate = (float)$employee->position->basic_salary;

        if ($dailyRate <= 0) {
            Log::warning("Invalid daily rate for holiday overtime calculation: {$employee->emp_code}");
            return 0;
        }

        // Calculate holiday overtime pay (30% additional):
        $holidayOvertimePay = round($dailyRate * $holidayDecimal * 1.30, 2);

        // For display purposes, calculate the hours
        $totalHours = $holidayDecimal * 8;

        Log::info("Holiday overtime pay calculation for {$employee->emp_code}: " .
            "Raw Time={$holidayOvertime}, Hours={$totalHours}hrs, " .
            "Decimal Days={$holidayDecimal}, Daily Rate={$dailyRate}, " .
            "Holiday Overtime Pay (with 30% additional)={$holidayOvertimePay}");

        return $holidayOvertimePay;
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
        float $holidayOvertimePay,
        float $subsidyPay,
        float $lateDeduction,
        float $aflDeduction,
        float $cutPayment,
        Employee $employee,
        int $lateMinutes = 0,
        array $contributions = [] // New parameter for contributions
    ): void {
        $overtimeDecimal = isset($stats->overtime_work_day) ? (float)$stats->overtime_work_day : 0;
        $attendedDays = isset($stats->attended_days) ? (float)$stats->attended_days : 0;
        $regularDays = max(0, $attendedDays - $overtimeDecimal);

        // Calculate overtime percentage for display
        $overtimePercentage = $overtimeDecimal * 100;

        // Calculate overtime rate with 25% additional
        $overtimeRate = $employee->position->basic_salary * 1.25;

        // Calculate holiday overtime rate with 30% additional
        $holidayOvertimeRate = $employee->position->basic_salary * 1.30;

        // Get holiday overtime decimal for display
        $holidayDecimal = 0;
        if (isset($stats->overtime_holiday) && $stats->overtime_holiday != '0:00') {
            $parts = explode(':', $stats->overtime_holiday);
            $hours = (int)$parts[0];
            $minutes = isset($parts[1]) ? (int)$parts[1] : 0;
            $totalHours = $hours + ($minutes / 60);
            if ($totalHours >= 1) {
                $holidayDecimal = round($totalHours / 8, 4);
            }
        }
        $holidayPercentage = $holidayDecimal * 100;

        // Earnings items with descriptions
        $earnings = [
            [
                'code' => 'BASE',
                'type' => 'earning',
                'amount' => $basePay,
                'description' => "Basic Pay - " . number_format($regularDays, 3) . " days @ ₱" . number_format($employee->position->basic_salary, 2) . "/day"
            ],
            [
                'code' => 'OVERTIME',
                'type' => 'earning',
                'amount' => $overtimePay,
                'description' => "Overtime Pay - " . number_format($overtimeDecimal, 3) . " days ({$overtimePercentage}% of a day) @ ₱" . number_format($overtimeRate, 2) . "/day (includes 25% additional)"
            ],
            [
                'code' => 'HOLIDAY OT',
                'type' => 'earning',
                'amount' => $holidayOvertimePay,
                'description' => "Holiday Overtime Pay - " . number_format($holidayDecimal, 3) . " days ({$holidayPercentage}% of a day) @ ₱" . number_format($holidayOvertimeRate, 2) . "/day (includes 30% additional)"
            ],
            [
                'code' => 'SUBSIDY',
                'type' => 'earning',
                'amount' => $subsidyPay,
                'description' => 'Subsidy'
            ],
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

        // Deduction items with descriptions (including government contributions)
        $deductions = [
            [
                'code' => 'LATE',
                'type' => 'deduction',
                'amount' => $lateDeduction,
                'description' => "Late Deduction - {$lateMinutes} minutes @ ₱1.00/minute"
            ],
            [
                'code' => 'AFL',
                'type' => 'deduction',
                'amount' => $aflDeduction,
                'description' => 'AFL Deduction'
            ],
            [
                'code' => 'CUT',
                'type' => 'deduction',
                'amount' => $cutPayment,
                'description' => 'Cut Payment'
            ],
        ];

        // Add government contributions to deductions if they have values
        if (!empty($contributions)) {
            if ($contributions['sss']['employee'] > 0) {
                $deductions[] = [
                    'code' => 'SSS',
                    'type' => 'deduction',
                    'amount' => $contributions['sss']['employee'],
                    'description' => 'SSS Contribution (Employee Share) - ' . 
                        number_format(($contributions['sss']['employee'] / ($grossPay ?? 1) * 100), 2) . '% of gross pay'
                ];
            }
            
            if ($contributions['pagibig']['employee'] > 0) {
                $deductions[] = [
                    'code' => 'PAGIBIG',
                    'type' => 'deduction',
                    'amount' => $contributions['pagibig']['employee'],
                    'description' => 'Pag-IBIG Contribution (Employee Share)'
                ];
            }
            
            if ($contributions['philhealth']['employee'] > 0) {
                $deductions[] = [
                    'code' => 'PHILHEALTH',
                    'type' => 'deduction',
                    'amount' => $contributions['philhealth']['employee'],
                    'description' => 'PhilHealth Contribution (Employee Share) - ' . 
                        number_format(($contributions['philhealth']['employee'] / ($grossPay ?? 1) * 100), 2) . '% of gross pay'
                ];
            }
        }

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
        
        // Log contribution totals
        if (!empty($contributions)) {
            Log::info("Government contributions for {$employee->emp_code}:", [
                'sss' => $contributions['sss']['employee'] ?? 0,
                'pagibig' => $contributions['pagibig']['employee'] ?? 0,
                'philhealth' => $contributions['philhealth']['employee'] ?? 0,
                'total_deductions' => ($contributions['sss']['employee'] ?? 0) + 
                                     ($contributions['pagibig']['employee'] ?? 0) + 
                                     ($contributions['philhealth']['employee'] ?? 0)
            ]);
        }
    }
}