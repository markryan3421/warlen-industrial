<?php

namespace App\Events;

use App\Models\ApplicationLeave;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ApplicationLeaveEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(protected ApplicationLeave $application_leave) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('application-leave'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->application_leave->id,
            'employee_id' => $this->application_leave->employee_id,
            'slug_app' => $this->application_leave->slug_app,
            'leave_start' => $this->application_leave->leave_start,
            'leave_end' => $this->application_leave->leave_end,
            'reason_to_leave' => $this->application_leave->reason_to_leave,
            'app_status' => $this->application_leave->app_status,
            'approved_by' => $this->application_leave->approved_by,
            'rejected_by' => $this->application_leave->rejected_by,
            'remarks' => $this->application_leave->remarks,
            'employee' => $this->application_leave->employee ? [
                'id' => $this->application_leave->employee->id,
                'user' => $this->application_leave->employee->user ? [
                    'id' => $this->application_leave->employee->user->id,
                    'name' => $this->application_leave->employee->user->name,
                    'email' => $this->application_leave->employee->user->email,
                ] : null
            ] : null
        ];
    }

    public function broadcastAs(): string
    {
        return 'ApplicationLeaveEvent';
    }
}
