<?php

namespace App\Models;

use App\Policies\PayrollPeriodPolicy;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[UsePolicy(PayrollPeriodPolicy::class)]
class PayrollPeriod extends Model
{
    protected $fillable = [
        'start_date',
        'end_date',
        'pay_date',
        'payroll_per_status',
    ]; 

    // protected $casts = [
    //     'start_date' => 'date',
    //     'end_date' => 'date',
    //     'pay_date' => 'date'
    // ];

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class, 'payroll_period_id');
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
