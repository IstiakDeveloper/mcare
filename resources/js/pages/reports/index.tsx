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
import React, { useEffect, useState } from 'react';
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

type EmployeeSubmission = {
    date: string;
    source: string;
    work_type: string;
    location: string;
    quantity: string;
    fee: number | null;
    description: string;
};

type IllnessBranch = {
    branch_id: number;
    branch_name: string;
    diabetes_affected: number;
    diabetes_medication: number;
    hypertension_affected: number;
    hypertension_medication: number;
    tuberculosis_affected: number;
    tuberculosis_medication: number;
    kidney_disease_affected: number;
    kidney_disease_medication: number;
    eye_disease_affected: number;
    eye_disease_medication: number;
    asthma_affected: number;
    asthma_medication: number;
    malnutrition_affected: number;
    malnutrition_medication: number;
    other_chronic_affected: number;
    other_chronic_medication: number;
    pregnant: number;
    anc: number;
    tt: number;
    delivered: number;
    pnc: number;
    stunting: number;
    wasting: number;
    underweight: number;
    disabled: number;
    general_illness: number;
    general_treated: number;
    diabetes_tests: number;
    diabetes_tests_member: number;
    diabetes_tests_non_member: number;
};

type IllnessReport = {
    summary: {
        diabetes_affected: number;
        diabetes_medication: number;
        hypertension_affected: number;
        hypertension_medication: number;
        tuberculosis_affected: number;
        tuberculosis_medication: number;
        kidney_disease_affected: number;
        kidney_disease_medication: number;
        eye_disease_affected: number;
        eye_disease_medication: number;
        asthma_affected: number;
        asthma_medication: number;
        malnutrition_affected: number;
        malnutrition_medication: number;
        other_chronic_affected: number;
        other_chronic_medication: number;
        pregnant: number;
        anc: number;
        tt: number;
        delivered: number;
        pnc: number;
        stunting: number;
        wasting: number;
        underweight: number;
        disabled: number;
        general_illness: number;
        general_treated: number;
        diabetes_tests: number;
        static_patients: number;
    };
    branches: IllnessBranch[];
    static_diseases: { disease: string; branch_name: string; patients: number }[];
};

const CHRONIC_COLUMNS: { key: keyof IllnessBranch; med: keyof IllnessBranch; label: string }[] = [
    { key: 'diabetes_affected', med: 'diabetes_medication', label: 'ডায়াবেটিস' },
    { key: 'hypertension_affected', med: 'hypertension_medication', label: 'উচ্চ রক্তচাপ' },
    { key: 'tuberculosis_affected', med: 'tuberculosis_medication', label: 'যক্ষা' },
    { key: 'kidney_disease_affected', med: 'kidney_disease_medication', label: 'কিডনি' },
    { key: 'eye_disease_affected', med: 'eye_disease_medication', label: 'চোখ' },
    { key: 'asthma_affected', med: 'asthma_medication', label: 'হাঁপানি' },
    { key: 'malnutrition_affected', med: 'malnutrition_medication', label: 'অপুষ্টি' },
    { key: 'other_chronic_affected', med: 'other_chronic_medication', label: 'অন্যান্য' },
];

type EmployeeReport = {
    requires_selection: boolean;
    employee: {
        id: number;
        name: string;
        employee_code: string;
        designation: string;
        branch_name: string;
    } | null;
    summary: {
        total_submissions: number;
        field_activities: number;
        health_camps: number;
        fee_collections: number;
        health_cards: number;
        total_fee_amount: number;
    };
    by_type: { work_type: string; source: string; count: number }[];
    submissions: EmployeeSubmission[];
};

type Props = {
    reportType: 'activities' | 'households' | 'fee_collections' | 'patients' | 'branches' | 'officers' | 'employee' | 'illness';
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
    employeeReport?: EmployeeReport | null;
    illnessReport?: IllnessReport | null;
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

const REPORT_TITLES: Record<string, string> = {
    activities: 'Field Activities Summary',
    households: 'Household Visits Register',
    fee_collections: 'Fee & Diabetes Register',
    patients: 'Clinical Consultations Register',
    branches: 'Branch Performance Matrix',
    officers: 'Officer Performance Summary',
    employee: 'Employee Work Report',
    illness: 'Illness & Disease Report',
};

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
    employeeReport = null,
    illnessReport = null,
    branches = [],
    officers = [],
    today,
    user,
}: Props) {
    const activeTab = filters.report_type || reportType;
    const [startDate, setStartDate] = useState(filters.start_date || today);
    const [endDate, setEndDate] = useState(filters.end_date || today);
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');
    const [userId, setUserId] = useState(filters.user_id || 'all');
    const [officerSearch, setOfficerSearch] = useState('');

    useEffect(() => {
        setStartDate(filters.start_date || today);
        setEndDate(filters.end_date || today);
        setBranchId(filters.branch_id || 'all');
        setUserId(filters.user_id || 'all');
    }, [filters.start_date, filters.end_date, filters.branch_id, filters.user_id, today]);

    const isPrivileged = Boolean(user.is_admin || user.is_branch_manager || user.role?.slug === 'admin' || user.role?.slug === 'branch-manager');

    // Filter officers for dropdown based on chosen branch
    const filteredOfficersForDropdown = officers.filter((off) => {
        if (branchId !== 'all' && String(off.branch_id) !== String(branchId)) {
            return false;
        }

        if (activeTab !== 'employee') {
            return true;
        }

        const query = officerSearch.trim().toLowerCase();

        if (!query) {
            return true;
        }

        return [off.name, off.employee_code, off.designation]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
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
        } else if (activeTab === 'employee') {
            const employee = employeeReport?.employee;
            const safeName = (employee?.name || 'employee').replace(/[^\w-]+/g, '_');
            filename = `Mcare_Employee_Report_${safeName}_${startDate}_to_${endDate}.csv`;

            if (!employeeReport?.employee) {
                rows.push(['Employee Work Report']);
                rows.push(['Select an employee and a date range to export this report.']);
            } else {
                const employee = employeeReport.employee;
                const reportSummary = employeeReport.summary;
                rows.push(['Employee Work Report']);
                rows.push(['Name', employee.name]);
                rows.push(['Employee Code', employee.employee_code]);
                rows.push(['Designation', employee.designation]);
                rows.push(['Branch', employee.branch_name]);
                rows.push(['Period', `${startDate} to ${endDate}`]);
                rows.push([]);
                rows.push(['Summary']);
                rows.push(['Total Submissions', String(reportSummary.total_submissions)]);
                rows.push(['Field Activities', String(reportSummary.field_activities)]);
                rows.push(['Health Camps', String(reportSummary.health_camps)]);
                rows.push(['Fee Collections', String(reportSummary.fee_collections)]);
                rows.push(['Health Cards', String(reportSummary.health_cards)]);
                rows.push(['Total Fee (BDT)', String(reportSummary.total_fee_amount)]);
                rows.push([]);
                rows.push(['Work Type', 'Source', 'Count']);
                employeeReport.by_type.forEach((item) => {
                    rows.push([item.work_type, item.source, String(item.count)]);
                });
                rows.push([]);
                rows.push(['SL', 'Date', 'Source', 'Work Type', 'Location', 'Quantity', 'Fee (BDT)', 'Description']);
                employeeReport.submissions.forEach((row, idx) => {
                    rows.push([
                        String(idx + 1),
                        row.date,
                        row.source,
                        row.work_type,
                        row.location,
                        row.quantity,
                        row.fee === null ? '' : String(row.fee),
                        row.description,
                    ]);
                });
            }
        } else if (activeTab === 'illness' && illnessReport) {
            filename = `Mcare_Illness_Report_${startDate}_to_${endDate}.csv`;
            const totals = illnessReport.summary;
            rows.push(['Illness & Disease Report']);
            rows.push(['Period', `${startDate} to ${endDate}`]);
            rows.push(['Branch', selectedBranchName]);
            rows.push([]);
            rows.push(['Summary']);
            rows.push(['Diabetes households (affected)', String(totals.diabetes_affected)]);
            rows.push(['Diabetes households (on medication)', String(totals.diabetes_medication)]);
            rows.push(['Hypertension households', String(totals.hypertension_affected)]);
            rows.push(['Tuberculosis households', String(totals.tuberculosis_affected)]);
            rows.push(['Kidney disease households', String(totals.kidney_disease_affected)]);
            rows.push(['Eye disease households', String(totals.eye_disease_affected)]);
            rows.push(['Asthma households', String(totals.asthma_affected)]);
            rows.push(['Elderly malnutrition households', String(totals.malnutrition_affected)]);
            rows.push(['Other chronic households', String(totals.other_chronic_affected)]);
            rows.push(['Pregnant households', String(totals.pregnant)]);
            rows.push(['ANC', String(totals.anc)]);
            rows.push(['TT vaccine', String(totals.tt)]);
            rows.push(['Delivered', String(totals.delivered)]);
            rows.push(['PNC', String(totals.pnc)]);
            rows.push(['Stunting', String(totals.stunting)]);
            rows.push(['Wasting', String(totals.wasting)]);
            rows.push(['Underweight', String(totals.underweight)]);
            rows.push(['Disabled', String(totals.disabled)]);
            rows.push(['General illness (people)', String(totals.general_illness)]);
            rows.push(['General illness treated (people)', String(totals.general_treated)]);
            rows.push(['Diabetes tests (people)', String(totals.diabetes_tests)]);
            rows.push(['Static clinic patients', String(totals.static_patients)]);
            rows.push([]);
            rows.push(['Branch', 'Diabetes affected', 'Diabetes on medication', 'Hypertension affected', 'Hypertension on medication', 'TB affected', 'TB on medication', 'Kidney affected', 'Kidney on medication', 'Eye affected', 'Eye on medication', 'Asthma affected', 'Asthma on medication', 'Malnutrition affected', 'Malnutrition on medication', 'Other chronic affected', 'Other chronic on medication', 'Pregnant', 'ANC', 'TT', 'Delivered', 'PNC', 'Stunting', 'Wasting', 'Underweight', 'Disabled', 'General illness', 'General treated', 'Diabetes tests', 'Tests member', 'Tests non-member']);
            illnessReport.branches.forEach((branch) => {
                rows.push([
                    branch.branch_name,
                    String(branch.diabetes_affected),
                    String(branch.diabetes_medication),
                    String(branch.hypertension_affected),
                    String(branch.hypertension_medication),
                    String(branch.tuberculosis_affected),
                    String(branch.tuberculosis_medication),
                    String(branch.kidney_disease_affected),
                    String(branch.kidney_disease_medication),
                    String(branch.eye_disease_affected),
                    String(branch.eye_disease_medication),
                    String(branch.asthma_affected),
                    String(branch.asthma_medication),
                    String(branch.malnutrition_affected),
                    String(branch.malnutrition_medication),
                    String(branch.other_chronic_affected),
                    String(branch.other_chronic_medication),
                    String(branch.pregnant),
                    String(branch.anc),
                    String(branch.tt),
                    String(branch.delivered),
                    String(branch.pnc),
                    String(branch.stunting),
                    String(branch.wasting),
                    String(branch.underweight),
                    String(branch.disabled),
                    String(branch.general_illness),
                    String(branch.general_treated),
                    String(branch.diabetes_tests),
                    String(branch.diabetes_tests_member),
                    String(branch.diabetes_tests_non_member),
                ]);
            });
            rows.push([]);
            rows.push(['Static clinic disease', 'Branch', 'Patients']);
            illnessReport.static_diseases.forEach((item) => {
                rows.push([item.disease, item.branch_name, String(item.patients)]);
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
    const currentTabTitle = REPORT_TITLES[activeTab] || 'Official Report';

    return (
        <>
            <Head title="Reports & Analytics — M Care Health System" />

            {/* EMBEDDED PRINT STYLE INJECTION FOR PURE A4 WORD DOCUMENT FORMAT */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm 10mm 14mm 10mm;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    [data-slot="sidebar"],
                    [data-slot="sidebar-header"],
                    [data-sidebar],
                    header,
                    nav,
                    aside,
                    footer,
                    [data-mobile-nav],
                    [data-sonner-toaster] {
                        display: none !important;
                    }
                    [data-slot="sidebar-wrapper"],
                    [data-slot="sidebar-inset"] {
                        display: block !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-height: 0 !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        box-shadow: none !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        overflow: visible !important;
                    }
                    #official-report {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        box-shadow: none !important;
                    }
                    #official-report .screen-only {
                        display: none !important;
                    }
                    #official-report,
                    #official-report * {
                        color: #000000 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                    #official-report {
                        background: #ffffff !important;
                    }
                    #official-report th {
                        background: #f0f0f0 !important;
                    }
                    #official-report .print-letterhead {
                        display: block !important;
                    }
                    #official-report .print-signature {
                        display: grid !important;
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
                        background: #ffffff !important;
                    }
                    th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold !important;
                    }
                }
            `}</style>

            <div id="official-report">
            <div className="print-letterhead hidden text-black font-sans mb-4 border-b-2 border-black pb-3">
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

            <div className="print-document-container mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 md:p-6 pb-24 md:pb-12 print:p-0 print:gap-3">
                {/* SCREEN ONLY HEADER */}
                <div className="screen-only flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs shrink-0">
                            <TrendingUp className="size-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                    {currentTabTitle}
                                </h1>
                                <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 text-[10px] font-bold">
                                    A4 Print & Excel Ready
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Choose a report from the Reports menu. Filter by date, branch, and employee, then print or export.
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

                <div className="screen-only rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs space-y-3">
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

                        {activeTab === 'employee' && isPrivileged && (
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={officerSearch}
                                    onChange={(e) => setOfficerSearch(e.target.value)}
                                    placeholder="Search employee by name, code, or designation"
                                    className="h-9 rounded-xl bg-background pl-9 text-xs"
                                />
                            </div>
                        )}

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
                                    <option value="all">{activeTab === 'employee' ? 'Select an employee' : 'All Officers'}</option>
                                    {filteredOfficersForDropdown.map((off) => (
                                        <option key={off.id} value={off.id}>
                                            {off.name}
                                            {off.employee_code ? ` (${off.employee_code})` : ''}
                                            {activeTab === 'employee' && off.designation ? ` — ${off.designation}` : ''}
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

                {activeTab === 'employee' && employeeReport?.employee && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {[
                            { label: 'Total Submissions', value: String(employeeReport.summary.total_submissions) },
                            { label: 'Field Activities', value: String(employeeReport.summary.field_activities) },
                            { label: 'Health Camps', value: String(employeeReport.summary.health_camps) },
                            { label: 'Fee Collections', value: String(employeeReport.summary.fee_collections) },
                            { label: 'Health Cards', value: String(employeeReport.summary.health_cards) },
                            { label: 'Fees Collected', value: `৳${Number(employeeReport.summary.total_fee_amount).toLocaleString()}` },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-border/80 bg-card p-3 shadow-2xs print:border-black print:shadow-none">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground print:text-black">
                                    {item.label}
                                </span>
                                <p className="mt-0.5 text-lg font-bold text-foreground print:text-black sm:text-xl">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'illness' && illnessReport && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                        {[
                            { label: 'ডায়াবেটিস (খানা)', value: `${illnessReport.summary.diabetes_affected} (${illnessReport.summary.diabetes_medication})` },
                            { label: 'ডায়াবেটিস পরীক্ষা', value: String(illnessReport.summary.diabetes_tests) },
                            { label: 'উচ্চ রক্তচাপ', value: String(illnessReport.summary.hypertension_affected) },
                            { label: 'যক্ষা', value: String(illnessReport.summary.tuberculosis_affected) },
                            { label: 'গর্ভবতী', value: String(illnessReport.summary.pregnant) },
                            { label: 'স্টান্টিং', value: String(illnessReport.summary.stunting) },
                            { label: 'সাধারণ অসুস্থ', value: String(illnessReport.summary.general_illness) },
                            { label: 'স্ট্যাটিক ক্লিনিক', value: String(illnessReport.summary.static_patients) },
                        ].map((item) => (
                            <div key={item.label} className="rounded-xl border border-border/80 bg-card p-3 shadow-2xs print:border-black print:shadow-none">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground print:text-black">
                                    {item.label}
                                </span>
                                <p className="mt-0.5 text-lg font-bold text-foreground print:text-black sm:text-xl">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab !== 'employee' && activeTab !== 'illness' && (
                <div className="screen-only grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                )}

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
                                        <th className="screen-only px-3 py-2.5 text-right">Action</th>
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
                                                <td className="screen-only px-3 py-2 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setUserId(String(o.user_id));
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

                    {activeTab === 'employee' && (
                        <div className="space-y-4 p-3 print:p-0">
                            {!employeeReport?.employee ? (
                                <div className="screen-only rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                    Select an employee and a date range to see how many submissions they made and what work they completed.
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-2 border border-border p-3 text-xs print:border-black print:text-[9pt] sm:grid-cols-4">
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase text-muted-foreground print:text-black">Employee</div>
                                            <div className="font-bold text-foreground print:text-black">{employeeReport.employee.name}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase text-muted-foreground print:text-black">Employee Code</div>
                                            <div className="font-mono font-bold text-foreground print:text-black">{employeeReport.employee.employee_code}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase text-muted-foreground print:text-black">Designation</div>
                                            <div className="font-bold text-foreground print:text-black">{employeeReport.employee.designation}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase text-muted-foreground print:text-black">Branch</div>
                                            <div className="font-bold text-foreground print:text-black">{employeeReport.employee.branch_name}</div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs print:text-[8.5pt]">
                                            <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                                <tr>
                                                    <th className="px-3 py-2.5">Work Type</th>
                                                    <th className="px-3 py-2.5">Source</th>
                                                    <th className="px-3 py-2.5 text-right">Submissions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border print:divide-black">
                                                {employeeReport.by_type.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} className="p-6 text-center text-muted-foreground">
                                                            No work in this date range.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    employeeReport.by_type.map((item) => (
                                                        <tr key={`${item.source}-${item.work_type}`}>
                                                            <td className="px-3 py-2 font-bold text-foreground">{item.work_type}</td>
                                                            <td className="px-3 py-2 text-foreground">{item.source}</td>
                                                            <td className="px-3 py-2 text-right font-bold text-foreground">{item.count}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs print:text-[8.5pt]">
                                            <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                                <tr>
                                                    <th className="px-3 py-2.5">#</th>
                                                    <th className="px-3 py-2.5">Date</th>
                                                    <th className="px-3 py-2.5">Work Type</th>
                                                    <th className="px-3 py-2.5">Location</th>
                                                    <th className="px-3 py-2.5">Quantity</th>
                                                    <th className="px-3 py-2.5 text-right">Fee</th>
                                                    <th className="px-3 py-2.5">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border print:divide-black">
                                                {employeeReport.submissions.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                            No submissions found for this employee in the selected date range.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    employeeReport.submissions.map((row, idx) => (
                                                        <tr key={`${row.date}-${row.source}-${idx}`} className="hover:bg-muted/15">
                                                            <td className="px-3 py-2 font-bold text-muted-foreground">{idx + 1}</td>
                                                            <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.date)}</td>
                                                            <td className="px-3 py-2">
                                                                <div className="font-bold text-foreground">{row.work_type}</div>
                                                                <div className="text-[10px] text-muted-foreground print:text-black">{row.source}</div>
                                                            </td>
                                                            <td className="px-3 py-2 text-foreground">{row.location}</td>
                                                            <td className="px-3 py-2 text-foreground">{row.quantity}</td>
                                                            <td className="px-3 py-2 text-right font-bold text-foreground">
                                                                {row.fee === null ? '—' : `৳${Number(row.fee).toFixed(2)}`}
                                                            </td>
                                                            <td className="px-3 py-2 max-w-xs text-foreground">{row.description}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'illness' && illnessReport && (
                        <div className="space-y-4 p-3 print:space-y-3 print:p-0">
                            <p className="text-[11px] text-muted-foreground print:text-black">
                                খানার সংখ্যা মানে যে খানায় এই অবস্থা পাওয়া গেছে। বন্ধনীর সংখ্যা মানে নিয়মিত ওষুধ খাচ্ছেন। ডায়াবেটিস পরীক্ষা, সাধারণ অসুস্থতা এবং স্ট্যাটিক ক্লিনিক জনসংখ্যা।
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs print:text-[8pt]">
                                    <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="px-2 py-2">Branch</th>
                                            {CHRONIC_COLUMNS.map((column) => (
                                                <th key={column.key} className="px-2 py-2 text-right">{column.label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border print:divide-black">
                                        {illnessReport.branches.length === 0 ? (
                                            <tr>
                                                <td colSpan={9} className="p-6 text-center text-muted-foreground">No household disease records in this range.</td>
                                            </tr>
                                        ) : (
                                            illnessReport.branches.map((branch) => (
                                                <tr key={`chronic-${branch.branch_id}`}>
                                                    <td className="px-2 py-2 font-bold text-foreground">{branch.branch_name}</td>
                                                    {CHRONIC_COLUMNS.map((column) => (
                                                        <td key={column.key} className="px-2 py-2 text-right text-foreground">
                                                            {branch[column.key]} ({branch[column.med]})
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs print:text-[8pt]">
                                    <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="px-2 py-2">Branch</th>
                                            <th className="px-2 py-2 text-right">গর্ভবতী</th>
                                            <th className="px-2 py-2 text-right">ANC</th>
                                            <th className="px-2 py-2 text-right">TT</th>
                                            <th className="px-2 py-2 text-right">প্রসব</th>
                                            <th className="px-2 py-2 text-right">PNC</th>
                                            <th className="px-2 py-2 text-right">স্টান্টিং</th>
                                            <th className="px-2 py-2 text-right">ওয়েস্টিং</th>
                                            <th className="px-2 py-2 text-right">আন্ডারওয়েট</th>
                                            <th className="px-2 py-2 text-right">প্রতিবন্ধী</th>
                                            <th className="px-2 py-2 text-right">সাধারণ অসুস্থ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border print:divide-black">
                                        {illnessReport.branches.map((branch) => (
                                            <tr key={`maternal-${branch.branch_id}`}>
                                                <td className="px-2 py-2 font-bold text-foreground">{branch.branch_name}</td>
                                                <td className="px-2 py-2 text-right">{branch.pregnant}</td>
                                                <td className="px-2 py-2 text-right">{branch.anc}</td>
                                                <td className="px-2 py-2 text-right">{branch.tt}</td>
                                                <td className="px-2 py-2 text-right">{branch.delivered}</td>
                                                <td className="px-2 py-2 text-right">{branch.pnc}</td>
                                                <td className="px-2 py-2 text-right">{branch.stunting}</td>
                                                <td className="px-2 py-2 text-right">{branch.wasting}</td>
                                                <td className="px-2 py-2 text-right">{branch.underweight}</td>
                                                <td className="px-2 py-2 text-right">{branch.disabled}</td>
                                                <td className="px-2 py-2 text-right">{branch.general_illness} ({branch.general_treated})</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs print:text-[8.5pt]">
                                    <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="px-3 py-2.5">Branch</th>
                                            <th className="px-3 py-2.5 text-right">ডায়াবেটিস পরীক্ষা</th>
                                            <th className="px-3 py-2.5 text-right">সদস্য</th>
                                            <th className="px-3 py-2.5 text-right">অ-সদস্য</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border print:divide-black">
                                        {illnessReport.branches.map((branch) => (
                                            <tr key={`diabetes-${branch.branch_id}`}>
                                                <td className="px-3 py-2 font-bold text-foreground">{branch.branch_name}</td>
                                                <td className="px-3 py-2 text-right font-bold">{branch.diabetes_tests}</td>
                                                <td className="px-3 py-2 text-right">{branch.diabetes_tests_member}</td>
                                                <td className="px-3 py-2 text-right">{branch.diabetes_tests_non_member}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs print:text-[8.5pt]">
                                    <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground print:bg-gray-100 print:text-black">
                                        <tr>
                                            <th className="px-3 py-2.5">স্ট্যাটিক ক্লিনিকের রোগ</th>
                                            <th className="px-3 py-2.5">Branch</th>
                                            <th className="px-3 py-2.5 text-right">রোগী</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border print:divide-black">
                                        {illnessReport.static_diseases.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-6 text-center text-muted-foreground">No static clinic disease names in this range.</td>
                                            </tr>
                                        ) : (
                                            illnessReport.static_diseases.map((item) => (
                                                <tr key={`${item.branch_name}-${item.disease}`}>
                                                    <td className="px-3 py-2 font-bold text-foreground">{item.disease}</td>
                                                    <td className="px-3 py-2 text-foreground">{item.branch_name}</td>
                                                    <td className="px-3 py-2 text-right font-bold">{item.patients}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* OFFICIAL WORD DOCUMENT / INSTITUTIONAL 4-COLUMN SIGNATURE FOOTER */}
                <div className="print-signature hidden grid-cols-4 gap-6 pt-16 text-center text-[9pt] border-t-2 border-black mt-12 text-black">
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
            </div>
        </>
    );
}
