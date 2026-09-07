<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDailyActivityRequest;
use App\Models\Branch;
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

        $branchId = $request->input('branch_id');
        $userId = $request->input('user_id');
        $search = $request->input('search');

        $activities = DailyActivity::query()
            ->with(['taskType', 'taskSubtype', 'samity', 'branch', 'user'])
            ->when(
                $user->isAdmin(),
                fn ($query) => $query
                    ->when($branchId && $branchId !== 'all', fn ($q) => $q->where('branch_id', $branchId))
                    ->when($userId && $userId !== 'all', fn ($q) => $q->where('user_id', $userId)),
                fn ($query) => $user->isBranchManager()
                    ? $query->where('branch_id', $user->branch_id)
                    : $query->where('user_id', $user->id),
            )
            ->when($search, function ($query, $term) {
                $query->where(function ($q) use ($term) {
                    $q->whereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('samity', fn ($sq) => $sq->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('branch', fn ($bq) => $bq->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('taskType', fn ($tq) => $tq->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('taskSubtype', fn ($tq) => $tq->where('name', 'like', "%{$term}%"));
                });
            })
            ->latest('activity_date')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($activities);
        }

        $branches = $user->isAdmin()
            ? Branch::query()->active()->orderBy('name')->get(['id', 'name'])
            : collect();

        $officers = $user->isAdmin()
            ? User::query()->orderBy('name')->get(['id', 'name', 'branch_id', 'employee_code'])
            : collect();

        return Inertia::render('activities/index', [
            'activities' => $activities,
            'branches' => $branches,
            'officers' => $officers,
            'filters' => [
                'branch_id' => $branchId ?: 'all',
                'user_id' => $userId ?: 'all',
                'search' => $search ?: '',
            ],
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

    public function update(Request $request, DailyActivity $activity): RedirectResponse|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isAdmin() && ! ($user->isBranchManager() && $activity->branch_id === $user->branch_id) && $activity->user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'activity_date' => ['sometimes', 'required', 'date'],
            'branch_id' => ['sometimes', 'nullable', 'exists:branches,id'],
            'samity_id' => ['sometimes', 'nullable', 'exists:samities,id'],
            'form_data' => ['sometimes', 'nullable', 'array'],
            'remarks' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $formData = $activity->form_data ?? [];
        if (isset($validated['form_data']) && is_array($validated['form_data'])) {
            $formData = array_merge($formData, $validated['form_data']);
        }
        if (isset($validated['remarks'])) {
            $formData['remarks'] = $validated['remarks'];
            $formData['notes'] = $validated['remarks'];
        }
        $validated['form_data'] = $formData;

        $activity->update($validated);
        $activity->load(['taskType', 'taskSubtype', 'samity', 'branch', 'user']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['data' => $activity, 'message' => 'Activity updated successfully.']);
        }

        return back()->with('status', 'Activity record updated successfully.');
    }

    public function destroy(Request $request, DailyActivity $activity): RedirectResponse|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isAdmin() && ! ($user->isBranchManager() && $activity->branch_id === $user->branch_id)) {
            abort(403, 'Only administrators or branch managers can delete activities.');
        }

        $activity->delete();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Activity deleted successfully.']);
        }

        return redirect()->route('activities.index')->with('status', 'Activity record deleted successfully.');
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
