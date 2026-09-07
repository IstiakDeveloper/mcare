<?php

use App\Models\Branch;
use App\Models\DailyActivity;
use App\Models\Role;
use App\Models\TaskType;
use App\Models\User;

test('admin can view all activities across all staff with filters', function () {
    $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $workerRole = Role::firstOrCreate(['slug' => 'health-officer'], ['name' => 'Health Officer']);

    $branchA = Branch::firstOrCreate(['name' => 'Branch A'], ['branch_code' => 'BA01', 'is_active' => true]);
    $branchB = Branch::firstOrCreate(['name' => 'Branch B'], ['branch_code' => 'BB02', 'is_active' => true]);

    $admin = User::factory()->create([
        'role_id' => $adminRole->id,
        'branch_id' => $branchA->id,
    ]);

    $worker1 = User::factory()->create([
        'name' => 'Worker One',
        'role_id' => $workerRole->id,
        'branch_id' => $branchA->id,
    ]);

    $worker2 = User::factory()->create([
        'name' => 'Worker Two',
        'role_id' => $workerRole->id,
        'branch_id' => $branchB->id,
    ]);

    $taskType = TaskType::firstOrCreate(['slug' => 'household-visit'], ['name' => 'Household Visit']);

    $act1 = DailyActivity::create([
        'user_id' => $worker1->id,
        'branch_id' => $branchA->id,
        'task_type_id' => $taskType->id,
        'activity_date' => now()->toDateString(),
        'form_data' => ['members_visited' => 10],
    ]);

    $act2 = DailyActivity::create([
        'user_id' => $worker2->id,
        'branch_id' => $branchB->id,
        'task_type_id' => $taskType->id,
        'activity_date' => now()->toDateString(),
        'form_data' => ['members_visited' => 25],
    ]);

    $response = $this->actingAs($admin)->get(route('activities.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('activities/index')
        ->has('activities.data', 2)
        ->has('branches')
        ->has('officers')
    );
});

test('admin can update an activity record', function () {
    $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $workerRole = Role::firstOrCreate(['slug' => 'health-officer'], ['name' => 'Health Officer']);
    $branch = Branch::firstOrCreate(['name' => 'Main Branch'], ['branch_code' => 'MB01', 'is_active' => true]);

    $admin = User::factory()->create([
        'role_id' => $adminRole->id,
        'branch_id' => $branch->id,
    ]);

    $worker = User::factory()->create([
        'role_id' => $workerRole->id,
        'branch_id' => $branch->id,
    ]);

    $taskType = TaskType::firstOrCreate(['slug' => 'samity-task'], ['name' => 'Samity Task']);

    $activity = DailyActivity::create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => '2026-09-01',
        'form_data' => ['attendees_count' => 12, 'notes' => 'Old note'],
    ]);

    $response = $this->actingAs($admin)->put(route('activities.update', $activity), [
        'activity_date' => '2026-09-05',
        'form_data' => ['attendees_count' => 20, 'notes' => 'Updated by Admin'],
        'remarks' => 'Updated by Admin',
    ]);

    $response->assertRedirect();
    $activity->refresh();
    expect($activity->activity_date->toDateString())->toBe('2026-09-05');
    expect($activity->form_data['attendees_count'])->toBe(20);
    expect($activity->form_data['remarks'])->toBe('Updated by Admin');
});

test('admin can delete an activity record', function () {
    $adminRole = Role::firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $workerRole = Role::firstOrCreate(['slug' => 'health-officer'], ['name' => 'Health Officer']);
    $branch = Branch::firstOrCreate(['name' => 'Main Branch'], ['branch_code' => 'MB01', 'is_active' => true]);

    $admin = User::factory()->create([
        'role_id' => $adminRole->id,
        'branch_id' => $branch->id,
    ]);

    $worker = User::factory()->create([
        'role_id' => $workerRole->id,
        'branch_id' => $branch->id,
    ]);

    $taskType = TaskType::firstOrCreate(['slug' => 'samity-task'], ['name' => 'Samity Task']);

    $activity = DailyActivity::create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => '2026-09-01',
        'form_data' => ['attendees_count' => 5],
    ]);

    $response = $this->actingAs($admin)->delete(route('activities.destroy', $activity));
    $response->assertRedirect(route('activities.index'));
    expect(DailyActivity::find($activity->id))->toBeNull();
});

test('non-admin worker cannot delete another users activity', function () {
    $workerRole = Role::firstOrCreate(['slug' => 'health-officer'], ['name' => 'Health Officer']);
    $branch = Branch::firstOrCreate(['name' => 'Main Branch'], ['branch_code' => 'MB01', 'is_active' => true]);

    $worker1 = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);
    $worker2 = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);

    $taskType = TaskType::firstOrCreate(['slug' => 'samity-task'], ['name' => 'Samity Task']);

    $activity = DailyActivity::create([
        'user_id' => $worker1->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => '2026-09-01',
        'form_data' => ['attendees_count' => 5],
    ]);

    $response = $this->actingAs($worker2)->delete(route('activities.destroy', $activity));
    $response->assertForbidden();
    expect(DailyActivity::find($activity->id))->not->toBeNull();
});
