<?php

namespace App\Services;

use App\Models\AttendancePeriodStat;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class PayrollCalculatorService
{
    /**
     * Calculate base pay based on attendance using position salary
     */
    public function calculateBasePay(AttendancePeriodStat $stats, Employee $employee): float
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
     * Only calculates if overtime is 1 hour or more
     * Returns 0 if position has fixed salary
     */
    public function calculateOvertimePay(AttendancePeriodStat $stats, Employee $employee): float
    {
        // Check if position has fixed salary
        if ($employee->position->is_salary_fixed) {
            Log::info("Skipping overtime pay for {$employee->emp_code} - Position has fixed salary");
            return 0;
        }

        // Get overtime workday (in hours:minutes format)
        $overtimeWorkday = $stats->overtime_workday ?? '0:00';

        // Convert hours:minutes to decimal days (assuming 8-hour workday)
        $overtimeDecimal = $this->convertTimeToDecimalDays($overtimeWorkday, $employee->emp_code, 'Overtime');

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
     * Only calculates if holiday overtime is 1 hour or more
     * Returns 0 if position has fixed salary
     */
    public function calculateHolidayOvertimePay(AttendancePeriodStat $stats, Employee $employee): float
    {
        // Check if position has fixed salary
        if ($employee->position->is_salary_fixed) {
            Log::info("Skipping holiday overtime pay for {$employee->emp_code} - Position has fixed salary");
            return 0;
        }

        // Get holiday overtime (in hours:minutes format)
        $holidayOvertime = $stats->overtime_holiday ?? '0:00';

        // Convert hours:minutes to decimal days (assuming 8-hour workday)
        $holidayDecimal = $this->convertTimeToDecimalDays($holidayOvertime, $employee->emp_code, 'Holiday Overtime');

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
     * Convert time string (HH:MM) to decimal days
     */
    private function convertTimeToDecimalDays(string $timeString, string $empCode, string $type): float
    {
        if (empty($timeString) || $timeString == '0:00') {
            return 0;
        }

        $parts = explode(':', $timeString);
        $hours = (int)$parts[0];
        $minutes = isset($parts[1]) ? (int)$parts[1] : 0;

        // Convert to total hours with decimal
        $totalHours = $hours + ($minutes / 60);

        // ENFORCE 1-HOUR MINIMUM RULE
        if ($totalHours < 1) {
            Log::info("{$type} below 1 hour threshold for {$empCode}: {$totalHours} hours - not calculating");
            return 0;
        }

        // Convert to decimal days (assuming 8-hour workday)
        $workingDayHours = 8;
        return round($totalHours / $workingDayHours, 4);
    }

    /**
     * Calculate late deduction (1 peso per minute late)
     */
    public function calculateLateDeduction(int $lateMinutes, Employee $employee): float
    {
        if ($lateMinutes <= 0) {
            return 0;
        }

        $deduction = (float)$lateMinutes;

        Log::info("Late deduction for {$employee->emp_code}: {$lateMinutes} minutes late = {$deduction} pesos deduction");

        return $deduction;
    }

    /**
     * Calculate hourly rate from daily rate
     */
    public function calculateHourlyRate(Employee $employee): float
    {
        $dailyRate = (float)$employee->position->basic_salary;
        // Assuming 8 hours per day
        return round($dailyRate / 8, 2);
    }

    /**
     * Get expected working days based on employee status
     */
    public function getExpectedWorkingDays(Employee $employee): int
    {
        switch ($employee->employee_status) {
            case 'weekender':
                return 6;
            case 'semi-monthly':
                return 12;
            case 'monthly':
                return 24;
            default:
                return 22;
        }
    }
}