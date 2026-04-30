<?php

use App\Enums\PayrollPeriodStatusEnum;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

beforeEach(function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->user = User::factory()->create();
    $this->user->assignRole($role);
    actingAs($this->user);

    $this->payrollPeriod = PayrollPeriod::create([
        'start_date'         => '2025-01-01',
        'end_date'           => '2025-01-15',
        'pay_date'           => '2025-01-20',
        'payroll_per_status' => PayrollPeriodStatusEnum::OPEN->value,
        'is_paid'            => true,
    ]);

    $this->employee = Employee::factory()->create(['employee_status' => 'active']);
});

function validDeductionData(array $overrides = []): array
{
    return array_merge([
        'deduction_name'    => 'SSS Contribution',
        'deduction_amount'  => 500,
        'payroll_period_id' => null,
        'employee_ids'      => [],
    ], $overrides);
}

describe('Authorization', function () {
    it('allows viewing index', function () {
        get(route('deductions.index'))->assertOk();
    });

    it('allows viewing create form', function () {
        get(route('deductions.create'))->assertOk();
    });

    it('allows viewing edit form', function () {
        $deduction = Deduction::create([
            'deduction_name'    => 'Test Deduction',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);
        $deduction->employees()->attach($this->employee->id);

        get(route('deductions.edit', $deduction))->assertOk();
    });

    it('denies unauthenticated users', function () {
        auth()->logout();
        get(route('deductions.index'))->assertRedirect(route('login'));
    });
});

describe('Index Page', function () {
    it('renders with correct inertia props', function () {
        get(route('deductions.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('deductions/index')
                ->has('deductions')
                ->has('payroll_periods')
                ->has('employees')
                ->has('filters')
            );
    });

    it('searches deductions by name', function () {
        Deduction::create([
            'deduction_name'    => 'sss contribution',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);
        Deduction::create([
            'deduction_name'    => 'pagibig fund',
            'deduction_amount'  => 200,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);

        get(route('deductions.index', ['search' => 'sss']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('deductions.data', 1)
            );
    });

    it('filters deductions by date range', function () {
        Deduction::create([
            'deduction_name'    => 'january deduction',
            'deduction_amount'  => 300,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);

        get(route('deductions.index', [
            'date_from' => '2025-01-01',
            'date_to'   => '2025-01-31',
        ]))->assertInertia(fn (Assert $page) => $page
            ->has('deductions.data', 1)
        );
    });
});

describe('Store Deduction', function () {
    it('creates a deduction with valid data', function () {
        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
        ]);

        post(route('deductions.store'), $data)
            ->assertRedirect(route('deductions.index'));

        assertDatabaseHas('deductions', [
            'deduction_name'   => 'SSS Contribution',
            'deduction_amount' => '500',
        ]);
    });

    it('requires deduction_name', function () {
        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
            'deduction_name'    => '',
        ]);
        post(route('deductions.store'), $data)
            ->assertSessionHasErrors('deduction_name');
    });

    it('requires deduction_amount', function () {
        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
            'deduction_amount'  => '',
        ]);
        post(route('deductions.store'), $data)
            ->assertSessionHasErrors('deduction_amount');
    });

    it('requires deduction_amount to be at least 100', function () {
        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
            'deduction_amount'  => 50,
        ]);
        post(route('deductions.store'), $data)
            ->assertSessionHasErrors('deduction_amount');
    });

    it('requires payroll_period_id', function () {
        $data = validDeductionData([
            'payroll_period_id' => '',
            'employee_ids'      => [$this->employee->id],
        ]);
        post(route('deductions.store'), $data)
            ->assertSessionHasErrors('payroll_period_id');
    });

    it('requires at least one employee', function () {
        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [],
        ]);
        post(route('deductions.store'), $data)
            ->assertSessionHasErrors('employee_ids');
    });

    it('requires valid employee ids', function () {
        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [99999],
        ]);
        post(route('deductions.store'), $data)
            ->assertSessionHasErrors('employee_ids.0');
    });

    it('requires valid payroll_period_id', function () {
        $data = validDeductionData([
            'payroll_period_id' => 99999,
            'employee_ids'      => [$this->employee->id],
        ]);
        post(route('deductions.store'), $data)
            ->assertSessionHasErrors('payroll_period_id');
    });

    it('attaches employees to deduction', function () {
        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
        ]);
        post(route('deductions.store'), $data);

        $deduction = Deduction::first();
        expect($deduction->employees)->toHaveCount(1);
        expect($deduction->employees->first()->id)->toBe($this->employee->id);
    });
});

describe('Update Deduction', function () {
    it('updates a deduction with valid data', function () {
        $deduction = Deduction::create([
            'deduction_name'    => 'old name',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);
        $deduction->employees()->attach($this->employee->id);

        $data = validDeductionData([
            'deduction_name'    => 'Updated Deduction',
            'deduction_amount'  => 800,
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
        ]);

        put(route('deductions.update', $deduction), $data)
            ->assertRedirect(route('deductions.index'));

        assertDatabaseHas('deductions', [
            'id'               => $deduction->id,
            'deduction_name'   => 'Updated Deduction',
            'deduction_amount' => '800',
        ]);
    });

    it('validates deduction_name min length', function () {
        $deduction = Deduction::create([
            'deduction_name'    => 'valid name',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);

        $data = validDeductionData([
            'deduction_name'    => 'ab',
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
        ]);

        put(route('deductions.update', $deduction), $data)
            ->assertSessionHasErrors('deduction_name');
    });

    it('validates deduction_amount max', function () {
        $deduction = Deduction::create([
            'deduction_name'    => 'valid name',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);

        $data = validDeductionData([
            'deduction_amount'  => 99999999,
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$this->employee->id],
        ]);

        put(route('deductions.update', $deduction), $data)
            ->assertSessionHasErrors('deduction_amount');
    });

    it('syncs employees on update', function () {
        $newEmployee = Employee::factory()->create(['employee_status' => 'active']);

        $deduction = Deduction::create([
            'deduction_name'    => 'sync test',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);
        $deduction->employees()->attach($this->employee->id);

        $data = validDeductionData([
            'payroll_period_id' => $this->payrollPeriod->id,
            'employee_ids'      => [$newEmployee->id],
        ]);

        put(route('deductions.update', $deduction), $data);

        $deduction->refresh();
        expect($deduction->employees)->toHaveCount(1);
        expect($deduction->employees->first()->id)->toBe($newEmployee->id);
    });
});

describe('Delete Deduction', function () {
    it('deletes a deduction', function () {
        $deduction = Deduction::create([
            'deduction_name'    => 'to be deleted',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);

        delete(route('deductions.destroy', $deduction))
            ->assertRedirect(route('deductions.index'));

        assertDatabaseMissing('deductions', ['id' => $deduction->id]);
    });

    it('redirects with warning flash on delete', function () {
        $deduction = Deduction::create([
            'deduction_name'    => 'flash test',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);

        delete(route('deductions.destroy', $deduction))
            ->assertRedirect(route('deductions.index'))
            ->assertSessionHas('warning');
    });

    it('detaches employees when deduction is deleted', function () {
        $deduction = Deduction::create([
            'deduction_name'    => 'with employees',
            'deduction_amount'  => 500,
            'payroll_period_id' => $this->payrollPeriod->id,
        ]);
        $deduction->employees()->attach($this->employee->id);

        delete(route('deductions.destroy', $deduction));

        assertDatabaseMissing('employee_deductions', [
            'deduction_id' => $deduction->id,
            'employee_id'  => $this->employee->id,
        ]);
    });
});