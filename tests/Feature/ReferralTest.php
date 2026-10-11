<?php

use App\Models\Branch;
use App\Models\Referral;
use App\Models\Role;
use App\Models\User;

test('a worker referral stays credited to that worker', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Referral Branch', 'branch_code' => 'RF-01', 'is_active' => true]);
    $worker = User::factory()->create([
        'role_id' => $workerRole->id,
        'branch_id' => $branch->id,
        'employee_code' => 'W-01',
        'designation' => 'Field Worker',
    ]);
    $other = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);

    $this->actingAs($worker)->post(route('referrals.store'), [
        'referred_by' => $other->id,
        'member_name' => 'রহিমা বেগম',
        'member_code' => 'M-100',
        'phone' => '01700000000',
        'reason' => 'ডায়াবেটিস ফলোআপ',
        'referral_date' => now()->toDateString(),
    ])->assertRedirect();

    $referral = Referral::query()->first();
    expect($referral)->not->toBeNull()
        ->and($referral->referred_by)->toBe($worker->id)
        ->and($referral->branch_id)->toBe($branch->id)
        ->and($referral->status)->toBe(Referral::STATUS_PENDING);
});

test('hospital staff record arrival without changing who referred', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $hospitalRole = Role::query()->firstOrCreate(['slug' => 'hospital'], ['name' => 'Hospital']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Hospital Branch', 'branch_code' => 'RF-02', 'is_active' => true]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);
    $hospital = User::factory()->create(['role_id' => $hospitalRole->id]);

    $referral = Referral::query()->create([
        'referred_by' => $worker->id,
        'branch_id' => $branch->id,
        'created_by' => $worker->id,
        'member_name' => 'করিম উদ্দিন',
        'reason' => 'চোখের সমস্যা',
        'referral_date' => now()->toDateString(),
        'status' => Referral::STATUS_PENDING,
    ]);

    $this->actingAs($hospital)->put(route('referrals.update', $referral), [
        'status' => Referral::STATUS_ARRIVED,
        'hospital_notes' => 'বিকেলের সেশনে এসেছেন',
        'referred_by' => $hospital->id,
    ])->assertRedirect();

    $referral->refresh();
    expect($referral->status)->toBe(Referral::STATUS_ARRIVED)
        ->and($referral->referred_by)->toBe($worker->id)
        ->and($referral->recorded_by)->toBe($hospital->id)
        ->and($referral->arrived_at)->not->toBeNull()
        ->and($referral->hospital_notes)->toBe('বিকেলের সেশনে এসেছেন');
});

test('hospital walk-in referrals require the referring employee', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $hospitalRole = Role::query()->firstOrCreate(['slug' => 'hospital'], ['name' => 'Hospital']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Walkin Branch', 'branch_code' => 'RF-03', 'is_active' => true]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);
    $hospital = User::factory()->create(['role_id' => $hospitalRole->id]);

    $payload = [
        'member_name' => 'সালমা',
        'reason' => 'গর্ভকালীন চেকআপ',
        'referral_date' => now()->toDateString(),
    ];

    $this->actingAs($hospital)->from('/referrals')->post(route('referrals.store'), $payload)
        ->assertSessionHasErrors('referred_by');

    $this->actingAs($hospital)->post(route('referrals.store'), [
        ...$payload,
        'referred_by' => $worker->id,
    ])->assertRedirect();

    $referral = Referral::query()->first();
    expect($referral->referred_by)->toBe($worker->id)
        ->and($referral->created_by)->toBe($hospital->id)
        ->and($referral->branch_id)->toBe($branch->id);
});

test('referral report counts by referring employee inside the date range', function () {
    $adminRole = Role::query()->firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Count Branch', 'branch_code' => 'RF-04', 'is_active' => true]);
    $admin = User::factory()->create(['role_id' => $adminRole->id, 'branch_id' => $branch->id]);
    $first = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id, 'name' => 'First Worker']);
    $second = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id, 'name' => 'Second Worker']);

    Referral::query()->create([
        'referred_by' => $first->id,
        'branch_id' => $branch->id,
        'member_name' => 'আজকের সদস্য',
        'reason' => 'জ্বর',
        'referral_date' => now()->toDateString(),
        'status' => Referral::STATUS_ARRIVED,
    ]);
    Referral::query()->create([
        'referred_by' => $second->id,
        'branch_id' => $branch->id,
        'member_name' => 'আরেক সদস্য',
        'reason' => 'কাশি',
        'referral_date' => now()->toDateString(),
        'status' => Referral::STATUS_PENDING,
    ]);
    Referral::query()->create([
        'referred_by' => $first->id,
        'branch_id' => $branch->id,
        'member_name' => 'গতকালের সদস্য',
        'reason' => 'পুরনো',
        'referral_date' => now()->subDay()->toDateString(),
        'status' => Referral::STATUS_ARRIVED,
    ]);

    $response = $this->actingAs($admin)->getJson(route('reports.index', [
        'report_type' => 'referral',
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
    ]));

    $response->assertOk();
    expect($response->json('referralReport.summary.total'))->toBe(2)
        ->and($response->json('referralReport.summary.arrived'))->toBe(1)
        ->and($response->json('referralReport.summary.pending'))->toBe(1)
        ->and(collect($response->json('referralReport.employees'))->pluck('user_id')->all())
        ->toEqualCanonicalizing([$first->id, $second->id]);
});

test('a branch manager only sees referrals from their own branch', function () {
    $managerRole = Role::query()->firstOrCreate(['slug' => 'branch-manager'], ['name' => 'Branch Manager']);
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $ownBranch = Branch::query()->firstOrCreate(['name' => 'Own Branch', 'branch_code' => 'RF-05', 'is_active' => true]);
    $otherBranch = Branch::query()->firstOrCreate(['name' => 'Other Branch', 'branch_code' => 'RF-06', 'is_active' => true]);
    $manager = User::factory()->create(['role_id' => $managerRole->id, 'branch_id' => $ownBranch->id]);
    $ownWorker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $ownBranch->id]);
    $otherWorker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $otherBranch->id]);

    Referral::query()->create([
        'referred_by' => $ownWorker->id,
        'branch_id' => $ownBranch->id,
        'member_name' => 'নিজ শাখা',
        'reason' => 'চেকআপ',
        'referral_date' => now()->toDateString(),
    ]);
    Referral::query()->create([
        'referred_by' => $otherWorker->id,
        'branch_id' => $otherBranch->id,
        'member_name' => 'অন্য শাখা',
        'reason' => 'চেকআপ',
        'referral_date' => now()->toDateString(),
    ]);

    $response = $this->actingAs($manager)->getJson(route('reports.index', [
        'report_type' => 'referral',
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
    ]));

    $response->assertOk();
    expect($response->json('referralReport.summary.total'))->toBe(1)
        ->and($response->json('referralReport.members.0.member_name'))->toBe('নিজ শাখা');
});

test('a worker referral report only counts their own referrals', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Worker Scope Branch', 'branch_code' => 'RF-07', 'is_active' => true]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);
    $colleague = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);

    Referral::query()->create([
        'referred_by' => $worker->id,
        'branch_id' => $branch->id,
        'member_name' => 'নিজের সদস্য',
        'reason' => 'ফলোআপ',
        'referral_date' => now()->toDateString(),
    ]);
    Referral::query()->create([
        'referred_by' => $colleague->id,
        'branch_id' => $branch->id,
        'member_name' => 'সহকর্মীর সদস্য',
        'reason' => 'ফলোআপ',
        'referral_date' => now()->toDateString(),
    ]);

    $response = $this->actingAs($worker)->getJson(route('reports.index', [
        'report_type' => 'referral',
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
        'user_id' => $colleague->id,
    ]));

    $response->assertOk();
    expect($response->json('referralReport.summary.total'))->toBe(1)
        ->and($response->json('referralReport.members.0.member_name'))->toBe('নিজের সদস্য');
});
