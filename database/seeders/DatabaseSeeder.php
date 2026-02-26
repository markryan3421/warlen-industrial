<?php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\DeductionSeeder;
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
            UserSeeder::class,
        ]);
    }
}
