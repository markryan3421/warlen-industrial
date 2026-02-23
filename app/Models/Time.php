<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Time extends Model
{
    protected $fillable = [
        'am_in',
        'am_out',
        'am_break_time',
        'pm_break_time',
        'pm_out',
        'pm_in',
        'effecttive_from',
        'effective_to',
    ];

    protected $casts = [
        'am_in',
        'am_out',
        'am_break_time',
        'pm_break_time',
        'pm_out',
        'pm_in',
        'effecttive_from' => 'date',
        'effective_to' => 'date',
    ];
}
