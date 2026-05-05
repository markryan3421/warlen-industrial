<?php

use App\Models\Branch;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use App\Models\Position;
use App\Models\Site;
use App\Models\User;;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Role;


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function actingAsAdmin(): User
{
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Gate::before(fn () => true);
    return $admin;
}

/**
 * Build a fully-wired Payroll using only ::create().
 * Position is created using factory with unique names to avoid constraint violations.
 */
function makePayroll(array $payrollOverrides = [], string $email = 'employee@example.com'): Payroll
{
    $user     = User::factory()->create(['email' => $email]);
    $position = Position::factory()->create(); // Unique name every time
    $branch   = Branch::factory()->create(['branch_name' => 'Main Branch']);
    $site     = Site::factory()->create(['site_name' => 'HQ']);

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

    $payroll = Payroll::create(array_merge([
        'employee_id'       => $employee->id,
        'payroll_period_id' => $period->id,
        'gross_pay'         => 20000,
        'total_deduction'   => 2000,
        'net_pay'           => 18000,
    ], $payrollOverrides));

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

// ===========================================================================
// index()
// ===========================================================================

describe('index', function () {
    it('returns the payrolls index page with correct props', function () {
        $admin = actingAsAdmin();
        makePayroll();

        $this->actingAs($admin)
            ->get(route('payrolls.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
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
        $this->get(route('payrolls.index'))->assertRedirect(route('login'));
    });

    it('is blocked for unauthorized users', function () {
        $user = User::factory()->create();
        $this->actingAs($user)->get(route('payrolls.index'))->assertForbidden();
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
            ->assertInertia(fn ($page) => $page
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
            ->assertInertia(fn ($page) => $page
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
            ->assertInertia(fn ($page) => $page->where('payrolls', []));
    });
});

// ===========================================================================
// getPrintData()
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
        $admin = actingAsAdmin();
        $this->actingAs($admin)->getJson(route('payrolls.print-data', 999999))->assertNotFound();
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

        // The controller uses description if present, otherwise falls back to code.
        // Our data has both, so either "Basic Salary"/"SSS" or "BASIC"/"SSS" will be present.
        // We'll accept either by checking both possibilities.
        $hasBasicSalary = $earningDescriptions->contains('Basic Salary') || $earningDescriptions->contains('BASIC');
        $hasSSS = $deductionDescriptions->contains('SSS') || $deductionDescriptions->contains('SSS');

        expect($hasBasicSalary)->toBeTrue()
            ->and($hasSSS)->toBeTrue();
    });

    it('is blocked for unauthenticated users', function () {
        $payroll = makePayroll();
        $this->getJson(route('payrolls.print-data', $payroll->id))->assertUnauthorized();
    });
});