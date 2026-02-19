<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Database\Seeders\DeductionSeeder;
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

        $this->call([
            PositionSeeder::class, // Make sure this runs first
            DeductionSeeder::class,
        ]);
    }
}
