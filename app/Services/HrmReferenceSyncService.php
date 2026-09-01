<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Role;
use App\Models\Samity;
use App\Models\TaskSubtype;
use App\Models\TaskType;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class HrmReferenceSyncService
{
    /**
     * @return array{source: string, branches: int, employees: int, samities: int, synced_at: string, duration_ms: int, status: string}
     */
    public function sync(): array
    {
        $startTime = microtime(true);
        $this->seedRoles();
        $this->seedTaskCatalog();

        try {
            $result = $this->syncFromHrm();
            $this->ensureLocalAdmin();

            $result['status'] = 'success';
        } catch (Throwable $exception) {
            Log::warning('HRM reference sync failed; using local fallback data.', [
                'message' => $exception->getMessage(),
            ]);

            $result = $this->syncFallback();
            $this->ensureLocalAdmin();

            $result['status'] = 'fallback';
            $result['error'] = $exception->getMessage();
        }

        $durationMs = (int) round((microtime(true) - $startTime) * 1000);
        $result['synced_at'] = now()->toIso8601String();
        $result['duration_ms'] = $durationMs;

        Cache::forever('hrm_last_sync', $result);

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    public function getLastSyncStatus(): array
    {
        return Cache::get('hrm_last_sync', [
            'synced_at' => null,
            'source' => 'none',
            'branches' => 0,
            'employees' => 0,
            'samities' => 0,
            'duration_ms' => 0,
            'status' => 'never',
        ]);
    }

    public function seedRoles(): void
    {
        /** @var list<array{name: string, slug: string}> $roles */
        $roles = config('mcare.roles', []);

        foreach ($roles as $role) {
            Role::query()->updateOrCreate(
                ['slug' => $role['slug']],
                ['name' => $role['name']],
            );
        }
    }

    public function seedTaskCatalog(): void
    {
        /** @var list<array<string, mixed>> $types */
        $types = config('mcare.task_types', []);

        foreach ($types as $type) {
            $taskType = TaskType::query()->updateOrCreate(
                ['slug' => $type['slug']],
                [
                    'name' => $type['name'],
                    'description' => $type['description'] ?? null,
                    'requires_subtype' => (bool) ($type['requires_subtype'] ?? false),
                    'sort_order' => (int) ($type['sort_order'] ?? 0),
                ],
            );

            /** @var list<array<string, mixed>> $subtypes */
            $subtypes = $type['subtypes'] ?? [];

            foreach ($subtypes as $subtype) {
                TaskSubtype::query()->updateOrCreate(
                    [
                        'task_type_id' => $taskType->id,
                        'slug' => $subtype['slug'],
                    ],
                    [
                        'name' => $subtype['name'],
                        'description' => $subtype['description'] ?? null,
                        'sort_order' => (int) ($subtype['sort_order'] ?? 0),
                    ],
                );
            }
        }
    }

    /**
     * @return array{source: string, branches: int, employees: int, samities: int}
     */
    private function syncFromHrm(): array
    {
        $connection = (string) config('mcare.hrm.connection', 'hrm');
        $departmentId = (int) config('mcare.hrm.health_department_id', 12);

        if (! $this->hrmTablesExist($connection)) {
            throw new \RuntimeException('HRM tables are not available on connection ['.$connection.'].');
        }

        $branchRows = DB::connection($connection)
            ->table('branches')
            ->when(
                Schema::connection($connection)->hasColumn('branches', 'deleted_at'),
                fn ($query) => $query->whereNull('deleted_at'),
            )
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'branch_code',
                'address',
                'contact_number',
                'is_active',
            ]);

        foreach ($branchRows as $row) {
            Branch::query()->updateOrCreate(
                ['external_hrm_id' => $row->id],
                [
                    'name' => $row->name,
                    'branch_code' => $row->branch_code,
                    'address' => $row->address,
                    'contact_number' => $row->contact_number,
                    'is_active' => (bool) $row->is_active,
                ],
            );
        }

        $employeeQuery = DB::connection($connection)
            ->table('employees')
            ->leftJoin('designations', 'designations.id', '=', 'employees.designation_id')
            ->where('employees.department_id', $departmentId)
            ->where('employees.status', 'active');

        $employees = $employeeQuery->get([
            'employees.id',
            'employees.employee_id',
            'employees.pin',
            'employees.name_en',
            'employees.email',
            'employees.mobile_official',
            'employees.mobile_personal',
            'employees.current_branch_id',
            'designations.name as designation',
        ]);

        $hrmUsernames = [];

        if (Schema::connection($connection)->hasTable('users')) {
            $hrmUsernames = DB::connection($connection)
                ->table('users')
                ->whereNotNull('employee_id')
                ->whereNotNull('username')
                ->pluck('username', 'employee_id')
                ->all();
        }

        $imported = 0;

        foreach ($employees as $employee) {
            $this->upsertOfficerFromHrm(
                (int) $employee->id,
                (string) ($employee->name_en ?: 'Health Officer'),
                $employee->employee_id ? (string) $employee->employee_id : null,
                $employee->email ? (string) $employee->email : null,
                $employee->mobile_official ?: $employee->mobile_personal,
                $employee->designation ? (string) $employee->designation : null,
                $employee->current_branch_id ? (int) $employee->current_branch_id : null,
                isset($hrmUsernames[$employee->id]) ? (string) $hrmUsernames[$employee->id] : null,
            );
            $imported++;
        }

        $samities = $this->ensureSampleSamities();

        return [
            'source' => 'hrm',
            'branches' => $branchRows->count(),
            'employees' => $imported,
            'samities' => $samities,
        ];
    }

    private function hrmTablesExist(string $connection): bool
    {
        try {
            DB::connection($connection)->getPdo();

            return Schema::connection($connection)->hasTable('branches')
                && Schema::connection($connection)->hasTable('employees');
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * @return array{source: string, branches: int, employees: int, samities: int}
     */
    private function syncFallback(): array
    {
        $branches = [
            ['external_hrm_id' => 1, 'name' => 'Head Office', 'branch_code' => '0000'],
            ['external_hrm_id' => 2, 'name' => 'Atrai', 'branch_code' => '0002'],
            ['external_hrm_id' => 3, 'name' => 'Bhabanipur', 'branch_code' => '0004'],
        ];

        foreach ($branches as $branch) {
            Branch::query()->updateOrCreate(
                ['external_hrm_id' => $branch['external_hrm_id']],
                [
                    'name' => $branch['name'],
                    'branch_code' => $branch['branch_code'],
                    'is_active' => true,
                ],
            );
        }

        $this->upsertOfficerFromHrm(
            1001,
            'Demo Health Officer',
            'PHCP-DEMO',
            'officer@mcare.local',
            '01700000000',
            'Community Health Officer',
            2,
            'PHCP-DEMO',
        );

        return [
            'source' => 'fallback',
            'branches' => count($branches),
            'employees' => 1,
            'samities' => $this->ensureSampleSamities(),
        ];
    }

    private function upsertOfficerFromHrm(
        int $hrmId,
        string $name,
        ?string $employeeCode,
        ?string $email,
        mixed $phone,
        ?string $designation,
        ?int $hrmBranchId,
        ?string $hrmUsername = null,
    ): void {
        $branchId = $hrmBranchId
            ? Branch::query()->where('external_hrm_id', $hrmBranchId)->value('id')
            : null;

        $roleSlug = $this->roleSlugForDesignation($designation);
        $roleId = Role::query()->where('slug', $roleSlug)->value('id');
        $user = User::query()->firstOrNew(['external_hrm_id' => $hrmId]);

        $user->fill([
            'name' => $name,
            'username' => $this->uniqueUsername($hrmUsername, $employeeCode, $hrmId, $user->id),
            'employee_code' => $employeeCode,
            'email' => $this->uniqueEmail($email, $employeeCode, $hrmId, $user->id),
            'phone' => $phone ? (string) $phone : null,
            'designation' => $designation,
            'role_id' => $roleId,
            'branch_id' => $branchId,
        ]);

        if (! $user->exists) {
            $user->email_verified_at = now();
            $user->password = (string) config('mcare.hrm.default_password', 'password');
        }

        $user->save();
    }

    private function roleSlugForDesignation(?string $designation): string
    {
        $normalized = Str::lower(trim((string) $designation));
        /** @var list<string> $adminDesignations */
        $adminDesignations = config('mcare.hrm.admin_designations', []);

        foreach ($adminDesignations as $adminDesignation) {
            if ($normalized === Str::lower($adminDesignation)) {
                return 'admin';
            }
        }

        return 'worker';
    }

    private function uniqueEmail(?string $email, ?string $employeeCode, int $hrmId, ?int $ignoreUserId = null): string
    {
        $candidate = $email ?: Str::slug((string) ($employeeCode ?: 'officer-'.$hrmId)).'@mcare.local';

        $exists = User::query()
            ->where('email', $candidate)
            ->when($ignoreUserId, fn ($query) => $query->where('id', '!=', $ignoreUserId))
            ->where(function ($query) use ($hrmId): void {
                $query->whereNull('external_hrm_id')
                    ->orWhere('external_hrm_id', '!=', $hrmId);
            })
            ->exists();

        if ($exists) {
            return 'hrm-'.$hrmId.'@mcare.local';
        }

        return $candidate;
    }

    private function uniqueUsername(?string $username, ?string $employeeCode, int $hrmId, ?int $ignoreUserId = null): string
    {
        $candidate = trim((string) $username);

        if ($candidate === '') {
            $candidate = trim((string) $employeeCode) ?: 'officer-'.$hrmId;
        }

        $exists = User::query()
            ->whereRaw('LOWER(username) = ?', [Str::lower($candidate)])
            ->when($ignoreUserId, fn ($query) => $query->where('id', '!=', $ignoreUserId))
            ->exists();

        if ($exists) {
            return $candidate.'-'.$hrmId;
        }

        return $candidate;
    }

    private function ensureSampleSamities(): int
    {
        $perBranch = (int) config('mcare.hrm.samities_per_branch', 3);
        $created = 0;

        Branch::query()->active()->each(function (Branch $branch) use ($perBranch, &$created): void {
            for ($index = 1; $index <= $perBranch; $index++) {
                $code = sprintf('%s-S%02d', $branch->branch_code ?: $branch->id, $index);

                $samity = Samity::query()->firstOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'code' => $code,
                    ],
                    [
                        'name' => $branch->name.' Samity '.$index,
                        'is_active' => true,
                    ],
                );

                if ($samity->wasRecentlyCreated) {
                    $created++;
                }
            }
        });

        return $created;
    }

    private function ensureLocalAdmin(): void
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');
        $headOfficeId = Branch::query()->where('branch_code', '0000')->value('id')
            ?? Branch::query()->value('id');

        $admin = User::query()->firstOrNew(['email' => 'admin@mcare.local']);
        $admin->fill([
            'name' => 'M Care Admin',
            'username' => $admin->username ?: 'admin',
            'designation' => 'System Admin',
            'employee_code' => 'MCARE-ADMIN',
            'role_id' => $adminRoleId,
            'branch_id' => $headOfficeId,
        ]);

        if (! $admin->exists) {
            $admin->email_verified_at = now();
            $admin->password = (string) config('mcare.hrm.default_password', 'password');
        }

        $admin->save();
    }
}
