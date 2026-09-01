<?php

namespace Database\Seeders;

use App\Services\HrmReferenceSyncService;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        app(HrmReferenceSyncService::class)->seedRoles();
    }
}
