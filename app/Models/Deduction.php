<?php

namespace App\Models;

use App\Concerns\LogsActivityTrait;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Contracts\Activity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
// use Spatie\Activitylog\Traits\LogsActivity;

class Deduction extends Model
{
    use LogsActivity;

    use LogsActivityTrait;

    protected $fillable = [
        'payroll_period_id',
        'deduction_name',
        'deduction_amount'
    ];

    public function payroll_period()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'payroll_period.start_date',
                'payroll_period.end_date',
                'deduction_name',
                'deduction_amount',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected function getActivityDisplayNames(): array
    {
        return [
            'payroll_period.start_date' => 'Start Date',
            'payroll_period.end_date' => 'End Date',
            'deduction_name' => 'Deduction Name',
            'deduction_amount' => 'Deduction Amount',
        ];
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
