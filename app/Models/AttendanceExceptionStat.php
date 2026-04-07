<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AttendanceExceptionStat extends Model
{
    protected $fillable = [
        'employee_id',
        'employee_name',
        'department',
        'date',
        'am_time_in',
        'am_time_out',    // First time zone (morning shift)
        'pm_time_in',
        'pm_time_out',    // Second time zone (afternoon/split shift)
        'late_minutes',                  // How many minutes late this day
        'leave_early_minutes',           // How many minutes left early
        'absence_minutes',               // Unaccounted absence minutes
        'total_exception_minutes',       // Sum of all exception minutes
    ];

    protected $casts = [
        'date'                    => 'date',
        'am_time_in'              => 'string',
        'am_time_out'             => 'string',
        'pm_time_in'              => 'string',
        'pm_time_out'             => 'string',
        'late_minutes'            => 'integer',
        'leave_early_minutes'     => 'integer',
        'absence_minutes'         => 'integer',
        'total_exception_minutes' => 'integer',
    ];

    // Convenience: was this employee late on this day?
    public function isLate(): bool
    {
        return $this->late_minutes > 0;
    }

    // Convenience: total exception hours (not just minutes)
    public function totalExceptionHours(): float
    {
        return round($this->total_exception_minutes / 60, 2);
    }

    public function scopeForEmployee($q, string $id)
    {
        return $q->where('employee_id', $id);
    }
    public function scopeForDate($q, string $date)
    {
        return $q->where('date', $date);
    }
    public function scopeLate($q)
    {
        return $q->where('late_minutes', '>', 0);
    }
    public function scopeAbsent($q)
    {
        return $q->where('absence_minutes', '>', 0);
    }

    #[Scope]
    protected function getAttendanceExceptionStat(Builder $query): void
    {
        $query->select([
            'employee_id',
            'employee_name',
            'department',
            'date',
            'am_time_in',
            'am_time_out',
            'pm_time_in',
            'pm_time_out',
            'absence_minutes',
            'total_exception_minutes',
        ]);
    }
}
