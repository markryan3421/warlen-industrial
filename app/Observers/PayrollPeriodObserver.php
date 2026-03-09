<?php

namespace App\Observers;

use App\Models\PayrollPeriod;
use App\Services\PayrollProcessingService;

class PayrollPeriodObserver
{
    protected $payrollService;

    public function __construct(PayrollProcessingService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Handle the PayrollPeriod "updated" event.
     */
    public function updated(PayrollPeriod $payrollPeriod): void
    {
        // Check if status is being changed to 'processing'
        if ($payrollPeriod->isDirty('payroll_per_status') && 
            $payrollPeriod->payroll_per_status === 'processing') {
            
            $this->payrollService->processPayrollForPeriod($payrollPeriod);
        }
    }

    /**
     * Handle the PayrollPeriod "created" event.
     */
    public function created(PayrollPeriod $payrollPeriod): void
    {
        // // Optionally auto-process if status is already 'processing' on creation
        // if ($payrollPeriod->payroll_per_status === 'processing') {
        //     $this->payrollService->processPayrollForPeriod($payrollPeriod);
        // }
    }
}