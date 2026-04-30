<?php

namespace Tests\Feature;

use App\Mail\PayrollSummaryMail;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollPeriod;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PayrollEmailDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_payroll_email_endpoint(): void
    {
        $payroll = $this->createPayrollForEmail();

        $response = $this->post(route('payrolls.email', $payroll));

        $response->assertRedirect(route('login'));
    }

    public function test_authorized_user_queues_single_payroll_email(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $this->assignAdminRole($user);
        $payroll = $this->createPayrollForEmail();

        $response = $this->actingAs($user)->post(route('payrolls.email', $payroll));

        $response->assertOk()
            ->assertJson(['message' => 'Payroll summary queued successfully.']);

        Mail::assertQueued(PayrollSummaryMail::class, 1);
    }

    public function test_bulk_email_queues_selected_payrolls(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $this->assignAdminRole($user);

        $first = $this->createPayrollForEmail();
        $second = $this->createPayrollForEmail();

        $response = $this->actingAs($user)->postJson(route('payrolls.bulk-email'), [
            'ids' => [$first->id, $second->id],
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => 2,
                'failures' => 0,
            ]);

        Mail::assertQueued(PayrollSummaryMail::class, 2);
    }

    private function createPayrollForEmail(): Payroll
    {
        $employee = Employee::factory()->create([
            'employee_status' => 'active',
        ]);

        $period = PayrollPeriod::create([
            'start_date' => now()->subDays(15)->toDateString(),
            'end_date' => now()->toDateString(),
            'pay_date' => now()->toDateString(),
            'payroll_per_status' => 'open',
            'is_paid' => false,
        ]);

        return Payroll::create([
            'payroll_period_id' => $period->id,
            'employee_id' => $employee->id,
            'gross_pay' => 1200,
            'total_deduction' => 200,
            'net_pay' => 1000,
        ]);
    }

    private function assignAdminRole(User $user): void
    {
        Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $user->assignRole('admin');
    }
}