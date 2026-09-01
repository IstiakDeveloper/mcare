import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FileImage,
    FileText,
    HeartPulse,
    Home,
    MapPin,
    Plus,
    Printer,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { DailyActivity } from '@/types/mcare';
import type { HouseholdEntry } from '@/components/household-repeater';

type Props = {
    activity: DailyActivity;
};

const fieldLabels: Record<string, string> = {
    village: 'গ্রামের নাম (Village Name)',
    samity_name: 'সমিতির নাম (Samity Name)',
    samity_code: 'সমিতির কোড (Samity Code)',
    samity_number: 'সমিতির নম্বর (Samity Number)',
    member_name: 'সদস্যের নাম (Member Name)',
    member_age: 'সদস্যের বয়স (Member Age)',
    member_gender: 'সদস্যের লিঙ্গ (Member Gender)',
    member_number: 'সদস্য নম্বর (Member Number)',
    patient_name: 'সেবা প্রাপ্ত ব্যক্তির নাম (Beneficiary Name)',
    patient_age: 'সেবা প্রাপ্ত ব্যক্তির বয়স (Beneficiary Age)',
    patient_gender: 'সেবা প্রাপ্ত ব্যক্তির লিঙ্গ (Beneficiary Gender)',
    patient_type: 'সেবা প্রাপ্ত ব্যক্তির ধরণ (Beneficiary Type)',
    services_provided: 'কি সেবা প্রদান করা হয়েছে (Services Provided)',
    attendees_count: 'উপস্থিতির সংখ্যা (Attendees Count)',
    topics_discussed: 'আলোচনার বিষয়বস্তু (Topics Discussed)',
    notes: 'মন্তব্য ও স্বাস্থ্য পরামর্শ (Comments / Advice)',
    topic: 'সেশনের বিষয়বস্তু (Topic)',
    key_messages: 'মূল বার্তা ও আলোচনা (Key Messages)',
    household_head: 'খানা প্রধানের নাম (Household Head)',
    members_visited: 'পরিদর্শনকৃত মোট সদস্য (Total Visited Members)',
    household_count: 'পরিদর্শনকৃত মোট খানা (Total Households)',
    findings: 'স্বাস্থ্য পর্যবেক্ষণ ও ফলাফল (Findings)',
    patients_served: 'সেবাগ্রহীতার সংখ্যা (Patients Served)',
    female_count: 'মহিলা সংখ্যা (Female Count)',
    male_count: 'পুরুষ সংখ্যা (পুরুষ সংখ্যা)',
    camp_name: 'ক্যাম্পের নাম (Camp Name)',
    location: 'স্থান (Location)',
};

export default function ActivityShow({ activity }: Props) {
    const rawData = (activity.form_data ?? {}) as Record<string, unknown>;
    const attachments = (Array.isArray(rawData.attachments)
        ? rawData.attachments
        : []) as string[];
    const patients = (Array.isArray(rawData.patients)
        ? rawData.patients
        : []) as Array<{
        id?: string;
        member_name?: string;
        member_number?: string;
        member_age?: string;
        member_gender?: string;
        patient_name?: string;
        patient_age?: string | number;
        patient_gender?: string;
        patient_type?: string;
        services_provided?: string;
        disease?: string;
        advice?: string;
        has_card?: boolean;
    }>;
    const households = (Array.isArray(rawData.households)
        ? rawData.households
        : []) as HouseholdEntry[];

    const entries = Object.entries(rawData).filter(
        ([k]) => !['attachments', 'patients', 'households', 'household_count'].includes(k),
    );
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const taskTitle =
        activity.task_subtype?.name ?? activity.task_type?.name ?? 'Daily Activity';

    return (
        <>
            <Head title={`${taskTitle} Report — M Care`} />

            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Back navigation & Actions */}
                <div className="flex items-center justify-between print:hidden">
                    <Link
                        href="/activities"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Activities Log
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="rounded-xl text-xs"
                        >
                            <Printer className="size-3.5 mr-1.5" />
                            Print Report
                        </Button>
                        <Button size="sm" asChild className="rounded-xl text-xs">
                            <Link href={dashboard()}>
                                <Plus className="size-3.5 mr-1" />
                                New Task
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Main Clinical Report Card */}
                <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xs space-y-6">
                    {/* Report Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-3.5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                                <HeartPulse className="size-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                    M Care Field Activity Report
                                </span>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {taskTitle}
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Category: {activity.task_type?.name ?? 'Field Work'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1">
                            <Badge
                                variant="secondary"
                                className="px-3 py-1 text-xs font-semibold self-start sm:self-auto"
                            >
                                <Calendar className="size-3 mr-1" />
                                {formatDate(activity.activity_date)}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="size-3 text-emerald-500" /> Verified Record
                            </span>
                        </div>
                    </div>

                    {/* Metadata Grid (Officer, Branch, Samity) */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border bg-muted/20 p-4">
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <User className="size-3" /> Submitted By
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {activity.user?.name ?? 'Health Officer'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {activity.user?.email}
                            </p>
                        </div>

                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Building2 className="size-3" /> Assigned Branch
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {activity.branch?.name ?? 'Branch'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                HRM Ref ID: {activity.branch?.id ?? '—'}
                            </p>
                        </div>

                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <MapPin className="size-3" /> Samity Location
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {activity.samity?.name ?? 'Non-samity Activity'}
                            </p>
                            {activity.samity?.code ? (
                                <p className="text-[11px] text-muted-foreground">
                                    Code: {activity.samity.code}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    {/* Form Data Key-Value Fields */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                            <FileText className="size-4 text-primary" />
                            Report Findings & Field Data
                        </h2>

                        {entries.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                                No additional parameters recorded.
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {entries.map(([key, value]) => (
                                    <div
                                        key={key}
                                        className={`rounded-xl border border-border/70 bg-card p-4 shadow-2xs space-y-1 ${
                                            key === 'topics_discussed' || key === 'notes' || key === 'services_provided' || key === 'findings'
                                                ? 'sm:col-span-2'
                                                : ''
                                        }`}
                                    >
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {fieldLabels[key] || key.replaceAll('_', ' ')}
                                        </p>
                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                                            {value === null || value === ''
                                                ? '—'
                                                : String(value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Patients / Beneficiaries Table (If Satellite Clinic / Static Clinic / Multi-Patient) */}
                    {patients.length > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Users className="size-4 text-teal-600 dark:text-teal-400" />
                                    সেবা প্রাপ্ত সদস্যদের তালিকা (Beneficiaries List)
                                </h2>
                                <Badge variant="secondary" className="text-xs font-semibold">
                                    {patients.length} জন সেবাগ্রহীতা
                                </Badge>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-2xs">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground">
                                        {patients.some((p) => p.disease !== undefined) ? (
                                            <tr>
                                                <th className="px-3.5 py-3">#</th>
                                                <th className="px-3.5 py-3">রোগীর নাম</th>
                                                <th className="px-3.5 py-3">বয়স ও লিঙ্গ</th>
                                                <th className="px-3.5 py-3">স্বাস্থ্য কার্ড</th>
                                                <th className="px-3.5 py-3">রোগের বিবরণ</th>
                                                <th className="px-3.5 py-3">পরামর্শ ও চিকিৎসা সেবা</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th className="px-3.5 py-3">#</th>
                                                <th className="px-3.5 py-3">সদস্যের নাম ও নম্বর</th>
                                                <th className="px-3.5 py-3">সেবাগ্রহীতা ও বয়স</th>
                                                <th className="px-3.5 py-3">ধরণ ও লিঙ্গ</th>
                                                <th className="px-3.5 py-3">প্রদত্ত সেবাসমূহ</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {patients.map((p, idx) => {
                                            const isStaticPatient = p.disease !== undefined;

                                            if (isStaticPatient) {
                                                return (
                                                    <tr key={p.id || idx} className="hover:bg-muted/15 transition-colors">
                                                        <td className="px-3.5 py-3 font-bold text-muted-foreground">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-3.5 py-3 font-bold text-foreground">
                                                            {p.patient_name || '—'}
                                                        </td>
                                                        <td className="px-3.5 py-3">
                                                            <p className="font-semibold text-foreground">
                                                                {p.patient_age ? `${p.patient_age} বছর` : '—'}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                {p.patient_gender || 'নারী'}
                                                            </p>
                                                        </td>
                                                        <td className="px-3.5 py-3">
                                                            <Badge
                                                                variant="secondary"
                                                                className={`text-[10px] px-2 py-0 ${
                                                                    p.has_card
                                                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                                                }`}
                                                            >
                                                                {p.has_card ? '✓ কার্ড আছে' : '✗ কার্ড নেই'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3.5 py-3 font-medium text-foreground">
                                                            {p.disease || '—'}
                                                        </td>
                                                        <td className="px-3.5 py-3 max-w-sm text-foreground whitespace-pre-wrap leading-relaxed text-[11px]">
                                                            {p.advice || p.services_provided || '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return (
                                                <tr key={p.id || idx} className="hover:bg-muted/15 transition-colors">
                                                    <td className="px-3.5 py-3 font-bold text-muted-foreground">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-3.5 py-3">
                                                        <p className="font-bold text-foreground">
                                                            {p.member_name || '—'}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {p.member_number ? `আইডি: ${p.member_number}` : ''}
                                                            {p.member_age ? ` • ${p.member_age} বছর` : ''}
                                                            {p.member_gender ? ` • ${p.member_gender}` : ''}
                                                        </p>
                                                    </td>
                                                    <td className="px-3.5 py-3">
                                                        <p className="font-medium text-foreground">
                                                            {p.patient_name || '—'}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                                            বয়স: {p.patient_age || '—'}
                                                        </p>
                                                    </td>
                                                    <td className="px-3.5 py-3">
                                                        <Badge variant="outline" className="text-[10px] font-medium py-0 h-5">
                                                            {p.patient_type || 'সদস্য নিজে'}
                                                        </Badge>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                                            {p.patient_gender}
                                                        </p>
                                                    </td>
                                                    <td className="px-3.5 py-3 max-w-sm">
                                                        <p className="text-foreground whitespace-pre-wrap leading-relaxed text-[11px]">
                                                            {p.services_provided || '—'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}

                    {/* Households Section (If Household Visit / Multi-Household) */}
                    {households.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Home className="size-4 text-blue-600 dark:text-blue-400" />
                                    পরিদর্শনকৃত খানার বিস্তারিত তথ্য (Households List)
                                </h2>
                                <Badge className="bg-blue-600 text-white text-xs font-semibold">
                                    {households.length}টি খানা পরিদর্শন
                                </Badge>
                            </div>

                            <div className="space-y-3.5">
                                {households.map((h, idx) => {
                                    const activeDiseases = Object.entries(h.elderly_diseases || {}).filter(
                                        ([_, s]) => s.affected,
                                    );

                                    return (
                                        <div
                                            key={h.id || idx}
                                            className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3"
                                        >
                                            {/* Household Card Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                                                        {idx + 1}
                                                    </span>
                                                    <h3 className="text-base font-bold text-foreground">
                                                        {h.household_head}
                                                    </h3>
                                                </div>
                                                <Badge variant="outline" className="text-xs font-semibold self-start sm:self-auto">
                                                    পরিবারের সদস্য: {h.member_count} জন
                                                </Badge>
                                            </div>

                                            {/* Grid of Household Sections */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                {/* Maternal Health (Pregnant & Delivery) */}
                                                <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                                                    <p className="font-bold text-foreground flex items-center gap-1.5 text-xs text-pink-700 dark:text-pink-300">
                                                        <span>🤰</span> মাতৃত্বকালীন স্বাস্থ্য
                                                    </p>
                                                    {h.has_pregnant ? (
                                                        <div className="space-y-1 pl-1 border-l-2 border-pink-500 text-[11px]">
                                                            <p><strong>গর্ভবতী:</strong> হ্যাঁ (সময়কাল: {h.pregnancy_duration || '—'})</p>
                                                            <p><strong>ANC সেবা:</strong> {h.has_anc ? '✓ প্রাপ্ত' : '✗ নেওয়া হয়নি'}</p>
                                                            <p><strong>টিটেনাস (TT) টিকা:</strong> {h.has_tt ? '✓ প্রাপ্ত' : '✗ নেওয়া হয়নি'}</p>
                                                            {h.pregnant_advice ? <p className="text-muted-foreground"><strong>পরামর্শ:</strong> {h.pregnant_advice}</p> : null}
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground text-[11px]">গর্ভবতী মা নেই</p>
                                                    )}

                                                    {h.has_delivered ? (
                                                        <div className="space-y-1 pl-1 border-l-2 border-purple-500 text-[11px] pt-1.5">
                                                            <p><strong>প্রসববর্তী নারী:</strong> হ্যাঁ</p>
                                                            <p><strong>প্রসবের স্থান:</strong> {h.delivery_place || '—'}</p>
                                                            <p><strong>PNC সেবা:</strong> {h.has_pnc ? '✓ প্রাপ্ত' : '✗ নেওয়া হয়নি'}</p>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* Child & Disability */}
                                                <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
                                                    <p className="font-bold text-foreground flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300">
                                                        <span>👶</span> শিশু পুষ্টি ও প্রতিবন্ধিতা
                                                    </p>
                                                    {h.has_child ? (
                                                        <div className="space-y-1 pl-1 border-l-2 border-sky-500 text-[11px]">
                                                            <p><strong>শিশু আছে:</strong> হ্যাঁ</p>
                                                            <p><strong>Stunting (খর্বকায়):</strong> {h.is_stunting ? '⚠ হ্যাঁ' : 'স্বাভাবিক'}</p>
                                                            <p><strong>Wasting (কৃশকায়):</strong> {h.is_wasting ? '⚠ হ্যাঁ' : 'স্বাভাবিক'}</p>
                                                            <p><strong>Under Weight:</strong> {h.is_underweight ? '⚠ হ্যাঁ' : 'স্বাভাবিক'}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground text-[11px]">৫ বছরের কম বয়সী শিশু নেই</p>
                                                    )}

                                                    {h.has_disabled ? (
                                                        <div className="space-y-1 pl-1 border-l-2 border-amber-500 text-[11px] pt-1.5">
                                                            <p><strong>প্রতিবন্ধী ব্যক্তি:</strong> হ্যাঁ ({h.disabled_gender})</p>
                                                        </div>
                                                    ) : null}
                                                </div>

                                                {/* Elderly & Chronic Diseases */}
                                                <div className="rounded-xl border bg-muted/20 p-3 space-y-2 md:col-span-2">
                                                    <p className="font-bold text-foreground flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                                                        <span>👴</span> প্রবীণ ব্যক্তি ও দীর্ঘমেয়াদী স্বাস্থ্য সমস্যা
                                                    </p>
                                                    {h.has_elderly ? (
                                                        <div className="space-y-1.5">
                                                            <p className="text-[11px]"><strong>প্রবীণ ব্যক্তি আছেন:</strong> হ্যাঁ</p>
                                                            {activeDiseases.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                    {activeDiseases.map(([k, s]) => (
                                                                        <Badge
                                                                            key={k}
                                                                            variant="secondary"
                                                                            className="text-[11px] px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30"
                                                                        >
                                                                            {k.replace('_', ' ')}: {s.taking_medication ? '✓ নিয়মিত ওষুধ খান' : '✗ ওষুধ খান না'}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-emerald-600 dark:text-emerald-400 text-[11px]">কোনো জটিল বা ক্রনিক রোগ নেই (সুস্থ)</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-muted-foreground text-[11px]">প্রবীণ ব্যক্তি নেই</p>
                                                    )}
                                                </div>

                                                {/* General Illness in Last 1 Month */}
                                                {Number(h.general_illness_count) > 0 ? (
                                                    <div className="rounded-xl border bg-indigo-500/10 border-indigo-500/30 p-3 space-y-1 md:col-span-2 text-[11px]">
                                                        <p className="font-bold text-indigo-800 dark:text-indigo-300">
                                                            🩺 গত ১ মাসে সাধারণ রোগে আক্রান্ত: {h.general_illness_count} জন
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            চিকিৎসা গ্রহণের অবস্থা: <strong>{h.took_treatment ? '✓ চিকিৎসা গ্রহণ করেছেন' : '✗ চিকিৎসা গ্রহণ করেননি'}</strong>
                                                        </p>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    {attachments.length > 0 ? (
                        <div className="space-y-3 border-t pt-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <FileImage className="size-4 text-primary" />
                                    সংযুক্ত ছবিসমূহ (Attached Field Photos)
                                </h2>
                                <Badge variant="secondary" className="text-xs">
                                    {attachments.length} Photos (WebP)
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {attachments.map((url, idx) => (
                                    <div
                                        key={url}
                                        onClick={() => setSelectedPhoto(url)}
                                        className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-card shadow-2xs cursor-pointer hover:shadow-md transition-all"
                                    >
                                        <img
                                            src={url}
                                            alt={`Field photo ${idx + 1}`}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Eye className="size-6 drop-shadow-md" />
                                        </div>
                                        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                                            Photo #{idx + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Lightbox Modal */}
                    <Dialog
                        open={Boolean(selectedPhoto)}
                        onOpenChange={(open) => !open && setSelectedPhoto(null)}
                    >
                        <DialogContent className="max-w-3xl p-2 rounded-2xl border bg-black/95 text-white">
                            <DialogHeader className="p-2 flex flex-row items-center justify-between border-b border-white/10">
                                <DialogTitle className="text-sm font-semibold text-white">
                                    Field Activity Photo Preview
                                </DialogTitle>
                                <DialogDescription className="hidden">
                                    Full size attachment preview
                                </DialogDescription>
                            </DialogHeader>

                            {selectedPhoto ? (
                                <div className="flex items-center justify-center p-2 max-h-[75vh]">
                                    <img
                                        src={selectedPhoto}
                                        alt="Enlarged preview"
                                        className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                                    />
                                </div>
                            ) : null}
                        </DialogContent>
                    </Dialog>

                    {/* Report Footer / Signature Area */}
                    <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-start sm:items-end text-xs text-muted-foreground gap-4">
                        <div>
                            <p className="font-semibold text-foreground">M Care Health Information System</p>
                            <p className="text-[11px]">Synced with Organization HRM Health Module</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[11px]">Report Generated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ActivityShow.layout = {
    breadcrumbs: [
        { title: "Today's Task", href: dashboard() },
        { title: 'Activities', href: '/activities' },
        { title: 'Activity Report', href: '/activities' },
    ],
};
