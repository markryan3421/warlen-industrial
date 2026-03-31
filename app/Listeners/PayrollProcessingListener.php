<?php

namespace App\Listeners;

use App\Events\PayrollProcessingEvent;
use App\Services\PayrollProcessingService;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class PayrollProcessingListener implements ShouldQueue, ShouldBeEncrypted
{
    protected $payrollService;

    /**
     * Create the event listener.
     */
    public function __construct(PayrollProcessingService $payrollService)
    {
        $this->payrollService = $payrollService;
      
    }

    /**
     * Handle the event.
     */
    public function handle(PayrollProcessingEvent $event): void
    {
        $this->payrollService->processPayrollForPeriod($event->payrollPeriod);
    }
}