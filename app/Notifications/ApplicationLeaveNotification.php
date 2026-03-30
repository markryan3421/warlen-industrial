<?php

namespace App\Notifications;

use App\Models\ApplicationLeave;
use App\Enums\ApplicationLeaveEnum;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationLeaveNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(protected ApplicationLeave $applicationLeave)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->applicationLeave->app_status;
        $statusLabel = ApplicationLeaveEnum::tryFrom($status)?->label() ?? ucfirst($status);
        $subject = "Leave Application {$statusLabel} - {$this->applicationLeave->slug_app}";

        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->greeting("Hello, {$this->applicationLeave->employee->user->name},")
            ->line("Your leave application has been {$statusLabel}.")
            ->line("**Leave Details:**")
            // ->line("Leave ID: {$this->applicationLeave->slug_app}")
            ->line("Start Date: {$this->applicationLeave->leave_start}")
            ->line("End Date: {$this->applicationLeave->leave_end}")
            ->line("Reason: {$this->applicationLeave->reason_to_leave}");

        // Add approver/rejecter info if available
        if ($status === ApplicationLeaveEnum::APPROVED->value && $this->applicationLeave->approved_by) {
            $mailMessage->line("Approved by: {$this->applicationLeave->approved_by}");
        } elseif ($status === ApplicationLeaveEnum::REJECTED->value && $this->applicationLeave->rejected_by) {
            $mailMessage->line("Rejected by: {$this->applicationLeave->rejected_by}");
        }

        // Add remarks if availableand not empty
        if ($this->applicationLeave->remarks) {
            $mailMessage->line("Remarks: {$this->applicationLeave->remarks}");
        }

        $mailMessage->action('View Application', url("/leave-applications/{$this->applicationLeave->slug_app}"))
            ->line('Thank you for using our application!');
        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'employee_id' => $this->applicationLeave->employee_id,
            'slug_app' => $this->applicationLeave->slug_app,
            'leave_start' => $this->applicationLeave->leave_start,
            'leave_end' => $this->applicationLeave->leave_end,
            'reason_to_leave' => $this->applicationLeave->reason_to_leave,
            'app_status' => $this->applicationLeave->app_status,
            'app_status_label' => ApplicationLeaveEnum::tryFrom($this->applicationLeave->app_status)?->label() ?? ucfirst($this->applicationLeave->app_status),
            'approved_by' => $this->applicationLeave->approved_by,
            'rejected_by' => $this->applicationLeave->rejected_by,
            'remarks' => $this->applicationLeave->remarks,
            'message' => $this->getNotificationMessage(),
        ];
    }

    // public function withDelay(object $notifiable): array
    // {
    //     return [
    //         'mail' => now()->addMinutes(1),
    //         'database' => now()->addMinutes(1),
    //     ];
    // }

    /**
     * Get the notification message based on status.
     */
    protected function getNotificationMessage(): string
    {
        $status = $this->applicationLeave->app_status;
        $leaveId = $this->applicationLeave->slug_app;

        switch ($status) {
            case ApplicationLeaveEnum::APPROVED->value:
                $approver = $this->applicationLeave->approved_by ? " by {$this->applicationLeave->approved_by}" : '';
                return "Your leave application ({$leaveId}) has been approved{$approver}.";

            case ApplicationLeaveEnum::REJECTED->value:
                $rejecter = $this->applicationLeave->rejected_by ? " by {$this->applicationLeave->rejected_by}" : '';
                return "Your leave application ({$leaveId}) has been rejected{$rejecter}.";

            case ApplicationLeaveEnum::PENDING->value:
                return "Your leave application ({$leaveId}) is pending for approval.";

            default:
                return "Your leave application ({$leaveId}) status has been updated to {$status}.";
        }
    }
}
