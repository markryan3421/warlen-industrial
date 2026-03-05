<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendancePeriodStat extends Model
{
    protected $fillable = [
        'employee_id', 'employee_name', 'department',
        'period_start', 'period_end',

        // Work hours
        'normal_work_hours', 'real_work_hours',

        // Late stats
        'late_times', 'late_minutes',

        // Leave early stats
        'leave_early_times', 'leave_early_minutes',

        // Overtime breakdown
        'overtime_workday', 'overtime_holiday', 'overtime_label',

        // Attendance day counts
        'scheduled_days', 'attended_days',

        // Absence/leave day counts
        'out_days', 'absent_days', 'afl_days',

        // Payment figures
        'overtime_pay', 'subsidy_pay',
        
        'late_leave_deduction', 'afl_deduction', 'cut_payment', 'real_pay',
        'note',
    ];

    protected $casts = [
        'period_start'        => 'date',
        'period_end'          => 'date',
        'normal_work_hours'   => 'float',
        'real_work_hours'     => 'float',
        'late_times'          => 'integer',
        'late_minutes'        => 'integer',
        'leave_early_times'   => 'integer',
        'leave_early_minutes' => 'integer',
        'overtime_workday'    => 'float',
        'overtime_holiday'    => 'float',
        'overtime_label'      => 'float',
        'scheduled_days'      => 'integer',
        'attended_days'       => 'integer',
        'out_days'            => 'float',
        'absent_days'         => 'float',
        'afl_days'            => 'float',
        'overtime_pay'        => 'float',
        'subsidy_pay'         => 'float',
        'late_leave_deduction'=> 'float',
        'afl_deduction'       => 'float',
        'cut_payment'         => 'float',
        'real_pay'            => 'float',
    ];

    // Total overtime hours across all categories
    public function totalOvertimeHours(): float
    {
        return round($this->overtime_workday + $this->overtime_holiday + $this->overtime_label, 2);
    }

    // Attendance rate as a percentage
    public function attendanceRate(): float
    {
        if ($this->scheduled_days === 0) return 0.0;
        return round(($this->attended_days / $this->scheduled_days) * 100, 1);
    }

    public function scopeForEmployee($q, string $id) { return $q->where('employee_id', $id); }
    public function scopeForPeriod($q, string $start, string $end) {
        return $q->where('period_start', $start)->where('period_end', $end);
    }
}
