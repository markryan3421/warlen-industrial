<?php

namespace App\Events;

use App\Models\PayrollPeriod;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PayrollEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $payrollPeriod;
    public $message;
    public $progress;

    /**
     * Create a new event instance.
     */
    public function __construct(PayrollPeriod $payrollPeriod, ?string $message = null, ?int $progress = null)
    {
        $this->payrollPeriod = $payrollPeriod;
        $this->message = $message ?? "Payroll period {$payrollPeriod->period_name} has been completed";
        $this->progress = $progress;
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
        $data = [
            'payroll_period_id' => $this->payrollPeriod->id,
            'period_name' => $this->payrollPeriod->period_name,
            'status' => $this->payrollPeriod->payroll_per_status,
            'message' => $this->message,
            'timestamp' => now()->toIso8601String(),
        ];
        
        // Always include progress, even if null
        $data['progress'] = $this->progress;
        
        return $data;
    }

    /**
     * Get the event name for broadcasting.
     */
    public function broadcastAs(): string
    {
        return 'payroll.completed';
    }
}