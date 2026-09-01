<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\FeeCollection;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FeeCollectionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $today = Carbon::today()->toDateString();
        $currentMonth = Carbon::today()->format('Y-m');

        $query = FeeCollection::with(['user:id,name', 'branch:id,name,branch_code'])
            ->latest('collection_date')
            ->latest('id');

        // Branch / User scoping based on role
        if (! $user->can_view_analytics && $user->role !== 'admin') {
            if ($user->role === 'branch-manager') {
                $query->where('branch_id', $user->branch_id);
            } else {
                $query->where('user_id', $user->id);
            }
        } elseif ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('collection_type')) {
            $query->where('collection_type', $request->input('collection_type'));
        }

        if ($request->filled('date')) {
            $query->whereDate('collection_date', $request->input('date'));
        } elseif ($request->filled('month')) {
            $query->whereYear('collection_date', substr($request->input('month'), 0, 4))
                ->whereMonth('collection_date', substr($request->input('month'), 5, 2));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('beneficiary_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('location_info', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        // Stats Query Base
        $statsBaseQuery = FeeCollection::query();
        if (! $user->can_view_analytics && $user->role !== 'admin') {
            if ($user->role === 'branch-manager') {
                $statsBaseQuery->where('branch_id', $user->branch_id);
            } else {
                $statsBaseQuery->where('user_id', $user->id);
            }
        } elseif ($request->filled('branch_id')) {
            $statsBaseQuery->where('branch_id', $request->input('branch_id'));
        }

        $todayTotalAmount = (clone $statsBaseQuery)->whereDate('collection_date', $today)->sum('amount');
        $todayCount = (clone $statsBaseQuery)->whereDate('collection_date', $today)->count();
        $todayDiabetesCount = (clone $statsBaseQuery)->whereDate('collection_date', $today)
            ->where('collection_type', 'ডায়াবেটিস পরীক্ষা')->count();

        $monthTotalAmount = (clone $statsBaseQuery)
            ->whereYear('collection_date', Carbon::today()->year)
            ->whereMonth('collection_date', Carbon::today()->month)
            ->sum('amount');
        $monthCount = (clone $statsBaseQuery)
            ->whereYear('collection_date', Carbon::today()->year)
            ->whereMonth('collection_date', Carbon::today()->month)
            ->count();

        $branches = ($user->can_view_analytics || $user->role === 'admin')
            ? Branch::query()->orderBy('name')->get(['id', 'name', 'branch_code as code'])
            : ($user->branch ? collect([$user->branch]) : collect());

        return Inertia::render('collections/index', [
            'collections' => $query->paginate(25)->withQueryString(),
            'filters' => [
                'date' => $request->input('date', ''),
                'month' => $request->input('month', ''),
                'collection_type' => $request->input('collection_type', ''),
                'branch_id' => $request->input('branch_id', ''),
                'search' => $request->input('search', ''),
            ],
            'stats' => [
                'today_amount' => (float) $todayTotalAmount,
                'today_count' => (int) $todayCount,
                'today_diabetes_count' => (int) $todayDiabetesCount,
                'month_amount' => (float) $monthTotalAmount,
                'month_count' => (int) $monthCount,
            ],
            'branches' => $branches,
            'today' => $today,
            'userBranchId' => $user->branch_id,
            'userBranchName' => $user->branch?->name ?? 'প্রধান শাখা',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'collection_date' => ['required', 'date'],
            'collection_type' => ['required', 'string', 'max:100'],
            'beneficiary_name' => ['required', 'string', 'max:255'],
            'beneficiary_type' => ['required', 'string', 'in:সদস্য,অ-সদস্য'],
            'age' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'location_info' => ['nullable', 'string', 'max:255'],
            'diabetes_reading' => ['nullable', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'branch_id' => ['nullable', 'exists:branches,id'],
        ]);

        $user = Auth::user();
        $validated['user_id'] = $user->id;
        $validated['branch_id'] = $validated['branch_id'] ?? $user->branch_id;

        FeeCollection::create($validated);

        return redirect()->back()->with('success', 'ফি আদায় তথ্য সফলভাবে পোস্টিং হয়েছে।');
    }

    public function destroy(FeeCollection $feeCollection): RedirectResponse
    {
        $user = Auth::user();
        if ($feeCollection->user_id !== $user->id && ! $user->can_view_analytics && $user->role !== 'admin') {
            abort(403);
        }

        $feeCollection->delete();

        return redirect()->back()->with('success', 'ফি আদায়ের রেকর্ডটি মুছে ফেলা হয়েছে।');
    }
}
