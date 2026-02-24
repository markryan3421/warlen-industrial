<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class ApplicationLeave extends Model
{

    protected $fillable = [
        'employee_id',
        'leave_start',
        'leave_end',
        'reason_to_leave',
        'is_approved',
        'remarks',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'leave_start' => 'date',
        'leave_end' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    protected function leaveStart(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->format('Y-m-d')
        );
    }

    protected function leaveEnd(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->format('Y-m-d')
        );
    }

    protected function reasonToLeave(): Attribute
    {
        return Attribute::make(
            set: fn($value) => strip_tags($value),
        );
    }
}
