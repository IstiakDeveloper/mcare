<?php

namespace App\Console\Commands;

use App\Services\HrmReferenceSyncService;
use Illuminate\Console\Command;

class SyncHrmReferenceDataCommand extends Command
{
    protected $signature = 'mcare:sync-hrm';

    protected $description = 'Sync lightweight branch and Health Department employee references from HRM';

    public function handle(HrmReferenceSyncService $sync): int
    {
        $result = $sync->sync();

        $this->info(sprintf(
            'Synced from %s: %d branches, %d health officers, %d new samities.',
            $result['source'],
            $result['branches'],
            $result['employees'],
            $result['samities'],
        ));

        $this->comment('Default password for new officers and admin@mcare.local: '.config('mcare.hrm.default_password'));

        return self::SUCCESS;
    }
}
