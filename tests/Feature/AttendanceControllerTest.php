<?php

use App\Models\AttendanceExceptionStat;
use App\Models\AttendanceLog;
use App\Models\AttendancePeriodStat;
use App\Models\AttendanceSchedule;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    $this->withoutVite();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $employeeRole = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);

    $this->admin = User::factory()->create(['name' => 'Admin User']);
    $this->admin->assignRole($adminRole);

    $this->hrHead = User::factory()->create(['name' => 'HR Head']);
    // hr_head role exists but route middleware 'admin' blocks access
    $hrHeadRole = Role::firstOrCreate(['name' => 'hr_head', 'guard_name' => 'web']);
    $this->hrHead->assignRole($hrHeadRole);

    $this->unauthorizedUser = User::factory()->create(['name' => 'Regular User']);
    $this->unauthorizedUser->assignRole($employeeRole);

    // Create minimal test data to ensure the controller has something to display
    // This avoids the need for mocking static service calls
    AttendanceLog::create([
        'employee_id' => 1,
        'employee_name' => 'Test Employee',
        'department' => 'IT',
        'date' => now()->toDateString(),
        'time_in' => '09:00:00',
        'time_out' => '18:00:00',
        'total_hours' => 8,
        'is_overtime' => false,
    ]);

    AttendanceExceptionStat::create([
        'employee_id' => 1,
        'employee_name' => 'Test Employee',
        'department' => 'IT',
        'date' => now()->toDateString(),
        'late_minutes' => 0,
        'leave_early_minutes' => 0,
        'absence_minutes' => 0,
        'total_exception_minutes' => 0,
    ]);

    AttendancePeriodStat::create([
        'employee_id' => 1,
        'employee_name' => 'Test Employee',
        'department' => 'IT',
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'normal_work_hours' => 160,
        'real_work_hours' => 160,
        'late_times' => 0,
        'late_minutes' => 0,
        'attended_days' => 20,
        'absent_days' => 0,
        'real_pay' => 50000,
    ]);

    AttendanceSchedule::create([
        'employee_id' => 1,
        'employee_name' => 'Test Employee',
        'department' => 'IT',
        'date' => now()->toDateString(),
        'shift_code' => 'MORNING',
        'shift_label' => 'Morning Shift',
    ]);
});

// -----------------------------------------------------------------------------
// Authorization – only users with 'admin' middleware can access
// (the route is protected by 'admin' middleware, so hr_head is also denied)
// -----------------------------------------------------------------------------
describe('Authorization', function () {
    it('allows admin to view attendance', function () {
        actingAs($this->admin);
        get(route('attendances.index'))->assertOk();
    });

    it('denies hr_head because route uses admin middleware', function () {
        actingAs($this->hrHead);
        get(route('attendances.index'))->assertForbidden();
    });

    it('denies unauthorized user', function () {
        actingAs($this->unauthorizedUser);
        get(route('attendances.index'))->assertForbidden();
    });
});

// -----------------------------------------------------------------------------
// Tab switching
// -----------------------------------------------------------------------------
describe('Tab switching', function () {
    beforeEach(fn () => actingAs($this->admin));

    it('renders default logs tab', function () {
        get(route('attendances.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendances/index')
                ->where('currentTab', 'logs')
                ->has('logs')
                ->has('timelineData')
                ->has('exceptionStats')
                ->has('calendarData')
                ->has('periodStats')
                ->has('visualData')
                ->has('schedules')
                ->has('scheduleCalendarData')
                ->has('filters')
                ->has('totalCounts')
                ->has('filteredCounts')
            );
    });

    it('switches to exceptions tab', function () {
        get(route('attendances.index', ['tab' => 'exceptions']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentTab', 'exceptions')
            );
    });

    it('switches to periods tab', function () {
        get(route('attendances.index', ['tab' => 'periods']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentTab', 'periods')
            );
    });

    it('switches to schedules tab', function () {
        get(route('attendances.index', ['tab' => 'schedules']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentTab', 'schedules')
            );
    });
});

// -----------------------------------------------------------------------------
// Pagination and search (basic structure tests)
// -----------------------------------------------------------------------------
describe('Pagination and search', function () {
    beforeEach(fn () => actingAs($this->admin));

    it('accepts perPage parameter without error', function () {
        get(route('attendances.index', ['perPage' => 25, 'tab' => 'logs']))->assertOk();
    });

    it('accepts search parameter without error', function () {
        get(route('attendances.index', ['search' => 'test', 'tab' => 'logs']))->assertOk();
    });
});

// -----------------------------------------------------------------------------
// Special data fetching – ensure the arrays are present and have the correct size
// (real data inserted in beforeEach ensures non‑empty collections)
// -----------------------------------------------------------------------------
describe('Special data fetching', function () {
    beforeEach(fn () => actingAs($this->admin));

    it('provides timelineData when tab is logs', function () {
        $response = get(route('attendances.index', ['tab' => 'logs']));
        $response->assertInertia(fn (Assert $page) => $page
            ->has('timelineData.0') // at least one record
        );
    });

    it('provides calendarData when tab is exceptions', function () {
        $response = get(route('attendances.index', ['tab' => 'exceptions']));
        $response->assertInertia(fn (Assert $page) => $page
            ->has('calendarData.0')
        );
    });

    it('provides visualData when tab is periods', function () {
        $response = get(route('attendances.index', ['tab' => 'periods']));
        $response->assertInertia(fn (Assert $page) => $page
            ->has('visualData.0')
        );
    });

    it('provides scheduleCalendarData when tab is schedules', function () {
        $response = get(route('attendances.index', ['tab' => 'schedules']));
        $response->assertInertia(fn (Assert $page) => $page
            ->has('scheduleCalendarData.0')
        );
    });
});

// -----------------------------------------------------------------------------
// Counts – check that the structure exists and contains integers
// -----------------------------------------------------------------------------
describe('Counts', function () {
    beforeEach(fn () => actingAs($this->admin));

    it('provides totalCounts and filteredCounts arrays with integer values', function () {
        get(route('attendances.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('totalCounts.logs')
                ->has('filteredCounts.logs')
                ->has('totalCounts.exceptionStats')
                ->has('filteredCounts.exceptionStats')
                ->has('totalCounts.periodStats')
                ->has('filteredCounts.periodStats')
                ->has('totalCounts.schedules')
                ->has('filteredCounts.schedules')
                ->whereType('totalCounts.logs', 'integer')
                ->whereType('filteredCounts.logs', 'integer')
            );
    });
});