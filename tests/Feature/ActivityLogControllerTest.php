<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    // Disable Vite manifest requirement during tests
    $this->withoutVite();

    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->user = User::factory()->create(['name' => 'Admin User', 'email' => 'admin@example.com']);
    $this->user->assignRole($role);
    actingAs($this->user);

    // Create some activity logs for testing
    $otherUser = User::factory()->create(['name' => 'Jane Doe', 'email' => 'jane@example.com']);

    // Create activities with different descriptions and subject types
    Activity::create([
        'log_name' => 'default',
        'description' => 'created',
        'subject_type' => 'App\Models\User',
        'subject_id' => $this->user->id,
        'causer_type' => get_class($this->user),
        'causer_id' => $this->user->id,
        'properties' => [],
        'created_at' => now(),
    ]);

    Activity::create([
        'log_name' => 'default',
        'description' => 'updated',
        'subject_type' => 'App\Models\User',
        'subject_id' => $otherUser->id,
        'causer_type' => get_class($this->user),
        'causer_id' => $this->user->id,
        'properties' => [],
        'created_at' => now(),
    ]);

    Activity::create([
        'log_name' => 'custom',
        'description' => 'deleted',
        'subject_type' => 'App\Models\Role',
        'subject_id' => $role->id,
        'causer_type' => get_class($this->user),
        'causer_id' => $this->user->id,
        'properties' => [],
        'created_at' => now(),
    ]);

    Activity::create([
        'log_name' => 'other',
        'description' => 'login',
        'subject_type' => null,
        'subject_id' => null,
        'causer_type' => get_class($this->user),
        'causer_id' => $this->user->id,
        'properties' => ['ip' => '127.0.0.1'],
        'created_at' => now(),
    ]);
});

describe('Index Page', function () {
    it('renders with paginated activity logs', function () {
        // Create additional logs manually to test pagination
        for ($i = 0; $i < 15; $i++) {
            Activity::create([
                'log_name' => 'default',
                'description' => 'created',
                'subject_type' => 'App\Models\User',
                'subject_id' => 1,
                'causer_type' => get_class($this->user),
                'causer_id' => $this->user->id,
                'properties' => [],
                'created_at' => now()->subMinutes($i),
            ]);
        }

        get(route('activity-logs.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityLogs/index')
                ->has('activityLogs.data', 10)
                ->has('activityLogs.links')
                ->has('filters')
                ->has('stats')
                ->whereType('stats.total', 'integer')
                ->whereType('stats.created', 'integer')
                ->whereType('stats.updated', 'integer')
                ->whereType('stats.deleted', 'integer')
                ->whereType('stats.other', 'integer')
                ->where('totalCount', Activity::count())
                ->where('filteredCount', Activity::count())
                ->has('allActions')
                ->has('allModels')
                ->has('allUsers')
            );
    });

    it('filters logs by search term (description, log_name, subject_type, causer name/email)', function () {
        // Search by description
        get(route('activity-logs.index', ['search' => 'created']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::where('description', 'created')->count())
                ->where('stats.total', Activity::where('description', 'created')->count())
                ->where('stats.created', Activity::where('description', 'created')->count())
            );

        // Search by log_name
        get(route('activity-logs.index', ['search' => 'custom']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::where('log_name', 'custom')->count())
            );

        // Search by subject_type
        get(route('activity-logs.index', ['search' => 'Role']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::where('subject_type', 'like', '%Role%')->count())
            );

        // Search by causer name
        get(route('activity-logs.index', ['search' => $this->user->name]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::whereHas('causer', fn($q) => $q->where('name', 'like', "%{$this->user->name}%"))->count())
            );
    });

    it('filters logs by action (description)', function () {
        get(route('activity-logs.index', ['action' => 'created']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::where('description', 'created')->count())
                ->where('stats.created', Activity::where('description', 'created')->count())
                ->where('stats.updated', 0)
                ->where('stats.deleted', 0)
            );

        get(route('activity-logs.index', ['action' => 'updated']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::where('description', 'updated')->count())
            );

        get(route('activity-logs.index', ['action' => 'all']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::count())
            );
    });

    it('filters logs by model (subject_type)', function () {
        get(route('activity-logs.index', ['model' => 'User']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::where('subject_type', 'like', '%User%')->count())
            );

        get(route('activity-logs.index', ['model' => 'Role']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', Activity::where('subject_type', 'like', '%Role%')->count())
            );
    });

    it('filters logs by user (causer)', function () {
        $otherUser = User::factory()->create();
        Activity::create([
            'description' => 'created',
            'causer_type' => get_class($otherUser),
            'causer_id' => $otherUser->id,
            'subject_type' => 'App\Models\User',
            'subject_id' => $otherUser->id,
            'properties' => [],
            'created_at' => now(),
        ]);

        $countForCurrentUser = Activity::whereHas('causer', fn($q) => $q->where('id', $this->user->id))->count();
        $countForOtherUser = Activity::whereHas('causer', fn($q) => $q->where('id', $otherUser->id))->count();

        get(route('activity-logs.index', ['user' => $this->user->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', $countForCurrentUser)
            );

        get(route('activity-logs.index', ['user' => $otherUser->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filteredCount', $countForOtherUser)
            );
    });

    it('combines multiple filters', function () {
        get(route('activity-logs.index', [
            'action' => 'created',
            'model' => 'User',
        ]))->assertInertia(fn (Assert $page) => $page
            ->where('filteredCount', Activity::where('description', 'created')->where('subject_type', 'like', '%User%')->count())
            ->where('stats.created', Activity::where('description', 'created')->where('subject_type', 'like', '%User%')->count())
        );

        get(route('activity-logs.index', [
            'search' => 'deleted',
            'model' => 'Role',
        ]))->assertInertia(fn (Assert $page) => $page
            ->where('filteredCount', Activity::where('description', 'deleted')->where('subject_type', 'like', '%Role%')->count())
        );
    });

    it('respects perPage parameter', function () {
        // Create additional logs
        for ($i = 0; $i < 20; $i++) {
            Activity::create([
                'log_name' => 'default',
                'description' => 'created',
                'subject_type' => 'App\Models\User',
                'subject_id' => 1,
                'causer_type' => get_class($this->user),
                'causer_id' => $this->user->id,
                'properties' => [],
                'created_at' => now()->subMinutes($i),
            ]);
        }

        get(route('activity-logs.index', ['perPage' => 5]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('activityLogs.data', 5)
                ->where('activityLogs.per_page', 5)
            );

        get(route('activity-logs.index', ['perPage' => 25]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('activityLogs.data', min(25, Activity::count()))
                ->where('activityLogs.per_page', 25)
            );
    });

    it('calculates correct stats based on applied filters', function () {
        // No filters: stats should reflect all logs
        get(route('activity-logs.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.total', Activity::count())
                ->where('stats.created', Activity::where('description', 'created')->count())
                ->where('stats.updated', Activity::where('description', 'updated')->count())
                ->where('stats.deleted', Activity::where('description', 'deleted')->count())
                ->where('stats.other', Activity::whereNotIn('description', ['created', 'updated', 'deleted'])->count())
            );

        // With action filter: stats scoped to that action
        get(route('activity-logs.index', ['action' => 'created']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.total', Activity::where('description', 'created')->count())
                ->where('stats.created', Activity::where('description', 'created')->count())
                ->where('stats.updated', 0)
                ->where('stats.deleted', 0)
                ->where('stats.other', 0)
            );
    });

    it('provides distinct action options for filter dropdown', function () {
        $expectedActions = Activity::distinct()->pluck('description')->filter()->values()->toArray();
        get(route('activity-logs.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('allActions', $expectedActions)
            );
    });

    it('provides distinct model options for filter dropdown', function () {
        $expectedModels = Activity::distinct()
            ->whereNotNull('subject_type')
            ->pluck('subject_type')
            ->map(fn($type) => class_basename($type))
            ->unique()
            ->values()
            ->toArray();

        get(route('activity-logs.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('allModels')
                ->where('allModels', $expectedModels) // order may vary, but matches controller output
            );
    });

    it('provides distinct user options for filter dropdown', function () {
        $expectedUsers = Activity::whereHas('causer')
            ->with('causer')
            ->get()
            ->map(fn($activity) => $activity->causer)
            ->filter()
            ->unique('id')
            ->map(fn($user) => ['id' => (string) $user->id, 'name' => $user->name ?? $user->email ?? 'System'])
            ->values()
            ->toArray();

        get(route('activity-logs.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('allUsers')
                ->where('allUsers', $expectedUsers)
            );
    });
});

describe('Model Name Helper', function () {
   it('returns correct model name from subject_type', function () {
    $uniqueDescription = 'custom_model_creation';
    Activity::create([
        'description' => $uniqueDescription,
        'subject_type' => 'App\Models\User', // existing model
        'subject_id' => $this->user->id,
        'causer_type' => get_class($this->user),
        'causer_id' => $this->user->id,
        'properties' => null,
        'created_at' => now(),
    ]);

    get(route('activity-logs.index', ['search' => $uniqueDescription]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('activityLogs.data', 1)
            ->where('activityLogs.data.0.subject_type', 'User')
        );
});

    it('falls back to log_name parsing when subject_type missing and properties is null', function () {
        // Clear previous activities
        Activity::query()->delete();

        Activity::create([
            'log_name' => 'branch_activity',
            'description' => 'created',
            'subject_type' => null,
            'causer_type' => get_class($this->user),
            'causer_id' => $this->user->id,
            'properties' => null,
            'created_at' => now(),
        ]);

        get(route('activity-logs.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('activityLogs.data', 1)
                ->where('activityLogs.data.0.subject_type', 'Branch')
            );
    });
});