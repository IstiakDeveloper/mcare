<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDailyActivityRequest;
use App\Models\DailyActivity;
use App\Models\User;
use App\Services\ActivitySubmissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DailyActivityController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $activities = DailyActivity::query()
            ->with(['taskType', 'taskSubtype', 'samity', 'branch', 'user'])
            ->when(
                $user->isAdmin(),
                fn ($query) => $query,
                fn ($query) => $user->isBranchManager()
                    ? $query->where('branch_id', $user->branch_id)
                    : $query->where('user_id', $user->id),
            )
            ->latest('activity_date')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($activities);
        }

        return Inertia::render('activities/index', [
            'activities' => $activities,
        ]);
    }

    public function store(StoreDailyActivityRequest $request, ActivitySubmissionService $service): RedirectResponse|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $activity = $service->submitDailyActivity($user, $request->validated());
        $activity->load(['taskType', 'taskSubtype', 'samity', 'branch']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['data' => $activity], 201);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Daily activity submitted.',
        ]);

        if ($request->boolean('stay_on_dashboard')) {
            return redirect()->route('dashboard')->with('status', 'Daily activity submitted successfully.');
        }

        return redirect()->route('activities.show', $activity);
    }

    public function show(Request $request, DailyActivity $activity): Response|JsonResponse
    {
        $this->authorizeView($request, $activity);

        $activity->load(['taskType', 'taskSubtype', 'samity', 'branch', 'user']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['data' => $activity]);
        }

        return Inertia::render('activities/show', [
            'activity' => $activity,
        ]);
    }

    private function authorizeView(Request $request, DailyActivity $activity): void
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isBranchManager() && $activity->branch_id === $user->branch_id) {
            return;
        }

        if ($activity->user_id === $user->id) {
            return;
        }

        abort(403);
    }
}
