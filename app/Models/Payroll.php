<?php

namespace App\Models;

use App\Models\PayrollItem;
use App\Policies\PayrollPolicy;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[UsePolicy(PayrollPolicy::class)]
class Payroll extends Model
{
    use LogsActivity;
    protected $fillable = [
        'payroll_period_id',
        'employee_id',
        'gross_pay',
        'total_deduction',
        'net_pay',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'payrollPeriod.start_date',
                'payrollPeriod.end_date',
                'employee.user.name',
                'gross_pay',
                'total_deduction',
                'net_pay',
            ])
            ->logOnlyDirty();
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function payrollItems(): HasMany
    {
        return $this->hasMany(PayrollItem::class, 'payroll_id');
    }
}
