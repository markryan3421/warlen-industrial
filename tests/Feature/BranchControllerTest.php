<?php

use App\Models\Branch;
use App\Models\Site;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Spatie\Permission\Models\Role;

//uses(RefreshDatabase::class);

beforeEach(function () {
    // Laravel 12: disable CSRF via withoutMiddleware on the test instance
    $this->withoutMiddleware([
        \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
        \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    ]);

    // Clear Spatie permission cache between tests
    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function branchPayload(array $overrides = []): array
{
    return array_merge([
        'branch_name'    => 'Test Branch',
        'branch_address' => '123 Main St',
        'sites'          => [
            ['site_name' => 'Main Site'],
        ],
    ], $overrides);
}

function adminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']));
    return $user;
}

function regularUser(): User
{
    return User::factory()->create();
}

// ─── Index ────────────────────────────────────────────────────────────────────

describe('GET /branches (index)', function () {

    it('renders the Branch/index page for authorized users', function () {
        $this->actingAs(adminUser())
            ->get(route('branches.index'))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Branch/index')
                    ->has('branches')
                    ->has('filters')
                    ->has('totalCount')
                    ->has('filteredCount')
            );
    });

    it('returns paginated branches with sites and employee counts', function () {
        Branch::factory()->has(Site::factory()->count(2), 'sites')->count(3)->create();

        $this->actingAs(adminUser())
            ->get(route('branches.index'))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Branch/index')
                    ->has('branches.data')
                    ->has('branches.total')
            );
    });

    it('filters branches by search term', function () {
        Branch::factory()->create(['branch_name' => 'Alpha Branch']);
        Branch::factory()->create(['branch_name' => 'Beta Branch']);

        $this->actingAs(adminUser())
            ->get(route('branches.index', ['search' => 'Alpha']))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Branch/index')
                    ->where('filteredCount', 1)
            );
    });

    it('denies access to unauthorized users', function () {
        $this->actingAs(regularUser())
            ->get(route('branches.index'))
            ->assertForbidden();
    });

    it('redirects guests to login', function () {
        $this->withMiddleware(); // re-enable all middleware for this one test
        $this->get(route('branches.index'))
            ->assertRedirect(route('login'));
    });
});

// ─── Create ───────────────────────────────────────────────────────────────────

describe('GET /branches/create (create)', function () {

    it('renders the Branch/create page for authorized users', function () {
        $this->actingAs(adminUser())
            ->get(route('branches.create'))
            ->assertOk()
            ->assertInertia(fn($page) => $page->component('Branch/create'));
    });

    it('denies access to unauthorized users', function () {
        $this->actingAs(regularUser())
            ->get(route('branches.create'))
            ->assertForbidden();
    });
});

// ─── Store ────────────────────────────────────────────────────────────────────

describe('POST /branches (store)', function () {

    it('creates a branch and redirects with success message', function () {
        $this->actingAs(adminUser())
            ->post(route('branches.store'), branchPayload())
            ->assertRedirect(route('branches.index'))
            ->assertSessionHas('success');

        // Controller stores names in lowercase
        $this->assertDatabaseHas('branches', ['branch_name' => 'test branch']);
    });

    it('creates associated sites', function () {
        $this->actingAs(adminUser())
            ->post(route('branches.store'), branchPayload([
                'sites' => [
                    ['site_name' => 'Site A'],
                    ['site_name' => 'Site B'],
                ],
            ]));

        // Controller stores site names in lowercase
        $this->assertDatabaseHas('sites', ['site_name' => 'site a']);
        $this->assertDatabaseHas('sites', ['site_name' => 'site b']);
    });

    it('validates required fields', function () {
        $this->actingAs(adminUser())
            ->post(route('branches.store'), [])
            ->assertSessionHasErrors(['branch_name']);
    });

    it('rate-limits excessive create attempts', function () {
        $user = adminUser();
        RateLimiter::clear('create-branch:' . $user->id);

        foreach (range(1, 15) as $_) {
            $this->actingAs($user)->post(route('branches.store'), branchPayload());
        }

        $this->actingAs($user)
            ->post(route('branches.store'), branchPayload())
            ->assertSessionHas('error');
    });

    it('denies unauthorized users', function () {
        $this->actingAs(regularUser())
            ->post(route('branches.store'), branchPayload())
            ->assertForbidden();
    });
});

// ─── Show ─────────────────────────────────────────────────────────────────────

describe('GET /branches/{branch_slug} (show)', function () {

    it('renders Branch/show with branch and sites data', function () {
        $branch = Branch::factory()->has(Site::factory()->count(2), 'sites')->create();

        $this->actingAs(adminUser())
            ->get(route('branches.show', $branch->branch_slug))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Branch/show')
                    ->has('branch')
                    ->has('sites')
                    ->where('branch.branch_slug', $branch->branch_slug)
            );
    });

    it('returns 404 for a non-existent slug', function () {
        $this->actingAs(adminUser())
            ->get(route('branches.show', 'does-not-exist'))
            ->assertNotFound();
    });

    it('includes sites_count and employees_preview', function () {
        $branch = Branch::factory()->has(Site::factory()->count(1), 'sites')->create();

        $this->actingAs(adminUser())
            ->get(route('branches.show', $branch->branch_slug))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Branch/show')
                    ->where('branch.sites_count', 1)
                    ->has('sites.0.employees_preview')
            );
    });

    it('denies unauthorized users', function () {
        $branch = Branch::factory()->create();

        $this->actingAs(regularUser())
            ->get(route('branches.show', $branch->branch_slug))
            ->assertForbidden();
    });
});

// ─── Edit ─────────────────────────────────────────────────────────────────────

describe('GET /branches/{branch}/edit (edit)', function () {

    it('renders Branch/edit with branch data', function () {
        $branch = Branch::factory()->create();

        $this->actingAs(adminUser())
            ->get(route('branches.edit', $branch))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Branch/edit')
                    ->has('branch')
            );
    });

    it('denies unauthorized users', function () {
        $branch = Branch::factory()->create();

        $this->actingAs(regularUser())
            ->get(route('branches.edit', $branch))
            ->assertForbidden();
    });
});

// ─── Update ───────────────────────────────────────────────────────────────────

describe('PUT /branches/{branch} (update)', function () {

    it('updates a branch and redirects with success message', function () {
        // Create branch with a valid site name
        $branch = Branch::factory()
            ->has(Site::factory()->state(['site_name' => 'Main Site']), 'sites')
            ->create();

        $this->actingAs(adminUser())
            ->put(route('branches.update', $branch), branchPayload([
                'branch_name' => 'Updated Branch',
                'sites'       => $branch->sites
                    ->map(fn($s) => ['id' => $s->id, 'site_name' => $s->site_name])
                    ->toArray(),
            ]))
            ->assertRedirect(route('branches.index'))
            ->assertSessionHas('success');

        // Controller stores names in lowercase
        $this->assertDatabaseHas('branches', ['branch_name' => 'updated branch']);
    });

    it('deletes sites omitted from the request', function () {
        $branch   = Branch::factory()->has(Site::factory()->count(2), 'sites')->create();
        $keepSite = $branch->sites->first();
        $dropSite = $branch->sites->last();

        $this->actingAs(adminUser())
            ->put(route('branches.update', $branch), branchPayload([
                'sites' => [['id' => $keepSite->id, 'site_name' => $keepSite->site_name]],
            ]))
            ->assertRedirect(route('branches.index'));

        $this->assertDatabaseHas('sites', ['id' => $keepSite->id]);
        $this->assertDatabaseMissing('sites', ['id' => $dropSite->id]);
    });

    it('validates required fields', function () {
        $branch = Branch::factory()->create();

        $this->actingAs(adminUser())
            ->put(route('branches.update', $branch), ['branch_name' => ''])
            ->assertSessionHasErrors(['branch_name']);
    });

    it('rate-limits excessive update attempts', function () {
        // Create branch with a fixed name and valid site name
        $branch = Branch::factory()
            ->has(Site::factory()->state(['site_name' => 'Main Site']), 'sites')
            ->create(['branch_name' => 'Test Branch']);
        $user = adminUser();

        RateLimiter::clear('update-branch:' . $user->id);

        $data = branchPayload([
            'branch_name' => $branch->branch_name,
            'sites' => $branch->sites->map(fn($s) => ['id' => $s->id, 'site_name' => $s->site_name])->toArray(),
        ]);

        // Perform 15 successful updates
        for ($i = 0; $i < 15; $i++) {
            $this->actingAs($user)->put(route('branches.update', $branch), $data);
            // Refresh the branch to get the latest slug (unchanged because name is the same)
            $branch = $branch->fresh();
        }

        // The 16th attempt should be rate-limited and redirect with error session
        $this->actingAs($user)
            ->put(route('branches.update', $branch), $data)
            ->assertSessionHas('error');
    });

    it('denies unauthorized users', function () {
        $branch = Branch::factory()->create();

        $this->actingAs(regularUser())
            ->put(route('branches.update', $branch), branchPayload())
            ->assertForbidden();
    });
});

// ─── Destroy ──────────────────────────────────────────────────────────────────

describe('DELETE /branches/{branch} (destroy)', function () {

    it('deletes a branch and redirects with warning message', function () {
        $branch = Branch::factory()->create();

        $this->actingAs(adminUser())
            ->delete(route('branches.destroy', $branch))
            ->assertRedirect(route('branches.index'))
            ->assertSessionHas('warning');

        $this->assertDatabaseMissing('branches', ['id' => $branch->id]);
    });

    it('rate-limits excessive delete attempts', function () {
        $user = adminUser();
        RateLimiter::clear('delete-branch:' . $user->id);

        foreach (range(1, 10) as $_) {
            $branch = Branch::factory()->create();
            $this->actingAs($user)->delete(route('branches.destroy', $branch));
        }

        $extra = Branch::factory()->create();
        $this->actingAs($user)
            ->delete(route('branches.destroy', $extra))
            ->assertSessionHas('error');
    });

    it('denies unauthorized users', function () {
        $branch = Branch::factory()->create();

        $this->actingAs(regularUser())
            ->delete(route('branches.destroy', $branch))
            ->assertForbidden();
    });

    it('clears branches and employees cache after deletion', function () {
        // Force default cache driver to array so controller + assertions share the same store
        config(['cache.default' => 'array', 'cache.store' => 'array']);
        Cache::forgetDriver('array');

        Cache::put('branches', 'value');
        Cache::put('employees', 'value');

        $branch = Branch::factory()->create();

        $this->actingAs(adminUser())
            ->delete(route('branches.destroy', $branch));

        expect(Cache::has('branches'))->toBeFalse();
        expect(Cache::has('employees'))->toBeFalse();
    });
});
