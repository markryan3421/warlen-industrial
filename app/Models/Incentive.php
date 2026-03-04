<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Incentive extends Model
{
    protected $fillable = [
        'payroll_period_id',
        'incentive_name',
        'incentive_amount'
    ];

    public function payroll_period()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_incentives', 'incentive_id', 'employee_id');
    }
}
