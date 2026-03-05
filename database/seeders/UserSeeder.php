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
        $adminUser = User::factory()->create([
            'name' => 'admin',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin123'),
        ]);

        $adminRole = Role::create(['name' => 'admin']);
        $adminUser->assignRole($adminRole);

        $empUser = User::factory()->create([
            'name' => 'employee',
            'email' => 'employee@gmail.com',
            'password' => Hash::make('employee123'),
        ]);

        $empRole = Role::create(['name' => 'employee']);
        $empUser->assignRole($empRole);

        $hr_user = User::factory()->create([
            'name' => 'Hr Head',
            'email' => 'hr@gmail.com',
            'password' => Hash::make('hr123456'),
        ]);
        $hrRole = Role::create(['name' => 'hr_head']);
        $hr_user->assignRole($hrRole);
    }
}
