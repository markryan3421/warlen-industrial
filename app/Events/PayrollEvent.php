<?php

namespace App\Events;

use App\Models\PayrollPeriod;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PayrollEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $payrollPeriod;
    public $message;

    /**
     * Create a new event instance.
     */
    public function __construct(PayrollPeriod $payrollPeriod, string $message = null)
    {
        $this->payrollPeriod = $payrollPeriod;
        $this->message = $message ?? "Payroll period {$payrollPeriod->period_name} has been completed";
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('payroll'),
            new PrivateChannel('payroll-period'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith(): array
    {
        return [
            'payroll_period_id' => $this->payrollPeriod->id,
            'period_name' => $this->payrollPeriod->period_name,
            'status' => $this->payrollPeriod->payroll_per_status,
            'message' => $this->message,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    /**
     * Get the event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'payroll.completed';
    }
}