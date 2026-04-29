<?php

namespace App\Mail;

use App\Models\Payroll;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PayrollSummaryMail extends Mailable
{
    use Queueable, SerializesModels;

    public Payroll $payroll;

    public function __construct(Payroll $payroll)
    {
        $this->payroll = $payroll;
    }

   public function build()
    {
        $this->payroll->loadMissing(['employee.user', 'employee.position', 'payrollPeriod', 'payrollItems']);
        return $this->subject("Your Payroll Summary – {$this->payroll->employee->user->name}")
                    ->view('emails.payroll-summary')
                    ->with([
                        'payroll' => $this->payroll,
                        'earnings' => $this->payroll->payrollItems->where('type', 'earning'),
                        'deductions' => $this->payroll->payrollItems->where('type', 'deduction'),
                        'authorizedName' => auth()->user()->name ?? 'System Administrator',
                    ]);
    }
}