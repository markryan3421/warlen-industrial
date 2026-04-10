<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class AttendanceLog extends Model
{
    protected $fillable = [
        'employee_id',
        'employee_name',
        'department',
        'date',
        'time_in',
        'time_out',
        'total_hours',
        'is_overtime',
    ];

    protected $casts = [
        'date'        => 'date',
        'time_in'     => 'datetime',
        'time_out'    => 'datetime',
        'total_hours' => 'float',
        'is_overtime' => 'boolean',
    ];

    // ── Scopes ───────────────────────────────────────────────────

    public function scopeForEmployee($query, string $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForDateRange($query, string $from, string $to)
    {
        return $query->whereBetween('date', [$from, $to]);
    }

    public function scopeOvertime($query)
    {
        return $query->where('is_overtime', true);
    }

    #[Scope]
    protected function getAttendanceLog(Builder $query): void
    {
        $query->select([
            'employee_id',
            'employee_name',
            'department',
            'date',
            'time_in',
            'time_out',
            'total_hours',
            'is_overtime',
        ]);
    }
}
