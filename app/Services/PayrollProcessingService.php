<?php

namespace App\Services;

use App\Events\PayrollEvent;
use App\Models\AttendancePeriodStat;
use App\Models\Payroll;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayrollProcessingService
{
    protected $employeeLookupService;
    protected $contributionService;
    protected $incentiveService;
    protected $payrollCalculatorService;
    protected $payrollItemService;

    public function __construct()
    {
        $this->employeeLookupService = new EmployeeLookupService();
        $this->contributionService = new ContributionService();
        $this->incentiveService = new IncentiveService();
        $this->payrollCalculatorService = new PayrollCalculatorService();
        $this->payrollItemService = new PayrollItemService();
    }

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
            throw $e;
        }
    }

    /**
     * Create payroll for a single employee based on their attendance stats
     */
    protected function createPayrollForEmployee(PayrollPeriod $payrollPeriod, AttendancePeriodStat $stats): bool
    {
        // Find employee using lookup service
        $employee = $this->employeeLookupService->findEmployee($stats->employee_id, $stats->employee_name ?? null);

        if (!$employee) {
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

        // Calculate payroll components using calculator service
        $basePay = $this->payrollCalculatorService->calculateBasePay($stats, $employee);
        $overtimePay = $this->payrollCalculatorService->calculateOvertimePay($stats, $employee);
        $holidayOvertimePay = $this->payrollCalculatorService->calculateHolidayOvertimePay($stats, $employee);
        
        $subsidyPay = $stats->subsidy_pay ?? 0;
        $lateMinutes = $stats->late_minutes ?? 0;
        $lateDeduction = $this->payrollCalculatorService->calculateLateDeduction($lateMinutes, $employee);
        $aflDeduction = $stats->afl_deduction ?? 0;
        $cutPayment = $stats->cut_payment ?? 0;

        // Get incentives for this employee
        $incentives = $this->incentiveService->getEmployeeIncentives($payrollPeriod->id, $employee->id);
        $totalIncentives = array_sum(array_column($incentives, 'amount'));

        // Calculate gross pay
        $grossPay = $basePay + $overtimePay + $holidayOvertimePay + $subsidyPay + $totalIncentives;
        
        // Calculate government contributions
        $contributions = $this->contributionService->calculateGovernmentContributions($grossPay);
        
        // Calculate total deductions and net pay
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

        // Create payroll items using item service
        $this->payrollItemService->createPayrollItems(
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
            $contributions,
            $incentives
        );

        return true;
    }
}