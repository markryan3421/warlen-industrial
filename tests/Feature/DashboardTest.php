<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user);

    $this->get(route('dashboard'))->assertOk();
});