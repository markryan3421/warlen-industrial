<?php

namespace App\Models;

use App\Policies\IncentivePolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
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
                'payroll_period_id',
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
}
