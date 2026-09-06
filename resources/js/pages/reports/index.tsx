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
    UserCheck,
    Users,
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

type Props = {
    reportType: 'activities' | 'households' | 'fee_collections' | 'patients' | 'branches';
    filters: {
        start_date: string;
        end_date: string;
        branch_id: string;
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
    branches: BranchOption[];
    today: string;
    user: {
        id: number;
        name: string;
        role: string;
        branch_name: string;
    };
};

const REPORT_TABS = [
    { key: 'activities', label: '১. সার্বিক কার্যক্রম রিপোর্ট', short: 'কার্যক্রম', icon: ClipboardListIcon },
    { key: 'households', label: '২. খানা পরিদর্শন বিস্তারিত রিপোর্ট', short: 'খানা পরিদর্শন', icon: Home },
    { key: 'fee_collections', label: '৩. ফি আদায় ও ডায়াবেটিস রেজিস্টার', short: 'ফি আদায়', icon: Coins },
    { key: 'patients', label: '৪. রোগী সেবা ও ক্লিনিক রেজিস্টার', short: 'রোগী রেজিস্টার', icon: Stethoscope },
    { key: 'branches', label: '৫. শাখা পারফরম্যান্স ম্যাট্রিক্স', short: 'শাখা সামারি', icon: Building2 },
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
    branches = [],
    today,
    user,
}: Props) {
    const [activeTab, setActiveTab] = useState<string>(filters.report_type || reportType);
    const [startDate, setStartDate] = useState(filters.start_date || today);
    const [endDate, setEndDate] = useState(filters.end_date || today);
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');
    const [tableSearch, setTableSearch] = useState('');

    const applyFilter = (newTab?: string, newStart?: string, newEnd?: string, newBranch?: string) => {
        const t = newTab ?? activeTab;
        const s = newStart ?? startDate;
        const e = newEnd ?? endDate;
        const b = newBranch ?? branchId;

        router.get(
            '/reports',
            {
                report_type: t,
                start_date: s,
                end_date: e,
                branch_id: b,
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
        applyFilter(activeTab, s, e, branchId);
    };

    const handlePrint = () => {
        window.print();
    };

    // EXCEL / CSV EXPORT (UTF-8 BOM supported for Microsoft Excel in Bengali)
    const exportToExcel = () => {
        let rows: string[][] = [];
        let filename = `Mcare_Report_${activeTab}_${startDate}_to_${endDate}.csv`;

        if (activeTab === 'activities') {
            rows.push(['ক্র. নং', 'তারিখ', 'শাখা', 'কার্যক্রমের ধরণ', 'সমিতি / স্থান', 'উপস্থিতি / সেবাগ্রহীতা', 'দায়িত্বপ্রাপ্ত কর্মকর্তা']);
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
            rows.push(['ক্র. নং', 'তারিখ', 'শাখা', 'সমিতি', 'গ্রাম', 'খানা প্রধান', 'সদস্য সংখ্যা', 'গর্ভবতী মা', 'প্রসূতি মা', 'পুষ্টি সমস্যা', 'প্রতিবন্ধী', 'দীঘমেয়াদী রোগ', 'কর্মকর্তা']);
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
                    h.has_pregnant ? 'হ্যাঁ' : 'না',
                    h.has_postnatal ? 'হ্যাঁ' : 'না',
                    h.child_nutrition_issue ? 'হ্যাঁ' : 'না',
                    h.has_disability ? 'হ্যাঁ' : 'না',
                    diseases || 'নেই',
                    h.officer_name,
                ]);
            });
        } else if (activeTab === 'fee_collections') {
            rows.push(['ক্র. নং', 'তারিখ', 'শাখা', 'উপকারভোগীর নাম', 'ধরন', 'বয়স', 'মোবাইল', 'সমিতি / গ্রাম', 'ফি আদায়ের ধরণ', 'ডায়াবেটিস মাত্রা', 'আদায়কৃত ফি (টাকা)', 'মন্তব্য']);
            feeCollections.forEach((f, idx) => {
                rows.push([
                    String(idx + 1),
                    f.collection_date,
                    f.branch?.name || '',
                    f.beneficiary_name,
                    f.beneficiary_type,
                    f.age ? `${f.age} বছর` : '',
                    f.phone || '',
                    f.location_info || '',
                    f.collection_type,
                    f.diabetes_reading || '',
                    String(f.amount),
                    f.notes || '',
                ]);
            });
            rows.push(['', '', '', '', '', '', '', '', '', 'সর্বমোট আদায়:', String(summary.total_fee_amount), '']);
        } else if (activeTab === 'patients') {
            rows.push(['ক্র. নং', 'তারিখ', 'শাখা', 'ক্লিনিকের ধরণ', 'রোগীর নাম', 'বয়স', 'লিঙ্গ', 'স্বাস্থ্য কার্ড', 'রোগের বিবরণ', 'পরামর্শ ও সেবা', 'কর্মকর্তা']);
            patientRecords.forEach((p, idx) => {
                rows.push([
                    String(idx + 1),
                    p.date,
                    p.branch_name,
                    p.clinic_type,
                    p.patient_name,
                    String(p.patient_age),
                    p.patient_gender,
                    p.has_card ? 'কার্ড আছে' : 'কার্ড নেই',
                    p.disease,
                    p.advice,
                    p.officer_name,
                ]);
            });
        } else if (activeTab === 'branches') {
            rows.push(['ক্র. নং', 'শাখার নাম', 'শাখা কোড', 'মোট কার্যক্রম', 'মোট সেবাগ্রহীতা', 'পরিদর্শনকৃত খানা', 'ডায়াবেটিস পরীক্ষা', 'মোট আদায়কৃত ফি (টাকা)']);
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

    return (
        <>
            <Head title="রিপোর্ট ও অ্যানালিটিক্স — M Care" />

            {/* PRINT-ONLY OFFICIAL HEADER */}
            <div className="hidden print:block text-center border-b pb-3 mb-4 space-y-1">
                <h1 className="text-xl font-bold uppercase tracking-wider text-black">
                    M Care — স্বাস্থ্যসেবা কার্যক্রম প্রতিবেদন
                </h1>
                <p className="text-xs font-semibold text-gray-800">
                    {REPORT_TABS.find((t) => t.key === activeTab)?.label}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1">
                    <span>রিপোর্ট সময়কাল: <strong>{formatDate(startDate)}</strong> হতে <strong>{formatDate(endDate)}</strong></span>
                    <span>শাখা: <strong>{branchId !== 'all' ? branches.find((b) => String(b.id) === branchId)?.name : 'সকল শাখা'}</strong></span>
                    <span>প্রিন্ট তারিখ: <strong>{formatDate(today)}</strong></span>
                </div>
            </div>

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 md:p-6 pb-24 md:pb-12 print:p-0">
                {/* SCREEN ONLY HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs print:hidden">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs shrink-0">
                            <TrendingUp className="size-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                    প্রতিবেদন ও পরিসংখ্যান কেন্দ্র (Reports & Analytics)
                                </h1>
                                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px] font-bold">
                                    A4 প্রিন্ট ও এক্সেল প্রস্তুত
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                দৈনিক ফিল্ড কার্যক্রম, খানা পরিদর্শন, ফি আদায় ও রোগী রেজিস্টার প্রতিবেদন
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={exportToExcel}
                            className="flex-1 sm:flex-initial rounded-xl text-xs font-semibold h-9 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                        >
                            <FileSpreadsheet className="size-4 mr-1.5 text-emerald-600" />
                            এক্সেল এক্সপোর্ট (.csv)
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            onClick={handlePrint}
                            className="flex-1 sm:flex-initial rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground shadow-xs cursor-pointer"
                        >
                            <Printer className="size-4 mr-1.5" />
                            A4 প্রিন্ট / PDF
                        </Button>
                    </div>
                </div>

                {/* REPORT SUB-TABS (PARENT REPORTS NAVIGATION) */}
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
                                    applyFilter(tab.key, startDate, endDate, branchId);
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

                {/* DATE TO DATE FILTER BAR */}
                <div className="rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs print:hidden space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Quick Date Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-muted-foreground mr-1 flex items-center gap-1">
                                <Calendar className="size-3.5" /> দ্রুত সময়কাল:
                            </span>
                            {[
                                { key: 'today', label: 'আজকে' },
                                { key: 'yesterday', label: 'গতকাল' },
                                { key: 'this_week', label: 'চলতি সপ্তাহ' },
                                { key: 'this_month', label: 'চলতি মাস' },
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

                        {/* Date to Date Picker & Branch */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-muted-foreground shrink-0">হতে:</span>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-8 text-xs rounded-xl bg-background flex-1 sm:w-32"
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-semibold text-muted-foreground shrink-0">পর্যন্ত:</span>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-8 text-xs rounded-xl bg-background flex-1 sm:w-32"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {branches.length > 1 ? (
                                    <select
                                        value={branchId}
                                        onChange={(e) => {
                                            setBranchId(e.target.value);
                                            applyFilter(activeTab, startDate, endDate, e.target.value);
                                        }}
                                        className="h-8 flex-1 sm:flex-initial rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                                    >
                                        <option value="all">সকল শাখা</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : null}

                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => applyFilter(activeTab, startDate, endDate, branchId)}
                                    className="h-8 px-4 flex-1 sm:flex-initial rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                                >
                                    <Filter className="size-3.5 mr-1" />
                                    ফিল্টার
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 SUMMARY STAT CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:grid-cols-4">
                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            ফিল্ড সেশন / কার্যক্রম
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                            {summary.total_activities} টি
                        </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            খানা পরিদর্শন সম্পন্ন
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                            {summary.total_households_visited} টি খানা
                        </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            মোট ফি আদায় (টাকা)
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ৳{summary.total_fee_amount.toLocaleString()}
                        </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/80 bg-card shadow-2xs">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                            ডায়াবেটিস পরীক্ষা
                        </span>
                        <p className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            {summary.total_diabetes_tests} জন
                        </p>
                    </div>
                </div>

                {/* REPORT TABLES BASED ON ACTIVE TAB */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden print:border-black print:rounded-none">
                    {/* 1. ACTIVITIES SUMMARY REPORT TABLE */}
                    {activeTab === 'activities' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[10px]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">তারিখ</th>
                                        <th className="px-3 py-2.5">শাখার নাম</th>
                                        <th className="px-3 py-2.5">কার্যক্রমের ধরণ</th>
                                        <th className="px-3 py-2.5">সমিতি / স্থান</th>
                                        <th className="px-3 py-2.5 text-right">উপস্থিতি / সেবাগ্রহীতা</th>
                                        <th className="px-3 py-2.5">দায়িত্বপ্রাপ্ত কর্মকর্তা</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-gray-300">
                                    {activities.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                নির্বাচিত সময়কালের মধ্যে কোনো কার্যক্রমের রেকর্ড পাওয়া যায়নি।
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
                                                    <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400">
                                                        {attendees} জন
                                                    </td>
                                                    <td className="px-3 py-2 text-foreground">{act.user?.name || '—'}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}

                    {/* 2. HOUSEHOLD VISITS DETAILED REPORT TABLE */}
                    {activeTab === 'households' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[10px]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-2.5 py-2.5">#</th>
                                        <th className="px-2.5 py-2.5">তারিখ</th>
                                        <th className="px-2.5 py-2.5">শাখা ও সমিতি</th>
                                        <th className="px-2.5 py-2.5">গ্রাম</th>
                                        <th className="px-2.5 py-2.5">খানা প্রধানের নাম</th>
                                        <th className="px-2.5 py-2.5 text-center">সদস্য</th>
                                        <th className="px-2.5 py-2.5">মাতৃ স্বাস্থ্য</th>
                                        <th className="px-2.5 py-2.5">শিশু পুষ্টি</th>
                                        <th className="px-2.5 py-2.5">প্রতিবন্ধী</th>
                                        <th className="px-2.5 py-2.5">দীর্ঘমেয়াদী রোগ</th>
                                        <th className="px-2.5 py-2.5">কর্মকর্তা</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-gray-300">
                                    {householdRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-muted-foreground">
                                                নির্বাচিত সময়কালের মধ্যে কোনো খানা পরিদর্শনের রেকর্ড পাওয়া যায়নি।
                                            </td>
                                        </tr>
                                    ) : (
                                        householdRecords.map((h, idx) => {
                                            const activeDiseases = Object.entries(h.elderly_diseases || {})
                                                .filter(([_, s]) => s.affected)
                                                .map(([name]) => name)
                                                .join(', ');

                                            return (
                                                <tr key={idx} className="hover:bg-muted/15 transition-colors">
                                                    <td className="px-2.5 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                    <td className="px-2.5 py-2 whitespace-nowrap">{formatDate(h.date)}</td>
                                                    <td className="px-2.5 py-2">
                                                        <p className="font-semibold text-foreground">{h.samity_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{h.branch_name}</p>
                                                    </td>
                                                    <td className="px-2.5 py-2">{h.village}</td>
                                                    <td className="px-2.5 py-2 font-bold text-foreground">
                                                        {h.household_head}
                                                        {h.phone && h.phone !== '—' ? (
                                                            <span className="block text-[10px] text-muted-foreground font-normal">{h.phone}</span>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-2.5 py-2 text-center font-bold">{h.member_count}</td>
                                                    <td className="px-2.5 py-2">
                                                        {h.has_pregnant ? <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-700">গর্ভবতী ({h.pregnant_months || '—'} মাস)</Badge> : null}
                                                        {h.has_postnatal ? <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-700 ml-1">প্রসূতি ({h.delivery_place || '—'})</Badge> : null}
                                                        {!h.has_pregnant && !h.has_postnatal ? '—' : null}
                                                    </td>
                                                    <td className="px-2.5 py-2">
                                                        {h.child_nutrition_issue ? (
                                                            <span className="text-rose-600 font-semibold text-[10px]">অপুষ্টি চিহ্নিত</span>
                                                        ) : 'স্বাভাবিক'}
                                                    </td>
                                                    <td className="px-2.5 py-2">
                                                        {h.has_disability ? <Badge variant="outline" className="text-[9px] bg-indigo-500/10 text-indigo-700">প্রতিবন্ধী ({h.disability_gender})</Badge> : '—'}
                                                    </td>
                                                    <td className="px-2.5 py-2 max-w-[120px] truncate text-[10px]">
                                                        {activeDiseases || '—'}
                                                    </td>
                                                    <td className="px-2.5 py-2 text-[10px]">{h.officer_name}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}

                    {/* 3. FEE COLLECTIONS & DIABETES REGISTER REPORT TABLE */}
                    {activeTab === 'fee_collections' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[10px]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">তারিখ</th>
                                        <th className="px-3 py-2.5">উপকারভোগীর নাম</th>
                                        <th className="px-3 py-2.5">ধরন</th>
                                        <th className="px-3 py-2.5">বয়স ও মোবাইল</th>
                                        <th className="px-3 py-2.5">সমিতি / গ্রাম</th>
                                        <th className="px-3 py-2.5">ফি আদায়ের ধরণ</th>
                                        <th className="px-3 py-2.5">ডায়াবেটিস মাত্রা</th>
                                        <th className="px-3 py-2.5 text-right">আদায় (টাকা)</th>
                                        <th className="px-3 py-2.5">মন্তব্য</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-gray-300">
                                    {feeCollections.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                                নির্বাচিত সময়কালের মধ্যে কোনো ফি আদায়ের রেকর্ড পাওয়া যায়নি।
                                            </td>
                                        </tr>
                                    ) : (
                                        feeCollections.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                                                <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.collection_date)}</td>
                                                <td className="px-3 py-2 font-bold text-foreground">{item.beneficiary_name}</td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                                        {item.beneficiary_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2">
                                                    {item.age ? `${item.age} ব.` : '—'} {item.phone ? `(${item.phone})` : ''}
                                                </td>
                                                <td className="px-3 py-2">{item.location_info || '—'}</td>
                                                <td className="px-3 py-2 font-medium">{item.collection_type}</td>
                                                <td className="px-3 py-2">
                                                    {item.diabetes_reading ? (
                                                        <span className="font-bold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px] border border-rose-500/20">
                                                            {item.diabetes_reading}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400">
                                                    ৳{Number(item.amount).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-2 text-[10px] text-muted-foreground">{item.notes || '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                {feeCollections.length > 0 ? (
                                    <tfoot className="border-t-2 border-border bg-muted/30 font-bold print:bg-gray-100">
                                        <tr>
                                            <td colSpan={8} className="px-3 py-2.5 text-right uppercase tracking-wider">
                                                সর্বমোট আদায়কৃত ফি:
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-black text-sm text-emerald-600">
                                                ৳{summary.total_fee_amount.toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                ) : null}
                            </table>
                        </div>
                    ) : null}

                    {/* 4. PATIENTS CLINICAL REGISTER REPORT TABLE */}
                    {activeTab === 'patients' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[10px]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">তারিখ</th>
                                        <th className="px-3 py-2.5">শাখা</th>
                                        <th className="px-3 py-2.5">রোগীর নাম</th>
                                        <th className="px-3 py-2.5">বয়স ও লিঙ্গ</th>
                                        <th className="px-3 py-2.5">স্বাস্থ্য কার্ড</th>
                                        <th className="px-3 py-2.5">রোগের বিবরণ / সমস্যা</th>
                                        <th className="px-3 py-2.5">প্রদত্ত পরামর্শ ও চিকিৎসা</th>
                                        <th className="px-3 py-2.5">কর্মকর্তা</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-gray-300">
                                    {patientRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                                নির্বাচিত সময়কালের মধ্যে কোনো ক্লিনিক্যাল রোগীর রেকর্ড পাওয়া যায়নি।
                                            </td>
                                        </tr>
                                    ) : (
                                        patientRecords.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-muted/15 transition-colors">
                                                <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.date)}</td>
                                                <td className="px-3 py-2">{p.branch_name}</td>
                                                <td className="px-3 py-2 font-bold text-foreground">{p.patient_name}</td>
                                                <td className="px-3 py-2">
                                                    {p.patient_age} বছর • {p.patient_gender}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 ${p.has_card ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'}`}>
                                                        {p.has_card ? '✓ আছে' : '✗ নেই'}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-2 font-medium text-foreground">{p.disease}</td>
                                                <td className="px-3 py-2 max-w-xs whitespace-pre-wrap text-[11px]">{p.advice}</td>
                                                <td className="px-3 py-2 text-[10px]">{p.officer_name}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}

                    {/* 5. BRANCH PERFORMANCE MATRIX REPORT TABLE */}
                    {activeTab === 'branches' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print:text-[10px]">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">শাখার নাম ও কোড</th>
                                        <th className="px-3 py-2.5 text-right">মোট সেশন</th>
                                        <th className="px-3 py-2.5 text-right">মোট সেবাগ্রহীতা</th>
                                        <th className="px-3 py-2.5 text-right">পরিদর্শনকৃত খানা</th>
                                        <th className="px-3 py-2.5 text-right">ডায়াবেটিস পরীক্ষা</th>
                                        <th className="px-3 py-2.5 text-right">মোট ফি আদায় (টাকা)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-gray-300">
                                    {branchMatrix.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                কোনো শাখার রেকর্ড পাওয়া যায়নি।
                                            </td>
                                        </tr>
                                    ) : (
                                        branchMatrix.map((b, idx) => (
                                            <tr key={b.branch_id} className="hover:bg-muted/15 transition-colors">
                                                <td className="px-3 py-2.5 font-bold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-3 py-2.5">
                                                    <p className="font-bold text-foreground">{b.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">কোড: {b.code}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold">{b.activities_count}</td>
                                                <td className="px-3 py-2.5 text-right font-black text-emerald-600">{b.beneficiaries_count.toLocaleString()} জন</td>
                                                <td className="px-3 py-2.5 text-right font-semibold">{b.households_visited} টি</td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-rose-600">{b.diabetes_tests_count} জন</td>
                                                <td className="px-3 py-2.5 text-right font-black text-emerald-600">৳{b.total_fee_collected.toLocaleString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>

                {/* PRINT-ONLY OFFICIAL SIGNATURES BLOCK (AT BOTTOM OF A4) */}
                <div className="hidden print:grid grid-cols-4 gap-6 pt-16 mt-8 text-center text-xs text-black border-t border-gray-400">
                    <div className="space-y-1">
                        <div className="border-t border-black w-3/4 mx-auto pt-1">
                            <p className="font-bold">প্রতিবেদন প্রস্তুতকারী</p>
                            <p className="text-[9px] text-gray-600">স্বাক্ষর ও তারিখ</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="border-t border-black w-3/4 mx-auto pt-1">
                            <p className="font-bold">স্বাস্থ্য কর্মকর্তা</p>
                            <p className="text-[9px] text-gray-600">স্বাক্ষর ও তারিখ</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="border-t border-black w-3/4 mx-auto pt-1">
                            <p className="font-bold">শাখা ব্যবস্থাপক</p>
                            <p className="text-[9px] text-gray-600">স্বাক্ষর ও তারিখ</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="border-t border-black w-3/4 mx-auto pt-1">
                            <p className="font-bold">অনুমোদনকারী কর্মকর্তা</p>
                            <p className="text-[9px] text-gray-600">স্বাক্ষর ও তারিখ</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
