<?php

use App\Enums\PayrollPeriodStatusEnum;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Disable CSRF for testing
    $this->withoutMiddleware([
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    ]);

    // Clear Spatie permission cache
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

    // Use array cache to easily test cache invalidation
    config(['cache.default' => 'array']);
    Cache::flush();

    // Prevent Inertia from checking for actual Vue component files
    config(['inertia.testing.ensure_pages_exist' => false]);

    // Set up roles and permissions
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $userRole = Role::firstOrCreate(['name' => 'hr_head', 'guard_name' => 'web']);

    // Define gates for Incentive – use fully qualified class name
    Gate::define('viewAny', fn($user) => $user->hasRole('admin'));
    Gate::define('create', fn($user) => $user->hasRole('admin'));
    Gate::define('view', fn($user, \App\Models\Incentive $incentive) => $user->hasRole('admin'));
    Gate::define('update', fn($user, \App\Models\Incentive $incentive) => $user->hasRole('admin'));
    Gate::define('delete', fn($user, \App\Models\Incentive $incentive) => $user->hasRole('admin'));
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function incentiveAdminUser(): User
{
    $user = User::create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);
    $user->assignRole('admin');
    return $user;
}

function incentiveRegularUser(): User
{
    return User::create([
        'name' => 'Regular User',
        'email' => 'user@example.com',
        'password' => bcrypt('password'),
    ]);
}

function createPayrollPeriod(array $overrides = []): PayrollPeriod
{
    $defaults = [
        'start_date' => now()->startOfMonth(),
        'end_date' => now()->endOfMonth(),
        'pay_date' => now()->addDays(5),
        'payroll_per_status' => PayrollPeriodStatusEnum::OPEN->value ?? 'open',
    ];
    return PayrollPeriod::create(array_merge($defaults, $overrides));
}

function createEmployee(): Employee
{
    $user = User::create([
        'name' => 'Employee ' . uniqid(),
        'email' => uniqid() . '@example.com',
        'password' => bcrypt('password'),
    ]);

    return Employee::create([
        'user_id' => $user->id,
        'position_id' => null,
        'branch_id' => null,
        'site_id' => null,
        'slug_emp' => Str::slug($user->name) . '-' . uniqid(),
        'avatar' => null,
        'emp_code' => 'EMP' . rand(1000, 9999),
        'employee_number' => 'EMPNO' . uniqid(),
        'contract_start_date' => now()->toDateString(),
        'contract_end_date' => now()->addYear()->toDateString(),
        'sss_number' => 'SSS-' . rand(1000000000, 9999999999),
        'pagibig_number' => 'PAGIBIG-' . rand(1000000000, 9999999999),
        'philhealth_number' => 'PHIL-' . rand(1000000000, 9999999999),
        'emergency_contact_number' => '09171234567',
        'pay_frequency' => 'monthly',
        'employee_status' => 'active',
        'first_name' => $user->name,
        'last_name' => 'Test',
    ]);
}

function createIncentiveWithRelations(array $overrides = []): \App\Models\Incentive
{
    $payrollPeriod = createPayrollPeriod();
    $incentive = \App\Models\Incentive::create(array_merge([
        'incentive_name' => 'Test Incentive',
        'incentive_amount' => 1000,
        'payroll_period_id' => $payrollPeriod->id,
        'is_daily' => false,
    ], $overrides));

    $employees = [createEmployee(), createEmployee()];
    $incentive->employees()->attach(array_column($employees, 'id'));

    return $incentive->load('employees');
}

// ─── Index ────────────────────────────────────────────────────────────────────

describe('GET /incentives (index)', function () {

    it('renders the incentives/index page for authorized users with paginated data', function () {
        $admin = incentiveAdminUser();
        for ($i = 0; $i < 5; $i++) {
            $period = createPayrollPeriod();
            \App\Models\Incentive::create([
                'incentive_name' => "Bonus $i",
                'incentive_amount' => 100 * ($i + 1),
                'payroll_period_id' => $period->id,
                'is_daily' => false,
            ]);
        }

        $this->actingAs($admin)
            ->get(route('incentives.index'))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('incentives/index')
                    ->has('incentives.data')
                    ->has('filters')
                    ->has('payroll_periods')
                    ->has('employees')
                    ->where('isEditing', false)
                    ->whereNull('editingIncentive')
            );
    });

    it('filters incentives by search term (incentive_name)', function () {
        $admin = incentiveAdminUser();
        $period = createPayrollPeriod();
        \App\Models\Incentive::create([
            'incentive_name' => 'Christmas Bonus',
            'incentive_amount' => 1000,
            'payroll_period_id' => $period->id,
            'is_daily' => false,
        ]);
        \App\Models\Incentive::create([
            'incentive_name' => 'Performance Bonus',
            'incentive_amount' => 2000,
            'payroll_period_id' => $period->id,
            'is_daily' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('incentives.index', ['search' => 'Christmas']))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->where('filters.search', 'Christmas')
                    ->where('incentives.total', 1)
            );
    });

    it('filters incentives by date range using payroll period dates', function () {
        $admin = incentiveAdminUser();
        $period1 = createPayrollPeriod(['start_date' => '2024-01-01', 'end_date' => '2024-01-31']);
        $period2 = createPayrollPeriod(['start_date' => '2024-02-01', 'end_date' => '2024-02-29']);
        \App\Models\Incentive::create([
            'incentive_name' => 'Jan Bonus',
            'incentive_amount' => 1000,
            'payroll_period_id' => $period1->id,
            'is_daily' => false,
        ]);
        \App\Models\Incentive::create([
            'incentive_name' => 'Feb Bonus',
            'incentive_amount' => 2000,
            'payroll_period_id' => $period2->id,
            'is_daily' => false,
        ]);

        $this->actingAs($admin)
            ->get(route('incentives.index', ['date_from' => '2024-01-01', 'date_to' => '2024-01-31']))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->where('incentives.total', 1)
            );
    });

    it('denies access to unauthorized users', function () {
        $user = incentiveRegularUser();
        $this->actingAs($user)
            ->get(route('incentives.index'))
            ->assertForbidden();
    });
});

// ─── Create ───────────────────────────────────────────────────────────────────

describe('GET /incentives/create', function () {

    it('renders the incentives/create page with dropdown data', function () {
        $admin = incentiveAdminUser();
        createPayrollPeriod();
        createEmployee();
        createEmployee();

        $this->actingAs($admin)
            ->get(route('incentives.create'))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('incentives/create')
                    ->has('payroll_periods')
                    ->has('employees')
            );
    });

    it('denies access to unauthorized users', function () {
        $user = incentiveRegularUser();
        $this->actingAs($user)
            ->get(route('incentives.create'))
            ->assertForbidden();
    });
});

// ─── Store ────────────────────────────────────────────────────────────────────

describe('POST /incentives (store)', function () {

    it('creates an incentive and redirects with success message', function () {
        $admin = incentiveAdminUser();
        $payrollPeriod = createPayrollPeriod();
        $employees = [createEmployee(), createEmployee()];

        $payload = [
            'incentive_name' => 'Holiday Bonus',
            'incentive_amount' => 1500,
            'payroll_period_id' => $payrollPeriod->id,
            'is_daily' => false,
            'employee_ids' => array_column($employees, 'id'),
        ];

        $this->actingAs($admin)
            ->post(route('incentives.store'), $payload)
            ->assertRedirect(route('incentives.index'))
            ->assertSessionHas('success', 'Incentive created successfully.');

        $this->assertDatabaseHas('incentives', [
            'incentive_name' => 'Holiday Bonus',
            'incentive_amount' => 1500,
            'payroll_period_id' => $payrollPeriod->id,
        ]);

        $incentive = \App\Models\Incentive::where('incentive_name', 'Holiday Bonus')->first();
        expect($incentive->employees->pluck('id')->toArray())->toEqualCanonicalizing(array_column($employees, 'id'));
    });

    it('validates required fields', function () {
        $admin = incentiveAdminUser();

        $this->actingAs($admin)
            ->post(route('incentives.store'), [])
            ->assertSessionHasErrors(['incentive_name', 'incentive_amount', 'payroll_period_id', 'employee_ids']);
    });

    it('handles creation failure and rolls back transaction', function () {
        $admin = incentiveAdminUser();
        $this->mock(\App\Actions\Incentive\CreateNewIncentive::class)
            ->shouldReceive('create')
            ->andThrow(new \Exception('Simulated failure'));

        $employee = createEmployee();
        $payload = [
            'incentive_name' => 'Failing Bonus',
            'incentive_amount' => 500,
            'payroll_period_id' => createPayrollPeriod()->id,
            'employee_ids' => [$employee->id],
        ];

        $this->actingAs($admin)
            ->post(route('incentives.store'), $payload)
            ->assertRedirect(route('incentives.index'))
            ->assertSessionHas('error', 'Failed to create incentive: Simulated failure');

        $this->assertDatabaseMissing('incentives', ['incentive_name' => 'Failing Bonus']);
    });

    it('denies unauthorized users', function () {
        $user = incentiveRegularUser();
        $this->actingAs($user)
            ->post(route('incentives.store'), [])
            ->assertForbidden();
    });
});

// ─── Edit ─────────────────────────────────────────────────────────────────────

describe('GET /incentives/{incentive}/edit (edit)', function () {

    it('renders the incentives/edit page with incentive and dropdowns', function () {
        $admin = incentiveAdminUser();
        $incentive = createIncentiveWithRelations();

        $this->actingAs($admin)
            ->get(route('incentives.edit', $incentive))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('incentives/edit')
                    ->has('incentive')
                    ->has('payroll_periods')
                    ->has('employees')
                    ->where('incentive.id', $incentive->id)
                    ->where('incentive.incentive_name', $incentive->incentive_name)
            );
    });

    it('denies access to unauthorized users', function () {
        $user = incentiveRegularUser();
        $incentive = createIncentiveWithRelations();

        $this->actingAs($user)
            ->get(route('incentives.edit', $incentive))
            ->assertForbidden();
    });
});

// ─── Update ───────────────────────────────────────────────────────────────────

describe('PUT /incentives/{incentive} (update)', function () {

    it('updates an incentive and redirects with success message', function () {
        $admin = incentiveAdminUser();
        $incentive = createIncentiveWithRelations();
        $newPayrollPeriod = createPayrollPeriod();
        $newEmployees = [createEmployee(), createEmployee()];

        $payload = [
            'incentive_name' => 'Updated Bonus',
            'incentive_amount' => 2000,
            'payroll_period_id' => $newPayrollPeriod->id,
            'is_daily' => true,
            'employee_ids' => array_column($newEmployees, 'id'),
        ];

        $this->actingAs($admin)
            ->put(route('incentives.update', $incentive), $payload)
            ->assertRedirect(route('incentives.index'))
            ->assertSessionHas('success', 'Incentive updated successfully.');

        $this->assertDatabaseHas('incentives', [
            'id' => $incentive->id,
            'incentive_name' => 'Updated Bonus',
            'incentive_amount' => 2000,
            'payroll_period_id' => $newPayrollPeriod->id,
            'is_daily' => true,
        ]);

        expect($incentive->fresh()->employees->pluck('id')->toArray())->toEqualCanonicalizing(array_column($newEmployees, 'id'));
    });

    it('validates required fields on update', function () {
        $admin = incentiveAdminUser();
        $incentive = createIncentiveWithRelations();

        $this->actingAs($admin)
            ->put(route('incentives.update', $incentive), [])
            ->assertSessionHasErrors(['incentive_name', 'incentive_amount', 'payroll_period_id', 'employee_ids']);
    });

    it('handles update failure and rolls back', function () {
        $admin = incentiveAdminUser();
        $incentive = createIncentiveWithRelations();

        $this->mock(\App\Actions\Incentive\UpdateIncentive::class)
            ->shouldReceive('update')
            ->andThrow(new \Exception('Update failed'));

        $payload = [
            'incentive_name' => 'Fail Update',
            'incentive_amount' => 100,
            'payroll_period_id' => $incentive->payroll_period_id,
            'employee_ids' => [$incentive->employees->first()->id],
        ];

        $this->actingAs($admin)
            ->put(route('incentives.update', $incentive), $payload)
            ->assertRedirect(route('incentives.index'))
            ->assertSessionHas('error', 'Failed to update incentive: Update failed');

        $this->assertDatabaseMissing('incentives', ['incentive_name' => 'Fail Update']);
    });

    it('denies unauthorized users', function () {
        $user = incentiveRegularUser();
        $incentive = createIncentiveWithRelations();

        $this->actingAs($user)
            ->put(route('incentives.update', $incentive), [])
            ->assertForbidden();
    });
});

// ─── Destroy ──────────────────────────────────────────────────────────────────

describe('DELETE /incentives/{incentive} (destroy)', function () {

    it('deletes an incentive and redirects with warning message', function () {
        $admin = incentiveAdminUser();
        $incentive = createIncentiveWithRelations();

        $this->actingAs($admin)
            ->delete(route('incentives.destroy', $incentive))
            ->assertRedirect(route('incentives.index'))
            ->assertSessionHas('warning', 'Incentive deleted successfully.');

        $this->assertDatabaseMissing('incentives', ['id' => $incentive->id]);
        expect($incentive->employees()->count())->toBe(0);
    });


    it('denies unauthorized users', function () {
        $user = incentiveRegularUser();
        $incentive = createIncentiveWithRelations();

        $this->actingAs($user)
            ->delete(route('incentives.destroy', $incentive))
            ->assertForbidden();
    });
});