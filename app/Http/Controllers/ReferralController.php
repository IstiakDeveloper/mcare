<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Referral;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReferralController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing(['role', 'branch']);

        $query = Referral::query()
            ->with([
                'referredBy:id,name,employee_code,designation,branch_id',
                'branch:id,name',
                'recordedBy:id,name',
            ])
            ->latest('referral_date')
            ->latest('id');

        $this->scopeQuery($query, $user);

        if ($user->isAdmin() || $user->isHospital()) {
            if ($request->filled('branch_id') && $request->input('branch_id') !== 'all') {
                $query->where('branch_id', $request->integer('branch_id'));
            }
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('start_date')) {
            $query->whereDate('referral_date', '>=', $request->string('start_date')->toString());
        }

        if ($request->filled('end_date')) {
            $query->whereDate('referral_date', '<=', $request->string('end_date')->toString());
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());
            $query->where(function ($inner) use ($search): void {
                $inner->where('member_name', 'like', "%{$search}%")
                    ->orWhere('member_code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('village_or_samity', 'like', "%{$search}%");
            });
        }

        $statsQuery = clone $query;

        $employees = [];
        if ($user->isAdmin() || $user->isHospital()) {
            $employees = User::query()
                ->with('branch:id,name')
                ->whereHas('role', fn ($role) => $role->whereIn('slug', ['worker', 'branch-manager', 'admin']))
                ->orderBy('name')
                ->get()
                ->map(fn (User $employee) => [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'employee_code' => $employee->employee_code,
                    'designation' => $employee->designation,
                    'branch_name' => $employee->branch?->name,
                ])
                ->values();
        }

        $branches = ($user->isAdmin() || $user->isHospital())
            ? Branch::query()->orderBy('name')->get(['id', 'name'])
            : ($user->branch ? [['id' => $user->branch->id, 'name' => $user->branch->name]] : []);

        return Inertia::render('referrals/index', [
            'referrals' => $query->paginate(20)->withQueryString(),
            'stats' => [
                'total' => (clone $statsQuery)->count(),
                'pending' => (clone $statsQuery)->where('status', Referral::STATUS_PENDING)->count(),
                'arrived' => (clone $statsQuery)->where('status', Referral::STATUS_ARRIVED)->count(),
                'not_arrived' => (clone $statsQuery)->where('status', Referral::STATUS_NOT_ARRIVED)->count(),
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString() ?: 'all',
                'start_date' => $request->string('start_date')->toString(),
                'end_date' => $request->string('end_date')->toString(),
                'branch_id' => $request->string('branch_id')->toString() ?: 'all',
            ],
            'branches' => $branches,
            'employees' => $employees,
            'canChooseEmployee' => $user->isAdmin() || $user->isHospital(),
            'canRecordArrival' => $user->isAdmin() || $user->isHospital(),
            'today' => Carbon::today()->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('role');

        $validated = $request->validate([
            'member_name' => ['required', 'string', 'max:150'],
            'member_code' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:30'],
            'age' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'max:20'],
            'village_or_samity' => ['nullable', 'string', 'max:150'],
            'reason' => ['required', 'string', 'max:1000'],
            'referral_date' => ['required', 'date'],
            'referred_by' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if ($user->isAdmin() || $user->isHospital()) {
            $request->validate([
                'referred_by' => ['required', 'integer', 'exists:users,id'],
            ]);
            $referrer = User::query()->findOrFail($validated['referred_by']);
        } else {
            $referrer = $user;
        }

        Referral::query()->create([
            'referred_by' => $referrer->id,
            'branch_id' => $referrer->branch_id,
            'created_by' => $user->id,
            'member_name' => $validated['member_name'],
            'member_code' => $validated['member_code'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'village_or_samity' => $validated['village_or_samity'] ?? null,
            'reason' => $validated['reason'],
            'referral_date' => $validated['referral_date'],
            'status' => Referral::STATUS_PENDING,
        ]);

        return back()->with('success', 'Referral saved.');
    }

    public function update(Request $request, Referral $referral): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('role');

        abort_unless($user->isAdmin() || $user->isHospital(), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                Referral::STATUS_PENDING,
                Referral::STATUS_ARRIVED,
                Referral::STATUS_NOT_ARRIVED,
            ])],
            'hospital_notes' => ['nullable', 'string', 'max:1000'],
            'member_name' => ['sometimes', 'required', 'string', 'max:150'],
            'member_code' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:30'],
            'village_or_samity' => ['nullable', 'string', 'max:150'],
        ]);

        $status = $validated['status'];
        $referral->fill([
            'status' => $status,
            'hospital_notes' => $validated['hospital_notes'] ?? $referral->hospital_notes,
            'member_name' => $validated['member_name'] ?? $referral->member_name,
            'member_code' => array_key_exists('member_code', $validated) ? $validated['member_code'] : $referral->member_code,
            'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $referral->phone,
            'village_or_samity' => array_key_exists('village_or_samity', $validated) ? $validated['village_or_samity'] : $referral->village_or_samity,
            'recorded_by' => $user->id,
            'arrived_at' => $status === Referral::STATUS_ARRIVED ? ($referral->arrived_at ?? now()) : null,
        ]);
        $referral->save();

        return back()->with('success', 'Referral updated.');
    }

    /**
     * @param  Builder<Referral>  $query
     */
    private function scopeQuery($query, User $user): void
    {
        if ($user->isAdmin() || $user->isHospital()) {
            return;
        }

        if ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);

            return;
        }

        $query->where('referred_by', $user->id);
    }
}
