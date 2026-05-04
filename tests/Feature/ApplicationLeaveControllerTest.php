<?php

use App\Enums\ApplicationLeaveEnum;
use App\Models\ApplicationLeave;
use App\Models\Employee;
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

    // Create an employee for the admin user
    $this->employee = Employee::factory()->create(['user_id' => $this->user->id, 'emp_code' => 'EMP001']);
});

// Helper to generate valid store data – matches the actual validation rules
function appLeaveValidStoreData(array $overrides = []): array
{
    $employee = \App\Models\Employee::factory()->create();
    return array_merge([
        'employee_id'     => $employee->id,
        'app_date'        => now()->toDateString(),
        'reason_to_leave' => 'Vacation leave',
        'leave_start'     => now()->addDays(1)->toDateString(),
        'leave_end'       => now()->addDays(3)->toDateString(),
        'app_status'      => ApplicationLeaveEnum::PENDING->value,
    ], $overrides);
}

// Helper for update – includes required 'remarks' field
function appLeaveValidUpdateData(array $overrides = []): array
{
    return array_merge([
        'app_status' => ApplicationLeaveEnum::APPROVED->value,
        'remarks'    => 'Approved after review',   // required field
    ], $overrides);
}

describe('Authorization', function () {
    it('allows viewing index', function () {
        get(route('application-leave.index'))->assertOk();
    });

    it('allows viewing create form', function () {
        get(route('application-leave.create'))->assertOk();
    });

    it('allows storing an application', function () {
        post(route('application-leave.store'), appLeaveValidStoreData())
            ->assertRedirect(route('application-leave.index'));
    });

    it('allows editing an application', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        get(route('application-leave.edit', $application))->assertOk();
    });

    it('allows updating an application', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        put(route('application-leave.update', $application), appLeaveValidUpdateData())
            ->assertRedirect(route('application-leave.index'));
    });

    it('allows deleting an application', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        delete(route('application-leave.destroy', $application))
            ->assertRedirect(route('application-leave.index'));
    });
});

describe('Index Page', function () {
    it('renders with paginated applications', function () {
        ApplicationLeave::factory()->count(15)->create(['employee_id' => $this->employee->id]);

        get(route('application-leave.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApplicationLeave/index')
                ->has('applicationLeaves.data', 10)
                ->has('applicationLeaves.links')
                ->has('filters')
                ->has('applicationLeaveEnum')
                ->where('totalCount', 15)
                ->where('filteredCount', 15)
            );
    });

    it('searches applications by employee name or emp code', function () {
        $employee1 = Employee::factory()->create(['emp_code' => 'ABC123']);
        $employee2 = Employee::factory()->create(['emp_code' => 'XYZ789']);
        $user1 = User::factory()->create(['name' => 'John Doe']);
        $user2 = User::factory()->create(['name' => 'Jane Smith']);
        $employee1->update(['user_id' => $user1->id]);
        $employee2->update(['user_id' => $user2->id]);

        ApplicationLeave::factory()->create(['employee_id' => $employee1->id]);
        ApplicationLeave::factory()->create(['employee_id' => $employee2->id]);

        get(route('application-leave.index', ['search' => 'John']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applicationLeaves.data', 1)
                ->where('filteredCount', 1)
                ->where('totalCount', 1)
            );

        get(route('application-leave.index', ['search' => 'ABC123']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applicationLeaves.data', 1)
                ->where('filteredCount', 1)
            );
    });

    it('filters by status', function () {
        ApplicationLeave::factory()->create(['employee_id' => $this->employee->id, 'app_status' => ApplicationLeaveEnum::PENDING->value]);
        ApplicationLeave::factory()->create(['employee_id' => $this->employee->id, 'app_status' => ApplicationLeaveEnum::APPROVED->value]);

        get(route('application-leave.index', ['status' => ApplicationLeaveEnum::PENDING->value]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applicationLeaves.data', 1)
                ->where('filteredCount', 1)
                ->where('totalCount', 1)
            );

        get(route('application-leave.index', ['status' => 'all']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applicationLeaves.data', 2)
                ->where('filteredCount', 2)
                ->where('totalCount', 2)
            );
    });

    it('respects perPage parameter', function () {
        ApplicationLeave::factory()->count(20)->create(['employee_id' => $this->employee->id]);

        get(route('application-leave.index', ['perPage' => 5]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applicationLeaves.data', 5)
                ->where('applicationLeaves.per_page', 5)
            );

        get(route('application-leave.index', ['perPage' => 25]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('applicationLeaves.data', 20)
                ->where('applicationLeaves.per_page', 25)
            );
    });
});

describe('Store Application Leave', function () {
    it('creates an application with valid data', function () {
        $data = appLeaveValidStoreData(['reason_to_leave' => 'Family emergency']);
        post(route('application-leave.store'), $data)
            ->assertRedirect(route('application-leave.index'));

        assertDatabaseHas('application_leaves', [
            'reason_to_leave' => 'Family emergency',
            'app_status' => ApplicationLeaveEnum::PENDING->value,
        ]);
    });

    it('validates required fields', function () {
        post(route('application-leave.store'), [])
            ->assertSessionHasErrors(['reason_to_leave', 'leave_start', 'leave_end']);
    });

    it('validates that leave_end is after leave_start', function () {
        $data = appLeaveValidStoreData([
            'leave_start' => now()->addDays(5)->toDateString(),
            'leave_end'   => now()->addDays(3)->toDateString(),
        ]);
        post(route('application-leave.store'), $data)
            ->assertSessionHasErrors('leave_end');
    });
});

describe('Update Application Leave', function () {
    it('updates an existing application', function () {
        $application = ApplicationLeave::factory()->create([
            'employee_id' => $this->employee->id,
            'app_status'  => ApplicationLeaveEnum::PENDING->value,
        ]);

        $updateData = appLeaveValidUpdateData([
            'app_status' => ApplicationLeaveEnum::REJECTED->value,
            'remarks'    => 'Insufficient documentation',
        ]);

        put(route('application-leave.update', $application), $updateData)
            ->assertRedirect(route('application-leave.index'));

        assertDatabaseHas('application_leaves', [
            'id'         => $application->id,
            'app_status' => ApplicationLeaveEnum::REJECTED->value,
            'remarks'    => 'Insufficient documentation',
        ]);
    });

    it('validates status is valid enum value', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        put(route('application-leave.update', $application), appLeaveValidUpdateData(['app_status' => 'invalid']))
            ->assertSessionHasErrors('app_status');
    });
});

describe('Delete Application Leave', function () {
    it('deletes an application', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        delete(route('application-leave.destroy', $application))
            ->assertRedirect(route('application-leave.index'));

        assertDatabaseCount('application_leaves', 0);
    });
});

describe('Rate Limiting', function () {
    it('prevents too many store attempts', function () {
        for ($i = 0; $i < 21; $i++) {
            $response = post(route('application-leave.store'), appLeaveValidStoreData());
            if ($i >= 20) {
                $response->assertSessionHas('error', 'Too many attempts. Please try again later.');
            }
        }
    });

    it('prevents too many update attempts', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        for ($i = 0; $i < 21; $i++) {
            $response = put(route('application-leave.update', $application), appLeaveValidUpdateData());
            if ($i >= 20) {
                $response->assertSessionHas('error', 'Too many attempts. Please try again later.');
            }
        }
    });

    it('prevents too many delete attempts', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        for ($i = 0; $i < 21; $i++) {
            $response = delete(route('application-leave.destroy', $application));
            if ($i >= 20) {
                $response->assertSessionHas('error', 'Too many attempts. Please try again later.');
            }
            if ($i < 20) {
                $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
            }
        }
    });
});

describe('Edit Form', function () {
    it('loads the edit page with application data and enum', function () {
        $application = ApplicationLeave::factory()->create(['employee_id' => $this->employee->id]);
        get(route('application-leave.edit', $application))
            ->assertInertia(fn (Assert $page) => $page
                ->component('ApplicationLeave/edit')
                ->has('applicationLeave')
                ->has('applicationLeaveEnum')
                ->where('applicationLeave.id', $application->id)
            );
    });
});