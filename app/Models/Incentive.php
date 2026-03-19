<?php

namespace App\Models;

use App\Policies\IncentivePolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[UsePolicy(IncentivePolicy::class)]
class Incentive extends Model
{
    use LogsActivity;

    protected $fillable = [
        'payroll_period_id',
        'incentive_name',
        'incentive_amount'
    ];


    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'payroll_period.start_date',
                'payroll_period.end_date',
                'incentive_name',
                'incentive_amount'
            ])
            ->logOnlyDirty();
    }

    public function payroll_period()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_incentives', 'incentive_id', 'employee_id');
    }

    protected function incentiveAmount(): Attribute
    {
        return Attribute::make(
            set: fn($value) => is_numeric($value) ? (float) $value : 0,
        );
    }

    protected function incentiveName(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }
}
