<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\HealthCardDisburse;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class HealthCardDisburseController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $today = Carbon::today()->toDateString();
        $thirtyDaysFromNow = Carbon::today()->addDays(30)->toDateString();

        $query = HealthCardDisburse::with(['user:id,name,employee_code', 'branch:id,name,branch_code'])
            ->latest('entry_date')
            ->latest('id');

        // Role & Branch Scoping
        $isAdmin = $user->isAdmin();
        $isBranchManager = $user->isBranchManager();

        if (! $isAdmin) {
            if ($isBranchManager || $user->branch_id) {
                $query->where('branch_id', $user->branch_id);
            } else {
                $query->where('user_id', $user->id);
            }
        } elseif ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Search Filter
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

        // Status Filter
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

        // Date / Month Filter
        if ($request->filled('date')) {
            $query->whereDate('entry_date', $request->input('date'));
        } elseif ($request->filled('month')) {
            $monthInput = (string) $request->input('month');
            $query->whereYear('entry_date', substr($monthInput, 0, 4))
                ->whereMonth('entry_date', substr($monthInput, 5, 2));
        }

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
            ? Branch::query()->orderBy('name')->get(['id', 'name', 'branch_code as code'])
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
                'date' => $request->input('date', ''),
                'month' => $request->input('month', ''),
            ],
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
            'userBranchName' => $user->branch?->name ?? 'প্রধান শাখা',
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
}
