<?php

namespace App\Http\Controllers;

use App\Models\FollowUp;
use App\Models\Referral;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FollowUpController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing(['role', 'branch']);

        if ($user->isHospital()) {
            return redirect()->route('referrals.index');
        }

        $pendingQuery = Referral::query()
            ->with(['referredBy:id,name,employee_code', 'branch:id,name'])
            ->where('status', Referral::STATUS_PENDING)
            ->whereDoesntHave('followUp')
            ->orderBy('referral_date')
            ->orderBy('id');
        $this->scopeReferrals($pendingQuery, $user);

        $followUpQuery = FollowUp::query()
            ->with(['user:id,name,employee_code', 'branch:id,name'])
            ->latest('follow_up_date')
            ->latest('id');
        $this->scopeFollowUps($followUpQuery, $user);

        $type = $request->string('type')->toString();
        if (in_array($type, [FollowUp::TYPE_REFERRED, FollowUp::TYPE_CUSTOM], true)) {
            $followUpQuery->where('type', $type);
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());
            $followUpQuery->where(function (Builder $inner) use ($search): void {
                $inner->where('member_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('village_or_samity', 'like', "%{$search}%");
            });
        }

        $pending = $pendingQuery->get()->map(fn (Referral $referral) => [
            'id' => $referral->id,
            'member_name' => $referral->member_name,
            'member_code' => $referral->member_code,
            'phone' => $referral->phone,
            'village_or_samity' => $referral->village_or_samity,
            'reason' => $referral->reason,
            'referral_date' => $referral->referral_date?->toDateString(),
            'employee_name' => $referral->referredBy?->name ?: '—',
            'branch_name' => $referral->branch?->name ?: '—',
        ])->values();

        $focusId = $request->integer('referral');

        return Inertia::render('follow-ups/index', [
            'pendingReferrals' => $pending,
            'followUps' => $followUpQuery->paginate(20)->withQueryString(),
            'filters' => [
                'type' => in_array($type, [FollowUp::TYPE_REFERRED, FollowUp::TYPE_CUSTOM], true) ? $type : 'all',
                'search' => $request->string('search')->toString(),
            ],
            'focusReferralId' => $pending->contains('id', $focusId) ? $focusId : null,
            'canChooseEmployee' => $user->isAdmin() || $user->isBranchManager(),
            'employees' => $this->employeeOptions($user),
            'today' => Carbon::today()->toDateString(),
        ]);
    }

    public function storeReferred(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('role');

        abort_if($user->isHospital(), 403);

        $validated = $request->validate([
            'referral_id' => ['required', 'integer', 'exists:referrals,id'],
            'outcome' => ['required', Rule::in([FollowUp::OUTCOME_WENT, FollowUp::OUTCOME_DID_NOT_GO])],
            'medicines' => ['nullable', 'string', 'max:2000', 'required_if:outcome,'.FollowUp::OUTCOME_WENT],
            'treatment' => ['nullable', 'string', 'max:2000', 'required_if:outcome,'.FollowUp::OUTCOME_WENT],
            'follow_up_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $went = $validated['outcome'] === FollowUp::OUTCOME_WENT;

        DB::transaction(function () use ($user, $validated, $went): void {
            $referral = Referral::query()->lockForUpdate()->findOrFail($validated['referral_id']);
            abort_unless($this->canRecordReferral($user, $referral), 403);

            if ($referral->status !== Referral::STATUS_PENDING || $referral->followUp()->exists()) {
                throw ValidationException::withMessages([
                    'referral_id' => 'এই রেফারের ফলোআপ আগেই হয়েছে।',
                ]);
            }

            FollowUp::query()->create([
                'type' => FollowUp::TYPE_REFERRED,
                'referral_id' => $referral->id,
                'user_id' => $referral->referred_by,
                'branch_id' => $referral->branch_id,
                'recorded_by' => $user->id,
                'member_name' => $referral->member_name,
                'member_code' => $referral->member_code,
                'phone' => $referral->phone,
                'village_or_samity' => $referral->village_or_samity,
                'outcome' => $validated['outcome'],
                'medicines' => $went ? $validated['medicines'] : null,
                'treatment' => $went ? $validated['treatment'] : null,
                'follow_up_date' => $validated['follow_up_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $referral->update([
                'status' => $went ? Referral::STATUS_WENT : Referral::STATUS_DID_NOT_GO,
            ]);
        });

        return redirect()->route('follow-ups.index')->with('success', 'Follow up saved.');
    }

    public function storeCustom(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing('role');

        abort_if($user->isHospital(), 403);

        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'member_name' => ['required', 'string', 'max:150'],
            'member_code' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:30'],
            'village_or_samity' => ['nullable', 'string', 'max:150'],
            'previous_treatment' => ['required', 'string', 'max:2000'],
            'medicines' => ['nullable', 'string', 'max:2000'],
            'treatment' => ['required', 'string', 'max:2000'],
            'follow_up_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $owner = $this->resolveCustomOwner($user, $validated['user_id'] ?? null);

        FollowUp::query()->create([
            'type' => FollowUp::TYPE_CUSTOM,
            'user_id' => $owner->id,
            'branch_id' => $owner->branch_id,
            'recorded_by' => $user->id,
            'member_name' => $validated['member_name'],
            'member_code' => $validated['member_code'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'village_or_samity' => $validated['village_or_samity'] ?? null,
            'previous_treatment' => $validated['previous_treatment'],
            'medicines' => $validated['medicines'] ?? null,
            'treatment' => $validated['treatment'],
            'follow_up_date' => $validated['follow_up_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('follow-ups.index')->with('success', 'Custom follow up saved.');
    }

    /**
     * @param  Builder<Referral>  $query
     */
    private function scopeReferrals(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);

            return;
        }

        $query->where('referred_by', $user->id);
    }

    /**
     * @param  Builder<FollowUp>  $query
     */
    private function scopeFollowUps(Builder $query, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isBranchManager()) {
            $query->where('branch_id', $user->branch_id);

            return;
        }

        $query->where('user_id', $user->id);
    }

    private function canRecordReferral(User $user, Referral $referral): bool
    {
        if ($user->isHospital()) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isBranchManager()) {
            return (int) $referral->branch_id === (int) $user->branch_id;
        }

        return (int) $referral->referred_by === (int) $user->id;
    }

    private function resolveCustomOwner(User $actor, mixed $requestedUserId): User
    {
        if (! $actor->isAdmin() && ! $actor->isBranchManager()) {
            return $actor;
        }

        if (! $requestedUserId) {
            return $actor;
        }

        $owner = User::query()->findOrFail((int) $requestedUserId);
        if ($actor->isBranchManager() && (int) $owner->branch_id !== (int) $actor->branch_id) {
            abort(403);
        }

        return $owner;
    }

    /**
     * @return list<array{id: int, name: string, employee_code: string|null, designation: string|null, branch_name: string|null}>
     */
    private function employeeOptions(User $user): array
    {
        if (! $user->isAdmin() && ! $user->isBranchManager()) {
            return [];
        }

        return User::query()
            ->with('branch:id,name')
            ->when($user->isBranchManager(), fn (Builder $query) => $query->where('branch_id', $user->branch_id))
            ->whereHas('role', fn (Builder $role) => $role->whereIn('slug', ['worker', 'branch-manager', 'admin']))
            ->orderBy('name')
            ->get()
            ->map(fn (User $employee) => [
                'id' => $employee->id,
                'name' => $employee->name,
                'employee_code' => $employee->employee_code,
                'designation' => $employee->designation,
                'branch_name' => $employee->branch?->name,
            ])
            ->values()
            ->all();
    }
}
