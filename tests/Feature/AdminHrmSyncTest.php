<?php

use App\Models\Role;
use App\Models\User;

test('admin can trigger hrm sync', function () {
    $adminRole = Role::query()->firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    $response = $this->actingAs($admin)->postJson(route('admin.hrm.sync'));

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'source',
                'branches',
                'employees',
                'samities',
                'status',
            ],
        ]);
});

test('non-admin worker cannot trigger hrm sync via web', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $worker = User::factory()->create(['role_id' => $workerRole->id]);

    $this->actingAs($worker)->postJson(route('admin.hrm.sync'))
        ->assertForbidden();
});

test('admin can check sync status', function () {
    $adminRole = Role::query()->firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $admin = User::factory()->create(['role_id' => $adminRole->id]);

    $response = $this->actingAs($admin)->getJson(route('admin.hrm.status'));

    $response->assertOk()
        ->assertJsonStructure(['status']);
});
