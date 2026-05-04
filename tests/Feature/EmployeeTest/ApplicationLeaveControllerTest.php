<?php

use App\Actions\ApplicationLeave\CreateNewApplication;
use App\Models\ApplicationLeave;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

beforeEach(function () {
    $this->withoutVite();

    $employeeRole = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);
    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

    $this->employeeUser = User::factory()->create(['name' => 'Employee User']);
    $this->employeeUser->assignRole($employeeRole);

    $this->employee = Employee::factory()->create([
        'user_id' => $this->employeeUser->id,
        'emp_code' => 'EMP001',
    ]);

    $this->admin = User::factory()->create(['name' => 'Admin User']);
    $this->admin->assignRole($adminRole);

    // Mock the CreateNewApplication action for tests that need it
    $this->mockCreateAction = Mockery::mock(CreateNewApplication::class);
    $this->app->instance(CreateNewApplication::class, $this->mockCreateAction);

    Cache::flush();
});

afterEach(function () {
    Mockery::close();
});

function validEmployeeLeaveStoreData(array $overrides = []): array
{
    return array_merge([
        'app_date'         => now()->toDateString(),
        'reason_to_leave'  => 'Vacation leave',
        'leave_start'      => now()->addDays(1)->toDateString(),
        'leave_end'        => now()->addDays(3)->toDateString(),
    ], $overrides);
}

describe('Authorization', function () {
    it('allows employee to view index', function () {
        actingAs($this->employeeUser);
        $this->mockCreateAction->shouldReceive('approvedLimit')->once()->andReturn(0);
        get(route('employee.application-leave.index'))->assertOk();
    });

    it('denies admin from viewing employee index', function () {
        actingAs($this->admin);
        get(route('employee.application-leave.index'))->assertForbidden();
    });

    it('allows employee to view create form', function () {
        actingAs($this->employeeUser);
        get(route('employee.application-leave.create'))->assertOk();
    });

    it('denies admin from viewing create form', function () {
        actingAs($this->admin);
        get(route('employee.application-leave.create'))->assertForbidden();
    });

    it('allows employee to store an application', function () {
        actingAs($this->employeeUser);
        $this->mockCreateAction->shouldReceive('approvedLimit')->once()->andReturn(2);
        $this->mockCreateAction->shouldReceive('createNewApplicationLeave')
            ->once()
            ->andReturn(new ApplicationLeave());

        post(route('employee.application-leave.store'), validEmployeeLeaveStoreData())
            ->assertRedirect(route('employee.application-leave.index'));
    });

    it('denies admin from storing an application', function () {
        actingAs($this->admin);
        post(route('employee.application-leave.store'), validEmployeeLeaveStoreData())
            ->assertForbidden();
    });
});

describe('Index Page', function () {
    beforeEach(fn () => actingAs($this->employeeUser));

    it('renders index with user\'s applications and approved count', function () {
        ApplicationLeave::factory()->count(3)->create([
            'employee_id' => $this->employee->id,
            'app_status' => 'pending',
        ]);

        $this->mockCreateAction->shouldReceive('approvedLimit')->once()->andReturn(2);

        get(route('employee.application-leave.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('employee-role/ApplicationLeave/index')
                ->has('applicationLeaves', 3)
                ->where('approvedCount', 2)
            );
    });

    it('shows only the authenticated employee\'s applications', function () {
        $otherEmployee = Employee::factory()->create();
        ApplicationLeave::factory()->create(['employee_id' => $otherEmployee->id]);
        ApplicationLeave::factory()->count(2)->create(['employee_id' => $this->employee->id]);

        $this->mockCreateAction->shouldReceive('approvedLimit')->once()->andReturn(0);

        get(route('employee.application-leave.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applicationLeaves', 2)
            );
    });
});

describe('Create Page', function () {
    beforeEach(fn () => actingAs($this->employeeUser));

    it('renders create form', function () {
        get(route('employee.application-leave.create'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('employee-role/ApplicationLeave/create')
            );
    });
});

describe('Store Application Leave', function () {
    beforeEach(fn () => actingAs($this->employeeUser));

    it('creates an application when under approved limit', function () {
        // Real integration test – no mocking
        // Temporarily replace the mock with the real action
        $this->app->instance(CreateNewApplication::class, new CreateNewApplication());

        $data = validEmployeeLeaveStoreData(['reason_to_leave' => 'Family emergency']);

        $response = post(route('employee.application-leave.store'), $data);
        $response->assertRedirect(route('employee.application-leave.index'));
        $response->assertSessionHas('success');

        // Verify the record exists (only the field that is assuredly a string)
        assertDatabaseHas('application_leaves', [
            'reason_to_leave' => 'Family emergency',
            'employee_id'     => $this->employee->id,
        ]);

        // Restore the mock for subsequent tests
        $this->app->instance(CreateNewApplication::class, $this->mockCreateAction);
    });

    it('prevents creation when approved limit (5) is reached', function () {
        $data = validEmployeeLeaveStoreData();

        $this->mockCreateAction->shouldReceive('approvedLimit')->once()->andReturn(5);
        $this->mockCreateAction->shouldReceive('createNewApplicationLeave')->never();

        post(route('employee.application-leave.store'), $data)
            ->assertRedirect()
            ->assertSessionHas('error', 'You have reached the maximum limit of 5 approved leaves for this year.');
    });

    it('validates required fields', function () {
        $this->mockCreateAction->shouldReceive('approvedLimit')->never();
        $this->mockCreateAction->shouldReceive('createNewApplicationLeave')->never();

        post(route('employee.application-leave.store'), [])
            ->assertSessionHasErrors(['reason_to_leave', 'leave_start', 'leave_end']);
    });

    it('validates that leave_end is after leave_start', function () {
        $data = validEmployeeLeaveStoreData([
            'leave_start' => now()->addDays(5)->toDateString(),
            'leave_end'   => now()->addDays(3)->toDateString(),
        ]);

        $this->mockCreateAction->shouldReceive('approvedLimit')->never();
        $this->mockCreateAction->shouldReceive('createNewApplicationLeave')->never();

        post(route('employee.application-leave.store'), $data)
            ->assertSessionHasErrors('leave_end');
    });

    it('handles exception during creation', function () {
        $data = validEmployeeLeaveStoreData();

        $this->mockCreateAction->shouldReceive('approvedLimit')->once()->andReturn(2);
        $this->mockCreateAction->shouldReceive('createNewApplicationLeave')
            ->once()
            ->andThrow(new \Exception('Database error'));

        post(route('employee.application-leave.store'), $data)
            ->assertRedirect()
            ->assertSessionHas('error', 'An error occurred while submitting the leave application. Please try again.');
    });

    it('respects rate limiting (max 20 attempts per minute)', function () {
        for ($i = 0; $i < 20; $i++) {
            $this->mockCreateAction->shouldReceive('approvedLimit')->once()->andReturn(2);
            $this->mockCreateAction->shouldReceive('createNewApplicationLeave')->once()->andReturn(new ApplicationLeave());
        }

        for ($i = 0; $i < 20; $i++) {
            post(route('employee.application-leave.store'), validEmployeeLeaveStoreData())->assertRedirect();
        }

        $response = post(route('employee.application-leave.store'), validEmployeeLeaveStoreData());
        $response->assertRedirect();
        $response->assertSessionHas('error', 'Too many attempts. Please try again later.');
    });
});