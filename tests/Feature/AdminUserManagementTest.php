<?php

use App\Models\Branch;
use App\Models\Role;
use App\Models\User;

test('non-admin cannot access admin user management', function () {
    $workerRole = Role::firstOrCreate(['slug' => 'worker'], ['name' => 'Field Worker']);
    $user = User::factory()->create(['role_id' => $workerRole->id]);

    $this->actingAs($user)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('admin can view user management list', function () {
    $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'System Admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk();
});

test('admin can create a new user', function () {
    $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'System Admin']);
    $workerRole = Role::firstOrCreate(['slug' => 'worker'], ['name' => 'Field Worker']);
    $branch = Branch::firstOrCreate(['branch_code' => 'TEST01'], ['name' => 'Test Branch', 'is_active' => true]);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    $response = $this->actingAs($admin)->post(route('admin.users.store'), [
        'name' => 'New Health Officer',
        'username' => 'new.officer',
        'email' => 'new.officer@mcare.local',
        'phone' => '01711122233',
        'employee_code' => 'PHCP-999',
        'designation' => 'Paramedic',
        'role_id' => $workerRole->id,
        'branch_id' => $branch->id,
        'password' => 'password123',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $this->assertDatabaseHas('users', [
        'email' => 'new.officer@mcare.local',
        'username' => 'new.officer',
    ]);
});

test('admin can update a user', function () {
    $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'System Admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);
    $targetUser = User::factory()->create(['name' => 'Old Name', 'email' => 'old@mcare.local']);

    $response = $this->actingAs($admin)->put(route('admin.users.update', $targetUser), [
        'name' => 'Updated Name',
        'username' => 'updated.username',
        'email' => 'updated@mcare.local',
        'designation' => 'Senior Officer',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $this->assertDatabaseHas('users', [
        'id' => $targetUser->id,
        'name' => 'Updated Name',
        'email' => 'updated@mcare.local',
    ]);
});

test('admin can filter reports by branch and user', function () {
    $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'System Admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);
    $worker = User::factory()->create(['name' => 'Field Officer 1']);
    $branch = Branch::firstOrCreate(['branch_code' => 'TEST02'], ['name' => 'Filter Branch', 'is_active' => true]);

    $this->actingAs($admin)
        ->get(route('reports.index', [
            'branch_id' => $branch->id,
            'user_id' => $worker->id,
            'report_type' => 'activities',
        ]))
        ->assertOk();
});
