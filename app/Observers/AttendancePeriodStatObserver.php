<?php

namespace App\Observers;

use App\Events\PayrollEvent;
use App\Models\AttendancePeriodStat;
use App\Models\PayrollPeriod;
use Symfony\Component\HttpKernel\Attribute\Cache;

class AttendancePeriodStatObserver
{
    /**
     * Handle the AttendancePeriodStat "created" event.
     */
    public function created(AttendancePeriodStat $attendancePeriodStat): void
    {
        $this->createPayrollPeriod($attendancePeriodStat->period_start, $attendancePeriodStat->period_end);
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

    protected function createPayrollPeriod($start_date, $end_date): PayrollPeriod
    {
        $payrollPeriod = PayrollPeriod::firstOrCreate([
            'start_date' => $start_date,
            'end_date' => $end_date,
            'pay_date' => $end_date->addDays(1),
        ]);

        broadcast(new PayrollEvent(
            $payrollPeriod, 
            "New payroll period has been created from attendance data"
        ));

        return $payrollPeriod;  
    }
}
