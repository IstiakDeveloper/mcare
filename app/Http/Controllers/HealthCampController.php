<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHealthCampRequest;
use App\Models\Branch;
use App\Models\HealthCamp;
use App\Models\User;
use App\Services\ActivitySubmissionService;
use App\Support\FormSchema;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HealthCampController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $camps = HealthCamp::query()
            ->with(['branch', 'enteredBy'])
            ->when(
                ! $user->isAdmin(),
                fn ($query) => $query->where('branch_id', $user->branch_id),
            )
            ->latest('activity_date')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($camps);
        }

        return Inertia::render('health-camps/index', [
            'camps' => $camps,
        ]);
    }

    public function create(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('branch');

        $branches = $user->isAdmin()
            ? Branch::query()->active()->orderBy('name')->get(['id', 'name', 'branch_code'])
            : new Collection;

        return Inertia::render('health-camps/form', [
            'schema' => FormSchema::forHealthCamp(),
            'branches' => $branches,
            'selectedBranchId' => $user->branch_id,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(StoreHealthCampRequest $request, ActivitySubmissionService $service): RedirectResponse|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $camp = $service->submitHealthCamp($user, $request->validated());
        $camp->load(['branch', 'enteredBy']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['data' => $camp], 201);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Health camp recorded.',
        ]);

        if ($request->boolean('stay_on_dashboard')) {
            return redirect()->route('dashboard')->with('status', 'Health camp recorded successfully.');
        }

        return redirect()->route('health-camps.show', $camp);
    }

    public function show(Request $request, HealthCamp $healthCamp): Response|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isAdmin() && $healthCamp->branch_id !== $user->branch_id) {
            abort(403);
        }

        $healthCamp->load(['branch', 'enteredBy']);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['data' => $healthCamp]);
        }

        return Inertia::render('health-camps/show', [
            'camp' => $healthCamp,
        ]);
    }
}
