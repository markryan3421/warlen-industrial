<?php

namespace App\Services;

use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class PayrollItemService
{
    /**
     * Create detailed payroll items breakdown
     */
    public function createPayrollItems(
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
        array $contributions = [],
        array $incentives = [],
        array $deductions = [] // Add this parameter
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
        $holidayDecimal = $this->getHolidayDecimal($stats);
        $holidayPercentage = $holidayDecimal * 100;

        // Create earnings items
        $this->createEarningItems(
            $payroll,
            $employee,
            $basePay,
            $overtimePay,
            $holidayOvertimePay,
            $subsidyPay,
            $regularDays,
            $overtimeDecimal,
            $overtimePercentage,
            $overtimeRate,
            $holidayDecimal,
            $holidayPercentage,
            $holidayOvertimeRate,
            $incentives
        );

        // Create deduction items
        $this->createDeductionItems(
            $payroll,
            $lateDeduction,
            $aflDeduction,
            $cutPayment,
            $lateMinutes,
            $contributions,
            $deductions // Pass deductions here
        );

        // Log summary
        $this->logSummary($employee, $incentives, $deductions, $contributions);
    }

    /**
     * Get holiday decimal from stats
     */
    private function getHolidayDecimal(AttendancePeriodStat $stats): float
    {
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
        return $holidayDecimal;
    }

    /**
     * Create earning items
     */
    private function createEarningItems(
        Payroll $payroll,
        Employee $employee,
        float $basePay,
        float $overtimePay,
        float $holidayOvertimePay,
        float $subsidyPay,
        float $regularDays,
        float $overtimeDecimal,
        float $overtimePercentage,
        float $overtimeRate,
        float $holidayDecimal,
        float $holidayPercentage,
        float $holidayOvertimeRate,
        array $incentives
    ): void {
        $earnings = [
            [
                'code' => 'Basic Pay',
                'type' => 'earning',
                'amount' => $basePay,
                'description' => "Basic Pay - " . number_format($regularDays, 3) . " days @ ₱" . number_format($employee->position->basic_salary, 2) . "/day"
            ],
            [
                'code' => 'Overtime Pay',
                'type' => 'earning',
                'amount' => $overtimePay,
                'description' => "Overtime Pay - " . number_format($overtimeDecimal, 3) . " days ({$overtimePercentage}% of a day) @ ₱" . number_format($overtimeRate, 2) . "/day (includes 25% additional)"
            ],
            [
                'code' => 'Holiday Overtime Pay',
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

        // Add incentives to earnings
        foreach ($incentives as $incentive) {
            $earnings[] = [
                'code' => 'INCENTIVE - ' . $incentive['name'],
                'type' => 'earning',
                'amount' => $incentive['amount'],
                'description' => $incentive['name'] . ' - Incentive'
            ];
        }

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
    }

    /**
     * Create deduction items
     */
    private function createDeductionItems(
        Payroll $payroll,
        float $lateDeduction,
        float $aflDeduction,
        float $cutPayment,
        int $lateMinutes,
        array $contributions,
        array $deductions = [] // Add this parameter
    ): void {
        $deductionItems = [
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

        // Add custom deductions from the Deduction model
        foreach ($deductions as $deduction) {
            $deductionItems[] = [
                'code' => 'DEDUCTION - ' . $deduction['name'],
                'type' => 'deduction',
                'amount' => $deduction['amount'],
                'description' => $deduction['name'] . ' - Deduction'
            ];
            
            Log::info("Adding custom deduction: {$deduction['name']} - ₱{$deduction['amount']}");
        }

        // Add government contributions to deductions if they have values
        if (!empty($contributions)) {
            if ($contributions['sss']['employee'] > 0) {
                $deductionItems[] = [
                    'code' => 'SSS',
                    'type' => 'deduction',
                    'amount' => $contributions['sss']['employee'],
                    'description' => 'SSS Contribution (Employee Share) - ' .
                        number_format(($contributions['sss']['employee'] / ($payroll->gross_pay ?? 1) * 100), 2) . '% of gross pay'
                ];
            }

            if ($contributions['pagibig']['employee'] > 0) {
                $deductionItems[] = [
                    'code' => 'PAGIBIG',
                    'type' => 'deduction',
                    'amount' => $contributions['pagibig']['employee'],
                    'description' => 'Pag-IBIG Contribution (Employee Share)'
                ];
            }

            if ($contributions['philhealth']['employee'] > 0) {
                $deductionItems[] = [
                    'code' => 'PHILHEALTH',
                    'type' => 'deduction',
                    'amount' => $contributions['philhealth']['employee'],
                    'description' => 'PhilHealth Contribution (Employee Share) - ' .
                        number_format(($contributions['philhealth']['employee'] / ($payroll->gross_pay ?? 1) * 100), 2) . '% of gross pay'
                ];
            }
        }

        foreach ($deductionItems as $deductionItem) {
            if ($deductionItem['amount'] > 0) {
                PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'code' => $deductionItem['code'],
                    'type' => $deductionItem['type'],
                    'amount' => $deductionItem['amount'],
                    'description' => $deductionItem['description'] ?? null,
                ]);
            }
        }
    }

    /**
     * Log summary information
     */
    private function logSummary(Employee $employee, array $incentives, array $deductions, array $contributions): void
    {
        Log::info("Payroll items created for employee {$employee->emp_code} with status {$employee->employee_status}, " .
            "position {$employee->position->pos_name} (Daily Rate: ₱{$employee->position->basic_salary})");

        // Log incentive totals
        if (!empty($incentives)) {
            $totalIncentives = array_sum(array_column($incentives, 'amount'));
            Log::info("Incentives for {$employee->emp_code}: Total ₱{$totalIncentives}");
        }
        
        // Log custom deduction totals
        if (!empty($deductions)) {
            $totalDeductions = array_sum(array_column($deductions, 'amount'));
            Log::info("Custom deductions for {$employee->emp_code}: Total ₱{$totalDeductions}");
            foreach ($deductions as $deduction) {
                Log::info("  - {$deduction['name']}: ₱{$deduction['amount']}");
            }
        }

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