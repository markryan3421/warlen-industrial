<?php

namespace App\Models;

use App\Models\PayrollItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payroll extends Model
{
    protected $fillable = [
        'payroll_perion_id',
        'employee_id',
        'gross_pay',
        'total_deduction',
        'net_pay',
    ];

    public function payrollPeriod():BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class,'payroll_period_id');
    }

    public function employee():BelongsTo
    {
        return $this->belongsTo(Employee::class,'employee_id');
    }

    public function payrollItems():HasMany
    {
        return $this->hasMany(PayrollItem::class, 'payroll_id');
    }

    
}
