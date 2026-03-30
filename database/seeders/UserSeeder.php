<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // $adminUser = User::factory()->create([
        //     'name' => 'Warlito',
        //     'email' => 'warlito@gmail.com',
        //     'password' => Hash::make('12345678'),
        // ]);

        // $elenaUser = User::factory()->create([
        //     'name' => 'Elena',
        //     'email' => 'elena@gmail.com',
        //     'password' => Hash::make('12345678'),
        // ]);

        // $adminRole = Role::create(['name' => 'admin']);
        // $adminUser->assignRole($adminRole);

        // $elenaUser->assignRole($adminRole);

        // $empUser = User::factory()->create([
        //     'name' => 'employee',
        //     'email' => 'employee@gmail.com',
        //     'password' => Hash::make('12345678'),
        // ]);

        // $empRole = Role::create(['name' => 'employee']);
        // $empUser->assignRole($empRole);

        // $hr_user = User::factory()->create([
        //     'name' => 'Jona',
        //     'email' => 'jona@gmail.com',
        //     'password' => Hash::make('1234568'),
        // ]);
        // $hrRole = Role::create(['name' => 'hr_head']);
        // $hr_user->assignRole($hrRole);

        Role::create(['name' => 'admin']);
        Role::create(['name' => 'employee']);
        Role::create(['name' => 'hr_head']);
    }
}
