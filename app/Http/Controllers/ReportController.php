<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyActivity;
use App\Models\FeeCollection;
use App\Models\HealthCamp;
use App\Models\HealthCardDisburse;
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

        $employeeReport = $reportType === 'employee'
            ? $this->buildEmployeeReport(
                $selectedUserId,
                $selectedBranchId,
                $startDate,
                $endDate,
                $activities,
                $healthCamps,
                $feeCollections,
            )
            : null;

        $illnessReport = $reportType === 'illness'
            ? $this->buildIllnessReport($activities, $feeCollections, $branches)
            : null;

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
            'employeeReport' => $employeeReport,
            'illnessReport' => $illnessReport,
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

    /**
     * @param  Collection<int, DailyActivity>  $activities
     * @param  Collection<int, FeeCollection>  $feeCollections
     * @param  iterable<int, mixed>  $branches
     * @return array{summary: array<string, int>, branches: list<array<string, int|string>>, static_diseases: list<array{disease: string, branch_name: string, patients: int}>}
     */
    private function buildIllnessReport(Collection $activities, Collection $feeCollections, iterable $branches): array
    {
        $rows = [];

        foreach ($branches as $branch) {
            $id = (int) (is_array($branch) ? ($branch['id'] ?? 0) : $branch->id);
            $name = (string) (is_array($branch) ? ($branch['name'] ?? '—') : ($branch->name ?? '—'));
            $rows[$id] = $this->blankIllnessBranch($id, $name);
        }

        $static = [];

        foreach ($activities as $act) {
            $branchId = (int) ($act->branch_id ?: 0);
            $branchName = $act->branch?->name ?: 'অনির্ধারিত শাখা';
            if (! isset($rows[$branchId])) {
                $rows[$branchId] = $this->blankIllnessBranch($branchId, $branchName);
            }

            $data = is_array($act->form_data) ? $act->form_data : [];
            $households = $data['households'] ?? [];
            if (is_array($households)) {
                foreach ($households as $household) {
                    if (! is_array($household)) {
                        continue;
                    }
                    $this->tallyHousehold($rows[$branchId], $household);
                }
            }

            $patients = $data['patients'] ?? [];
            if (is_array($patients)) {
                foreach ($patients as $patient) {
                    if (! is_array($patient)) {
                        continue;
                    }
                    $disease = trim((string) ($patient['disease'] ?? ''));
                    if ($disease === '') {
                        continue;
                    }
                    $key = $branchId.'|'.mb_strtolower($disease);
                    if (! isset($static[$key])) {
                        $static[$key] = [
                            'disease' => $disease,
                            'branch_name' => $branchName,
                            'patients' => 0,
                        ];
                    }
                    $static[$key]['patients']++;
                }
            }
        }

        foreach ($feeCollections as $fee) {
            if ($fee->collection_type !== 'ডায়াবেটিস পরীক্ষা') {
                continue;
            }
            $branchId = (int) ($fee->branch_id ?: 0);
            $branchName = $fee->branch?->name ?: 'অনির্ধারিত শাখা';
            if (! isset($rows[$branchId])) {
                $rows[$branchId] = $this->blankIllnessBranch($branchId, $branchName);
            }
            $rows[$branchId]['diabetes_tests']++;
            if ($fee->beneficiary_type === 'অ-সদস্য') {
                $rows[$branchId]['diabetes_tests_non_member']++;
            } else {
                $rows[$branchId]['diabetes_tests_member']++;
            }
        }

        $branchRows = array_values($rows);
        usort($branchRows, fn (array $a, array $b): int => strnatcasecmp((string) $a['branch_name'], (string) $b['branch_name']));

        $staticRows = array_values($static);
        usort($staticRows, function (array $a, array $b): int {
            return [$b['patients'], $a['disease']] <=> [$a['patients'], $b['disease']];
        });

        $summary = [
            'diabetes_affected' => 0,
            'diabetes_medication' => 0,
            'hypertension_affected' => 0,
            'hypertension_medication' => 0,
            'tuberculosis_affected' => 0,
            'tuberculosis_medication' => 0,
            'kidney_disease_affected' => 0,
            'kidney_disease_medication' => 0,
            'eye_disease_affected' => 0,
            'eye_disease_medication' => 0,
            'asthma_affected' => 0,
            'asthma_medication' => 0,
            'malnutrition_affected' => 0,
            'malnutrition_medication' => 0,
            'other_chronic_affected' => 0,
            'other_chronic_medication' => 0,
            'pregnant' => 0,
            'anc' => 0,
            'tt' => 0,
            'delivered' => 0,
            'pnc' => 0,
            'stunting' => 0,
            'wasting' => 0,
            'underweight' => 0,
            'disabled' => 0,
            'general_illness' => 0,
            'general_treated' => 0,
            'diabetes_tests' => 0,
            'static_patients' => 0,
        ];

        foreach ($branchRows as $row) {
            foreach ($summary as $key => $value) {
                if ($key === 'static_patients') {
                    continue;
                }
                $summary[$key] += (int) ($row[$key] ?? 0);
            }
        }
        foreach ($staticRows as $row) {
            $summary['static_patients'] += $row['patients'];
        }

        return [
            'summary' => $summary,
            'branches' => $branchRows,
            'static_diseases' => $staticRows,
        ];
    }

    /**
     * @param  array<string, int|string>  $row
     * @param  array<string, mixed>  $household
     */
    private function tallyHousehold(array &$row, array $household): void
    {
        if (! empty($household['has_pregnant'])) {
            $row['pregnant']++;
        }
        if (! empty($household['has_anc'])) {
            $row['anc']++;
        }
        if (! empty($household['has_tt'])) {
            $row['tt']++;
        }
        if (! empty($household['has_delivered'])) {
            $row['delivered']++;
        }
        if (! empty($household['has_pnc'])) {
            $row['pnc']++;
        }
        if (! empty($household['is_stunting'])) {
            $row['stunting']++;
        }
        if (! empty($household['is_wasting'])) {
            $row['wasting']++;
        }
        if (! empty($household['is_underweight'])) {
            $row['underweight']++;
        }
        if (! empty($household['has_disabled']) || ! empty($household['has_disability'])) {
            $row['disabled']++;
        }

        $general = (int) ($household['general_illness_count'] ?? 0);
        $row['general_illness'] += $general;
        if (! empty($household['took_treatment'])) {
            $row['general_treated'] += $general;
        }

        $diseases = $household['elderly_diseases'] ?? [];
        if (! is_array($diseases)) {
            return;
        }

        foreach (['diabetes', 'hypertension', 'tuberculosis', 'kidney_disease', 'eye_disease', 'asthma', 'malnutrition', 'other_chronic'] as $key) {
            $status = $diseases[$key] ?? null;
            if (! is_array($status) || empty($status['affected'])) {
                continue;
            }
            $row[$key.'_affected']++;
            if (! empty($status['taking_medication']) || ! empty($status['regular_medication'])) {
                $row[$key.'_medication']++;
            }
        }
    }

    /**
     * @return array<string, int|string>
     */
    private function blankIllnessBranch(int $id, string $name): array
    {
        $row = [
            'branch_id' => $id,
            'branch_name' => $name,
            'pregnant' => 0,
            'anc' => 0,
            'tt' => 0,
            'delivered' => 0,
            'pnc' => 0,
            'stunting' => 0,
            'wasting' => 0,
            'underweight' => 0,
            'disabled' => 0,
            'general_illness' => 0,
            'general_treated' => 0,
            'diabetes_tests' => 0,
            'diabetes_tests_member' => 0,
            'diabetes_tests_non_member' => 0,
        ];

        foreach (['diabetes', 'hypertension', 'tuberculosis', 'kidney_disease', 'eye_disease', 'asthma', 'malnutrition', 'other_chronic'] as $key) {
            $row[$key.'_affected'] = 0;
            $row[$key.'_medication'] = 0;
        }

        return $row;
    }

    /**
     * @param  Collection<int, DailyActivity>  $activities
     * @param  Collection<int, HealthCamp>  $healthCamps
     * @param  Collection<int, FeeCollection>  $feeCollections
     * @return array{
     *     requires_selection: bool,
     *     employee: array{id: int, name: string, employee_code: string, designation: string, branch_name: string}|null,
     *     summary: array{total_submissions: int, field_activities: int, health_camps: int, fee_collections: int, health_cards: int, total_fee_amount: float},
     *     by_type: list<array{work_type: string, source: string, count: int}>,
     *     submissions: list<array{date: string, source: string, work_type: string, location: string, quantity: string, fee: float|null, description: string}>
     * }
     */
    private function buildEmployeeReport(
        ?int $selectedUserId,
        ?int $selectedBranchId,
        string $startDate,
        string $endDate,
        Collection $activities,
        Collection $healthCamps,
        Collection $feeCollections,
    ): array {
        $empty = $this->emptyEmployeeReport(true);

        if ($selectedUserId === null) {
            return $empty;
        }

        $employee = User::query()
            ->with('branch:id,name')
            ->when($selectedBranchId, fn ($q) => $q->where('branch_id', $selectedBranchId))
            ->find($selectedUserId);

        if (! $employee instanceof User) {
            return $empty;
        }

        $healthCards = HealthCardDisburse::query()
            ->with('branch:id,name')
            ->where('user_id', $employee->id)
            ->whereDate('entry_date', '>=', $startDate)
            ->whereDate('entry_date', '<=', $endDate)
            ->when($selectedBranchId, fn ($q) => $q->where('branch_id', $selectedBranchId))
            ->latest('entry_date')
            ->latest('id')
            ->get();

        $submissions = [];

        foreach ($activities as $act) {
            if ((int) $act->user_id !== (int) $employee->id) {
                continue;
            }

            $data = is_array($act->form_data) ? $act->form_data : [];
            $households = is_array($data['households'] ?? null)
                ? count($data['households'])
                : (int) ($data['household_count'] ?? 0);
            $patients = is_array($data['patients'] ?? null) ? count($data['patients']) : 0;
            $beneficiaries = (int) ($data['attendees_count'] ?? $data['patients_served'] ?? $data['members_visited'] ?? $patients);

            $quantityParts = [];
            if ($households > 0) {
                $quantityParts[] = $households.' households';
            }
            if ($beneficiaries > 0) {
                $quantityParts[] = $beneficiaries.' beneficiaries';
            }

            $submissions[] = [
                'date' => $this->reportDate($act->activity_date),
                'source' => 'Field activity',
                'work_type' => $act->taskSubtype?->name ?: $act->taskType?->name ?: 'Field activity',
                'location' => (string) ($data['samity_name'] ?? $act->samity?->name ?? $data['village'] ?? $data['location'] ?? '—'),
                'quantity' => $quantityParts !== [] ? implode(', ', $quantityParts) : '1 submission',
                'fee' => null,
                'description' => $this->reportText($data['topics_discussed'] ?? $data['topic'] ?? $data['key_messages'] ?? $data['notes'] ?? null),
            ];
        }

        foreach ($healthCamps as $camp) {
            if ((int) $camp->entered_by !== (int) $employee->id) {
                continue;
            }

            $data = is_array($camp->service_data) ? $camp->service_data : [];
            $patients = (int) ($data['patients_served'] ?? 0);

            $submissions[] = [
                'date' => $this->reportDate($camp->activity_date),
                'source' => 'Health camp',
                'work_type' => 'Health Camp',
                'location' => (string) ($data['location'] ?? $camp->branch?->name ?? '—'),
                'quantity' => $patients > 0 ? $patients.' patients' : '1 camp',
                'fee' => null,
                'description' => $this->reportText($data['camp_name'] ?? $data['services_provided'] ?? $data['notes'] ?? null),
            ];
        }

        $feeTotal = 0.0;

        foreach ($feeCollections as $fee) {
            if ((int) $fee->user_id !== (int) $employee->id) {
                continue;
            }

            $amount = (float) $fee->amount;
            $feeTotal += $amount;
            $detail = trim(implode(' — ', array_filter([
                $fee->beneficiary_name,
                $fee->diabetes_reading ? 'Reading '.$fee->diabetes_reading : null,
                $fee->notes,
            ])));

            $submissions[] = [
                'date' => $this->reportDate($fee->collection_date),
                'source' => 'Fee collection',
                'work_type' => (string) ($fee->collection_type ?: 'Fee collection'),
                'location' => (string) ($fee->location_info ?: $fee->branch?->name ?: '—'),
                'quantity' => '1 collection',
                'fee' => $amount,
                'description' => $detail !== '' ? $detail : '—',
            ];
        }

        foreach ($healthCards as $card) {
            $submissions[] = [
                'date' => $this->reportDate($card->entry_date),
                'source' => 'Health card',
                'work_type' => 'Health Card',
                'location' => (string) ($card->village_or_samity ?: $card->branch?->name ?: '—'),
                'quantity' => '1 card',
                'fee' => null,
                'description' => trim($card->member_name.' · '.$card->health_card_number),
            ];
        }

        usort($submissions, function (array $a, array $b): int {
            return [$b['date'], $a['source']] <=> [$a['date'], $b['source']];
        });

        $byType = [];
        foreach ($submissions as $row) {
            $key = $row['source'].'|'.$row['work_type'];
            if (! isset($byType[$key])) {
                $byType[$key] = [
                    'work_type' => $row['work_type'],
                    'source' => $row['source'],
                    'count' => 0,
                ];
            }
            $byType[$key]['count']++;
        }

        $byType = array_values($byType);
        usort($byType, fn (array $a, array $b): int => $b['count'] <=> $a['count']);

        $fieldActivities = count(array_filter($submissions, fn (array $row): bool => $row['source'] === 'Field activity'));
        $campCount = count(array_filter($submissions, fn (array $row): bool => $row['source'] === 'Health camp'));
        $feeCount = count(array_filter($submissions, fn (array $row): bool => $row['source'] === 'Fee collection'));
        $cardCount = count(array_filter($submissions, fn (array $row): bool => $row['source'] === 'Health card'));

        return [
            'requires_selection' => false,
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'employee_code' => $employee->employee_code ?: '—',
                'designation' => $employee->designation ?: '—',
                'branch_name' => $employee->branch?->name ?: '—',
            ],
            'summary' => [
                'total_submissions' => count($submissions),
                'field_activities' => $fieldActivities,
                'health_camps' => $campCount,
                'fee_collections' => $feeCount,
                'health_cards' => $cardCount,
                'total_fee_amount' => $feeTotal,
            ],
            'by_type' => $byType,
            'submissions' => $submissions,
        ];
    }

    /**
     * @return array{
     *     requires_selection: bool,
     *     employee: null,
     *     summary: array{total_submissions: int, field_activities: int, health_camps: int, fee_collections: int, health_cards: int, total_fee_amount: float},
     *     by_type: list<array{work_type: string, source: string, count: int}>,
     *     submissions: list<array{date: string, source: string, work_type: string, location: string, quantity: string, fee: float|null, description: string}>
     * }
     */
    private function emptyEmployeeReport(bool $requiresSelection): array
    {
        return [
            'requires_selection' => $requiresSelection,
            'employee' => null,
            'summary' => [
                'total_submissions' => 0,
                'field_activities' => 0,
                'health_camps' => 0,
                'fee_collections' => 0,
                'health_cards' => 0,
                'total_fee_amount' => 0.0,
            ],
            'by_type' => [],
            'submissions' => [],
        ];
    }

    private function reportDate(mixed $date): string
    {
        if ($date instanceof Carbon) {
            return $date->toDateString();
        }

        return substr((string) $date, 0, 10);
    }

    private function reportText(mixed $value): string
    {
        if (! is_scalar($value)) {
            return '—';
        }

        $text = trim((string) $value);

        return $text !== '' ? $text : '—';
    }
}
