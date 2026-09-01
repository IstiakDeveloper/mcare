<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyActivity;
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

        // Calculate total beneficiaries served today across all activities
        $totalBeneficiariesToday = 0;
        foreach ($todayActivities as $act) {
            $data = $act->form_data ?? [];
            $totalBeneficiariesToday += (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? 0);
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
        ]);
    }
}

