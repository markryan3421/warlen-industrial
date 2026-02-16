<?php

namespace App\Models;

use App\Models\Position;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deduction extends Model
{
    protected $fillable = [
        'position_id',
        'salary_rate',
        'reg_overtime_rate',
        'special_overtime_rate',
        'sss_rate',
        'philhealth_rate',
        'pagibig_rate',
    ];

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class,'position_id');
    }
}
