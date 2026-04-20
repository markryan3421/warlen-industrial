<?php

namespace App\Events;

use App\Models\PayrollPeriod;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PayrollProcessingEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $tries = 3;
    public $payrollPeriod;

    /**
     * Create a new event instance.
     */
    public function __construct(PayrollPeriod $payrollPeriod)
    {
        $this->payrollPeriod = $payrollPeriod;
      
    }
}