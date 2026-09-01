<?php

namespace Database\Factories;

use App\Models\Branch;
use App\Models\DailyActivity;
use App\Models\TaskType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DailyActivity>
 */
class DailyActivityFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'branch_id' => Branch::factory(),
            'samity_id' => null,
            'task_type_id' => TaskType::factory(),
            'task_subtype_id' => null,
            'activity_date' => now()->toDateString(),
            'form_data' => [
                'notes' => fake()->sentence(),
            ],
        ];
    }
}
