<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'external_hrm_id' => fake()->unique()->numberBetween(1000, 999999),
            'name' => fake()->city().' Branch',
            'branch_code' => fake()->unique()->numerify('0###'),
            'address' => fake()->address(),
            'contact_number' => fake()->numerify('01#########'),
            'is_active' => true,
        ];
    }
}
