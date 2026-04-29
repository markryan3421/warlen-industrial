<?php

use App\Models\Position;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
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
});

function validStoreData(array $overrides = []): array
{
    return array_merge([
        'pos_name'        => 'Team Lead',
        'basic_salary'    => 5500,
        'is_salary_fixed' => true,
    ], $overrides);
}

function validUpdateData(array $overrides = []): array
{
    return array_merge([
        'pos_name'        => 'Updated Name',
        'basic_salary'    => 6000,
        'is_salary_fixed' => true,
    ], $overrides);
}

describe('Authorization', function () {
    it('allows viewing index', function () {
        get(route('positions.index'))->assertOk();
    });

    it('allows creating a position', function () {
        get(route('positions.create'))->assertOk();
    });

    it('allows storing a position', function () {
        post(route('positions.store'), validStoreData())
            ->assertRedirect(route('positions.index'));
    });

    it('allows editing a position', function () {
        $position = Position::factory()->create();
        get(route('positions.edit', $position))->assertOk();
    });

    it('allows updating a position', function () {
        $position = Position::factory()->create();
        put(route('positions.update', $position), validUpdateData())
            ->assertRedirect(route('positions.index'));
    });

    it('allows deleting a position', function () {
        $position = Position::factory()->create();
        delete(route('positions.destroy', $position))
            ->assertRedirect(route('positions.index'));
    });
});

describe('Index Page', function () {
    it('renders with paginated positions', function () {
        Position::factory()->count(15)->create();

        get(route('positions.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('positions/index')
                ->has('positions.data', 10)
                ->has('positions.links')
                ->has('filters')
                ->where('totalCount', 15)
                ->where('filteredCount', 15)
            );
    });

    it('searches positions by name and salary', function () {
        Position::factory()->create(['pos_name' => 'manager',        'basic_salary' => 5000, 'is_salary_fixed' => true]);
        Position::factory()->create(['pos_name' => 'developer',      'basic_salary' => 6000, 'is_salary_fixed' => true]);
        Position::factory()->create(['pos_name' => 'senior manager', 'basic_salary' => 7000, 'is_salary_fixed' => true]);

        get(route('positions.index', ['search' => 'manager']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('positions.data', 2)
                ->where('filteredCount', 2)
                ->where('totalCount', 3)
            );
    });
});

describe('Store Position', function () {
    it('creates a position with valid data', function () {
        $data = validStoreData(['pos_name' => 'team lead']);
        post(route('positions.store'), $data)
            ->assertRedirect(route('positions.index'));
        assertDatabaseHas('positions', ['pos_name' => 'team lead', 'basic_salary' => 5500]);
    });

    it('requires pos_name and basic_salary', function () {
        post(route('positions.store'), [])
            ->assertSessionHasErrors(['pos_name', 'basic_salary']);
    });

    it('requires unique pos_name', function () {
        Position::factory()->create(['pos_name' => 'duplicate', 'is_salary_fixed' => true]);
        post(route('positions.store'), validStoreData(['pos_name' => 'duplicate']))
            ->assertSessionHasErrors('pos_name');
    });
});

describe('Update Position', function () {
    it('updates an existing position', function () {
        $position = Position::factory()->create(['pos_name' => 'old name', 'basic_salary' => 1000, 'is_salary_fixed' => true]);
        $updatedData = validUpdateData(['pos_name' => 'new name', 'basic_salary' => 2500]);
        put(route('positions.update', $position), $updatedData)
            ->assertRedirect(route('positions.index'));
        assertDatabaseHas('positions', ['pos_name' => 'new name', 'basic_salary' => 2500]);
    });

    it('validates unique pos_name except current', function () {
        Position::factory()->create(['pos_name' => 'other',    'is_salary_fixed' => true]);
        $position = Position::factory()->create(['pos_name' => 'original', 'is_salary_fixed' => true]);

        put(route('positions.update', $position), validUpdateData(['pos_name' => 'other']))
            ->assertSessionHasErrors('pos_name');

        put(route('positions.update', $position), validUpdateData(['pos_name' => 'original']))
            ->assertRedirect();
    });
});

describe('Delete Position', function () {
    it('deletes a position', function () {
        $position = Position::factory()->create();
        delete(route('positions.destroy', $position))
            ->assertRedirect(route('positions.index'));
        assertDatabaseMissing('positions', ['id' => $position->id]);
    });
});

describe('Cache Forget', function () {
    it('flushes employees cache on store, update, and delete', function () {
        Cache::spy();

        post(route('positions.store'), validStoreData(['pos_name' => 'cache test']));

        $position = Position::factory()->create();
        put(route('positions.update', $position), validUpdateData());

        $positionToDelete = Position::factory()->create();
        delete(route('positions.destroy', $positionToDelete));

        Cache::shouldHaveReceived('forget')->with('employees')->times(3);
    });
});