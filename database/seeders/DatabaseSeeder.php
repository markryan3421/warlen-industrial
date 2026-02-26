<?php

namespace Database\Seeders;

use App\Models\ApplicationLeave;
use App\Models\Branch;
use App\Models\ContributionBracket;
use App\Models\ContributionVersion;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'John Paul Morgan',
            'email' => 'jpm@gmail.com',
            'password' => Hash::make('password'),
        ]);
        
        // -------------------------------------------------------
        // 1. Branches (no dependencies)
        // -------------------------------------------------------
        $branches = Branch::factory(10)->create();

        // -------------------------------------------------------
        // 2. Positions (no dependencies)
        // -------------------------------------------------------
        Position::factory(10)->create();

        // -------------------------------------------------------
        // 3. Sites (depends on Branch)
        //    Each branch gets 1-3 sites
        // -------------------------------------------------------
        $branches->each(function ($branch) {
            Site::factory(rand(1, 3))->create([
                'branch_id' => $branch->id,
            ]);
        });

        // -------------------------------------------------------
        // 4. Employees (depends on Position, Branch, User, Site)
        //    Each employee gets its own User account
        // -------------------------------------------------------
        Employee::factory(30)->create();

        // -------------------------------------------------------
        // 5. Application Leaves (depends on Employee)
        //    Each employee gets 0-3 leave applications
        // -------------------------------------------------------
        Employee::all()->each(function ($employee) {
            ApplicationLeave::factory(rand(0, 3))->create([
                'employee_id' => $employee->id,
            ]);
        });

        // -------------------------------------------------------
        // 6. Contribution Versions (no dependencies)
        //    Create one active version per type
        // -------------------------------------------------------
        $types = ['sss', 'philhealth', 'pagibig'];

        foreach ($types as $type) {
            // Old version (expired)
            $oldVersion = ContributionVersion::factory()->create([
                'type'           => $type,
                'effective_from' => now()->subYears(3)->format('Y-m-d'),
                'effective_to'   => now()->subYear()->format('Y-m-d'),
            ]);

            // Brackets for the old version
            ContributionBracket::factory(5)->create([
                'contribution_version_id' => $oldVersion->id,
            ]);

            // Current active version (no effective_to = still active)
            $currentVersion = ContributionVersion::factory()->create([
                'type'           => $type,
                'effective_from' => now()->subYear()->format('Y-m-d'),
                'effective_to'   => null,
            ]);

            // Brackets for the current version
            ContributionBracket::factory(5)->create([
                'contribution_version_id' => $currentVersion->id,
            ]);
        }
    }
}
