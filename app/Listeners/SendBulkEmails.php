<?php

namespace App\Listeners;

use App\Events\BulkEmailRequested;
use App\Mail\PayrollSummaryMail;
use App\Models\Payroll;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendBulkEmails implements ShouldQueue
{
    public $tries = 3;
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(BulkEmailRequested $event): void
    {
        $authorName = $event->userId ? User::find($event->userId)?->name : null;
        $this->processEmailPayroll($event->payrollIds, $authorName);
    }

    private function processEmailPayroll(array $payrollIds,?string $authorName): void
    {
         $payrolls = Payroll::with(['employee.user', 'employee.position', 'payrollPeriod', 'payrollItems'])
            ->whereIn('id', $payrollIds)
            ->get();

        $success = 0;
        $failures = 0;
        $errors = [];

        foreach ($payrolls as $index => $payroll) {
            $email = optional($payroll->employee?->user)->email;
            if (blank($email)) {
                $failures++;
                $errors[] = "Payroll #{$payroll->id}: no email address";
                continue;
            }

            try {
                $delaySeconds = 5 + ($index * 10);
                Mail::to($email)->later(now()->addSeconds($delaySeconds), new PayrollSummaryMail($payroll, $authorName));
                $success++;
            } catch (\Exception $e) {
                $failures++;
                $errors[] = "Payroll #{$payroll->id}: " . $e->getMessage();
                Log::error("Bulk email failed for payroll {$payroll->id}: " . $e->getMessage());
            }
        }

        Log::info("Bulk email completed: succeeded {$success}, failed {$failures}", ['errors' => $errors]);
    }
}
