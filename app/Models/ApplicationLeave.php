<?php

namespace App\Models;

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

    protected function reasonToLeave(): Attribute
    {
        return Attribute::make(
            set: fn($value) => strip_tags($value),
        );
    }
}
