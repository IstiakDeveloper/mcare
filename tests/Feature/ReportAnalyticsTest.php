<?php

use App\Models\Branch;
use App\Models\DailyActivity;
use App\Models\FeeCollection;
use App\Models\HealthCamp;
use App\Models\Role;
use App\Models\TaskType;
use App\Models\User;

test('authenticated users can access reports center with date to date filters', function () {
    $adminRole = Role::query()->firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $managerRole = Role::query()->firstOrCreate(['slug' => 'branch-manager'], ['name' => 'Branch Manager']);
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);

    $branch = Branch::query()->firstOrCreate(['name' => 'Test Branch', 'branch_code' => 'TB-01', 'is_active' => true]);

    $admin = User::factory()->create(['role_id' => $adminRole->id, 'branch_id' => $branch->id]);
    $manager = User::factory()->create(['role_id' => $managerRole->id, 'branch_id' => $branch->id]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);

    $taskType = TaskType::query()->firstOrCreate(['slug' => 'samity-task'], ['name' => 'Samity Task', 'sort_order' => 1]);

    DailyActivity::create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => now()->toDateString(),
        'form_data' => [
            'village' => 'Test Village',
            'samity_name' => 'Test Samity',
            'attendees_count' => 15,
        ],
    ]);

    HealthCamp::create([
        'branch_id' => $branch->id,
        'entered_by' => $worker->id,
        'activity_date' => now()->toDateString(),
        'service_data' => [
            'camp_name' => 'Free Health Camp',
            'patients_served' => 30,
        ],
    ]);

    FeeCollection::create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'collection_date' => now()->toDateString(),
        'collection_type' => 'ডায়াবেটিস পরীক্ষা',
        'beneficiary_name' => 'রহিমা খাতুন',
        'beneficiary_type' => 'সদস্য',
        'amount' => 50,
        'diabetes_reading' => '6.5 mmol/L',
    ]);

    // Admin can view reports JSON
    $response = $this->actingAs($admin)->getJson(route('reports.index', [
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
        'report_type' => 'activities',
    ]));

    $response->assertOk()
        ->assertJsonStructure([
            'summary',
            'activities',
            'feeCollections',
            'householdRecords',
            'patientRecords',
            'branchMatrix',
            'filters',
        ]);

    expect($response->json('summary.total_activities'))->toBe(1)
        ->and($response->json('summary.total_fee_amount'))->toEqual(50);

    // Manager can view
    $this->actingAs($manager)->get(route('reports.index'))->assertOk();

    // Worker can view own scoped reports
    $this->actingAs($worker)->get(route('reports.index'))->assertOk();
});
