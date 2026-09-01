<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\FeeCollection;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeeCollectionTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create([
            'name' => 'Health Worker',
            'slug' => 'health-worker',
        ]);

        $this->branch = Branch::create([
            'name' => 'Chandpura Branch',
            'branch_code' => 'CHD-01',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'role_id' => $role->id,
            'branch_id' => $this->branch->id,
        ]);
    }

    public function test_user_can_view_fee_collections_index(): void
    {
        FeeCollection::create([
            'user_id' => $this->user->id,
            'branch_id' => $this->branch->id,
            'collection_date' => now()->toDateString(),
            'collection_type' => 'ডায়াবেটিস পরীক্ষা',
            'beneficiary_name' => 'রহিমা খাতুন',
            'beneficiary_type' => 'সদস্য',
            'age' => '45',
            'phone' => '01711223344',
            'location_info' => 'চাঁদপুরা সমিতি',
            'diabetes_reading' => '6.8 mmol/L',
            'amount' => 50,
            'notes' => 'নিয়মিত পরীক্ষা',
        ]);

        $response = $this->actingAs($this->user)->get(route('fee-collections.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('collections/index')
            ->has('collections.data', 1)
            ->where('stats.today_amount', 50)
            ->where('stats.today_diabetes_count', 1)
        );
    }

    public function test_user_can_store_fee_collection_with_diabetes_reading(): void
    {
        $payload = [
            'collection_date' => now()->toDateString(),
            'collection_type' => 'ডায়াবেটিস পরীক্ষা',
            'beneficiary_name' => 'আব্দুল করিম',
            'beneficiary_type' => 'অ-সদস্য',
            'age' => '58',
            'phone' => '01899887766',
            'location_info' => 'দক্ষিণ পাড়া',
            'diabetes_reading' => '7.4 mmol/L',
            'amount' => 60,
            'notes' => 'রক্তের গ্লুকোজ পরিমাপ',
        ];

        $response = $this->actingAs($this->user)->post(route('fee-collections.store'), $payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('fee_collections', [
            'user_id' => $this->user->id,
            'beneficiary_name' => 'আব্দুল করিম',
            'collection_type' => 'ডায়াবেটিস পরীক্ষা',
            'diabetes_reading' => '7.4 mmol/L',
            'amount' => 60,
        ]);
    }

    public function test_user_can_delete_fee_collection(): void
    {
        $collection = FeeCollection::create([
            'user_id' => $this->user->id,
            'branch_id' => $this->branch->id,
            'collection_date' => now()->toDateString(),
            'collection_type' => 'স্ট্যাটিক ক্লিনিক',
            'beneficiary_name' => 'নাসিমা বেগম',
            'beneficiary_type' => 'সদস্য',
            'amount' => 30,
        ]);

        $response = $this->actingAs($this->user)->delete(route('fee-collections.destroy', $collection));

        $response->assertRedirect();
        $this->assertDatabaseMissing('fee_collections', [
            'id' => $collection->id,
        ]);
    }
}
