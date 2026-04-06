<?php

namespace App\Observers;

use App\Concerns\Cache\CacheTrait;
use App\Events\ApplicationLeaveEvent;
use App\Models\ApplicationLeave;
use App\Models\User;
use App\Notifications\ApplicationLeaveNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ApplicationLeaveObserver
{
    use CacheTrait;

    /**
     * Handle the ApplicationLeave "created" event.
     */
    public function created(ApplicationLeave $applicationLeave): void
    {
        ApplicationLeaveEvent::dispatch($applicationLeave);

        // Send notification to the employee
        $this->sendNotificationToEmployee($applicationLeave);

        // Also notify HR and admins for new leave applications
        $this->notifyHRAndAdmins($applicationLeave);
    }

    /**
     * Handle the ApplicationLeave "updated" event.
     */
    public function updated(ApplicationLeave $applicationLeave): void
    {
        ApplicationLeaveEvent::dispatch($applicationLeave);

        // Only send notification if status changed
        if ($applicationLeave->wasChanged('app_status')) {
            // Notify the employee about status change
            $this->sendNotificationToEmployee($applicationLeave);

            // If approved/rejected, notify HR/admins as well
            if (in_array($applicationLeave->app_status, ['approved', 'rejected'])) {
                $this->notifyHRAndAdmins($applicationLeave);
            }
        }
    }

    /**
     * Handle the ApplicationLeave "deleted" event.
     */
    public function deleted(ApplicationLeave $applicationLeave): void {}

    /**
     * Handle the ApplicationLeave "restored" event.
     */
    public function restored(ApplicationLeave $applicationLeave): void
    {
        $this->sendNotificationToEmployee($applicationLeave);
    }

    /**
     * Handle the ApplicationLeave "force deleted" event.
     */
    public function forceDeleted(ApplicationLeave $applicationLeave): void {}

    /**
     * Send notification to the employee.
     */
    protected function sendNotificationToEmployee(ApplicationLeave $applicationLeave): void
    {
        try {
            // Load the employee relationship
            if (!$applicationLeave->relationLoaded('employee')) {
                $applicationLeave->load('employee.user');
            }

            $user = $applicationLeave->employee->user;
            $delay = now()->addSeconds(30); // Delay of 30 seconds

            if ($user) {
                $user->notify((new ApplicationLeaveNotification($applicationLeave))->delay($delay));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send notification to employee', [
                'leave_id' => $applicationLeave->slug_app,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Notify HR Heads and Admins.
     */
    protected function notifyHRAndAdmins(ApplicationLeave $applicationLeave): void
    {
        try {
            // Get all users with hr_head or admin roles
            $users = User::role(['hr_head', 'admin'])->get();

            if ($users->isNotEmpty()) {
                Log::info('Sending staggered notifications to HR/Admins', [
                    'count' => $users->count(),
                    'leave_id' => $applicationLeave->slug_app
                ]);

                // Send each notification with 30-second delay between them
                foreach ($users as $index => $user) {
                    $delayInSeconds = ($index + 1) * 30; // 30, 60, 90, 120 seconds etc.

                    $user->notify(
                        (new ApplicationLeaveNotification($applicationLeave))->delay(now()->addSeconds($delayInSeconds))
                    );

                    Log::info('Notification queued for HR/Admin', [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'delay' => $delayInSeconds . ' seconds',
                        'leave_id' => $applicationLeave->slug_app
                    ]);
                }
            } else {
                Log::info('No HR/Admin users found to notify', [
                    'leave_id' => $applicationLeave->slug_app
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send notification to HR/Admins', [
                'leave_id' => $applicationLeave->slug_app,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
