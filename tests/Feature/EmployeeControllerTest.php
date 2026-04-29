<?php

use App\Models\Branch;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Site;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertSoftDeleted;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

beforeEach(function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->user = User::factory()->create();
    $this->user->assignRole($role);
    actingAs($this->user);

    $this->position = Position::factory()->create(['is_salary_fixed' => true]);
    $this->branch   = Branch::factory()->create();
    $this->site     = Site::factory()->create(['branch_id' => $this->branch->id]);
});

function validEmployeeData(array $overrides = []): array
{
    return array_merge([
        'name'                     => 'Juan Dela Cruz',
        'email'                    => 'juan@example.com',
        'password'                 => 'Password@123',
        'emp_code'                 => '1001',
        'employee_number'          => '09171234567',
        'emergency_contact_number' => '09181234567',
        'contract_start_date'      => '2024-01-01',
        'contract_end_date'        => '2025-01-01',
        'sss_number'               => '1234567890',
        'pagibig_number'           => '1234567891',
        'philhealth_number'        => '1234567892',
        'pay_frequency'            => 'monthly',
        'employee_status'          => 'active',
        'position_id'              => null,
        'branch_id'                => null,
        'site_id'                  => null,
    ], $overrides);
}

describe('Authorization', function () {
    it('allows viewing index', function () {
        get(route('employees.index'))->assertOk();
    });

    it('allows viewing create form', function () {
        get(route('employees.create'))->assertOk();
    });

    it('allows viewing show page', function () {
        $employee = Employee::factory()->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);
        get(route('employees.show', $employee))->assertOk();
    });

    it('allows viewing edit form', function () {
        $employee = Employee::factory()->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);
        get(route('employees.edit', $employee))->assertOk();
    });

    it('denies unauthenticated users', function () {
        auth()->logout();
        get(route('employees.index'))->assertRedirect(route('login'));
    });
});

describe('Index Page', function () {
    it('renders with correct inertia props', function () {
        Employee::factory()->count(3)->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);

        get(route('employees.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('employees/index')
                ->has('employees.data')
                ->has('filters')
                ->has('totalCount')
                ->has('filteredCount')
                ->has('positionsList')
                ->has('allBranchesForAssign')
                ->has('archivedEmployees')
            );
    });

    it('searches employees by emp_code', function () {
        Employee::factory()->create([
            'emp_code'    => '9999',
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);
        Employee::factory()->create([
            'emp_code'    => '8888',
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);

        get(route('employees.index', ['search' => '9999']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', 1)
            );
    });
});

describe('Store Employee', function () {
    it('creates an employee with valid data', function () {
        $data = validEmployeeData([
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]);
        post(route('employees.store'), $data)
            ->assertRedirect(route('employees.index'));
        assertDatabaseHas('employees', ['emp_code' => '1001']);
    });

    it('requires emp_code', function () {
        $data = validEmployeeData(['branch_id' => $this->branch->id, 'emp_code' => '']);
        post(route('employees.store'), $data)
            ->assertSessionHasErrors('emp_code');
    });

    it('requires branch_id', function () {
        $data = validEmployeeData(['branch_id' => '']);
        post(route('employees.store'), $data)
            ->assertSessionHasErrors('branch_id');
    });

    it('requires unique emp_code', function () {
        Employee::factory()->create([
            'emp_code'  => '1001',
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]);
        $data = validEmployeeData(['branch_id' => $this->branch->id, 'emp_code' => '1001']);
        post(route('employees.store'), $data)
            ->assertSessionHasErrors('emp_code');
    });

    it('requires unique employee_number', function () {
        Employee::factory()->create([
            'employee_number' => '09171234567',
            'branch_id'       => $this->branch->id,
            'site_id'         => $this->site->id,
        ]);
        $data = validEmployeeData([
            'branch_id'       => $this->branch->id,
            'employee_number' => '09171234567',
        ]);
        post(route('employees.store'), $data)
            ->assertSessionHasErrors('employee_number');
    });

    it('requires contract_end_date after or equal to start date', function () {
        $data = validEmployeeData([
            'branch_id'           => $this->branch->id,
            'contract_start_date' => '2025-01-01',
            'contract_end_date'   => '2024-01-01',
        ]);
        post(route('employees.store'), $data)
            ->assertSessionHasErrors('contract_end_date');
    });
});

describe('Update Employee', function () {
    it('updates an existing employee', function () {
        $employee = Employee::factory()->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);

        $data = validEmployeeData([
            'branch_id'       => $this->branch->id,
            'site_id'         => $this->site->id,
            'email'           => 'updated@example.com',
            'emp_code'        => '2002',
            'employee_number' => '09179999999',
        ]);

        put(route('employees.update', $employee), $data)
            ->assertRedirect(route('employees.index'));

        assertDatabaseHas('employees', ['emp_code' => '2002']);
    });

    it('validates unique emp_code except current', function () {
        Employee::factory()->create([
            'emp_code'  => '3003',
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]);
        $employee = Employee::factory()->create([
            'emp_code'  => '4004',
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]);

        $data = validEmployeeData([
            'branch_id' => $this->branch->id,
            'emp_code'  => '3003',
        ]);
        put(route('employees.update', $employee), $data)
            ->assertSessionHasErrors('emp_code');
    });
});

describe('Delete Employee', function () {
    it('soft deletes an employee', function () {
        $employee = Employee::factory()->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);

        delete(route('employees.destroy', $employee))
            ->assertRedirect(route('employees.index'));

        assertSoftDeleted($employee);
    });

    it('sets employee status to inactive on delete', function () {
        $employee = Employee::factory()->create([
            'branch_id'       => $this->branch->id,
            'position_id'     => $this->position->id,
            'site_id'         => $this->site->id,
            'employee_status' => 'active',
        ]);

        delete(route('employees.destroy', $employee));

        assertDatabaseHas('employees', [
            'id'              => $employee->id,
            'employee_status' => 'inactive',
        ]);
    });
});

describe('Restore Employee', function () {
    it('restores a soft deleted employee', function () {
        $employee = Employee::factory()->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);
        $employee->delete();

        // Route is PUT employees/{employee}/restore
        $this->put(route('employees.restore', $employee))
            ->assertRedirect(route('employees.index'));

        assertDatabaseHas('employees', [
            'id'              => $employee->id,
            'deleted_at'      => null,
            'employee_status' => 'active',
        ]);
    });
});

describe('Bulk Operations', function () {
    it('bulk deletes employees', function () {
        $employees = Employee::factory()->count(3)->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);

        // Route has no name: DELETE employees/bulk-destroy
        $this->delete('/employees/bulk-destroy', [
            'ids' => $employees->pluck('id')->toArray(),
        ])->assertRedirect(route('employees.index'));

        $employees->each(fn ($e) => assertSoftDeleted($e));
    });

    it('bulk restores employees', function () {
        $employees = Employee::factory()->count(3)->create([
            'branch_id'   => $this->branch->id,
            'position_id' => $this->position->id,
            'site_id'     => $this->site->id,
        ]);
        $employees->each->delete();

        // Route has no name: PUT employees/bulk-restore
        $this->put('/employees/bulk-restore', [
            'ids' => $employees->pluck('id')->toArray(),
        ])->assertRedirect(route('employees.index'));

        $employees->each(fn ($e) => assertDatabaseHas('employees', [
            'id'         => $e->id,
            'deleted_at' => null,
        ]));
    });

    it('bulk assigns position to employees without one', function () {
        $employees = Employee::factory()->count(3)->create([
            'branch_id'   => $this->branch->id,
            'position_id' => null,
            'site_id'     => $this->site->id,
        ]);

        post(route('employees.bulk-assign-position'), [
            'ids'         => $employees->pluck('id')->toArray(),
            'position_id' => $this->position->id,
        ])->assertRedirect();

        $employees->each(fn ($e) => assertDatabaseHas('employees', [
            'id'          => $e->id,
            'position_id' => $this->position->id,
        ]));
    });

    it('bulk assigns branch and site to employees', function () {
        $employees = Employee::factory()->count(3)->create([
            'branch_id' => null,
            'site_id'   => null,
        ]);

        post(route('employees.bulk-assign-branch-site'), [
            'ids'       => $employees->pluck('id')->toArray(),
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ])->assertRedirect();

        $employees->each(fn ($e) => assertDatabaseHas('employees', [
            'id'        => $e->id,
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]));
    });

    it('returns error when no ids provided for bulk delete', function () {
        $this->delete('/employees/bulk-destroy', ['ids' => []])
            ->assertRedirect()
            ->assertSessionHas('error');
    });
});

describe('Cache', function () {
    it('forgets employees cache on store', function () {
        Cache::spy();
        $data = validEmployeeData([
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]);
        post(route('employees.store'), $data);
        Cache::shouldHaveReceived('forget')->with('employees')->once();
    });

    it('forgets employees cache on update', function () {
        Cache::spy();
        $employee = Employee::factory()->create([
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]);
        $data = validEmployeeData([
            'branch_id'       => $this->branch->id,
            'site_id'         => $this->site->id,
            'email'           => 'cache@example.com',
            'emp_code'        => '9090',
            'employee_number' => '09170000001',
        ]);
        put(route('employees.update', $employee), $data);
        Cache::shouldHaveReceived('forget')->with('employees')->once();
    });

    it('forgets employees cache on delete', function () {
        Cache::spy();
        $employee = Employee::factory()->create([
            'branch_id' => $this->branch->id,
            'site_id'   => $this->site->id,
        ]);
        delete(route('employees.destroy', $employee));
        Cache::shouldHaveReceived('forget')->with('employees')->once();
    });
});