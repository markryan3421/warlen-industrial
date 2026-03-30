<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
// use Spatie\Activitylog\Traits\LogsActivity;

class Deduction extends Model
{
    
    protected $fillable = [
        'payroll_period_id',
        'deduction_name',
        'deduction_amount'
    ];

    public function payroll_period()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_deductions', 'deduction_id', 'employee_id');
    }

    protected function deductionAmount(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }

    protected function deductionName(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }
}
