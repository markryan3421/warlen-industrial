<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSchedule extends Model
{
    protected $fillable = [
        'employee_id', 'employee_name', 'department',
        'date',
        'shift_code',   // Raw code from device: "25", "26", null, or shift template number
        'shift_label',  // Human-readable: "Normal", "Ask for Leave", "Out", "Holiday"
    ];

    protected $casts = [
        'date' => 'string',
    ];

    // Is this day a holiday?
    public function isHoliday(): bool   { return $this->shift_label === 'Holiday'; }
    // Is this day a leave request?
    public function isLeave(): bool     { return $this->shift_code === '25'; }
    // Is this an official out day?
    public function isOut(): bool       { return $this->shift_code === '26'; }
    // Is this a normal working day?
    public function isNormal(): bool    { return $this->shift_label === 'Normal'; }

    public function scopeForEmployee($q, string $id) { return $q->where('employee_id', $id); }
    public function scopeForDate($q, string $date)   { return $q->where('date', $date); }
    public function scopeHolidays($q)                { return $q->where('shift_label', 'Holiday'); }
    public function scopeLeaves($q)                  { return $q->where('shift_code', '25'); }
}
