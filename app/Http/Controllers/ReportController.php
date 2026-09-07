<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyActivity;
use App\Models\FeeCollection;
use App\Models\HealthCamp;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing(['role', 'branch']);
        $today = Carbon::today()->toDateString();

        // 1. Date Range Resolution (Default to Today as requested)
        $startDate = $request->string('start_date')->toString() ?: $today;
        $endDate = $request->string('end_date')->toString() ?: $today;
        $reportType = $request->string('report_type')->toString() ?: 'activities';

        // 2. Branch Resolution
        $selectedBranchId = null;
        if ($user->isAdmin()) {
            $selectedBranchId = $request->filled('branch_id') && $request->input('branch_id') !== 'all'
                ? $request->integer('branch_id')
                : null;
            $branches = Branch::query()->orderBy('name')->get(['id', 'name', 'branch_code as code']);
        } elseif ($user->isBranchManager()) {
            $selectedBranchId = $user->branch_id;
            $branches = $user->branch ? collect([$user->branch]) : new Collection;
        } else {
            $selectedBranchId = $user->branch_id;
            $branches = $user->branch ? collect([$user->branch]) : new Collection;
        }

        // 3. Officer / User Resolution (Admin & Manager can filter by user/officer)
        $selectedUserId = null;
        if ($user->isAdmin() || $user->isBranchManager()) {
            $selectedUserId = $request->filled('user_id') && $request->input('user_id') !== 'all'
                ? $request->integer('user_id')
                : null;
        } else {
            $selectedUserId = $user->id;
        }

        // Available Officers list for dropdown
        if ($user->isAdmin()) {
            $officersQuery = User::query()
                ->with('branch:id,name')
                ->when($selectedBranchId, fn ($q) => $q->where('branch_id', $selectedBranchId))
                ->orderBy('name');
            $officers = $officersQuery->get()->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'employee_code' => $u->employee_code,
                'designation' => $u->designation,
                'branch_id' => $u->branch_id,
                'branch_name' => $u->branch?->name,
            ]);
        } elseif ($user->isBranchManager()) {
            $officers = User::query()
                ->where('branch_id', $user->branch_id)
                ->orderBy('name')
                ->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'employee_code' => $u->employee_code,
                    'designation' => $u->designation,
                    'branch_id' => $u->branch_id,
                    'branch_name' => $user->branch?->name,
                ]);
        } else {
            $officers = collect([[
                'id' => $user->id,
                'name' => $user->name,
                'employee_code' => $user->employee_code,
                'designation' => $user->designation,
                'branch_id' => $user->branch_id,
                'branch_name' => $user->branch?->name,
            ]]);
        }

        // 4. Query Activities
        $activityQuery = DailyActivity::query()
            ->with(['taskType', 'taskSubtype', 'branch', 'user', 'samity'])
            ->whereDate('activity_date', '>=', $startDate)
            ->whereDate('activity_date', '<=', $endDate)
            ->when($selectedBranchId, fn ($q) => $q->where('branch_id', $selectedBranchId))
            ->when($selectedUserId, fn ($q) => $q->where('user_id', $selectedUserId))
            ->latest('activity_date')
            ->latest('id');

        $activities = $activityQuery->get();

        // 5. Query Health Camps
        $campQuery = HealthCamp::query()
            ->with(['branch', 'user'])
            ->whereDate('activity_date', '>=', $startDate)
            ->whereDate('activity_date', '<=', $endDate)
            ->when($selectedBranchId, fn ($q) => $q->where('branch_id', $selectedBranchId))
            ->when($selectedUserId, fn ($q) => $q->where('entered_by', $selectedUserId))
            ->latest('activity_date');

        $healthCamps = $campQuery->get();

        // 6. Query Fee Collections
        $feeQuery = FeeCollection::query()
            ->with(['branch', 'user'])
            ->whereDate('collection_date', '>=', $startDate)
            ->whereDate('collection_date', '<=', $endDate)
            ->when($selectedBranchId, fn ($q) => $q->where('branch_id', $selectedBranchId))
            ->when($selectedUserId, fn ($q) => $q->where('user_id', $selectedUserId))
            ->latest('collection_date')
            ->latest('id');

        $feeCollections = $feeQuery->get();

        // 7. Extract Flattened Records for Detailed Reports
        // 7.1 Household Visits Extraction
        $householdRecords = [];
        foreach ($activities as $act) {
            $data = is_array($act->form_data) ? $act->form_data : [];
            $households = $data['households'] ?? [];
            if (is_array($households) && count($households) > 0) {
                foreach ($households as $h) {
                    $householdRecords[] = [
                        'activity_id' => $act->id,
                        'date' => $act->activity_date,
                        'branch_name' => $act->branch?->name ?: '—',
                        'samity_name' => $data['samity_name'] ?? $act->samity?->name ?? '—',
                        'village' => $data['village'] ?? '—',
                        'officer_name' => $act->user?->name ?: '—',
                        'household_head' => $h['household_head'] ?? '—',
                        'member_count' => (int) ($h['member_count'] ?? 1),
                        'member_number' => $h['member_number'] ?? '—',
                        'phone' => $h['phone'] ?? '—',
                        'has_pregnant' => (bool) ($h['has_pregnant'] ?? false),
                        'pregnant_months' => $h['pregnant_months'] ?? null,
                        'has_anc' => (bool) ($h['has_anc'] ?? false),
                        'has_tt' => (bool) ($h['has_tt'] ?? false),
                        'has_postnatal' => (bool) ($h['has_postnatal'] ?? false),
                        'delivery_place' => $h['delivery_place'] ?? null,
                        'has_pnc' => (bool) ($h['has_pnc'] ?? false),
                        'child_nutrition_issue' => (bool) ($h['has_child_nutrition_issue'] ?? false),
                        'nutrition_types' => $h['child_nutrition_types'] ?? [],
                        'has_disability' => (bool) ($h['has_disability'] ?? false),
                        'disability_gender' => $h['disability_gender'] ?? null,
                        'elderly_diseases' => $h['elderly_diseases'] ?? [],
                        'has_general_illness' => (bool) ($h['has_general_illness'] ?? false),
                        'general_illness_desc' => $h['general_illness_desc'] ?? null,
                    ];
                }
            }
        }

        // 7.2 Clinical Patients Extraction (Static & Satellite Clinics)
        $patientRecords = [];
        foreach ($activities as $act) {
            $data = is_array($act->form_data) ? $act->form_data : [];
            $patients = $data['patients'] ?? [];
            if (is_array($patients) && count($patients) > 0) {
                foreach ($patients as $p) {
                    $patientRecords[] = [
                        'activity_id' => $act->id,
                        'date' => $act->activity_date,
                        'branch_name' => $act->branch?->name ?: '—',
                        'clinic_type' => $act->taskSubtype?->name ?: $act->taskType?->name ?: 'ক্লিনিক',
                        'officer_name' => $act->user?->name ?: '—',
                        'patient_name' => $p['patient_name'] ?? $p['member_name'] ?? '—',
                        'patient_age' => $p['patient_age'] ?? $p['member_age'] ?? '—',
                        'patient_gender' => $p['patient_gender'] ?? $p['member_gender'] ?? 'নারী',
                        'patient_type' => $p['patient_type'] ?? 'সদস্য নিজে',
                        'has_card' => (bool) ($p['has_card'] ?? false),
                        'disease' => $p['disease'] ?? '—',
                        'advice' => $p['advice'] ?? $p['services_provided'] ?? '—',
                    ];
                }
            }
        }

        // 7.3 Branch Performance Aggregation
        $branchMatrix = [];
        foreach ($activities as $act) {
            $bId = $act->branch_id ?: 0;
            $bName = $act->branch?->name ?: 'অনির্ধারিত শাখা';
            if (! isset($branchMatrix[$bId])) {
                $branchMatrix[$bId] = [
                    'branch_id' => $bId,
                    'name' => $bName,
                    'code' => $act->branch?->branch_code ?: '—',
                    'activities_count' => 0,
                    'beneficiaries_count' => 0,
                    'total_fee_collected' => 0.00,
                    'diabetes_tests_count' => 0,
                    'households_visited' => 0,
                ];
            }
            $branchMatrix[$bId]['activities_count']++;
            $data = is_array($act->form_data) ? $act->form_data : [];
            $branchMatrix[$bId]['beneficiaries_count'] += (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? (isset($data['patients']) ? count($data['patients']) : 0));
            $branchMatrix[$bId]['households_visited'] += (int) ($data['household_count'] ?? (isset($data['households']) ? count($data['households']) : 0));
        }

        foreach ($feeCollections as $fee) {
            $bId = $fee->branch_id ?: 0;
            $bName = $fee->branch?->name ?: 'অনির্ধারিত শাখা';
            if (! isset($branchMatrix[$bId])) {
                $branchMatrix[$bId] = [
                    'branch_id' => $bId,
                    'name' => $bName,
                    'code' => $fee->branch?->branch_code ?: '—',
                    'activities_count' => 0,
                    'beneficiaries_count' => 0,
                    'total_fee_collected' => 0.00,
                    'diabetes_tests_count' => 0,
                    'households_visited' => 0,
                ];
            }
            $branchMatrix[$bId]['total_fee_collected'] += (float) $fee->amount;
            if ($fee->collection_type === 'ডায়াবেটিস পরীক্ষা') {
                $branchMatrix[$bId]['diabetes_tests_count']++;
            }
        }

        // 7.4 Officer Performance Aggregation (User-wise breakdown)
        $officerMatrix = [];
        foreach ($activities as $act) {
            $uId = $act->user_id ?: 0;
            $uName = $act->user?->name ?: 'অনির্ধারিত কর্মী';
            $uCode = $act->user?->employee_code ?: '—';
            $bName = $act->branch?->name ?: '—';

            if (! isset($officerMatrix[$uId])) {
                $officerMatrix[$uId] = [
                    'user_id' => $uId,
                    'name' => $uName,
                    'employee_code' => $uCode,
                    'branch_name' => $bName,
                    'activities_count' => 0,
                    'beneficiaries_count' => 0,
                    'households_visited' => 0,
                    'total_fee_collected' => 0.00,
                ];
            }
            $officerMatrix[$uId]['activities_count']++;
            $data = is_array($act->form_data) ? $act->form_data : [];
            $officerMatrix[$uId]['beneficiaries_count'] += (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? (isset($data['patients']) ? count($data['patients']) : 0));
            $officerMatrix[$uId]['households_visited'] += (int) ($data['household_count'] ?? (isset($data['households']) ? count($data['households']) : 0));
        }

        foreach ($feeCollections as $fee) {
            $uId = $fee->user_id ?: 0;
            $uName = $fee->user?->name ?: 'অনির্ধারিত কর্মী';
            $uCode = $fee->user?->employee_code ?: '—';
            $bName = $fee->branch?->name ?: '—';

            if (! isset($officerMatrix[$uId])) {
                $officerMatrix[$uId] = [
                    'user_id' => $uId,
                    'name' => $uName,
                    'employee_code' => $uCode,
                    'branch_name' => $bName,
                    'activities_count' => 0,
                    'beneficiaries_count' => 0,
                    'households_visited' => 0,
                    'total_fee_collected' => 0.00,
                ];
            }
            $officerMatrix[$uId]['total_fee_collected'] += (float) $fee->amount;
        }

        // Summary Aggregates
        $summary = [
            'total_activities' => $activities->count(),
            'total_health_camps' => $healthCamps->count(),
            'total_fee_amount' => (float) $feeCollections->sum('amount'),
            'total_fee_count' => $feeCollections->count(),
            'total_diabetes_tests' => $feeCollections->where('collection_type', 'ডায়াবেটিস পরীক্ষা')->count(),
            'total_households_visited' => count($householdRecords),
            'total_clinical_patients' => count($patientRecords),
        ];

        $payload = [
            'reportType' => $reportType,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $selectedBranchId ? (string) $selectedBranchId : 'all',
                'user_id' => $selectedUserId ? (string) $selectedUserId : 'all',
                'report_type' => $reportType,
            ],
            'summary' => $summary,
            'activities' => $activities,
            'healthCamps' => $healthCamps,
            'feeCollections' => $feeCollections,
            'householdRecords' => $householdRecords,
            'patientRecords' => $patientRecords,
            'branchMatrix' => array_values($branchMatrix),
            'officerMatrix' => array_values($officerMatrix),
            'branches' => $branches,
            'officers' => $officers,
            'today' => $today,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'is_admin' => $user->isAdmin(),
                'is_branch_manager' => $user->isBranchManager(),
                'branch_name' => $user->branch?->name ?: 'প্রধান শাখা',
            ],
        ];

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($payload);
        }

        return Inertia::render('reports/index', $payload);
    }
}
