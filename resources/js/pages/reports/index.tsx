import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    Coins,
    DollarSign,
    Download,
    Droplet,
    FileSpreadsheet,
    FileText,
    Filter,
    HeartPulse,
    Home,
    Layers,
    MapPin,
    Phone,
    Printer,
    RefreshCw,
    Search,
    Stethoscope,
    Tent,
    TrendingUp,
    User,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BranchOption, DailyActivity, FeeCollection, HealthCamp } from '@/types/mcare';

type HouseholdRecord = {
    activity_id: number;
    date: string;
    branch_name: string;
    samity_name: string;
    village: string;
    officer_name: string;
    household_head: string;
    member_count: number;
    member_number: string;
    phone: string;
    has_pregnant: boolean;
    pregnant_months?: string | null;
    has_anc: boolean;
    has_tt: boolean;
    has_postnatal: boolean;
    delivery_place?: string | null;
    has_pnc: boolean;
    child_nutrition_issue: boolean;
    nutrition_types?: string[];
    has_disability: boolean;
    disability_gender?: string | null;
    elderly_diseases?: Record<string, { affected: boolean; regular_medication: boolean }>;
    has_general_illness: boolean;
    general_illness_desc?: string | null;
};

type PatientRecord = {
    activity_id: number;
    date: string;
    branch_name: string;
    clinic_type: string;
    officer_name: string;
    patient_name: string;
    patient_age: string | number;
    patient_gender: string;
    patient_type: string;
    has_card: boolean;
    disease: string;
    advice: string;
};

type BranchMatrixItem = {
    branch_id: number;
    name: string;
    code: string;
    activities_count: number;
    beneficiaries_count: number;
    total_fee_collected: number;
    diabetes_tests_count: number;
    households_visited: number;
};

type OfficerMatrixItem = {
    user_id: number;
    name: string;
    employee_code: string;
    branch_name: string;
    activities_count: number;
    beneficiaries_count: number;
    households_visited: number;
    total_fee_collected: number;
};

type OfficerOption = {
    id: number;
    name: string;
    employee_code?: string | null;
    designation?: string | null;
    branch_id?: number | null;
    branch_name?: string | null;
};

type Props = {
    reportType: 'activities' | 'households' | 'fee_collections' | 'patients' | 'branches' | 'officers';
    filters: {
        start_date: string;
        end_date: string;
        branch_id: string;
        user_id?: string;
        report_type: string;
    };
    summary: {
        total_activities: number;
        total_health_camps: number;
        total_fee_amount: number;
        total_fee_count: number;
        total_diabetes_tests: number;
        total_households_visited: number;
        total_clinical_patients: number;
    };
    activities: DailyActivity[];
    healthCamps: HealthCamp[];
    feeCollections: FeeCollection[];
    householdRecords: HouseholdRecord[];
    patientRecords: PatientRecord[];
    branchMatrix: BranchMatrixItem[];
    officerMatrix: OfficerMatrixItem[];
    branches: BranchOption[];
    officers?: OfficerOption[];
    today: string;
    user: {
        id: number;
        name: string;
        role: any;
        is_admin?: boolean;
        is_branch_manager?: boolean;
        branch_name: string;
    };
};

const REPORT_TABS = [
    { key: 'activities', label: '1. Field Activities Summary', short: 'Activities', icon: ClipboardListIcon },
    { key: 'households', label: '2. Household Visits Register', short: 'Households', icon: Home },
    { key: 'fee_collections', label: '3. Fee & Diabetes Register', short: 'Fees & Diabetes', icon: Coins },
    { key: 'patients', label: '4. Clinical Consultations Register', short: 'Patients', icon: Stethoscope },
    { key: 'branches', label: '5. Branch Performance Matrix', short: 'Branch Matrix', icon: Building2 },
    { key: 'officers', label: '6. Officer Performance Summary', short: 'Officer Matrix', icon: UserCheck },
];

function ClipboardListIcon(props: React.SVGProps<SVGSVGElement>) {
    return <FileText className="size-4" {...props} />;
}

export default function ReportsIndex({
    reportType = 'activities',
    filters,
    summary,
    activities = [],
    healthCamps = [],
    feeCollections = [],
    householdRecords = [],
    patientRecords = [],
    branchMatrix = [],
    officerMatrix = [],
    branches = [],
    officers = [],
    today,
    user,
}: Props) {
    const [activeTab, setActiveTab] = useState<string>(filters.report_type || reportType);
    const [startDate, setStartDate] = useState(filters.start_date || today);
    const [endDate, setEndDate] = useState(filters.end_date || today);
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');
    const [userId, setUserId] = useState(filters.user_id || 'all');

    const isPrivileged = Boolean(user.is_admin || user.is_branch_manager || user.role?.slug === 'admin' || user.role?.slug === 'branch-manager');

    // Filter officers for dropdown based on chosen branch
    const filteredOfficersForDropdown = officers.filter((off) => {
        if (branchId === 'all') return true;
        return String(off.branch_id) === String(branchId);
    });

    const applyFilter = (newTab?: string, newStart?: string, newEnd?: string, newBranch?: string, newUser?: string) => {
        const t = newTab ?? activeTab;
        const s = newStart ?? startDate;
        const e = newEnd ?? endDate;
        const b = newBranch ?? branchId;
        const u = newUser ?? userId;

        router.get(
            '/reports',
            {
                report_type: t,
                start_date: s,
                end_date: e,
                branch_id: b,
                user_id: u,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleQuickDate = (type: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
        const now = new Date();
        let s = today;
        let e = today;

        if (type === 'today') {
            s = today;
            e = today;
        } else if (type === 'yesterday') {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            s = y.toISOString().split('T')[0];
            e = s;
        } else if (type === 'this_week') {
            const first = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            s = first.toISOString().split('T')[0];
            e = today;
        } else if (type === 'this_month') {
            const first = new Date(now.getFullYear(), now.getMonth(), 1);
            s = first.toISOString().split('T')[0];
            e = today;
        }

        setStartDate(s);
        setEndDate(e);
        applyFilter(activeTab, s, e, branchId, userId);
    };

    const handlePrint = () => {
        window.print();
    };

    // EXCEL / CSV EXPORT (UTF-8 BOM supported for Microsoft Excel in Bengali)
    const exportToExcel = () => {
        let rows: string[][] = [];
        let filename = `Mcare_Report_${activeTab}_${startDate}_to_${endDate}.csv`;

        if (activeTab === 'activities') {
            rows.push(['SL', 'Date', 'Branch', 'Activity Type', 'Samity / Location', 'Attendees / Beneficiaries', 'Assigned Officer']);
            activities.forEach((act, idx) => {
                const data = act.form_data || {};
                const attendees = data.attendees_count || data.patients_served || data.members_visited || (Array.isArray(data.patients) ? data.patients.length : '0');
                rows.push([
                    String(idx + 1),
                    act.activity_date,
                    act.branch?.name || '',
                    act.task_subtype?.name || act.task_type?.name || '',
                    (data.samity_name as string) || act.samity?.name || '',
                    String(attendees),
                    act.user?.name || '',
                ]);
            });
        } else if (activeTab === 'households') {
            rows.push(['SL', 'Date', 'Branch', 'Samity', 'Village', 'Household Head', 'Members', 'Pregnant Mother', 'Postnatal Mother', 'Child Nutrition Issue', 'Disability', 'Chronic Illness', 'Officer']);
            householdRecords.forEach((h, idx) => {
                const diseases = Object.keys(h.elderly_diseases || {}).join(', ');
                rows.push([
                    String(idx + 1),
                    h.date,
                    h.branch_name,
                    h.samity_name,
                    h.village,
                    h.household_head,
                    String(h.member_count),
                    h.has_pregnant ? 'Yes' : 'No',
                    h.has_postnatal ? 'Yes' : 'No',
                    h.child_nutrition_issue ? 'Yes' : 'No',
                    h.has_disability ? 'Yes' : 'No',
                    diseases || 'None',
                    h.officer_name,
                ]);
            });
        } else if (activeTab === 'fee_collections') {
            rows.push(['SL', 'Date', 'Branch', 'Beneficiary Name', 'Type', 'Age', 'Phone', 'Samity / Village', 'Fee Category', 'Diabetes Reading', 'Fee Amount (BDT)', 'Officer', 'Remarks']);
            feeCollections.forEach((f, idx) => {
                rows.push([
                    String(idx + 1),
                    f.collection_date,
                    f.branch?.name || '',
                    f.beneficiary_name,
                    f.beneficiary_type,
                    f.age ? `${f.age} yrs` : '',
                    f.phone || '',
                    f.location_info || '',
                    f.collection_type,
                    f.diabetes_reading || '',
                    String(f.amount),
                    f.user?.name || '',
                    f.notes || '',
                ]);
            });
            rows.push(['', '', '', '', '', '', '', '', '', 'Grand Total:', String(summary.total_fee_amount), '', '']);
        } else if (activeTab === 'patients') {
            rows.push(['SL', 'Date', 'Branch', 'Clinic Type', 'Patient Name', 'Age', 'Gender', 'Health Card', 'Diagnosis / Illness', 'Services & Advice', 'Officer']);
            patientRecords.forEach((p, idx) => {
                rows.push([
                    String(idx + 1),
                    p.date,
                    p.branch_name,
                    p.clinic_type,
                    p.patient_name,
                    String(p.patient_age),
                    p.patient_gender,
                    p.has_card ? 'Yes' : 'No',
                    p.disease,
                    p.advice,
                    p.officer_name,
                ]);
            });
        } else if (activeTab === 'branches') {
            rows.push(['SL', 'Branch Name', 'Branch Code', 'Total Activities', 'Total Beneficiaries', 'Households Visited', 'Diabetes Tests', 'Total Fee Collected (BDT)']);
            branchMatrix.forEach((b, idx) => {
                rows.push([
                    String(idx + 1),
                    b.name,
                    b.code,
                    String(b.activities_count),
                    String(b.beneficiaries_count),
                    String(b.households_visited),
                    String(b.diabetes_tests_count),
                    String(b.total_fee_collected),
                ]);
            });
        } else if (activeTab === 'officers') {
            rows.push(['SL', 'Officer Name', 'Employee Code', 'Branch', 'Total Activities', 'Beneficiaries Served', 'Households Visited', 'Total Fee Collected (BDT)']);
            officerMatrix.forEach((o, idx) => {
                rows.push([
                    String(idx + 1),
                    o.name,
                    o.employee_code,
                    o.branch_name,
                    String(o.activities_count),
                    String(o.beneficiaries_count),
                    String(o.households_visited),
                    String(o.total_fee_collected),
                ]);
            });
        }

        const csvContent = '\uFEFF' + rows.map((e) => e.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const selectedBranchName = branchId !== 'all' ? branches.find((b) => String(b.id) === branchId)?.name : 'All Branches (সকল শাখা)';
    const selectedOfficerName = userId !== 'all' ? officers.find((o) => String(o.id) === userId)?.name : 'All Officers (সকল কর্মকর্তা)';
    const currentTabTitle = REPORT_TABS.find((t) => t.key === activeTab)?.label || 'Official Report';

    return (
        <>
            <Head title="Reports & Analytics — M Care Health System" />

            {/* EMBEDDED PRINT STYLE INJECTION FOR PURE A4 WORD DOCUMENT FORMAT */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm 10mm 15mm 10mm;
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-size: 9pt !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Force hide web UI elements in print */
                    nav, aside, header, footer, .sidebar, [data-sidebar], [data-mobile-nav], .pb-safe, [class*="bottom-0"], button, input, select, .print\\:hidden, .no-print {
                        display: none !important;
                    }
                    .print-document-container {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        page-break-after: auto;
                    }
                    thead {
                        display: table-header-group !important;
                    }
                    tfoot {
                        display: table-footer-group !important;
                    }
                    th, td {
                        border: 1px solid #222222 !important;
                        padding: 4px 6px !important;
                        font-size: 8.5pt !important;
                        color: #000000 !important;
                    }
                    th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold !important;
                    }
                }
            `}</style>

            {/* OFFICIAL A4 LETTERHEAD HEADER (VISIBLE IN PRINT ONLY) */}
            <div className="hidden print:block text-black font-sans mb-4 border-b-2 border-black pb-3">
                <div className="text-center space-y-0.5">
                    <h1 className="text-lg font-black tracking-wider uppercase">
                        M Care Health Services Management System
                    </h1>
                    <p className="text-xs font-semibold text-gray-800">
                        Department of Primary Healthcare & Field Operations
                    </p>
                    <p className="text-sm font-bold text-black uppercase mt-1">
                        {currentTabTitle}
                    </p>
                </div>

                {/* Formal Reference & Meta Information Table */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[9pt] border border-black p-2 bg-gray-50/50">
                    <div>
                        <div><strong>Report Period:</strong> {formatDate(startDate)} to {formatDate(endDate)}</div>
                        <div><strong>Target Branch:</strong> {selectedBranchName}</div>
                    </div>
                    <div className="text-right">
                        <div><strong>Designated Officer:</strong> {selectedOfficerName}</div>
                        <div><strong>Generated On:</strong> {formatDate(today)} by {user.name}</div>
                    </div>
                </div>
            </div>

            <div className="print-document-container mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 md:p-6 pb-24 md:pb-12 print:p-0">
                {/* SCREEN ONLY HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs shrink-0">
                            <TrendingUp className="size-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                    Reports & Operational Analytics
                                </h1>
                                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px] font-bold">
                                    A4 Print & Excel Ready
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Filter by Branch and Officer to view, export, and print verified field data
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        {isPrivileged && (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs font-semibold h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                            >
                                <Link href="/admin/users">
                                    <Users className="size-3.5" />
                                    <span>User Management</span>
                                </Link>
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={exportToExcel}
                            className="flex-1 sm:flex-initial rounded-xl text-xs font-semibold h-9 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                        >
                            <FileSpreadsheet className="size-4 mr-1.5 text-emerald-600" />
                            Export Excel (.csv)
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            className="flex-1 sm:flex-initial rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground shadow-xs cursor-pointer"
                        >
                            <Printer className="size-4 mr-1.5" />
                            Print A4 / PDF
                        </Button>
                    </div>
                </div>

                {/* REPORT SUB-TABS (NAVIGATION) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 bg-card p-1.5 rounded-2xl border border-border/80 shadow-2xs print:hidden">
                    {REPORT_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    applyFilter(tab.key, startDate, endDate, branchId, userId);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                }`}
                            >
                                <Icon className="size-4 shrink-0" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ADVANCED MULTI-LEVEL FILTER BAR (DATE, BRANCH, OFFICER) */}
                <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs print:hidden space-y-3">
                    <div className="flex flex-col gap-3">
                        {/* Quick Date Presets */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
                                    <Calendar className="size-3.5" /> Quick Presets:
                                </span>
                                {[
                                    { key: 'today', label: 'Today' },
                                    { key: 'yesterday', label: 'Yesterday' },
                                    { key: 'this_week', label: 'This Week' },
                                    { key: 'this_month', label: 'This Month' },
                                ].map((preset) => (
                                    <button
                                        key={preset.key}
                                        type="button"
                                        onClick={() => handleQuickDate(preset.key as any)}
                                        className="px-2.5 py-1 rounded-lg border border-input bg-background text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Active Filter Indicator */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground">
                                    <Building2 className="size-3" /> {selectedBranchName}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-muted-foreground">
                                    <User className="size-3" /> {selectedOfficerName}
                                </span>
                            </div>
                        </div>

                        {/* Date, Branch & User Selector Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 items-center">
                            {/* Start Date */}
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-semibold text-muted-foreground shrink-0">From:</span>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background w-full"
                                />
                            </div>

                            {/* End Date */}
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-semibold text-muted-foreground shrink-0">To:</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background w-full"
                                />
                            </div>

                            {/* Branch Selector */}
                            <div>
                                <select
                                    value={branchId}
                                    onChange={(e) => {
                                        const newB = e.target.value;
                                        setBranchId(newB);
                                        applyFilter(activeTab, startDate, endDate, newB, 'all');
                                    }}
                                    className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                                >
                                    <option value="all">All Branches</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Officer Selector */}
                            <div>
                                <select
                                    value={userId}
                                    onChange={(e) => {
                                        const newU = e.target.value;
                                        setUserId(newU);
                                        applyFilter(activeTab, startDate, endDate, branchId, newU);
                                    }}
                                    disabled={!isPrivileged && officers.length <= 1}
                                    className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-medium disabled:opacity-60"
                                >
                                    <option value="all">All Officers</option>
                                    {filteredOfficersForDropdown.map((off) => (
                                        <option key={off.id} value={off.id}>
                                            {off.name} {off.employee_code ? `(${off.employee_code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Apply Button */}
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => applyFilter(activeTab, startDate, endDate, branchId, userId)}
                                    className="h-9 flex-1 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer gap-1.5"
                                >
                                    <Filter className="size-3.5" />
                                    Apply Filter
                                </Button>

                                {(branchId !== 'all' || userId !== 'all') && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setBranchId('all');
                                            setUserId('all');
                                            applyFilter(activeTab, startDate, endDate, 'all', 'all');
                                        }}
                                        className="h-9 px-2 text-xs"
                                        title="Reset filters"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 SUMMARY STAT CARDS (SCREEN ONLY) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:hidden">
                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Field Sessions
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                            {summary.total_activities}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Households Visited
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                            {summary.total_households_visited}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Total Fees Collected
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ৳{summary.total_fee_amount.toLocaleString()}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            Diabetes Tests
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            {summary.total_diabetes_tests}
                        </p>
                    </div>
                </div>

                {/* REPORT TABLES BASED ON ACTIVE TAB */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
                    {/* 1. ACTIVITIES SUMMARY REPORT TABLE */}
                    {activeTab === 'activities' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[8.5pt]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">Date</th>
                                        <th className="px-3 py-2.5">Branch</th>
                                        <th className="px-3 py-2.5">Activity Type</th>
                                        <th className="px-3 py-2.5">Samity / Location</th>
                                        <th className="px-3 py-2.5 text-right">Beneficiaries</th>
                                        <th className="px-3 py-2.5">Assigned Officer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-black">
                                    {activities.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                No activity records found for the selected criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        activities.map((act, idx) => {
                                            const data = act.form_data || {};
                                            const attendees = data.attendees_count || data.patients_served || data.members_visited || (Array.isArray(data.patients) ? data.patients.length : '—');
                                            return (
                                                <tr key={act.id} className="hover:bg-muted/15 transition-colors">
                                                    <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{formatDate(act.activity_date)}</td>
                                                    <td className="px-3 py-2 text-foreground">{act.branch?.name || '—'}</td>
                                                    <td className="px-3 py-2 font-bold text-foreground">
                                                        {act.task_subtype?.name || act.task_type?.name || '—'}
                                                    </td>
                                                    <td className="px-3 py-2 text-foreground">{(data.samity_name as string) || act.samity?.name || data.village || '—'}</td>
                                                    <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400 print:text-black">
                                                        {attendees}
                                                    </td>
                                                    <td className="px-3 py-2 text-foreground">
                                                        <span className="font-semibold">{act.user?.name || '—'}</span>
                                                        {act.user?.employee_code && (
                                                            <span className="ml-1 text-[10px] text-muted-foreground font-mono">({act.user.employee_code})</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 2. HOUSEHOLD VISITS DETAILED REPORT TABLE */}
                    {activeTab === 'households' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[8.5pt]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-2.5 py-2.5">#</th>
                                        <th className="px-2.5 py-2.5">Date</th>
                                        <th className="px-2.5 py-2.5">Branch & Samity</th>
                                        <th className="px-2.5 py-2.5">Village</th>
                                        <th className="px-2.5 py-2.5">Head of Household</th>
                                        <th className="px-2.5 py-2.5 text-center">Members</th>
                                        <th className="px-2.5 py-2.5">Maternal Care</th>
                                        <th className="px-2.5 py-2.5">Nutrition</th>
                                        <th className="px-2.5 py-2.5">Disability</th>
                                        <th className="px-2.5 py-2.5">Chronic Illness</th>
                                        <th className="px-2.5 py-2.5">Officer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-black">
                                    {householdRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-muted-foreground">
                                                No household visit records found for the selected criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        householdRecords.map((h, idx) => {
                                            const activeDiseases = Object.entries(h.elderly_diseases || {})
                                                .filter(([_, s]) => s.affected)
                                                .map(([name]) => name);

                                            return (
                                                <tr key={idx} className="hover:bg-muted/15 transition-colors">
                                                    <td className="px-2.5 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                    <td className="px-2.5 py-2 font-medium text-foreground whitespace-nowrap">{formatDate(h.date)}</td>
                                                    <td className="px-2.5 py-2">
                                                        <div className="font-bold text-foreground">{h.branch_name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{h.samity_name}</div>
                                                    </td>
                                                    <td className="px-2.5 py-2 text-foreground">{h.village}</td>
                                                    <td className="px-2.5 py-2">
                                                        <div className="font-bold text-foreground">{h.household_head}</div>
                                                        {h.phone !== '—' && (
                                                            <div className="text-[10px] text-muted-foreground font-mono">{h.phone}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-2.5 py-2 text-center font-bold text-foreground">{h.member_count}</td>
                                                    <td className="px-2.5 py-2">
                                                        {h.has_pregnant ? 'Pregnant' : h.has_postnatal ? 'Postnatal' : '—'}
                                                    </td>
                                                    <td className="px-2.5 py-2">
                                                        {h.child_nutrition_issue ? 'Issue Flagged' : 'Normal'}
                                                    </td>
                                                    <td className="px-2.5 py-2">
                                                        {h.has_disability ? `Yes (${h.disability_gender})` : '—'}
                                                    </td>
                                                    <td className="px-2.5 py-2">
                                                        {activeDiseases.length > 0 ? activeDiseases.join(', ') : '—'}
                                                    </td>
                                                    <td className="px-2.5 py-2 font-medium text-foreground">{h.officer_name}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 3. FEE COLLECTIONS & DIABETES REGISTER TABLE */}
                    {activeTab === 'fee_collections' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[8.5pt]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">Date</th>
                                        <th className="px-3 py-2.5">Branch</th>
                                        <th className="px-3 py-2.5">Beneficiary Name</th>
                                        <th className="px-3 py-2.5">Type & Age</th>
                                        <th className="px-3 py-2.5">Location</th>
                                        <th className="px-3 py-2.5">Fee Category</th>
                                        <th className="px-3 py-2.5">Diabetes Reading</th>
                                        <th className="px-3 py-2.5 text-right">Amount (BDT)</th>
                                        <th className="px-3 py-2.5">Officer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-black">
                                    {feeCollections.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                                No fee collection records found for the selected criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        feeCollections.map((f, idx) => (
                                            <tr key={f.id} className="hover:bg-muted/15 transition-colors">
                                                <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{formatDate(f.collection_date)}</td>
                                                <td className="px-3 py-2 text-foreground">{f.branch?.name || '—'}</td>
                                                <td className="px-3 py-2 font-bold text-foreground">
                                                    {f.beneficiary_name}
                                                    {f.phone && (
                                                        <div className="text-[10px] text-muted-foreground font-mono">{f.phone}</div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-foreground">
                                                    <div>{f.beneficiary_type}</div>
                                                    {f.age && <div className="text-[10px] text-muted-foreground">{f.age} yrs</div>}
                                                </td>
                                                <td className="px-3 py-2 text-foreground">{f.location_info || '—'}</td>
                                                <td className="px-3 py-2 font-semibold text-foreground">{f.collection_type}</td>
                                                <td className="px-3 py-2">
                                                    {f.diabetes_reading ? `${f.diabetes_reading} mmol/L` : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400 print:text-black">
                                                    ৳{Number(f.amount).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-foreground font-medium">{f.user?.name || '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {feeCollections.length > 0 && (
                                    <tfoot className="border-t-2 border-black bg-muted/60 font-bold print:bg-gray-100 text-foreground">
                                        <tr>
                                            <td colSpan={8} className="px-3 py-2.5 text-right font-bold text-sm print:text-[9pt]">
                                                Grand Total Fees Collected:
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-black text-sm print:text-[9pt] text-emerald-600 dark:text-emerald-400 print:text-black">
                                                ৳{summary.total_fee_amount.toFixed(2)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}

                    {/* 4. CLINIC PATIENTS REGISTER TABLE */}
                    {activeTab === 'patients' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[8.5pt]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">Date</th>
                                        <th className="px-3 py-2.5">Branch</th>
                                        <th className="px-3 py-2.5">Clinic Type</th>
                                        <th className="px-3 py-2.5">Patient Name</th>
                                        <th className="px-3 py-2.5 text-center">Age & Gender</th>
                                        <th className="px-3 py-2.5">Health Card</th>
                                        <th className="px-3 py-2.5">Diagnosis / Illness</th>
                                        <th className="px-3 py-2.5">Advice & Treatment</th>
                                        <th className="px-3 py-2.5">Officer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-black">
                                    {patientRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                                No clinical consultation records found for the selected criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        patientRecords.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-muted/15 transition-colors">
                                                <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{formatDate(p.date)}</td>
                                                <td className="px-3 py-2 text-foreground">{p.branch_name}</td>
                                                <td className="px-3 py-2 font-bold text-foreground">{p.clinic_type}</td>
                                                <td className="px-3 py-2 font-bold text-foreground">
                                                    {p.patient_name}
                                                    <div className="text-[10px] text-muted-foreground font-normal">{p.patient_type}</div>
                                                </td>
                                                <td className="px-3 py-2 text-center text-foreground">{p.patient_age} yrs ({p.patient_gender})</td>
                                                <td className="px-3 py-2">
                                                    {p.has_card ? 'Yes' : 'No'}
                                                </td>
                                                <td className="px-3 py-2 font-medium text-foreground">{p.disease}</td>
                                                <td className="px-3 py-2 text-foreground">{p.advice}</td>
                                                <td className="px-3 py-2 font-medium text-foreground">{p.officer_name}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 5. BRANCH PERFORMANCE MATRIX TABLE */}
                    {activeTab === 'branches' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[8.5pt]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">Branch Name</th>
                                        <th className="px-3 py-2.5">Code</th>
                                        <th className="px-3 py-2.5 text-center">Activities Count</th>
                                        <th className="px-3 py-2.5 text-center">Beneficiaries</th>
                                        <th className="px-3 py-2.5 text-center">Households Visited</th>
                                        <th className="px-3 py-2.5 text-center">Diabetes Tests</th>
                                        <th className="px-3 py-2.5 text-right">Total Fees (BDT)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-black">
                                    {branchMatrix.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                No branch matrix data available.
                                            </td>
                                        </tr>
                                    ) : (
                                        branchMatrix.map((b, idx) => (
                                            <tr key={b.branch_id} className="hover:bg-muted/15 transition-colors">
                                                <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2 font-bold text-foreground">{b.name}</td>
                                                <td className="px-3 py-2 text-muted-foreground font-mono">{b.code}</td>
                                                <td className="px-3 py-2 text-center font-bold text-foreground">{b.activities_count}</td>
                                                <td className="px-3 py-2 text-center font-bold text-foreground">{b.beneficiaries_count}</td>
                                                <td className="px-3 py-2 text-center font-bold text-foreground">{b.households_visited}</td>
                                                <td className="px-3 py-2 text-center font-bold text-foreground">{b.diabetes_tests_count}</td>
                                                <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400 print:text-black">
                                                    ৳{Number(b.total_fee_collected).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 6. OFFICER PERFORMANCE MATRIX TABLE (USER-WISE BREAKDOWN) */}
                    {activeTab === 'officers' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[8.5pt]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">Officer Name</th>
                                        <th className="px-3 py-2.5">Branch</th>
                                        <th className="px-3 py-2.5 text-center">Activities Count</th>
                                        <th className="px-3 py-2.5 text-center">Beneficiaries</th>
                                        <th className="px-3 py-2.5 text-center">Households</th>
                                        <th className="px-3 py-2.5 text-right">Total Fees (BDT)</th>
                                        <th className="px-3 py-2.5 text-right print:hidden">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-black">
                                    {officerMatrix.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                                No officer performance data available for this range.
                                            </td>
                                        </tr>
                                    ) : (
                                        officerMatrix.map((o, idx) => (
                                            <tr key={o.user_id} className="hover:bg-muted/15 transition-colors">
                                                <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2">
                                                    <div className="font-bold text-foreground">{o.name}</div>
                                                    {o.employee_code !== '—' && (
                                                        <div className="text-[10px] font-mono text-muted-foreground">
                                                            {o.employee_code}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-foreground">{o.branch_name}</td>
                                                <td className="px-3 py-2 text-center font-bold text-foreground">
                                                    {o.activities_count}
                                                </td>
                                                <td className="px-3 py-2 text-center font-bold text-foreground">
                                                    {o.beneficiaries_count}
                                                </td>
                                                <td className="px-3 py-2 text-center font-bold text-foreground">
                                                    {o.households_visited}
                                                </td>
                                                <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400 print:text-black">
                                                    ৳{Number(o.total_fee_collected).toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-right print:hidden">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setUserId(String(o.user_id));
                                                            setActiveTab('activities');
                                                            applyFilter('activities', startDate, endDate, branchId, String(o.user_id));
                                                        }}
                                                        className="h-7 px-2 text-[11px] font-semibold"
                                                    >
                                                        Filter Logs
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* OFFICIAL WORD DOCUMENT / INSTITUTIONAL 4-COLUMN SIGNATURE FOOTER */}
                <div className="hidden print:grid grid-cols-4 gap-6 pt-16 text-center text-[9pt] border-t-2 border-black mt-12 text-black">
                    <div>
                        <div className="border-t border-black pt-1 font-bold">Field Paramedic / Worker</div>
                        <div className="text-[8pt] text-gray-600">Signature & Date</div>
                    </div>
                    <div>
                        <div className="border-t border-black pt-1 font-bold">Field Supervisor</div>
                        <div className="text-[8pt] text-gray-600">Verification & Date</div>
                    </div>
                    <div>
                        <div className="border-t border-black pt-1 font-bold">Branch Manager</div>
                        <div className="text-[8pt] text-gray-600">Seal & Signature</div>
                    </div>
                    <div>
                        <div className="border-t border-black pt-1 font-bold">Director (Health Operations)</div>
                        <div className="text-[8pt] text-gray-600">Approval & Seal</div>
                    </div>
                </div>
            </div>
        </>
    );
}
