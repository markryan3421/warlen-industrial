<?php

namespace App\Observers;

use App\Concerns\Cache\CacheTrait;
use App\Events\ApplicationLeaveEvent;
use App\Models\ApplicationLeave;
use Illuminate\Support\Facades\Log;

class ApplicationLeaveObserver
{
    use CacheTrait;
    /**
     * Handle the ApplicationLeave "created" event.
     */
    public function created(ApplicationLeave $applicationLeave): void
    {
        ApplicationLeaveEvent::dispatch($applicationLeave);
    }

    /**
     * Handle the ApplicationLeave "updated" event.
     */
    public function updated(ApplicationLeave $applicationLeave): void
    {
        ApplicationLeaveEvent::dispatch($applicationLeave);
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
        //
    }

    /**
     * Handle the ApplicationLeave "force deleted" event.
     */
    public function forceDeleted(ApplicationLeave $applicationLeave): void
    {
        //
    }
}
