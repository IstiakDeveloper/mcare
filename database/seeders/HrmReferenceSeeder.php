<?php

namespace Database\Seeders;

use App\Services\HrmReferenceSyncService;
use Illuminate\Database\Seeder;

class HrmReferenceSeeder extends Seeder
{
    public function run(): void
    {
        $result = app(HrmReferenceSyncService::class)->sync();

        $this->command->info(sprintf(
            'HRM references loaded from %s (%d branches, %d officers).',
            $result['source'],
            $result['branches'],
            $result['employees'],
        ));
    }
}
