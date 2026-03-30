<?php

namespace App\Services;

use App\Events\PayrollEvent;
use App\Models\AttendancePeriodStat;
use App\Models\Payroll;
use App\Models\PayrollPeriod;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;

class PayrollProcessingService
{
    protected EmployeeLookupService $employeeLookupService;
    protected ContributionService $contributionService;
    protected IncentiveService $incentiveService;
    protected PayrollCalculatorService $payrollCalculatorService;
    protected PayrollItemService $payrollItemService;
    
    protected const PROGRESS_BROADCAST_INTERVAL = 10; // Broadcast every 10% progress
    protected const MICROSECONDS_DELAY = 50000; // 0.05 seconds delay

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
        $startTime = microtime(true);
        
        try {
            DB::beginTransaction();

            $attendanceStats = $this->getAttendanceStats($payrollPeriod);
            
            if ($attendanceStats->isEmpty()) {
                $this->handleEmptyAttendance($payrollPeriod);
                DB::commit();
                return;
            }

            $this->clearExistingPayrolls($payrollPeriod);
            
            $result = $this->processEmployees($payrollPeriod, $attendanceStats);
            
            $this->finalizeProcessing($payrollPeriod, $result);
            
            DB::commit();
            
            $duration = round(microtime(true) - $startTime, 2);
            Log::info("Payroll processing completed for period {$payrollPeriod->id} in {$duration} seconds");
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->handleProcessingError($payrollPeriod, $e);
            throw $e;
        }
    }

    /**
     * Get attendance stats for the payroll period
     */
    protected function getAttendanceStats(PayrollPeriod $payrollPeriod): Collection
    {
        return AttendancePeriodStat::where('period_start', $payrollPeriod->start_date)
            ->where('period_end', $payrollPeriod->end_date)
            ->get();
    }

    /**
     * Handle empty attendance data
     */
    protected function handleEmptyAttendance(PayrollPeriod $payrollPeriod): void
    {
        $message = "Payroll period {$payrollPeriod->period_name} completed with no attendance data";
        Log::warning($message);
        
        $payrollPeriod->update(['payroll_per_status' => 'completed']);
        
        $event = new PayrollEvent($payrollPeriod, $message, 100);
        broadcast($event);
    }

    /**
     * Clear existing payroll records for this period
     */
    protected function clearExistingPayrolls(PayrollPeriod $payrollPeriod): void
    {
        $deleted = $payrollPeriod->payrolls()->delete();
        if ($deleted > 0) {
            Log::info("Cleared {$deleted} existing payroll records for period {$payrollPeriod->id}");
        }
    }

    /**
     * Process all employees in the payroll period
     */
    protected function processEmployees(PayrollPeriod $payrollPeriod, Collection $attendanceStats): array
    {
        $totalEmployees = $attendanceStats->count();
        $processedCount = 0;
        $skippedCount = 0;
        $lastBroadcastProgress = 0;

        // Broadcast initial progress
        $this->broadcastProgress($payrollPeriod, 0, 0, 0, "Starting payroll processing...");

        foreach ($attendanceStats as $index => $stats) {
            $result = $this->createPayrollForEmployee($payrollPeriod, $stats);
            
            if ($result) {
                $processedCount++;
            } else {
                $skippedCount++;
            }
            
            $progress = $this->calculateProgress($index + 1, $totalEmployees);
            
            // Broadcast progress at intervals to reduce network traffic
            if ($this->shouldBroadcastProgress($progress, $lastBroadcastProgress, $index, $totalEmployees)) {
                $this->broadcastProgress($payrollPeriod, $progress, $processedCount, $skippedCount);
                $lastBroadcastProgress = $progress;
            }
            
            // Small delay to prevent overwhelming the system
            usleep(self::MICROSECONDS_DELAY);
        }

        return [
            'processed' => $processedCount,
            'skipped' => $skippedCount,
            'total' => $totalEmployees
        ];
    }

    /**
     * Calculate progress percentage
     */
    protected function calculateProgress(int $current, int $total): int
    {
        return (int)(($current / $total) * 100);
    }

    /**
     * Determine if we should broadcast progress update
     */
    protected function shouldBroadcastProgress(int $currentProgress, int $lastProgress, int $index, int $total): bool
    {
        return $currentProgress >= $lastProgress + self::PROGRESS_BROADCAST_INTERVAL || 
               $index + 1 === $total; // Always broadcast on last employee
    }

    /**
     * Broadcast progress event
     */
    protected function broadcastProgress(
        PayrollPeriod $payrollPeriod, 
        int $progress, 
        int $processedCount, 
        int $skippedCount, 
        ?string $customMessage = null
    ): void {
        $message = $customMessage ?? "Processing payroll: {$progress}% complete ({$processedCount} processed, {$skippedCount} skipped)";
        
        $event = new PayrollEvent($payrollPeriod, $message, $progress);
        broadcast($event);
        
        Log::info("Broadcasting progress: {$progress}% for period {$payrollPeriod->id}");
    }

    /**
     * Finalize payroll processing
     */
    protected function finalizeProcessing(PayrollPeriod $payrollPeriod, array $result): void
    {
        $hasProcessedEmployees = $result['processed'] > 0;
        $finalStatus = $hasProcessedEmployees ? 'completed' : 'pending';
        $successMessage = $hasProcessedEmployees 
            ? "Payroll period {$payrollPeriod->period_name} completed successfully" 
            : "Payroll period {$payrollPeriod->period_name} completed with no processed employees";
        
        $payrollPeriod->update(['payroll_per_status' => $finalStatus]);
        
        Log::info("Payroll processed for period: {$payrollPeriod->id}", [
            'processed' => $result['processed'],
            'skipped' => $result['skipped'],
            'total' => $result['total'],
            'status' => $finalStatus
        ]);
        
        $completeEvent = new PayrollEvent($payrollPeriod, $successMessage, 100);
        broadcast($completeEvent);
    }

    /**
     * Handle processing error
     */
    protected function handleProcessingError(PayrollPeriod $payrollPeriod, \Exception $e): void
    {
        $errorMessage = "Payroll processing failed for period {$payrollPeriod->id}: " . $e->getMessage();
        Log::error($errorMessage);
        
        $payrollPeriod->update(['payroll_per_status' => 'failed']);
        
        $errorEvent = new PayrollEvent($payrollPeriod, "Payroll processing failed: " . $e->getMessage(), null);
        broadcast($errorEvent);
    }

    /**
     * Create payroll for a single employee based on their attendance stats
     */
    protected function createPayrollForEmployee(PayrollPeriod $payrollPeriod, AttendancePeriodStat $stats): bool
    {
        try {
            $employee = $this->employeeLookupService->findEmployee(
                $stats->employee_id, 
                $stats->employee_name ?? null
            );

            if (!$employee) {
                Log::warning("Employee not found", [
                    'employee_id' => $stats->employee_id,
                    'employee_name' => $stats->employee_name
                ]);
                return false;
            }

            if (!$this->validateEmployee($employee, $payrollPeriod)) {
                return false;
            }

            $payrollData = $this->calculatePayrollData($payrollPeriod, $stats, $employee);
            
            $payroll = $this->createPayrollRecord($payrollPeriod, $employee, $payrollData);
            
            $this->payrollItemService->createPayrollItems(
                $payroll,
                $stats,
                $payrollData['basePay'],
                $payrollData['overtimePay'],
                $payrollData['holidayOvertimePay'],
                $payrollData['subsidyPay'],
                $payrollData['lateDeduction'],
                $payrollData['aflDeduction'],
                $payrollData['cutPayment'],
                $employee,
                $payrollData['lateMinutes'],
                $payrollData['contributions'],
                $payrollData['incentives']
            );

            return true;
            
        } catch (\Exception $e) {
            Log::error("Failed to process payroll for employee", [
                'employee_id' => $stats->employee_id,
                'period_id' => $payrollPeriod->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Validate employee can be processed
     */
    protected function validateEmployee($employee, PayrollPeriod $payrollPeriod): bool
    {
        if (!$employee->position) {
            Log::warning("Employee {$employee->emp_code} has no position assigned. Skipping payroll.");
            return false;
        }

        if (!$employee->position->basic_salary || $employee->position->basic_salary <= 0) {
            Log::warning("Employee {$employee->emp_code} position '{$employee->position->pos_name}' has no valid salary. Skipping payroll.");
            return false;
        }

        return true;
    }

    /**
     * Calculate all payroll data for an employee
     */
    protected function calculatePayrollData(PayrollPeriod $payrollPeriod, AttendancePeriodStat $stats, $employee): array
    {
        $basePay = $this->payrollCalculatorService->calculateBasePay($stats, $employee);
        $overtimePay = $this->payrollCalculatorService->calculateOvertimePay($stats, $employee);
        $holidayOvertimePay = $this->payrollCalculatorService->calculateHolidayOvertimePay($stats, $employee);
        
        $subsidyPay = $stats->subsidy_pay ?? 0;
        $lateMinutes = $stats->late_minutes ?? 0;
        $lateDeduction = $this->payrollCalculatorService->calculateLateDeduction($lateMinutes, $employee);
        $aflDeduction = $stats->afl_deduction ?? 0;
        $cutPayment = $stats->cut_payment ?? 0;

        $incentives = $this->incentiveService->getEmployeeIncentives($payrollPeriod->id, $employee->id);
        $totalIncentives = array_sum(array_column($incentives, 'amount'));

        $grossPay = $basePay + $overtimePay + $holidayOvertimePay + $subsidyPay + $totalIncentives;
        $contributions = $this->contributionService->calculateGovernmentContributions($grossPay);
        
        $totalDeductions = $lateDeduction + $aflDeduction + $cutPayment + 
                          $contributions['sss']['employee'] + 
                          $contributions['pagibig']['employee'] + 
                          $contributions['philhealth']['employee'];
        
        $netPay = $grossPay - $totalDeductions;

        return [
            'basePay' => $basePay,
            'overtimePay' => $overtimePay,
            'holidayOvertimePay' => $holidayOvertimePay,
            'subsidyPay' => $subsidyPay,
            'lateMinutes' => $lateMinutes,
            'lateDeduction' => $lateDeduction,
            'aflDeduction' => $aflDeduction,
            'cutPayment' => $cutPayment,
            'incentives' => $incentives,
            'totalIncentives' => $totalIncentives,
            'grossPay' => $grossPay,
            'contributions' => $contributions,
            'totalDeductions' => $totalDeductions,
            'netPay' => $netPay
        ];
    }

    /**
     * Create payroll record in database
     */
    protected function createPayrollRecord(PayrollPeriod $payrollPeriod, $employee, array $payrollData): Payroll
    {
        return Payroll::create([
            'payroll_period_id' => $payrollPeriod->id,
            'employee_id' => $employee->id,
            'gross_pay' => $payrollData['grossPay'],
            'total_deduction' => $payrollData['totalDeductions'],
            'net_pay' => $payrollData['netPay'],
        ]);
    }
}