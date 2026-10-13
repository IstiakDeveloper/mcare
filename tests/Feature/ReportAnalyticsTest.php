<?php

use App\Models\Branch;
use App\Models\DailyActivity;
use App\Models\FeeCollection;
use App\Models\HealthCamp;
use App\Models\HealthCardDisburse;
use App\Models\Role;
use App\Models\TaskSubtype;
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

test('employee work report counts submissions in the date range for the selected employee', function () {
    $adminRole = Role::query()->firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $managerRole = Role::query()->firstOrCreate(['slug' => 'branch-manager'], ['name' => 'Branch Manager']);
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);

    $branch = Branch::query()->firstOrCreate(['name' => 'Employee Report Branch', 'branch_code' => 'ER-01', 'is_active' => true]);
    $otherBranch = Branch::query()->firstOrCreate(['name' => 'Other Report Branch', 'branch_code' => 'ER-02', 'is_active' => true]);

    $admin = User::factory()->create(['role_id' => $adminRole->id, 'branch_id' => $branch->id]);
    $manager = User::factory()->create(['role_id' => $managerRole->id, 'branch_id' => $branch->id]);
    $worker = User::factory()->create([
        'role_id' => $workerRole->id,
        'branch_id' => $branch->id,
        'name' => 'Rahima Akter',
        'employee_code' => 'EMP-100',
        'designation' => 'Health Worker',
    ]);
    $otherWorker = User::factory()->create([
        'role_id' => $workerRole->id,
        'branch_id' => $otherBranch->id,
        'name' => 'Karim Mia',
        'employee_code' => 'EMP-200',
    ]);

    $taskType = TaskType::query()->firstOrCreate(['slug' => 'samity-task'], ['name' => 'Samity Task', 'sort_order' => 1]);
    $subtype = TaskSubtype::query()->firstOrCreate(
        ['slug' => 'uthan-boithok'],
        ['task_type_id' => $taskType->id, 'name' => 'Uthan Boithok', 'sort_order' => 1],
    );

    $today = now()->toDateString();
    $yesterday = now()->subDay()->toDateString();

    DailyActivity::create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'task_subtype_id' => $subtype->id,
        'activity_date' => $today,
        'form_data' => [
            'village' => 'North Para',
            'samity_name' => 'Shapla Samity',
            'attendees_count' => 12,
            'topics_discussed' => 'Nutrition session',
        ],
    ]);

    DailyActivity::create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'task_subtype_id' => $subtype->id,
        'activity_date' => $yesterday,
        'form_data' => ['attendees_count' => 4],
    ]);

    DailyActivity::create([
        'user_id' => $otherWorker->id,
        'branch_id' => $otherBranch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => $today,
        'form_data' => ['attendees_count' => 9],
    ]);

    HealthCamp::create([
        'branch_id' => $branch->id,
        'entered_by' => $worker->id,
        'activity_date' => $today,
        'service_data' => [
            'camp_name' => 'Village Camp',
            'location' => 'School Field',
            'patients_served' => 20,
        ],
    ]);

    FeeCollection::create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'collection_date' => $today,
        'collection_type' => 'ডায়াবেটিস পরীক্ষা',
        'beneficiary_name' => 'রহিমা খাতুন',
        'beneficiary_type' => 'সদস্য',
        'amount' => 50,
        'location_info' => 'Shapla Samity',
    ]);

    HealthCardDisburse::query()->create([
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'member_name' => 'Ayesha Begum',
        'member_code' => 'M-01',
        'health_card_number' => 'HC-9001',
        'entry_date' => $today,
        'expire_date' => now()->addYear()->toDateString(),
        'village_or_samity' => 'Shapla Samity',
    ]);

    $response = $this->actingAs($admin)->getJson(route('reports.index', [
        'start_date' => $today,
        'end_date' => $today,
        'report_type' => 'employee',
        'user_id' => $worker->id,
    ]));

    $response->assertOk();

    expect($response->json('employeeReport.requires_selection'))->toBeFalse()
        ->and($response->json('employeeReport.employee.name'))->toBe('Rahima Akter')
        ->and($response->json('employeeReport.employee.employee_code'))->toBe('EMP-100')
        ->and($response->json('employeeReport.summary.total_submissions'))->toBe(4)
        ->and($response->json('employeeReport.summary.field_activities'))->toBe(1)
        ->and($response->json('employeeReport.summary.health_camps'))->toBe(1)
        ->and($response->json('employeeReport.summary.fee_collections'))->toBe(1)
        ->and($response->json('employeeReport.summary.health_cards'))->toBe(1)
        ->and($response->json('employeeReport.summary.total_fee_amount'))->toEqual(50);

    $workTypes = collect($response->json('employeeReport.submissions'))->pluck('work_type');
    expect($workTypes->all())->toContain('Uthan Boithok', 'Health Camp', 'ডায়াবেটিস পরীক্ষা', 'Health Card');

    $ownReport = $this->actingAs($worker)->getJson(route('reports.index', [
        'start_date' => $today,
        'end_date' => $today,
        'report_type' => 'employee',
        'user_id' => $otherWorker->id,
    ]));

    $ownReport->assertOk();
    expect($ownReport->json('employeeReport.employee.id'))->toBe($worker->id)
        ->and($ownReport->json('employeeReport.summary.total_submissions'))->toBe(4);

    $outsideBranch = $this->actingAs($manager)->getJson(route('reports.index', [
        'start_date' => $today,
        'end_date' => $today,
        'report_type' => 'employee',
        'user_id' => $otherWorker->id,
    ]));

    $outsideBranch->assertOk();
    expect($outsideBranch->json('employeeReport.employee'))->toBeNull()
        ->and($outsideBranch->json('employeeReport.submissions'))->toBe([]);
});

test('illness report totals follow the date branch and employee filters', function () {
    $adminRole = Role::query()->firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $managerRole = Role::query()->firstOrCreate(['slug' => 'branch-manager'], ['name' => 'Branch Manager']);

    $branch = Branch::query()->firstOrCreate(['name' => 'Illness Branch A', 'branch_code' => 'IL-01', 'is_active' => true]);
    $otherBranch = Branch::query()->firstOrCreate(['name' => 'Illness Branch B', 'branch_code' => 'IL-02', 'is_active' => true]);

    $admin = User::factory()->create(['role_id' => $adminRole->id, 'branch_id' => $branch->id]);
    $manager = User::factory()->create(['role_id' => $managerRole->id, 'branch_id' => $branch->id]);
    $worker = User::factory()->create(['role_id' => $adminRole->id, 'branch_id' => $otherBranch->id]);

    $taskType = TaskType::query()->firstOrCreate(['slug' => 'household-visit'], ['name' => 'Household Visit', 'sort_order' => 2]);
    $today = now()->toDateString();

    DailyActivity::create([
        'user_id' => $admin->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => $today,
        'form_data' => [
            'households' => [[
                'household_head' => 'Amina',
                'has_pregnant' => true,
                'has_anc' => true,
                'has_tt' => true,
                'is_stunting' => true,
                'has_disabled' => true,
                'general_illness_count' => 2,
                'took_treatment' => true,
                'elderly_diseases' => [
                    'diabetes' => ['affected' => true, 'taking_medication' => true],
                    'hypertension' => ['affected' => true, 'taking_medication' => false],
                ],
            ]],
            'patients' => [
                ['patient_name' => 'Rina', 'disease' => 'জ্বর'],
                ['patient_name' => 'Karim', 'disease' => 'জ্বর'],
            ],
        ],
    ]);

    DailyActivity::create([
        'user_id' => $worker->id,
        'branch_id' => $otherBranch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => $today,
        'form_data' => [
            'households' => [[
                'household_head' => 'Saleha',
                'elderly_diseases' => [
                    'diabetes' => ['affected' => true, 'taking_medication' => false],
                ],
            ]],
        ],
    ]);

    DailyActivity::create([
        'user_id' => $admin->id,
        'branch_id' => $branch->id,
        'task_type_id' => $taskType->id,
        'activity_date' => now()->subDay()->toDateString(),
        'form_data' => [
            'households' => [[
                'elderly_diseases' => [
                    'diabetes' => ['affected' => true, 'taking_medication' => true],
                ],
            ]],
        ],
    ]);

    FeeCollection::create([
        'user_id' => $admin->id,
        'branch_id' => $branch->id,
        'collection_date' => $today,
        'collection_type' => 'ডায়াবেটিস পরীক্ষা',
        'beneficiary_name' => 'রহিমা',
        'beneficiary_type' => 'সদস্য',
        'amount' => 50,
    ]);

    $response = $this->actingAs($admin)->getJson(route('reports.index', [
        'start_date' => $today,
        'end_date' => $today,
        'report_type' => 'illness',
    ]));

    $response->assertOk();

    expect($response->json('illnessReport.summary.diabetes_affected'))->toBe(2)
        ->and($response->json('illnessReport.summary.diabetes_medication'))->toBe(1)
        ->and($response->json('illnessReport.summary.hypertension_affected'))->toBe(1)
        ->and($response->json('illnessReport.summary.pregnant'))->toBe(1)
        ->and($response->json('illnessReport.summary.anc'))->toBe(1)
        ->and($response->json('illnessReport.summary.tt'))->toBe(1)
        ->and($response->json('illnessReport.summary.stunting'))->toBe(1)
        ->and($response->json('illnessReport.summary.disabled'))->toBe(1)
        ->and($response->json('illnessReport.summary.general_illness'))->toBe(2)
        ->and($response->json('illnessReport.summary.general_treated'))->toBe(2)
        ->and($response->json('illnessReport.summary.diabetes_tests'))->toBe(1)
        ->and($response->json('illnessReport.summary.diabetes_tests_member'))->toBe(1)
        ->and($response->json('illnessReport.summary.static_patients'))->toBe(2)
        ->and($response->json('illnessReport.static_diseases.0.disease'))->toBe('জ্বর')
        ->and($response->json('illnessReport.static_diseases.0.patients'))->toBe(2)
        ->and($response->json('illnessReport.breakdown.diabetes_affected.0.name'))->toBe('Amina')
        ->and($response->json('illnessReport.breakdown.diabetes_affected.0.role'))->toBe('খানা প্রধান')
        ->and($response->json('illnessReport.breakdown.diabetes_affected.0.branch_name'))->toBe('Illness Branch A')
        ->and($response->json('illnessReport.breakdown.diabetes_affected.0.count'))->toBe(1)
        ->and($response->json('illnessReport.breakdown.diabetes_affected.1.name'))->toBe('Saleha')
        ->and($response->json('illnessReport.breakdown.diabetes_affected.1.branch_name'))->toBe('Illness Branch B')
        ->and($response->json('illnessReport.breakdown.general_illness.0.name'))->toBe('Amina')
        ->and($response->json('illnessReport.breakdown.general_illness.0.count'))->toBe(2)
        ->and($response->json('illnessReport.breakdown.diabetes_tests.0.name'))->toBe('রহিমা')
        ->and($response->json('illnessReport.breakdown.diabetes_tests.0.role'))->toBe('সদস্য')
        ->and($response->json('illnessReport.breakdown.diabetes_tests_member.0.name'))->toBe('রহিমা')
        ->and($response->json('illnessReport.static_diseases.0.recipients.0.name'))->toBe('Karim')
        ->and($response->json('illnessReport.static_diseases.0.recipients.0.role'))->toBe('রোগী')
        ->and($response->json('illnessReport.static_diseases.0.recipients.1.name'))->toBe('Rina')
        ->and($response->json('illnessReport.breakdown.pregnant.0.name'))->toBe('Amina');

    $scoped = $this->actingAs($manager)->getJson(route('reports.index', [
        'start_date' => $today,
        'end_date' => $today,
        'report_type' => 'illness',
    ]));

    $scoped->assertOk();
    expect($scoped->json('illnessReport.summary.diabetes_affected'))->toBe(1)
        ->and($scoped->json('illnessReport.summary.diabetes_tests'))->toBe(1)
        ->and($scoped->json('illnessReport.breakdown.diabetes_affected'))->toHaveCount(1)
        ->and($scoped->json('illnessReport.breakdown.diabetes_affected.0.name'))->toBe('Amina');

    $byBranch = $this->actingAs($admin)->getJson(route('reports.index', [
        'start_date' => $today,
        'end_date' => $today,
        'report_type' => 'illness',
        'branch_id' => $branch->id,
    ]));

    $byBranch->assertOk();
    expect($byBranch->json('illnessReport.summary.diabetes_affected'))->toBe(1)
        ->and($byBranch->json('illnessReport.summary.static_patients'))->toBe(2);

    $byEmployee = $this->actingAs($admin)->getJson(route('reports.index', [
        'start_date' => $today,
        'end_date' => $today,
        'report_type' => 'illness',
        'user_id' => $worker->id,
    ]));

    $byEmployee->assertOk();
    expect($byEmployee->json('illnessReport.summary.diabetes_affected'))->toBe(1)
        ->and($byEmployee->json('illnessReport.summary.pregnant'))->toBe(0)
        ->and($byEmployee->json('illnessReport.summary.diabetes_tests'))->toBe(0)
        ->and($byEmployee->json('illnessReport.breakdown.diabetes_affected.0.name'))->toBe('Saleha')
        ->and($byEmployee->json('illnessReport.breakdown.pregnant'))->toBe([]);
});
