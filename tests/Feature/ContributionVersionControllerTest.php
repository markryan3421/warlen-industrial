<?php

use App\Models\ContributionVersion;
use App\Models\ContributionBracket;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
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

    // Ensure rate limiter is cleared before each test
    RateLimiter::clear('store-contribution:*');
    RateLimiter::clear('update-contribution:*');
    RateLimiter::clear('delete-contribution:*');
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Valid payload matching StoreContributionRequest and UpdateContributionRequest.
 * - type must be 'sss', 'philhealth', or 'pagibig'
 * - shares must be ≤ 100
 */
function contributionVersionPayload(array $overrides = []): array
{
    return array_merge([
        'type'           => 'sss',
        'effective_from' => '2024-01-01',
        'effective_to'   => '2024-12-31',
        'salary_ranges'  => [
            [
                'salary_from'    => 0,
                'salary_to'      => 5000,
                'employee_share' => 10,
                'employer_share' => 20,
            ],
            [
                'salary_from'    => 5001,
                'salary_to'      => 10000,
                'employee_share' => 15,
                'employer_share' => 25,
            ],
        ],
    ], $overrides);
}

/**
 * Helper to create a ContributionVersion with brackets, using only allowed types.
 * @param string $type One of 'sss', 'philhealth', 'pagibig'
 * @param array|null $brackets Bracket data with keys: salary_from, salary_to, employee_share, employer_share
 */
function createContributionWithBrackets(string $type, ?array $brackets = null): ContributionVersion
{
    $version = ContributionVersion::create(['type' => $type]);
    $brackets = $brackets ?? [
        ['salary_from' => 0, 'salary_to' => 5000, 'employee_share' => 10, 'employer_share' => 20],
        ['salary_from' => 5001, 'salary_to' => 10000, 'employee_share' => 15, 'employer_share' => 25],
    ];
    foreach ($brackets as $bracket) {
        $version->contributionBrackets()->create($bracket);
    }
    return $version;
}

function contributionAdminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']));
    return $user;
}

function contributionRegularUser(): User
{
    return User::factory()->create();
}

// ─── Index ────────────────────────────────────────────────────────────────────

describe('GET /contribution-versions (index)', function () {

    it('renders the Contributions/index page for authorized users', function () {
        $this->actingAs(contributionAdminUser())
            ->get(route('contribution-versions.index'))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Contributions/index')
                    ->has('contributionVersions.data')
                    ->has('filters')
                    ->has('totalCount')
                    ->has('filteredCount')
            );
    });

    it('returns paginated contribution versions with brackets', function () {
        // Create three versions using allowed types
        createContributionWithBrackets('sss');
        createContributionWithBrackets('philhealth');
        createContributionWithBrackets('pagibig');

        $this->actingAs(contributionAdminUser())
            ->get(route('contribution-versions.index'))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Contributions/index')
                    ->has('contributionVersions.data', 3)
                    ->where('contributionVersions.total', 3) // FIXED: use where() instead of has()
            );
    });

    it('filters contribution versions by search term', function () {
        createContributionWithBrackets('sss');
        createContributionWithBrackets('philhealth');

        $this->actingAs(contributionAdminUser())
            ->get(route('contribution-versions.index', ['search' => 'sss']))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Contributions/index')
                    ->where('filteredCount', 1)
            );
    });

    it('denies access to unauthorized users', function () {
        $this->actingAs(contributionRegularUser())
            ->get(route('contribution-versions.index'))
            ->assertForbidden();
    });
});

// ─── Create ───────────────────────────────────────────────────────────────────

describe('GET /contribution-versions/create (create)', function () {

    it('renders the Contributions/create page for authorized users', function () {
        $this->actingAs(contributionAdminUser())
            ->get(route('contribution-versions.create'))
            ->assertOk()
            ->assertInertia(fn($page) => $page->component('Contributions/create'));
    });

    it('denies access to unauthorized users', function () {
        $this->actingAs(contributionRegularUser())
            ->get(route('contribution-versions.create'))
            ->assertForbidden();
    });
});

// ─── Store ────────────────────────────────────────────────────────────────────

describe('POST /contribution-versions (store)', function () {

    it('creates a contribution version and redirects with success message', function () {
        $this->actingAs(contributionAdminUser())
            ->post(route('contribution-versions.store'), contributionVersionPayload())
            ->assertRedirect(route('contribution-versions.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('contribution_versions', ['type' => 'sss']);
    });

    it('prevents creating duplicate type', function () {
        createContributionWithBrackets('sss');

        $this->actingAs(contributionAdminUser())
            ->post(route('contribution-versions.store'), contributionVersionPayload(['type' => 'sss']))
            ->assertRedirect()
            ->assertSessionHas('error', 'A Sss contribution version already exists. Only one version per contribution type is allowed.');
    });

    it('prevents creating more than 3 total types', function () {
        createContributionWithBrackets('sss');
        createContributionWithBrackets('philhealth');
        createContributionWithBrackets('pagibig');

        // FIXED: expect the "cannot create new contribution" error
        $this->actingAs(contributionAdminUser())
            ->post(route('contribution-versions.store'), contributionVersionPayload())
            ->assertRedirect()
            ->assertSessionHas('error', 'Cannot create new contribution. All contribution types (SSS, PhilHealth, Pag-IBIG) already have versions. Please edit or delete existing versions if you need to make changes.');
    });

    it('validates required fields', function () {
        $this->actingAs(contributionAdminUser())
            ->post(route('contribution-versions.store'), [])
            // FIXED: only expect 'type' because effective_from and salary_ranges are not required in the request
            ->assertSessionHasErrors(['type']);
    });

    it('rate-limits excessive store attempts', function () {
        $user = contributionAdminUser();
        RateLimiter::clear('store-contribution:' . $user->id);

        // 20 attempts allowed per minute (controller uses limit 20)
        for ($i = 0; $i < 20; $i++) {
            $this->actingAs($user)
                ->post(route('contribution-versions.store'), contributionVersionPayload(['type' => 'sss']));
        }

        // The 21st attempt should be rate-limited
        $this->actingAs($user)
            ->post(route('contribution-versions.store'), contributionVersionPayload(['type' => 'sss']))
            ->assertSessionHas('error', 'Too many attempts. Please try again later.');
    });

    it('denies unauthorized users', function () {
        $this->actingAs(contributionRegularUser())
            ->post(route('contribution-versions.store'), contributionVersionPayload())
            ->assertForbidden();
    });

    it('clears cache after creation', function () {
        Cache::put('contribution_versions', 'cached_value');

        $this->actingAs(contributionAdminUser())
            ->post(route('contribution-versions.store'), contributionVersionPayload());

        expect(Cache::has('contribution_versions'))->toBeFalse();
    });
});

// ─── Edit ─────────────────────────────────────────────────────────────────────

describe('GET /contribution-versions/{contributionVersion}/edit (edit)', function () {

    it('renders the Contributions/edit page with contribution and brackets', function () {
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionAdminUser())
            ->get(route('contribution-versions.edit', $contribution))
            ->assertOk()
            ->assertInertia(
                fn($page) => $page
                    ->component('Contributions/edit')
                    ->has('contributionVersion')
                    ->where('contributionVersion.id', $contribution->id)
                    ->has('contributionVersion.contribution_brackets', 2)
            );
    });

    it('denies unauthorized users', function () {
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionRegularUser())
            ->get(route('contribution-versions.edit', $contribution))
            ->assertForbidden();
    });
});

// ─── Update ───────────────────────────────────────────────────────────────────

describe('PUT /contribution-versions/{contributionVersion} (update)', function () {

    it('updates a contribution version and redirects with success message', function () {
        $contribution = createContributionWithBrackets('sss');

        $newPayload = contributionVersionPayload();
        $newPayload['type'] = 'sss'; // keep same type to avoid duplicate check

        $this->actingAs(contributionAdminUser())
            ->put(route('contribution-versions.update', $contribution), $newPayload)
            ->assertRedirect(route('contribution-versions.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('contribution_versions', ['id' => $contribution->id, 'type' => 'sss']);
    });

    it('prevents changing type to an existing one', function () {
        createContributionWithBrackets('sss');
        $philhealth = createContributionWithBrackets('philhealth');

        $this->actingAs(contributionAdminUser())
            ->put(route('contribution-versions.update', $philhealth), contributionVersionPayload(['type' => 'sss']))
            ->assertRedirect()
            ->assertSessionHas('error', 'A Sss contribution version already exists. Only one version per contribution type is allowed.');
    });

    it('validates required fields', function () {
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionAdminUser())
            ->put(route('contribution-versions.update', $contribution), [])
            // FIXED: only expect 'type' because effective_from is not required in the update request
            ->assertSessionHasErrors(['type']);
    });

    it('rate-limits excessive update attempts', function () {
        $user = contributionAdminUser();
        $contribution = createContributionWithBrackets('sss');

        RateLimiter::clear('update-contribution:' . $user->id);

        $payload = contributionVersionPayload();

        for ($i = 0; $i < 20; $i++) {
            $this->actingAs($user)
                ->put(route('contribution-versions.update', $contribution), $payload);
        }

        $this->actingAs($user)
            ->put(route('contribution-versions.update', $contribution), $payload)
            ->assertSessionHas('error', 'Too many attempts. Please try again later.');
    });

    it('denies unauthorized users', function () {
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionRegularUser())
            ->put(route('contribution-versions.update', $contribution), contributionVersionPayload())
            ->assertForbidden();
    });

    it('clears cache after update', function () {
        Cache::put('contribution_versions', 'cached_value');
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionAdminUser())
            ->put(route('contribution-versions.update', $contribution), contributionVersionPayload());

        expect(Cache::has('contribution_versions'))->toBeFalse();
    });
});

// ─── Destroy ──────────────────────────────────────────────────────────────────

describe('DELETE /contribution-versions/{contributionVersion} (destroy)', function () {

    it('deletes a contribution version and redirects with warning message', function () {
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionAdminUser())
            ->delete(route('contribution-versions.destroy', $contribution))
            ->assertRedirect(route('contribution-versions.index'))
            ->assertSessionHas('warning');

        $this->assertDatabaseMissing('contribution_versions', ['id' => $contribution->id]);
    });

    it('rate-limits excessive delete attempts', function () {
        $user = contributionAdminUser();
        RateLimiter::clear('delete-contribution:' . $user->id);

        // FIXED: perform 20 deletions to hit the rate limit of 20 per minute
        for ($i = 0; $i < 20; $i++) {
            $contribution = createContributionWithBrackets('sss');
            $this->actingAs($user)->delete(route('contribution-versions.destroy', $contribution));
        }

        $extra = createContributionWithBrackets('philhealth');
        $this->actingAs($user)
            ->delete(route('contribution-versions.destroy', $extra))
            ->assertSessionHas('error');
    });

    it('denies unauthorized users', function () {
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionRegularUser())
            ->delete(route('contribution-versions.destroy', $contribution))
            ->assertForbidden();
    });

    it('clears cache after deletion', function () {
        Cache::put('contribution_versions', 'cached_value');
        $contribution = createContributionWithBrackets('sss');

        $this->actingAs(contributionAdminUser())
            ->delete(route('contribution-versions.destroy', $contribution));

        expect(Cache::has('contribution_versions'))->toBeFalse();
    });
});