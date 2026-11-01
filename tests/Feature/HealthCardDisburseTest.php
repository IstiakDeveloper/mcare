<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\HealthCardDisburse;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCardDisburseTest extends TestCase
{
    use RefreshDatabase;

    private User $worker;

    private User $admin;

    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $workerRole = Role::create([
            'name' => 'Health Worker',
            'slug' => 'worker',
        ]);

        $adminRole = Role::create([
            'name' => 'System Admin',
            'slug' => 'admin',
        ]);

        $this->branch = Branch::create([
            'name' => 'Chandpura Branch',
            'branch_code' => 'CHD-01',
            'is_active' => true,
        ]);

        $this->worker = User::factory()->create([
            'role_id' => $workerRole->id,
            'branch_id' => $this->branch->id,
        ]);

        $this->admin = User::factory()->create([
            'role_id' => $adminRole->id,
            'branch_id' => null,
        ]);
    }

    public function test_user_can_view_health_cards_index(): void
    {
        HealthCardDisburse::create([
            'user_id' => $this->worker->id,
            'branch_id' => $this->branch->id,
            'member_name' => 'মোসাঃ রোকেয়া বেগম',
            'member_code' => 'MEM-5001',
            'health_card_number' => 'HC-2026-001',
            'entry_date' => now()->toDateString(),
            'expire_date' => now()->addYear()->toDateString(),
            'phone' => '01700000000',
            'village_or_samity' => 'চাঁদপুরা সমিতি',
        ]);

        $response = $this->actingAs($this->worker)->get(route('health-cards.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('health-cards/index')
            ->has('cards.data', 1)
            ->where('cards.data.0.member_name', 'মোসাঃ রোকেয়া বেগম')
            ->where('cards.data.0.validity_status', 'active')
            ->where('branchLedger', null)
        );
    }

    public function test_user_can_store_health_card_with_auto_one_year_expiry(): void
    {
        $today = now()->toDateString();
        $expectedExpiry = Carbon::parse($today)->addYear()->toDateString();

        $response = $this->actingAs($this->worker)->post(route('health-cards.store'), [
            'member_name' => 'ফাতেমা আক্তার',
            'member_code' => 'MEM-8800',
            'health_card_number' => 'HC-2026-999',
            'entry_date' => $today,
            'phone' => '01812345678',
            'village_or_samity' => 'চর চাঁদপুরা',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('health_card_disburses', [
            'member_name' => 'ফাতেমা আক্তার',
            'member_code' => 'MEM-8800',
            'health_card_number' => 'HC-2026-999',
            'user_id' => $this->worker->id,
            'branch_id' => $this->branch->id,
        ]);

        $card = HealthCardDisburse::where('health_card_number', 'HC-2026-999')->first();
        $this->assertNotNull($card);
        $this->assertEquals($today, $card->entry_date->toDateString());
        $this->assertEquals($expectedExpiry, $card->expire_date->toDateString());
    }

    public function test_user_can_store_health_card_with_custom_extended_expiry(): void
    {
        $today = now()->toDateString();
        $customExpiry = Carbon::parse($today)->addYears(3)->toDateString();

        $response = $this->actingAs($this->worker)->post(route('health-cards.store'), [
            'member_name' => 'আফরোজা খানম',
            'member_code' => 'MEM-9900',
            'health_card_number' => 'HC-2026-3YR',
            'entry_date' => $today,
            'expire_date' => $customExpiry,
            'phone' => '01912345678',
        ]);

        $response->assertRedirect();
        $card = HealthCardDisburse::where('health_card_number', 'HC-2026-3YR')->first();
        $this->assertNotNull($card);
        $this->assertEquals('আফরোজা খানম', $card->member_name);
        $this->assertEquals($customExpiry, $card->expire_date->toDateString());
    }

    public function test_admin_can_update_health_card(): void
    {
        $card = HealthCardDisburse::create([
            'user_id' => $this->worker->id,
            'branch_id' => $this->branch->id,
            'member_name' => 'সাবিহা সুলতানা',
            'member_code' => 'MEM-1100',
            'health_card_number' => 'HC-OLD-11',
            'entry_date' => now()->toDateString(),
            'expire_date' => now()->addYear()->toDateString(),
        ]);

        $response = $this->actingAs($this->admin)->put(route('health-cards.update', $card), [
            'member_name' => 'সাবিহা সুলতানা (সংশোধিত)',
            'member_code' => 'MEM-1100',
            'health_card_number' => 'HC-NEW-11',
            'entry_date' => now()->toDateString(),
            'expire_date' => now()->addYears(2)->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('health_card_disburses', [
            'id' => $card->id,
            'member_name' => 'সাবিহা সুলতানা (সংশোধিত)',
            'health_card_number' => 'HC-NEW-11',
        ]);
    }

    public function test_admin_can_delete_health_card(): void
    {
        $card = HealthCardDisburse::create([
            'user_id' => $this->worker->id,
            'branch_id' => $this->branch->id,
            'member_name' => 'আনোয়ার হোসেন',
            'member_code' => 'MEM-2200',
            'health_card_number' => 'HC-2200',
            'entry_date' => now()->toDateString(),
            'expire_date' => now()->addYear()->toDateString(),
        ]);

        $response = $this->actingAs($this->admin)->delete(route('health-cards.destroy', $card));

        $response->assertRedirect();
        $this->assertDatabaseMissing('health_card_disburses', [
            'id' => $card->id,
        ]);
    }

    public function test_branch_ledger_counts_cards_per_branch_for_the_selected_dates(): void
    {
        $other = Branch::create([
            'name' => 'Rampur Branch',
            'branch_code' => 'RMP-01',
            'is_active' => true,
        ]);
        Branch::create([
            'name' => 'Empty Branch',
            'branch_code' => 'EMP-01',
            'is_active' => true,
        ]);

        $this->makeCard('চাঁদপুরা এক', '2026-03-10');
        $this->makeCard('চাঁদপুরা দুই', '2026-03-20');
        $this->makeCard('চাঁদপুরা বাইরে', '2026-08-01');

        HealthCardDisburse::create([
            'user_id' => $this->admin->id,
            'branch_id' => $other->id,
            'member_name' => 'রামপুর এক',
            'member_code' => 'MEM-R1',
            'health_card_number' => 'HC-R1',
            'entry_date' => '2026-03-12',
            'expire_date' => '2027-03-12',
        ]);

        $response = $this->actingAs($this->admin)->get(route('health-cards.index', [
            'view' => 'ledger',
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-31',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('filters.view', 'ledger')
            ->has('branchLedger', 3)
            ->where('branchLedger.0.name', 'Chandpura Branch')
            ->where('branchLedger.0.total_count', 2)
            ->where('branchLedger.1.name', 'Rampur Branch')
            ->where('branchLedger.1.total_count', 1)
            ->where('branchLedger.2.name', 'Empty Branch')
            ->where('branchLedger.2.total_count', 0)
        );

        $workerResponse = $this->actingAs($this->worker)->get(route('health-cards.index', [
            'view' => 'ledger',
            'start_date' => '2026-03-01',
            'end_date' => '2026-03-31',
        ]));

        $workerResponse->assertOk();
        $workerResponse->assertInertia(fn ($page) => $page
            ->has('branchLedger', 1)
            ->where('branchLedger.0.name', 'Chandpura Branch')
            ->where('branchLedger.0.total_count', 2)
        );
    }

    public function test_date_range_filter_returns_cards_disbursed_between_from_and_to(): void
    {
        $this->makeCard('আগে বিতরণ', '2026-01-05');
        $this->makeCard('মাঝের কার্ড', '2026-03-15');
        $this->makeCard('পরে বিতরণ', '2026-06-20');

        $response = $this->actingAs($this->worker)->get(route('health-cards.index', [
            'start_date' => '2026-02-01',
            'end_date' => '2026-04-30',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('cards.data', 1)
            ->where('cards.data.0.member_name', 'মাঝের কার্ড')
            ->where('filters.start_date', '2026-02-01')
            ->where('filters.end_date', '2026-04-30')
        );
    }

    public function test_to_date_alone_includes_every_card_up_to_that_day(): void
    {
        $this->makeCard('আগে বিতরণ', '2026-01-05');
        $this->makeCard('ওই দিন', '2026-03-15');
        $this->makeCard('পরে বিতরণ', '2026-06-20');

        $response = $this->actingAs($this->worker)->get(route('health-cards.index', [
            'end_date' => '2026-03-15',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('cards.data', 2)
            ->where('filters.start_date', '')
            ->where('filters.end_date', '2026-03-15')
        );
    }

    public function test_from_date_alone_includes_every_card_from_that_day(): void
    {
        $this->makeCard('আগে বিতরণ', '2026-01-05');
        $this->makeCard('ওই দিন', '2026-03-15');
        $this->makeCard('পরে বিতরণ', '2026-06-20');

        $response = $this->actingAs($this->worker)->get(route('health-cards.index', [
            'start_date' => '2026-03-15',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('cards.data', 2));
    }

    public function test_reversed_date_range_still_returns_the_list(): void
    {
        $this->makeCard('মাঝের কার্ড', '2026-03-15');
        $this->makeCard('বাইরের কার্ড', '2026-08-01');

        $response = $this->actingAs($this->worker)->get(route('health-cards.index', [
            'start_date' => '2026-04-30',
            'end_date' => '2026-02-01',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('cards.data', 1)
            ->where('cards.data.0.member_name', 'মাঝের কার্ড')
            ->where('filters.start_date', '2026-02-01')
            ->where('filters.end_date', '2026-04-30')
        );
    }

    public function test_invalid_date_filter_does_not_hide_the_list(): void
    {
        $this->makeCard('দৃশ্যমান কার্ড', now()->toDateString());

        $response = $this->actingAs($this->worker)->get(route('health-cards.index', [
            'start_date' => 'not-a-date',
            'end_date' => 'also-bad',
        ]));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('cards.data', 1)
            ->where('cards.data.0.member_name', 'দৃশ্যমান কার্ড')
            ->where('filters.start_date', '')
            ->where('filters.end_date', '')
        );
    }

    private function makeCard(string $name, string $entryDate): HealthCardDisburse
    {
        return HealthCardDisburse::create([
            'user_id' => $this->worker->id,
            'branch_id' => $this->branch->id,
            'member_name' => $name,
            'member_code' => 'MEM-'.substr(md5($name), 0, 6),
            'health_card_number' => 'HC-'.substr(md5($name.$entryDate), 0, 8),
            'entry_date' => $entryDate,
            'expire_date' => Carbon::parse($entryDate)->addYear()->toDateString(),
        ]);
    }
}
