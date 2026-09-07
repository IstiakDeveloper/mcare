<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyActivity;
use App\Models\FeeCollection;
use App\Models\HealthCamp;
use App\Models\Samity;
use App\Models\TaskType;
use App\Models\User;
use App\Support\FormSchema;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing(['role', 'branch']);

        $today = now()->toDateString();

        $todayActivities = DailyActivity::query()
            ->with(['taskType', 'taskSubtype', 'samity', 'branch'])
            ->where('user_id', $user->id)
            ->whereDate('activity_date', $today)
            ->latest()
            ->get();

        $recentActivities = DailyActivity::query()
            ->with(['taskType', 'taskSubtype', 'samity', 'branch'])
            ->where('user_id', $user->id)
            ->latest('activity_date')
            ->latest()
            ->limit(10)
            ->get();

        $taskTypes = TaskType::query()
            ->with('subtypes')
            ->orderBy('sort_order')
            ->get();

        $todayCampCount = HealthCamp::query()
            ->when(
                ! $user->isAdmin(),
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->whereDate('activity_date', $today)
            ->count();

        $branchId = $user->isAdmin()
            ? $request->integer('branch_id') ?: $user->branch_id
            : $user->branch_id;

        $samities = $branchId
            ? Samity::query()->where('branch_id', $branchId)->active()->orderBy('name')->get(['id', 'name', 'code', 'branch_id'])
            : new Collection;

        $branches = $user->isAdmin()
            ? Branch::query()->active()->orderBy('name')->get(['id', 'name', 'branch_code'])
            : ($user->branch ? collect([$user->branch]) : new Collection);

        // Preload schemas for instant single-screen forms
        $formSchemas = [];
        foreach ($taskTypes as $type) {
            if ($type->requires_subtype) {
                foreach ($type->subtypes as $subtype) {
                    $formSchemas[$subtype->slug] = FormSchema::forTask($type, $subtype);
                }
            } else {
                $formSchemas[$type->slug] = FormSchema::forTask($type, null);
            }
        }
        $formSchemas['health-camp'] = FormSchema::forHealthCamp();

        // Calculate total beneficiaries served today across user's activities
        $totalBeneficiariesToday = 0;
        foreach ($todayActivities as $act) {
            $data = $act->form_data ?? [];
            $totalBeneficiariesToday += (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? 0);
        }

        // Admin-specific live monitoring & oversight metrics
        $adminOverview = null;
        if ($user->isAdmin()) {
            $allTodayActivities = DailyActivity::query()
                ->with(['taskType', 'taskSubtype', 'user', 'branch', 'samity'])
                ->whereDate('activity_date', $today)
                ->latest('created_at')
                ->get();

            $allTodayFees = FeeCollection::query()
                ->with(['user', 'branch'])
                ->whereDate('collection_date', $today)
                ->get();

            $allTodayCamps = HealthCamp::query()
                ->with(['user', 'branch'])
                ->whereDate('activity_date', $today)
                ->get();

            // All field workers (officers eligible to submit daily tasks)
            $allWorkers = User::query()
                ->with('branch')
                ->whereHas('role', fn ($q) => $q->where('slug', '!=', 'admin'))
                ->orWhereNull('role_id')
                ->orderBy('name')
                ->get();

            // Calculate submitted vs pending officers
            $submittedUserIds = $allTodayActivities->pluck('user_id')
                ->merge($allTodayFees->pluck('user_id'))
                ->unique()
                ->filter()
                ->values();

            $submittedOfficers = [];
            foreach ($submittedUserIds as $uId) {
                $officer = $allWorkers->firstWhere('id', $uId) ?? User::with('branch')->find($uId);
                if (! $officer) continue;

                $userActs = $allTodayActivities->where('user_id', $uId);
                $userFees = $allTodayFees->where('user_id', $uId);

                $beneficiariesCount = 0;
                foreach ($userActs as $act) {
                    $data = $act->form_data ?? [];
                    $beneficiariesCount += (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? (isset($data['patients']) ? count($data['patients']) : 0));
                }

                $lastActivity = $userActs->first();

                $submittedOfficers[] = [
                    'id' => $officer->id,
                    'name' => $officer->name,
                    'employee_code' => $officer->employee_code ?: '—',
                    'designation' => $officer->designation ?: 'Health Worker',
                    'phone' => $officer->phone ?: '—',
                    'branch_id' => $officer->branch_id,
                    'branch_name' => $officer->branch?->name ?: '—',
                    'activities_count' => $userActs->count(),
                    'beneficiaries_count' => $beneficiariesCount,
                    'fee_collected' => (float) $userFees->sum('amount'),
                    'last_submission_time' => $lastActivity ? $lastActivity->created_at?->format('h:i A') : null,
                    'last_task_name' => $lastActivity ? ($lastActivity->taskSubtype?->name ?: $lastActivity->taskType?->name) : 'Fee Collection',
                ];
            }

            // Pending officers who have NOT submitted any task today
            $pendingOfficers = [];
            foreach ($allWorkers as $worker) {
                if (! $submittedUserIds->contains($worker->id)) {
                    $pendingOfficers[] = [
                        'id' => $worker->id,
                        'name' => $worker->name,
                        'employee_code' => $worker->employee_code ?: '—',
                        'designation' => $worker->designation ?: 'Field Worker',
                        'phone' => $worker->phone ?: '—',
                        'branch_id' => $worker->branch_id,
                        'branch_name' => $worker->branch?->name ?: '—',
                    ];
                }
            }

            // Branch by branch performance today
            $allBranchesList = Branch::query()->active()->orderBy('name')->get();
            $branchProgress = [];
            foreach ($allBranchesList as $b) {
                $branchWorkers = $allWorkers->where('branch_id', $b->id);
                $branchSubmitted = $branchWorkers->filter(fn ($w) => $submittedUserIds->contains($w->id))->count();
                $branchActs = $allTodayActivities->where('branch_id', $b->id);
                $branchFeeTotal = (float) $allTodayFees->where('branch_id', $b->id)->sum('amount');

                $bBeneficiaries = 0;
                foreach ($branchActs as $act) {
                    $data = $act->form_data ?? [];
                    $bBeneficiaries += (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? (isset($data['patients']) ? count($data['patients']) : 0));
                }

                $branchProgress[] = [
                    'branch_id' => $b->id,
                    'branch_name' => $b->name,
                    'branch_code' => $b->branch_code,
                    'total_officers' => $branchWorkers->count(),
                    'submitted_count' => $branchSubmitted,
                    'pending_count' => max(0, $branchWorkers->count() - $branchSubmitted),
                    'activities_count' => $branchActs->count(),
                    'beneficiaries_count' => $bBeneficiaries,
                    'fee_amount' => $branchFeeTotal,
                ];
            }

            $allTodayBeneficiariesTotal = 0;
            foreach ($allTodayActivities as $act) {
                $data = $act->form_data ?? [];
                $allTodayBeneficiariesTotal += (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? (isset($data['patients']) ? count($data['patients']) : 0));
            }

            $adminOverview = [
                'total_users' => User::count(),
                'total_branches' => $allBranchesList->count(),
                'total_active_officers' => $allWorkers->count(),
                'submitted_today_count' => count($submittedOfficers),
                'pending_today_count' => count($pendingOfficers),
                'submission_rate' => $allWorkers->count() > 0 ? round((count($submittedOfficers) / $allWorkers->count()) * 100, 1) : 0,
                'today_all_activities_count' => $allTodayActivities->count(),
                'today_all_beneficiaries' => $allTodayBeneficiariesTotal,
                'today_all_fees' => (float) $allTodayFees->sum('amount'),
                'today_all_camps' => $allTodayCamps->count(),
                'submitted_officers' => $submittedOfficers,
                'pending_officers' => $pendingOfficers,
                'branch_progress' => $branchProgress,
                'recent_system_activities' => $allTodayActivities->take(10),
                'hrm_today' => $this->getHrmTodayStatus($today),
            ];
        }

        return Inertia::render('dashboard', [
            'taskTypes' => $taskTypes,
            'todayActivities' => $todayActivities,
            'recentActivities' => $recentActivities,
            'todayCampCount' => $todayCampCount,
            'totalBeneficiariesToday' => $totalBeneficiariesToday,
            'today' => $today,
            'samities' => $samities,
            'branches' => $branches,
            'selectedBranchId' => $branchId,
            'formSchemas' => $formSchemas,
            'adminOverview' => $adminOverview,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function getHrmTodayStatus(string $today): array
    {
        $connection = (string) config('mcare.hrm.connection', 'hrm');
        $departmentId = (int) config('mcare.hrm.health_department_id', 12);

        try {
            if (! \Illuminate\Support\Facades\Schema::connection($connection)->hasTable('employees')) {
                return $this->getFallbackHrmStatus();
            }

            $db = \Illuminate\Support\Facades\DB::connection($connection);

            $healthEmployees = $db->table('employees')
                ->leftJoin('designations', 'designations.id', '=', 'employees.designation_id')
                ->leftJoin('branches', 'branches.id', '=', 'employees.current_branch_id')
                ->where('employees.department_id', $departmentId)
                ->where('employees.status', 'active')
                ->select([
                    'employees.id',
                    'employees.employee_id',
                    'employees.name_en',
                    'employees.email',
                    'employees.mobile_official',
                    'employees.mobile_personal',
                    'employees.current_branch_id',
                    'branches.name as branch_name',
                    'designations.name as designation',
                ])
                ->get();

            if ($healthEmployees->isEmpty()) {
                return $this->getFallbackHrmStatus();
            }

            $empIds = $healthEmployees->pluck('id')->all();

            $attendances = \Illuminate\Support\Facades\Schema::connection($connection)->hasTable('attendances')
                ? $db->table('attendances')->whereIn('employee_id', $empIds)->where('date', $today)->get()->keyBy('employee_id')
                : collect();

            $movements = \Illuminate\Support\Facades\Schema::connection($connection)->hasTable('movements')
                ? $db->table('movements')->whereIn('employee_id', $empIds)->where(function ($q) use ($today) {
                    $q->whereDate('from_datetime', $today)->orWhereDate('created_at', $today);
                })->get()->groupBy('employee_id')
                : collect();

            $leaves = \Illuminate\Support\Facades\Schema::connection($connection)->hasTable('leave_applications')
                ? $db->table('leave_applications')->whereIn('employee_id', $empIds)->where('start_date', '<=', $today)->where('end_date', '>=', $today)->get()->groupBy('employee_id')
                : collect();

            $presentList = [];
            $movementList = [];
            $leaveList = [];
            $absentList = [];

            foreach ($healthEmployees as $emp) {
                $att = $attendances->get($emp->id);
                $mov = $movements->get($emp->id);
                $lea = $leaves->get($emp->id);

                $item = [
                    'id' => $emp->id,
                    'employee_id' => $emp->employee_id ? (string) $emp->employee_id : '—',
                    'name' => $emp->name_en ?: 'Health Officer',
                    'branch_name' => $emp->branch_name ?? 'Head Office',
                    'designation' => $emp->designation ?? 'Health Officer',
                    'phone' => $emp->mobile_official ?: $emp->mobile_personal ?: '—',
                    'check_in' => $att?->check_in ? substr((string) $att->check_in, 0, 5) : null,
                    'check_out' => $att?->check_out ? substr((string) $att->check_out, 0, 5) : null,
                    'status' => $att?->status ?? 'absent',
                    'movement_purpose' => $mov ? $mov->first()?->purpose : null,
                    'movement_destination' => $mov ? $mov->first()?->destination : null,
                    'leave_reason' => $lea ? $lea->first()?->reason : null,
                ];

                if ($att && in_array($att->status, ['present', 'late', 'half_day', 'on_duty'])) {
                    $presentList[] = $item;
                } elseif ($mov && $mov->isNotEmpty()) {
                    $item['status'] = 'movement';
                    $movementList[] = $item;
                } elseif ($lea && $lea->isNotEmpty()) {
                    $item['status'] = 'leave';
                    $leaveList[] = $item;
                } else {
                    $item['status'] = 'absent';
                    $absentList[] = $item;
                }
            }

            return [
                'connected' => true,
                'total_staff' => $healthEmployees->count(),
                'present_count' => count($presentList),
                'movement_count' => count($movementList),
                'leave_count' => count($leaveList),
                'absent_count' => count($absentList),
                'present_list' => $presentList,
                'movement_list' => $movementList,
                'leave_list' => $leaveList,
                'absent_list' => $absentList,
            ];
        } catch (\Throwable $e) {
            return $this->getFallbackHrmStatus();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function getFallbackHrmStatus(): array
    {
        $workers = User::with('branch')->whereHas('role', fn ($q) => $q->where('slug', '!=', 'admin'))->get();

        return [
            'connected' => false,
            'total_staff' => $workers->count(),
            'present_count' => 0,
            'movement_count' => 0,
            'leave_count' => 0,
            'absent_count' => $workers->count(),
            'present_list' => [],
            'movement_list' => [],
            'leave_list' => [],
            'absent_list' => $workers->map(fn ($w) => [
                'id' => $w->id,
                'employee_id' => $w->employee_code ?: '—',
                'name' => $w->name,
                'branch_name' => $w->branch?->name ?: '—',
                'designation' => $w->designation ?: 'Health Officer',
                'phone' => $w->phone ?: '—',
                'status' => 'absent',
                'check_in' => null,
                'check_out' => null,
                'movement_purpose' => null,
                'movement_destination' => null,
                'leave_reason' => null,
            ])->values()->all(),
        ];
    }
}
