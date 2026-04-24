<?php

namespace App\Concerns\PayrollPeriod;

use App\Enums\PayrollPeriodStatusEnum;
use Carbon\Carbon;
use Illuminate\Validation\Rule;

trait PayrollPeriodValidationRules
{

    protected function payrollPeriodRules(): array
    {
        return [
            'start_date' => 'required',
            'end_date' => 'required',
            'pay_date' => 'required',
            'payroll_per_status' => ['required', Rule::enum(PayrollPeriodStatusEnum::class)],
        ];
    }

    protected function payrollPeriodUpdateRules(): array
    {
        return [
            'start_date' => 'required',
            'end_date' => 'required',
            'pay_date' => 'required|date',
            'payroll_per_status' => ['required', Rule::enum(PayrollPeriodStatusEnum::class)],
            'is_paid' => [
                'boolean',
            //   $this->payrollIsPaidRules(),
            ],
        ];
    }

    protected function payrollIsPaidRules(): callable
    {
      return function ($attribute, $value, $fail) {
            $status = request()->input('payroll_per_status');
            $payDate = request()->input('pay_date');

            $isPayDatePassed = $payDate && Carbon::parse($payDate)->isPast();

            $isStatusCompleted = $status === PayrollPeriodStatusEnum::COMPLETED->value;

            // Rule: If pay date has passed, must confirm payment
            if ($isPayDatePassed && $value !== true) {
                $fail('The pay date (' . Carbon::parse($payDate)->format('M d, Y') . ') has already passed. Please confirm that all employees in this period have received their payment.');
                return;
            }

            // Rule: If status is completed, must confirm payment
            if ($isStatusCompleted && $value !== true) {
                $fail('When status is completed, you must confirm that payout has been done.');
            }
        };
    }

    protected function payrollPeriodAttributes(): array
    {
        return [
            'name' => 'Payroll Period',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
        ];
    }

    protected function payrollPeriodUpdateAttributes(): array
    {
        return [
            'name' => 'Payroll Period',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
            'is_paid' => 'Is paid'
        ];
    }
}
