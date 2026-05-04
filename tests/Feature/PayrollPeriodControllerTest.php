<?php

use App\Enums\PayrollPeriodStatusEnum;
use App\Models\PayrollPeriod;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

beforeEach(function () {
    $this->withoutVite();

    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->user = User::factory()->create(['name' => 'Admin User']);
    $this->user->assignRole($role);
    actingAs($this->user);
});

function validPayrollPeriodStoreData(array $overrides = []): array
{
    return array_merge([
        'start_date'         => now()->startOfMonth()->toDateString(),
        'end_date'           => now()->endOfMonth()->toDateString(),
        'pay_date'           => now()->addDays(5)->toDateString(),
        'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
    ], $overrides);
}

function validPayrollPeriodUpdateData(array $overrides = []): array
{
    return array_merge([
        'start_date'         => now()->startOfMonth()->addMonth()->toDateString(),
        'end_date'           => now()->endOfMonth()->addMonth()->toDateString(),
        'pay_date'           => now()->addDays(10)->toDateString(),
        'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
        'is_paid'            => false,
    ], $overrides);
}

describe('Authorization', function () {
    it('allows viewing index', function () {
        get(route('payroll-periods.index'))->assertOk();
    });

    // create route is excluded – test removed

    it('allows storing a payroll period', function () {
        post(route('payroll-periods.store'), validPayrollPeriodStoreData())
            ->assertRedirect(route('payroll-periods.index'));
    });

    // show route is excluded – test removed

    it('allows editing a payroll period', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        get(route('payroll-periods.edit', $payrollPeriod))->assertOk();
    });

    it('allows updating a payroll period', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        put(route('payroll-periods.update', $payrollPeriod), validPayrollPeriodUpdateData())
            ->assertRedirect(route('payroll-periods.index'));
    });

    // destroy route is excluded – test removed
});

describe('Index Page', function () {
    it('renders all payroll periods without pagination', function () {
        for ($i = 0; $i < 5; $i++) {
            PayrollPeriod::create([
                'start_date' => now()->startOfMonth()->addMonths($i),
                'end_date' => now()->endOfMonth()->addMonths($i),
                'pay_date' => now()->addDays(5)->addMonths($i),
                'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
                'is_paid' => false,
            ]);
        }

        get(route('payroll-periods.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('PayrollPeriod/index')
                ->has('payrollPeriods', 5)
                ->has('payroll_period_enums')
            );
    });
});

// Create page test removed (route does not exist)

describe('Store Payroll Period', function () {
    it('creates a payroll period with valid data', function () {
        $data = validPayrollPeriodStoreData(['start_date' => '2025-01-01']);
        post(route('payroll-periods.store'), $data)
            ->assertRedirect(route('payroll-periods.index'));

        assertDatabaseHas('payroll_periods', [
            'start_date' => '2025-01-01',
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
        ]);
    });

    it('validates required fields', function () {
        post(route('payroll-periods.store'), [])
            ->assertSessionHasErrors(['start_date', 'end_date', 'pay_date', 'payroll_per_status']);
    });

    it('validates payroll_per_status is a valid enum value', function () {
        $data = validPayrollPeriodStoreData(['payroll_per_status' => 'invalid']);
        post(route('payroll-periods.store'), $data)
            ->assertSessionHasErrors('payroll_per_status');
    });
});

// Show page test removed

describe('Edit Page', function () {
    it('loads the edit page with payroll period and enums', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        get(route('payroll-periods.edit', $payrollPeriod))
            ->assertInertia(fn (Assert $page) => $page
                ->component('PayrollPeriod/edit')
                ->has('payrollPeriod')
                ->has('payroll_period_enums')
                ->where('payrollPeriod.id', $payrollPeriod->id)
            );
    });
});

describe('Update Payroll Period', function () {
    it('updates an existing payroll period', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        $updateData = validPayrollPeriodUpdateData([
            'payroll_per_status' => PayrollPeriodStatusEnum::COMPLETED->value,
            'is_paid' => true,
        ]);

        put(route('payroll-periods.update', $payrollPeriod), $updateData)
            ->assertRedirect(route('payroll-periods.index'));

        assertDatabaseHas('payroll_periods', [
            'id' => $payrollPeriod->id,
            'payroll_per_status' => PayrollPeriodStatusEnum::COMPLETED->value,
            'is_paid' => true,
        ]);
    });

    it('validates required fields on update', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        put(route('payroll-periods.update', $payrollPeriod), [])
            ->assertSessionHasErrors(['start_date', 'end_date', 'pay_date', 'payroll_per_status']);
    });

    it('validates that is_paid must be true when pay_date has passed', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        $pastDate = now()->subDays(1)->toDateString();
        $updateData = validPayrollPeriodUpdateData([
            'pay_date' => $pastDate,
            'is_paid' => false,
        ]);

        put(route('payroll-periods.update', $payrollPeriod), $updateData)
            ->assertSessionHasErrors('is_paid');
    });

    it('validates that is_paid must be true when status is completed', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        $updateData = validPayrollPeriodUpdateData([
            'payroll_per_status' => PayrollPeriodStatusEnum::COMPLETED->value,
            'is_paid' => false,
        ]);

        put(route('payroll-periods.update', $payrollPeriod), $updateData)
            ->assertSessionHasErrors('is_paid');
    });
});

// Delete payroll period tests removed (destroy route excluded)

describe('Rate Limiting', function () {
    it('prevents too many store attempts (limit 5 per minute)', function () {
        for ($i = 0; $i < 6; $i++) {
            $response = post(route('payroll-periods.store'), validPayrollPeriodStoreData());
            if ($i >= 5) {
                $response->assertSessionHas('error', 'Too many attempts. Please try again later.');
            }
        }
    });

    it('prevents too many update attempts', function () {
        $payrollPeriod = PayrollPeriod::create([
            'start_date' => now()->startOfMonth(),
            'end_date' => now()->endOfMonth(),
            'pay_date' => now()->addDays(5),
            'payroll_per_status' => PayrollPeriodStatusEnum::PROCESSING->value,
            'is_paid' => false,
        ]);
        for ($i = 0; $i < 6; $i++) {
            $response = put(route('payroll-periods.update', $payrollPeriod), validPayrollPeriodUpdateData());
            if ($i >= 5) {
                $response->assertSessionHas('error', 'Too many attempts. Please try again later.');
            }
        }
    });

    
});