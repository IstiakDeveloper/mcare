<?php

use App\Models\Branch;
use App\Models\FollowUp;
use App\Models\Referral;
use App\Models\Role;
use App\Models\User;

test('a pending referral becomes a referred follow up only when follow up is saved', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Follow Branch', 'branch_code' => 'FU-01', 'is_active' => true]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);

    $referral = Referral::query()->create([
        'referred_by' => $worker->id,
        'branch_id' => $branch->id,
        'created_by' => $worker->id,
        'member_name' => 'রহিমা',
        'reason' => 'ডায়াবেটিস',
        'referral_date' => now()->toDateString(),
        'status' => Referral::STATUS_PENDING,
    ]);

    $this->actingAs($worker)->get(route('follow-ups.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('follow-ups/index')
            ->where('pendingReferrals.0.member_name', 'রহিমা'));

    $this->actingAs($worker)->post(route('follow-ups.referred'), [
        'referral_id' => $referral->id,
        'outcome' => FollowUp::OUTCOME_WENT,
        'medicines' => 'মেটফরমিন',
        'treatment' => 'ডায়াবেটিস কাউন্সেলিং',
        'follow_up_date' => now()->toDateString(),
    ])->assertRedirect(route('follow-ups.index'));

    $referral->refresh();
    $followUp = FollowUp::query()->first();

    expect($referral->status)->toBe(Referral::STATUS_WENT)
        ->and($followUp->type)->toBe(FollowUp::TYPE_REFERRED)
        ->and($followUp->referral_id)->toBe($referral->id)
        ->and($followUp->member_name)->toBe('রহিমা')
        ->and($followUp->medicines)->toBe('মেটফরমিন')
        ->and($followUp->user_id)->toBe($worker->id)
        ->and(FollowUp::query()->count())->toBe(1);

    $this->actingAs($worker)->from(route('follow-ups.index'))->post(route('follow-ups.referred'), [
        'referral_id' => $referral->id,
        'outcome' => FollowUp::OUTCOME_DID_NOT_GO,
        'follow_up_date' => now()->toDateString(),
    ])->assertRedirect(route('follow-ups.index'))
        ->assertSessionHasErrors('referral_id');

    expect(FollowUp::query()->count())->toBe(1);
});

test('a referred follow up can record that the member did not go', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Missed Branch', 'branch_code' => 'FU-02', 'is_active' => true]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);
    $referral = Referral::query()->create([
        'referred_by' => $worker->id,
        'branch_id' => $branch->id,
        'member_name' => 'করিম',
        'reason' => 'চোখ',
        'referral_date' => now()->toDateString(),
        'status' => Referral::STATUS_PENDING,
    ]);

    $this->actingAs($worker)->post(route('follow-ups.referred'), [
        'referral_id' => $referral->id,
        'outcome' => FollowUp::OUTCOME_DID_NOT_GO,
        'follow_up_date' => now()->toDateString(),
    ])->assertRedirect();

    expect($referral->refresh()->status)->toBe(Referral::STATUS_DID_NOT_GO)
        ->and(FollowUp::query()->first()->medicines)->toBeNull();
});

test('hospital staff cannot record a referral follow up', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $hospitalRole = Role::query()->firstOrCreate(['slug' => 'hospital'], ['name' => 'Hospital']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Hospital Follow Branch', 'branch_code' => 'FU-03', 'is_active' => true]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);
    $hospital = User::factory()->create(['role_id' => $hospitalRole->id]);
    $referral = Referral::query()->create([
        'referred_by' => $worker->id,
        'branch_id' => $branch->id,
        'member_name' => 'সালমা',
        'reason' => 'চেকআপ',
        'referral_date' => now()->toDateString(),
        'status' => Referral::STATUS_PENDING,
    ]);

    $this->actingAs($hospital)->post(route('follow-ups.referred'), [
        'referral_id' => $referral->id,
        'outcome' => FollowUp::OUTCOME_WENT,
        'medicines' => 'ওষুধ',
        'treatment' => 'চিকিৎসা',
        'follow_up_date' => now()->toDateString(),
    ])->assertForbidden();

    expect($referral->refresh()->status)->toBe(Referral::STATUS_PENDING)
        ->and(FollowUp::query()->count())->toBe(0);
});

test('a worker can record a custom follow up without a referral', function () {
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Custom Branch', 'branch_code' => 'FU-04', 'is_active' => true]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);

    $this->actingAs($worker)->post(route('follow-ups.store'), [
        'member_name' => 'আমেনা',
        'previous_treatment' => 'জ্বরের ওষুধ',
        'treatment' => 'এখন সুস্থ, পরামর্শ দেওয়া হয়েছে',
        'medicines' => 'প্যারাসিটামল',
        'follow_up_date' => now()->toDateString(),
    ])->assertRedirect(route('follow-ups.index'));

    $followUp = FollowUp::query()->first();
    expect($followUp->type)->toBe(FollowUp::TYPE_CUSTOM)
        ->and($followUp->referral_id)->toBeNull()
        ->and($followUp->previous_treatment)->toBe('জ্বরের ওষুধ')
        ->and($followUp->user_id)->toBe($worker->id)
        ->and(Referral::query()->count())->toBe(0);
});

test('follow up report can be filtered by type', function () {
    $adminRole = Role::query()->firstOrCreate(['slug' => 'admin'], ['name' => 'Admin']);
    $workerRole = Role::query()->firstOrCreate(['slug' => 'worker'], ['name' => 'Worker']);
    $branch = Branch::query()->firstOrCreate(['name' => 'Report Follow Branch', 'branch_code' => 'FU-05', 'is_active' => true]);
    $admin = User::factory()->create(['role_id' => $adminRole->id, 'branch_id' => $branch->id]);
    $worker = User::factory()->create(['role_id' => $workerRole->id, 'branch_id' => $branch->id]);

    FollowUp::query()->create([
        'type' => FollowUp::TYPE_REFERRED,
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'member_name' => 'রেফার্ড সদস্য',
        'outcome' => FollowUp::OUTCOME_WENT,
        'medicines' => 'ওষুধ',
        'treatment' => 'চিকিৎসা',
        'follow_up_date' => now()->toDateString(),
    ]);
    FollowUp::query()->create([
        'type' => FollowUp::TYPE_CUSTOM,
        'user_id' => $worker->id,
        'branch_id' => $branch->id,
        'member_name' => 'কাস্টম সদস্য',
        'previous_treatment' => 'আগের চিকিৎসা',
        'treatment' => 'ফলোআপ পরামর্শ',
        'follow_up_date' => now()->toDateString(),
    ]);

    $response = $this->actingAs($admin)->getJson(route('reports.index', [
        'report_type' => 'followup',
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
    ]));

    $response->assertOk();
    expect($response->json('followUpReport.summary.total'))->toBe(2)
        ->and($response->json('followUpReport.summary.referred'))->toBe(1)
        ->and($response->json('followUpReport.summary.custom'))->toBe(1)
        ->and($response->json('followUpReport.summary.went'))->toBe(1);

    $custom = $this->actingAs($admin)->getJson(route('reports.index', [
        'report_type' => 'followup',
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
        'followup_type' => FollowUp::TYPE_CUSTOM,
    ]));

    expect($custom->json('followUpReport.summary.total'))->toBe(2)
        ->and($custom->json('followUpReport.rows'))->toHaveCount(1)
        ->and($custom->json('followUpReport.rows.0.member_name'))->toBe('কাস্টম সদস্য');
});
