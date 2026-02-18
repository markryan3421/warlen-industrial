<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApplicationLeave extends Model
{
    protected $casts = [
        'is_approved'=> 'boolean',
    ];

    protected $fillable = [
        'employee_id',
        'leave_start',
        'leave_end',
        'reason_to_leave',
        'is_approved',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
