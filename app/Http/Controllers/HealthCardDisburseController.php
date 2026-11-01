<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\HealthCardDisburse;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class HealthCardDisburseController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $today = Carbon::today()->toDateString();
        $thirtyDaysFromNow = Carbon::today()->addDays(30)->toDateString();

        $isAdmin = $user->isAdmin();
        $isBranchManager = $user->isBranchManager();
        $showLedger = $request->input('view') === 'ledger';
        [$startDate, $endDate] = $this->entryDateRange($request);

        $query = HealthCardDisburse::query()
            ->with(['user:id,name,employee_code', 'branch:id,name,branch_code'])
            ->leftJoin('branches', 'branches.id', '=', 'health_card_disburses.branch_id')
            ->select('health_card_disburses.*')
            ->orderBy('branches.branch_code')
            ->orderByDesc('health_card_disburses.entry_date')
            ->orderByDesc('health_card_disburses.id');

        $this->applyCardVisibility($query, $user, $isAdmin, $isBranchManager);
        $this->applyCardFilters($query, $request, $today, $thirtyDaysFromNow, $startDate, $endDate, true);

        // Statistics Base Query
        $statsBaseQuery = HealthCardDisburse::query();
        if (! $isAdmin) {
            if ($isBranchManager || $user->branch_id) {
                $statsBaseQuery->where('branch_id', $user->branch_id);
            } else {
                $statsBaseQuery->where('user_id', $user->id);
            }
        } elseif ($request->filled('branch_id')) {
            $statsBaseQuery->where('branch_id', $request->input('branch_id'));
        }

        $totalCount = (clone $statsBaseQuery)->count();
        $monthCount = (clone $statsBaseQuery)
            ->whereYear('entry_date', Carbon::today()->year)
            ->whereMonth('entry_date', Carbon::today()->month)
            ->count();
        $activeCount = (clone $statsBaseQuery)->whereDate('expire_date', '>=', $today)->count();
        $expiredCount = (clone $statsBaseQuery)->whereDate('expire_date', '<', $today)->count();
        $expiringSoonCount = (clone $statsBaseQuery)
            ->whereDate('expire_date', '>=', $today)
            ->whereDate('expire_date', '<=', $thirtyDaysFromNow)
            ->count();

        $branches = $isAdmin
            ? Branch::query()->orderBy('branch_code')->orderBy('name')->get(['id', 'name', 'branch_code'])
            : ($user->branch ? collect([$user->branch]) : collect());

        $paginated = $query->paginate(25)->withQueryString();

        // Append computed fields for each record
        $paginated->getCollection()->transform(function ($card) use ($today) {
            $expireDate = Carbon::parse($card->expire_date);
            $todayCarbon = Carbon::parse($today);
            $daysRemaining = (int) $todayCarbon->diffInDays($expireDate, false);

            $validityStatus = 'active';
            if ($daysRemaining < 0) {
                $validityStatus = 'expired';
            } elseif ($daysRemaining <= 30) {
                $validityStatus = 'expiring_soon';
            }

            $card->days_remaining = $daysRemaining;
            $card->validity_status = $validityStatus;

            return $card;
        });

        return Inertia::render('health-cards/index', [
            'cards' => $paginated,
            'filters' => [
                'search' => $request->input('search', ''),
                'branch_id' => $request->input('branch_id', ''),
                'status' => $request->input('status', ''),
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
                'view' => $showLedger ? 'ledger' : '',
            ],
            'branchLedger' => $this->branchLedger($request, $user, $isAdmin, $isBranchManager, $today, $thirtyDaysFromNow, $startDate, $endDate),
            'stats' => [
                'total_count' => $totalCount,
                'month_count' => $monthCount,
                'active_count' => $activeCount,
                'expired_count' => $expiredCount,
                'expiring_soon_count' => $expiringSoonCount,
            ],
            'branches' => $branches,
            'today' => $today,
            'userBranchId' => $user->branch_id,
            'userBranchName' => $user->branch
                ? trim($user->branch->name.($user->branch->branch_code ? ' ('.$user->branch->branch_code.')' : ''))
                : 'প্রধান শাখা',
            'canManage' => $isAdmin || $isBranchManager,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'member_name' => ['required', 'string', 'max:255'],
            'member_code' => ['required', 'string', 'max:100'],
            'health_card_number' => ['required', 'string', 'max:100'],
            'entry_date' => ['required', 'date'],
            'expire_date' => ['nullable', 'date', 'after_or_equal:entry_date'],
            'phone' => ['nullable', 'string', 'max:50'],
            'village_or_samity' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ], [
            'member_name.required' => 'সদস্যের নাম আবশ্যক।',
            'member_code.required' => 'সদস্য কোড আবশ্যক।',
            'health_card_number.required' => 'হেলথ কার্ড নম্বর আবশ্যক।',
            'entry_date.required' => 'বিতরণের তারিখ আবশ্যক।',
            'expire_date.after_or_equal' => 'মেয়াদ উত্তীর্ণের তারিখ এন্ট্রি তারিখের সমান বা পরবর্তী হতে হবে।',
        ]);

        $user = Auth::user();
        $validated['user_id'] = $user->id;
        $validated['branch_id'] = $validated['branch_id'] ?? $user->branch_id;

        // If expire_date is not explicitly set, default to 1 year from entry_date
        if (empty($validated['expire_date'])) {
            $validated['expire_date'] = Carbon::parse($validated['entry_date'])->addYear()->toDateString();
        }

        HealthCardDisburse::create($validated);

        return redirect()->back()->with('success', 'হেলথ কার্ড সফলভাবে বিতরণ ও সংরক্ষণ করা হয়েছে।');
    }

    public function update(Request $request, HealthCardDisburse $healthCard): RedirectResponse
    {
        $user = Auth::user();

        // Check permission (Admin, Branch Manager, or the Creator)
        if (! $user->isAdmin() && ! $user->isBranchManager() && $healthCard->user_id !== $user->id) {
            abort(403, 'আপনার এই তথ্য সংশোধন করার অনুমতি নেই।');
        }

        $validated = $request->validate([
            'member_name' => ['required', 'string', 'max:255'],
            'member_code' => ['required', 'string', 'max:100'],
            'health_card_number' => ['required', 'string', 'max:100'],
            'entry_date' => ['required', 'date'],
            'expire_date' => ['nullable', 'date', 'after_or_equal:entry_date'],
            'phone' => ['nullable', 'string', 'max:50'],
            'village_or_samity' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ], [
            'member_name.required' => 'সদস্যের নাম আবশ্যক।',
            'member_code.required' => 'সদস্য কোড আবশ্যক।',
            'health_card_number.required' => 'হেলথ কার্ড নম্বর আবশ্যক।',
            'entry_date.required' => 'বিতরণের তারিখ আবশ্যক।',
            'expire_date.after_or_equal' => 'মেয়াদ উত্তীর্ণের তারিখ এন্ট্রি তারিখের সমান বা পরবর্তী হতে হবে।',
        ]);

        if (empty($validated['expire_date'])) {
            $validated['expire_date'] = Carbon::parse($validated['entry_date'])->addYear()->toDateString();
        }

        $healthCard->update($validated);

        return redirect()->back()->with('success', 'হেলথ কার্ডের তথ্য সফলভাবে সংশোধন করা হয়েছে।');
    }

    public function destroy(HealthCardDisburse $healthCard): RedirectResponse
    {
        $user = Auth::user();

        // Only Admin or Branch Manager can delete
        if (! $user->isAdmin() && ! $user->isBranchManager()) {
            abort(403, 'শুধুমাত্র এডমিন বা শাখা ব্যবস্থাপক কার্ড মুছে ফেলতে পারবেন।');
        }

        $healthCard->delete();

        return redirect()->back()->with('success', 'হেলথ কার্ডের রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে।');
    }

    /**
     * @param  Builder<HealthCardDisburse>  $query
     */
    private function applyCardVisibility(Builder $query, User $user, bool $isAdmin, bool $isBranchManager): void
    {
        if ($isAdmin) {
            return;
        }

        if ($isBranchManager || $user->branch_id) {
            $query->where('branch_id', $user->branch_id);

            return;
        }

        $query->where('user_id', $user->id);
    }

    /**
     * @param  Builder<HealthCardDisburse>  $query
     */
    private function applyCardFilters(
        Builder $query,
        Request $request,
        string $today,
        string $thirtyDaysFromNow,
        ?string $startDate,
        ?string $endDate,
        bool $restrictBranch,
    ): void {
        /** @var User $user */
        $user = Auth::user();

        if ($restrictBranch && $user->isAdmin() && $request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('member_name', 'like', "%{$search}%")
                    ->orWhere('member_code', 'like', "%{$search}%")
                    ->orWhere('health_card_number', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('village_or_samity', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->whereDate('expire_date', '>=', $today);
            } elseif ($status === 'expired') {
                $query->whereDate('expire_date', '<', $today);
            } elseif ($status === 'expiring_soon') {
                $query->whereDate('expire_date', '>=', $today)
                    ->whereDate('expire_date', '<=', $thirtyDaysFromNow);
            }
        }

        $this->applyEntryDateRange($query, $startDate, $endDate);
    }

    /**
     * @return list<array{branch_id: int|null, name: string, code: string|null, total_count: int, active_count: int, expiring_soon_count: int, expired_count: int}>
     */
    private function branchLedger(
        Request $request,
        User $user,
        bool $isAdmin,
        bool $isBranchManager,
        string $today,
        string $thirtyDaysFromNow,
        ?string $startDate,
        ?string $endDate,
    ): array {
        $query = HealthCardDisburse::query();
        $this->applyCardVisibility($query, $user, $isAdmin, $isBranchManager);
        $this->applyCardFilters($query, $request, $today, $thirtyDaysFromNow, $startDate, $endDate, false);

        $counts = $query
            ->select('branch_id')
            ->selectRaw('COUNT(*) as total_count')
            ->selectRaw('SUM(CASE WHEN expire_date > ? THEN 1 ELSE 0 END) as active_count', [$thirtyDaysFromNow])
            ->selectRaw('SUM(CASE WHEN expire_date >= ? AND expire_date <= ? THEN 1 ELSE 0 END) as expiring_soon_count', [$today, $thirtyDaysFromNow])
            ->selectRaw('SUM(CASE WHEN expire_date < ? THEN 1 ELSE 0 END) as expired_count', [$today])
            ->groupBy('branch_id')
            ->get()
            ->keyBy(fn ($row) => (string) ($row->branch_id ?? 'none'));

        $branchRows = $isAdmin
            ? Branch::query()->orderBy('branch_code')->orderBy('name')->get(['id', 'name', 'branch_code'])
            : ($user->branch ? collect([$user->branch]) : collect());

        $rows = $branchRows->map(function ($branch) use ($counts) {
            $count = $counts->get((string) $branch->id);

            return [
                'branch_id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->branch_code,
                'total_count' => (int) ($count->total_count ?? 0),
                'active_count' => (int) ($count->active_count ?? 0),
                'expiring_soon_count' => (int) ($count->expiring_soon_count ?? 0),
                'expired_count' => (int) ($count->expired_count ?? 0),
            ];
        });

        $knownIds = $branchRows->pluck('id')->map(fn ($id) => (string) $id);
        foreach ($counts as $key => $count) {
            if ($knownIds->contains((string) $key) || (int) $count->total_count === 0) {
                continue;
            }

            $rows->push([
                'branch_id' => $count->branch_id,
                'name' => $count->branch_id ? 'অজানা শাখা' : 'শাখা নির্ধারিত নেই',
                'code' => null,
                'total_count' => (int) $count->total_count,
                'active_count' => (int) $count->active_count,
                'expiring_soon_count' => (int) $count->expiring_soon_count,
                'expired_count' => (int) $count->expired_count,
            ]);
        }

        return $rows
            ->sort(function (array $a, array $b): int {
                $codeA = (string) ($a['code'] ?? '');
                $codeB = (string) ($b['code'] ?? '');

                if ($codeA === '' && $codeB !== '') {
                    return 1;
                }

                if ($codeB === '' && $codeA !== '') {
                    return -1;
                }

                $byCode = strnatcasecmp($codeA, $codeB);
                if ($byCode !== 0) {
                    return $byCode;
                }

                return strcmp($a['name'], $b['name']);
            })
            ->values()
            ->all();
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private function entryDateRange(Request $request): array
    {
        $start = $this->parseFilterDate($request->input('start_date'));
        $end = $this->parseFilterDate($request->input('end_date'));

        if ($start === null && $end === null) {
            $single = $this->parseFilterDate($request->input('date'));
            if ($single !== null) {
                $start = $single;
                $end = $single;
            }
        }

        if ($start !== null && $end !== null && $start > $end) {
            return [$end, $start];
        }

        return [$start, $end];
    }

    private function parseFilterDate(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  Builder<HealthCardDisburse>  $query
     */
    private function applyEntryDateRange(Builder $query, ?string $start, ?string $end): void
    {
        if ($start !== null) {
            $query->whereDate('entry_date', '>=', $start);
        }

        if ($end !== null) {
            $query->whereDate('entry_date', '<=', $end);
        }
    }
}
