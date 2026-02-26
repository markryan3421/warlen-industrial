<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class ApplicationLeave extends Model
{

    protected $fillable = [
        'employee_id',
        'slug_app',
        'leave_start',
        'leave_end',
        'reason_to_leave',
        'app_status',
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

    protected function appStatus(): Attribute
    {
       return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
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

    public function getRouteKeyName()
    {
        return 'slug_app';
    }
}
