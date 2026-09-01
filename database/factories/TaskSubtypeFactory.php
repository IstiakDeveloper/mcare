<?php

namespace Database\Factories;

use App\Models\TaskSubtype;
use App\Models\TaskType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskSubtype>
 */
class TaskSubtypeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->city().' Subtype';

        return [
            'task_type_id' => TaskType::factory()->state(['requires_subtype' => true]),
            'name' => $name,
            'slug' => str($name)->slug()->toString(),
            'description' => fake()->sentence(),
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }
}
