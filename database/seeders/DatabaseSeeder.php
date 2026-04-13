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
use Database\Seeders\DeductionSeeder;
use Database\Seeders\EmployeeSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();


        $this->call([
           // PositionSeeder::class, // Make sure this runs first
            //DeductionSeeder::class,
            //UserSeeder::class,
            ContributionSeeder::class,
            EmployeeSeeder::class
        ]);
    }
}
