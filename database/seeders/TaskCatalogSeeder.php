<?php

namespace Database\Seeders;

use App\Services\HrmReferenceSyncService;
use Illuminate\Database\Seeder;

class TaskCatalogSeeder extends Seeder
{
    public function run(): void
    {
        app(HrmReferenceSyncService::class)->seedTaskCatalog();
    }
}
