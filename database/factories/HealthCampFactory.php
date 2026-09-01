<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\HealthCamp;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HealthCamp>
 */
class HealthCampFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'branch_id' => Branch::factory(),
            'entered_by' => User::factory(),
            'activity_date' => now()->toDateString(),
            'service_data' => [
                'camp_name' => 'General Health Camp',
                'location' => fake()->streetName(),
                'patients_served' => fake()->numberBetween(10, 80),
            ],
        ];
    }
}
