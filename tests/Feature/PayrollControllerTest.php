<?php

use App\Mail\PayrollSummaryMail;
use App\Models\Branch;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use App\Models\Position;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create an admin user with the Spatie 'admin' role so AdminMiddleware passes.
 * Gate::before is also opened so policy checks are skipped.
 */
function actingAsAdmin(): User
{
    // Spatie requires the role to exist before assigning it
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    Gate::before(fn () => true);

    return $admin;
}

/**
 * Build a fully-wired Payroll using only ::create() — no Payroll/PayrollItem/
 * PayrollPeriod factories needed.
 *
 * @param  array   $payrollOverrides  Override any payrolls column value.
 * @param  string  $email             The employee's login email.
 */
function makePayroll(array $payrollOverrides = [], string $email = 'employee@example.com'): Payroll
{
    $user     = User::factory()->create(['email' => $email]);
    $position = Position::factory()->create(['pos_name' => 'Engineer']);
    $branch   = Branch::factory()->create(['branch_name' => 'Main Branch']);
    $site     = Site::factory()->create(['site_name' => 'HQ']);

    // ── PayrollPeriod — no factory, create directly ──────────────────────────
    // Adjust column names below if your migration differs.
    // Run: php artisan tinker --execute="print_r(Schema::getColumnListing('payroll_periods'));"
    $period = PayrollPeriod::create([
        'period_name' => '2024-01',
        'start_date'  => '2024-01-01',
        'end_date'    => '2024-01-15',
        'pay_date'    => '2024-01-16',
    ]);

    $employee = Employee::factory()->create([
        'user_id'     => $user->id,
        'position_id' => $position->id,
        'branch_id'   => $branch->id,
        'site_id'     => $site->id,
        'emp_code'    => 'EMP-001',
    ]);

    // ── Payroll — no factory, create directly ────────────────────────────────
    $payroll = Payroll::create(array_merge([
        'employee_id'       => $employee->id,
        'payroll_period_id' => $period->id,
        'gross_pay'         => 20000,
        'total_deduction'   => 2000,
        'net_pay'           => 18000,
    ], $payrollOverrides));

    // ── PayrollItems — no factory, create directly ───────────────────────────
    // Adjust column names below if your migration differs.
    // Run: php artisan tinker --execute="print_r(Schema::getColumnListing('payroll_items'));"
    PayrollItem::create([
        'payroll_id'  => $payroll->id,
        'type'        => 'earning',
        'code'        => 'BASIC',
        'description' => 'Basic Salary',
        'amount'      => 20000,
    ]);

    PayrollItem::create([
        'payroll_id'  => $payroll->id,
        'type'        => 'deduction',
        'code'        => 'SSS',
        'description' => 'SSS',
        'amount'      => 2000,
    ]);

    return $payroll->fresh();
}

/**
 * Payroll whose employee has no usable email.
 * The DB has NOT NULL on users.email, so we use an empty string —
 * blank('') === true, triggering the same 422 branch in the controller.
 */
function makePayrollWithoutEmail(): Payroll
{
    $payroll = makePayroll(email: 'noemail@example.com');
    $payroll->employee->user->update(['email' => '']);
    return $payroll->fresh();
}

// ===========================================================================
// index()  —  GET /payrolls
// ===========================================================================

describe('index', function () {

    it('returns the payrolls index page with correct props', function () {
        $admin = actingAsAdmin();
        makePayroll();

        $this->actingAs($admin)
            ->get(route('payrolls.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('payrolls/index')
                    ->has('payrolls')
                    ->has('pagination')
                    ->has('filters')
                    ->has('totalCount')
                    ->has('filteredCount')
                    ->has('totalNetPay')
                    ->has('totalGrossPay')
                    ->has('totalDeductions')
                    ->has('totalOvertimePay')
                    ->has('totalOvertimeHours')
                    ->has('activeEmployee')
                    ->has('allPositions')
                    ->has('allBranches')
                    ->has('allSites')
                    ->has('branchesData')
            );
    });

    it('is blocked for unauthenticated users', function () {
        $this->get(route('payrolls.index'))
            ->assertRedirect(route('login'));
    });

    it('is blocked for unauthorized users', function () {
        // A plain user with no role hits the admin middleware → 403
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('payrolls.index'))
            ->assertForbidden();
    });

    it('passes through filter values as props', function () {
        $admin = actingAsAdmin();

        $this->actingAs($admin)
            ->get(route('payrolls.index', [
                'search'    => 'John',
                'date_from' => '2024-01-01',
                'date_to'   => '2024-01-31',
                'perPage'   => 25,
            ]))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->where('filters.search', 'John')
                    ->where('filters.date_from', '2024-01-01')
                    ->where('filters.date_to', '2024-01-31')
                    ->where('filters.perPage', '25')
            );
    });

    it('returns correct pagination structure', function () {
        $admin = actingAsAdmin();
        makePayroll();

        $this->actingAs($admin)
            ->get(route('payrolls.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->has('pagination.current_page')
                    ->has('pagination.last_page')
                    ->has('pagination.per_page')
                    ->has('pagination.total')
                    ->has('pagination.from')
                    ->has('pagination.to')
                    ->has('pagination.links')
            );
    });

    it('returns empty payrolls list when search finds nothing', function () {
        $admin = actingAsAdmin();
        makePayroll();

        $this->actingAs($admin)
            ->get(route('payrolls.index', ['search' => 'zzz-nonexistent-xyz']))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page->where('payrolls', [])
            );
    });
});

// ===========================================================================
// getPrintData()  —  GET /payrolls/{id}/print-data
// ===========================================================================

describe('getPrintData', function () {

    it('returns correct JSON structure for a valid payroll', function () {
        $admin   = actingAsAdmin();
        $payroll = makePayroll();

        $this->actingAs($admin)
            ->getJson(route('payrolls.print-data', $payroll->id))
            ->assertOk()
            ->assertJsonStructure([
                'id',
                'employee_name',
                'employee_code',
                'position',
                'branch_name',
                'site_name',
                'payroll_period',
                'start_date',
                'end_date',
                'pay_date',
                'gross_pay',
                'total_deduction',
                'net_pay',
                'avatar',
                'earnings'   => [['description', 'amount']],
                'deductions' => [['description', 'amount']],
            ]);
    });

    it('returns 404 for a non-existent payroll', function () {
        // The route is behind 'admin' middleware — must be an admin or we get 403, not 404
        $admin = actingAsAdmin();

        $this->actingAs($admin)
            ->getJson(route('payrolls.print-data', 999999))
            ->assertNotFound();
    });

    it('returns correct monetary values in the response', function () {
        $admin   = actingAsAdmin();
        $payroll = makePayroll();

        $data = $this->actingAs($admin)
            ->getJson(route('payrolls.print-data', $payroll->id))
            ->assertOk()
            ->json();

        expect((float) $data['gross_pay'])->toBe(20000.0)
            ->and((float) $data['net_pay'])->toBe(18000.0)
            ->and((float) $data['total_deduction'])->toBe(2000.0)
            ->and($data['employee_code'])->toBe('EMP-001');
    });

    it('separates earnings and deductions correctly', function () {
        $admin   = actingAsAdmin();
        $payroll = makePayroll();

        $data = $this->actingAs($admin)
            ->getJson(route('payrolls.print-data', $payroll->id))
            ->assertOk()
            ->json();

        $earningDescriptions   = collect($data['earnings'])->pluck('description');
        $deductionDescriptions = collect($data['deductions'])->pluck('description');

        expect($earningDescriptions)->toContain('Basic Salary')
            ->and($deductionDescriptions)->toContain('SSS');
    });

    it('is blocked for unauthenticated users', function () {
        // Build the payroll first so we have a valid ID to hit
        $payroll = makePayroll();

        // Then hit the route without logging in — admin middleware redirects to login
        $this->getJson(route('payrolls.print-data', $payroll->id))
            ->assertUnauthorized();
    });
});

// ===========================================================================
// emailPayroll()  —  POST /payrolls/{payroll}/email
// (behind 'auth' + 'throttle' only — NOT the 'admin' middleware group)
// ===========================================================================

describe('emailPayroll', function () {

    it('queues a payroll summary email to the correct address', function () {
        Mail::fake();
        $admin   = actingAsAdmin();
        $payroll = makePayroll(email: 'worker@example.com');

        $this->actingAs($admin)
            ->postJson(route('payrolls.email', $payroll->id))
            ->assertOk()
            ->assertJson(['message' => 'Payroll summary queued successfully.']);

        Mail::assertQueued(PayrollSummaryMail::class, fn ($mail) =>
            $mail->hasTo('worker@example.com')
        );
    });

    it('returns 422 when employee has no email', function () {
        Mail::fake();
        $admin   = actingAsAdmin();
        $payroll = makePayrollWithoutEmail();

        $this->actingAs($admin)
            ->postJson(route('payrolls.email', $payroll->id))
            ->assertStatus(422)
            ->assertJson(['message' => 'Employee has no email address.']);

        Mail::assertNothingQueued();
    });

    it('returns 404 for a non-existent payroll', function () {
        Mail::fake();
        $admin = actingAsAdmin();

        $this->actingAs($admin)
            ->postJson(route('payrolls.email', 999999))
            ->assertNotFound();
    });

    it('returns 500 and logs an error when mail throws an exception', function () {
        Log::spy();

        $admin   = actingAsAdmin();
        $payroll = makePayroll();

        $this->mock(\Illuminate\Mail\Mailer::class, function ($mock) {
            $mock->shouldReceive('to')->andThrow(new \Exception('SMTP failure'));
        });

        $this->actingAs($admin)
            ->postJson(route('payrolls.email', $payroll->id))
            ->assertStatus(500)
            ->assertJsonFragment(['message' => 'Failed to send email: SMTP failure']);

        Log::shouldHaveReceived('error')->once();
    });

    it('is blocked for unauthorized users', function () {
        Mail::fake();
        Gate::before(fn () => false);

        // Plain user, no role — Gate denies the policy check inside the controller
        $user    = User::factory()->create();
        $payroll = makePayroll();

        $this->actingAs($user)
            ->postJson(route('payrolls.email', $payroll->id))
            ->assertForbidden();

        Mail::assertNothingQueued();
    });

    it('is blocked for unauthenticated users', function () {
        Mail::fake();
        $payroll = makePayroll();

        $this->postJson(route('payrolls.email', $payroll->id))
            ->assertUnauthorized();

        Mail::assertNothingQueued();
    });
});

// ===========================================================================
// bulkEmail()  —  POST /payrolls/bulk-email
// (behind 'auth' + 'throttle' only — NOT the 'admin' middleware group)
// ===========================================================================

describe('bulkEmail', function () {

    it('queues emails for all valid payrolls', function () {
        Mail::fake();
        $admin = actingAsAdmin();

        $p1 = makePayroll(email: 'alpha@example.com');
        $p2 = makePayroll(email: 'beta@example.com');

        $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), ['ids' => [$p1->id, $p2->id]])
            ->assertOk()
            ->assertJson([
                'success'  => 2,
                'failures' => 0,
            ]);

        Mail::assertQueued(PayrollSummaryMail::class, 2);
    });

    it('counts failures when some employees have no email', function () {
        Mail::fake();
        $admin = actingAsAdmin();

        $good = makePayroll(email: 'good@example.com');
        $bad  = makePayrollWithoutEmail();

        $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), ['ids' => [$good->id, $bad->id]])
            ->assertOk()
            ->assertJson([
                'success'  => 1,
                'failures' => 1,
            ]);

        Mail::assertQueued(PayrollSummaryMail::class, 1);
    });

    it('returns 422 when the ids array is empty', function () {
        Mail::fake();
        $admin = actingAsAdmin();

        $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), ['ids' => []])
            ->assertStatus(422);

        Mail::assertNothingQueued();
    });

    it('returns 422 when the ids field is missing entirely', function () {
        Mail::fake();
        $admin = actingAsAdmin();

        $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), [])
            ->assertStatus(422);

        Mail::assertNothingQueued();
    });

    it('returns 422 for non-existent payroll ids', function () {
        Mail::fake();
        $admin = actingAsAdmin();

        $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), ['ids' => [999998, 999999]])
            ->assertStatus(422);

        Mail::assertNothingQueued();
    });

    it('returns 422 for duplicate ids in the request', function () {
        Mail::fake();
        $admin   = actingAsAdmin();
        $payroll = makePayroll();

        $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), [
                'ids' => [$payroll->id, $payroll->id],
            ])
            ->assertStatus(422);
    });

    it('returns 422 for non-integer ids', function () {
        Mail::fake();
        $admin = actingAsAdmin();

        $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), ['ids' => ['abc', 'def']])
            ->assertStatus(422);

        Mail::assertNothingQueued();
    });

    it('is blocked for unauthenticated users', function () {
        Mail::fake();

        $this->postJson(route('payrolls.bulk-email'), ['ids' => [1]])
            ->assertUnauthorized();

        Mail::assertNothingQueued();
    });

    it('returns a message summarising successes and failures', function () {
        Mail::fake();
        $admin   = actingAsAdmin();
        $payroll = makePayroll();

        $response = $this->actingAs($admin)
            ->postJson(route('payrolls.bulk-email'), ['ids' => [$payroll->id]])
            ->assertOk()
            ->json();

        expect($response['message'])->toContain('Emails queued: 1, failed: 0');
    });
});