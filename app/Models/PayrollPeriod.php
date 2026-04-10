<?php

namespace App\Models;

use App\Concerns\LogsActivityTrait;
use App\Policies\PayrollPeriodPolicy;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\Contracts\Activity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[UsePolicy(PayrollPeriodPolicy::class)]
class PayrollPeriod extends Model
{
    use LogsActivity;

    use LogsActivityTrait;

    protected $fillable = [
        'start_date',
        'end_date',
        'pay_date',
        'payroll_per_status',
        'is_paid',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
    ];


    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class, 'payroll_period_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'start_date',
                'end_date',
                'pay_date',
                'payroll_per_status',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected function getActivityDisplayNames(): array
    {
        return [
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
            'pay_date' => 'Pay Date',
            'payroll_per_status' => 'Payroll Period Status',
        ];
    }


    public function incentives(): HasMany
    {
        return $this->hasMany(Incentive::class, 'payroll_period_id');
    }
    protected function payrollPerStatus(): Attribute
    {
        return Attribute::make(
            set: fn($value) => trim(strip_tags($value)),
        );
    }
}
