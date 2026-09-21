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
}
