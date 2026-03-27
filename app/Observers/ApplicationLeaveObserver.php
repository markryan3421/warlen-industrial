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
    public function deleted(ApplicationLeave $applicationLeave): void 
    {
    }

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
    public function forceDeleted(ApplicationLeave $applicationLeave): void
    {
    }
    
    /**
     * Send notification to the employee.
     */
    protected function sendNotificationToEmployee(ApplicationLeave $applicationLeave): void
    {
        try {
            // Load the employee relationship
            if (!$applicationLeave->relationLoaded('employee')) {
                $applicationLeave->load('employee');
            }
            
            $user = $applicationLeave->employee;
            
            if ($user) {
                $user->notify(new ApplicationLeaveNotification($applicationLeave));
                
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
                Notification::send($users, new ApplicationLeaveNotification($applicationLeave));
            }
        } catch (\Exception $e) {
            Log::error('Failed to send notification to HR/Admins', [
                'leave_id' => $applicationLeave->slug_app,
                'error' => $e->getMessage()
            ]);
        }
    }
}