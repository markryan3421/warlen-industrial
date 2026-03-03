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

    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function employeeIncentives()
    {
        return $this->belongsToMany(Employee::class, 'employee_incentives', 'employee_id', 'incentive_id');
    }
}
