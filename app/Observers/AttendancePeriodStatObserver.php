<?php

namespace App\Observers;

use App\Models\AttendancePeriodStat;
use App\Models\PayrollPeriod;

class AttendancePeriodStatObserver
{
    /**
     * Handle the AttendancePeriodStat "created" event.
     */
    public function created(AttendancePeriodStat $attendancePeriodStat): void
    {
        PayrollPeriod::firstOrCreate([
            'start_date' => $attendancePeriodStat->period_start,
            'end_date' => $attendancePeriodStat->period_end,
            'pay_date' => $attendancePeriodStat->period_end->addDays(1),
        ]);
    }

    /**
     * Handle the AttendancePeriodStat "updated" event.
     */
    public function updated(AttendancePeriodStat $attendancePeriodStat): void
    {
        //
    }

    /**
     * Handle the AttendancePeriodStat "deleted" event.
     */
    public function deleted(AttendancePeriodStat $attendancePeriodStat): void
    {
        //
    }

    /**
     * Handle the AttendancePeriodStat "restored" event.
     */
    public function restored(AttendancePeriodStat $attendancePeriodStat): void
    {
        //
    }

    /**
     * Handle the AttendancePeriodStat "force deleted" event.
     */
    public function forceDeleted(AttendancePeriodStat $attendancePeriodStat): void
    {
        //
    }
}
