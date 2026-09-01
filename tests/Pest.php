<?php

use App\Models\Branch;
use App\Models\Role;
use App\Models\Samity;
use App\Models\TaskType;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\TaskCatalogSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(LazilyRefreshDatabase::class)
    ->in('Feature');

function seedCatalog(): void
{
    test()->seed(RoleSeeder::class);
    test()->seed(TaskCatalogSeeder::class);
}

/**
 * @param  array<string, mixed>  $overrides
 */
function officer(array $overrides = []): User
{
    seedCatalog();

    $role = Role::query()->where('slug', 'worker')->first()
        ?? Role::factory()->create(['name' => 'Worker', 'slug' => 'worker']);

    if (! isset($overrides['branch_id'])) {
        $overrides['branch_id'] = Branch::factory()->create()->id;
    }

    return User::factory()->create([
        'role_id' => $role->id,
        'email_verified_at' => now(),
        ...$overrides,
    ]);
}

function samityFor(User $user): Samity
{
    return Samity::factory()->create([
        'branch_id' => $user->branch_id,
    ]);
}

function taskId(string $slug): int
{
    return (int) TaskType::query()->where('slug', $slug)->value('id');
}
