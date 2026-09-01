<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\Samity;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Samity>
 */
class SamityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'name' => fake()->streetName().' Samity',
            'code' => fake()->unique()->bothify('S-####'),
            'is_active' => true,
        ];
    }
}
