import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ArrowRight,
    Award,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    Clock,
    Coins,
    CreditCard,
    Eye,
    FileText,
    Flame,
    HeartPulse,
    Home,
    Layers,
    MapPin,
    Plus,
    Receipt,
    Search,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Tent,
    TrendingUp,
    User,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    DynamicFormFields,
    emptyFormValues,
} from '@/components/dynamic-form-fields';
import { PhotoAttachmentField } from '@/components/photo-attachment-field';
import {
    PatientEntry,
    SatellitePatientRepeater,
} from '@/components/satellite-patient-repeater';
import { AdminDashboardView } from '@/components/admin-dashboard-view';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';
import type {
    BranchOption,
    DailyActivity,
    DashboardProps,
    FormSchema,
    SamityOption,
    TaskSubtype,
    TaskType,
} from '@/types/mcare';

const taskIcons: Record<string, typeof Users> = {
    'samity-task': Users,
    'uthan-boithok': Users,
    'satellite-clinic': Stethoscope,
    'awareness-session': Sparkles,
    'household-visit': Home,
    'static-clinic': Activity,
    'health-camp': Tent,
};

export default function Dashboard({
    taskTypes,
    todayActivities,
    recentActivities,
    todayCampCount,
    totalBeneficiariesToday = 0,
    today,
    samities = [],
    branches = [],
    selectedBranchId = null,
    formSchemas = {},
    adminOverview = null,
}: DashboardProps) {
    const { auth, flash } = usePage<{
        auth: Auth;
        flash?: { status?: string; toast?: { message: string } };
    }>().props;
    const user = auth.user;

    // Single-Screen Quick Form State
    const [quickModalOpen, setQuickModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState<'select_samity_subtask' | 'fill_form'>(
        'fill_form',
    );
    const [selectedTaskType, setSelectedTaskType] = useState<TaskType | null>(
        null,
    );
    const [selectedSubtype, setSelectedSubtype] = useState<TaskSubtype | null>(
        null,
    );
    const [isCampMode, setIsCampMode] = useState(false);

    // Quick Activity Detail Preview State
    const [previewActivity, setPreviewActivity] =
        useState<DailyActivity | null>(null);

    // Filter & Search State for submissions
    const [activeTab, setActiveTab] = useState<'today' | 'recent'>('today');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeHouseholdSession, setActiveHouseholdSession] = useState<{
        village: string;
        samity_name: string;
        householdsCount: number;
        opened_at: string;
    } | null>(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('mcare_active_household_session');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.is_active) {
                    setActiveHouseholdSession({
                        village: parsed.village || '',
                        samity_name: parsed.samity_name || '',
                        householdsCount: Array.isArray(parsed.households)
                            ? parsed.households.length
                            : 0,
                        opened_at: parsed.opened_at || '',
                    });
                }
            }
        } catch {
            // ignore
        }
    }, []);

    const isDayCompleted = todayActivities.length > 0;

    // Find specific task objects from taskTypes array
    const samityTaskType = taskTypes.find((t) => t.slug === 'samity-task');
    const householdTaskType = taskTypes.find((t) => t.slug === 'household-visit');
    const staticClinicTaskType = taskTypes.find((t) => t.slug === 'static-clinic');

    // Active schema for current modal
    const currentSchemaKey = isCampMode
        ? 'health-camp'
        : selectedSubtype?.slug || selectedTaskType?.slug || 'household-visit';

    const activeSchema: FormSchema = formSchemas[currentSchemaKey] || {
        title:
            selectedSubtype?.name ||
            selectedTaskType?.name ||
            (isCampMode ? 'Health Camp' : 'Daily Activity'),
        requires_samity: !isCampMode && selectedTaskType?.slug !== 'static-clinic',
        fields: [
            {
                name: 'notes',
                label: 'Notes / Remarks',
                type: 'textarea',
                required: true,
            },
        ],
    };

    // Inertia form for Single-Screen Task Submission
    const taskForm = useForm({
        task_type_id: selectedTaskType?.id ?? '',
        task_subtype_id: selectedSubtype?.id ?? '',
        activity_date: today,
        branch_id: selectedBranchId ? String(selectedBranchId) : '',
        samity_id: '',
        stay_on_dashboard: true,
        form_data: {} as Record<string, string>,
    });

    // Inertia form for Single-Screen Health Camp Submission
    const campForm = useForm({
        activity_date: today,
        branch_id: selectedBranchId ? String(selectedBranchId) : '',
        stay_on_dashboard: true,
        service_data: {} as Record<string, string>,
    });

    // Handler 1: User clicks on Samity Task
    const handleSelectSamityTask = () => {
        if (!samityTaskType) return;
        setIsCampMode(false);
        setSelectedTaskType(samityTaskType);
        setSelectedSubtype(null);
        setModalStep('select_samity_subtask');
        setQuickModalOpen(true);
    };

    // Handler 1.1: User picks one of the 3 Samity Sub-tasks
    const handleChooseSamitySubtask = (subtype: TaskSubtype) => {
        if (!samityTaskType) return;
        setSelectedSubtype(subtype);
        setModalStep('fill_form');

        const schema = formSchemas[subtype.slug] || {
            title: subtype.name,
            requires_samity: true,
            fields: [],
        };

        taskForm.setData({
            task_type_id: samityTaskType.id,
            task_subtype_id: subtype.id,
            activity_date: today,
            branch_id: selectedBranchId ? String(selectedBranchId) : '',
            samity_id: '',
            stay_on_dashboard: true,
            form_data: emptyFormValues(schema),
        });
    };

    // Handler 2: User clicks Household Visit -> Direct dedicated full-page session
    const handleSelectHouseholdVisit = () => {
        router.visit('/tasks/household-visit');
    };

    // Handler 3: User clicks Static Clinic
    const handleSelectStaticClinic = () => {
        if (!staticClinicTaskType) return;
        setIsCampMode(false);
        setSelectedTaskType(staticClinicTaskType);
        setSelectedSubtype(null);
        setModalStep('fill_form');

        const schema = formSchemas[staticClinicTaskType.slug] || {
            title: staticClinicTaskType.name,
            requires_samity: false,
            fields: [],
        };

        taskForm.setData({
            task_type_id: staticClinicTaskType.id,
            task_subtype_id: '',
            activity_date: today,
            branch_id: selectedBranchId ? String(selectedBranchId) : '',
            samity_id: '',
            stay_on_dashboard: true,
            form_data: emptyFormValues(schema),
        });

        setQuickModalOpen(true);
    };

    // Handler 4: Health Camp (Common Branch module)
    const handleSelectHealthCamp = () => {
        setIsCampMode(true);
        setSelectedTaskType(null);
        setSelectedSubtype(null);
        setModalStep('fill_form');

        const schema = formSchemas['health-camp'] || {
            title: 'Health Camp',
            requires_samity: false,
            fields: [],
        };

        campForm.setData({
            activity_date: today,
            branch_id: selectedBranchId ? String(selectedBranchId) : '',
            stay_on_dashboard: true,
            service_data: emptyFormValues(schema),
        });

        setQuickModalOpen(true);
    };

    const handleTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        taskForm.post('/activities', {
            preserveScroll: true,
            onSuccess: () => {
                setQuickModalOpen(false);
                taskForm.reset();
            },
        });
    };

    const handleCampSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        campForm.post('/health-camps', {
            preserveScroll: true,
            onSuccess: () => {
                setQuickModalOpen(false);
                campForm.reset();
            },
        });
    };

    // Filter displayed activities
    const currentList =
        activeTab === 'today' ? todayActivities : recentActivities;

    const filteredActivities = currentList.filter((act) => {
        if (filterCategory !== 'all') {
            if (filterCategory === 'samity' && act.task_type?.slug !== 'samity-task') return false;
            if (filterCategory === 'household' && act.task_type?.slug !== 'household-visit') return false;
            if (filterCategory === 'static' && act.task_type?.slug !== 'static-clinic') return false;
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const name = (
                act.task_subtype?.name ||
                act.task_type?.name ||
                ''
            ).toLowerCase();
            const samityName = (act.samity?.name || '').toLowerCase();
            const officer = (act.user?.name || '').toLowerCase();
            return (
                name.includes(query) ||
                samityName.includes(query) ||
                officer.includes(query)
            );
        }
        return true;
    });

    return (
        <>
            <Head title="Today's Hub — M Care Health System" />

            <div className="flex flex-1 flex-col gap-5 md:gap-6 p-3.5 sm:p-5 md:p-7 max-w-7xl mx-auto w-full pb-24 md:pb-8">
                {/* Status Flash Notification */}
                {flash?.status || flash?.toast?.message ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 sm:p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{flash.status || flash.toast?.message}</span>
                    </div>
                ) : null}

                {user?.role === 'admin' && adminOverview ? (
                    <AdminDashboardView
                        adminOverview={adminOverview}
                        today={today}
                        branches={branches}
                    />
                ) : (
                    <>
                        {/* Compact Executive Header */}
                        <div className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-4 md:p-5 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm sm:text-base shrink-0">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                            <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground truncate">
                                                {user?.name || 'Health Officer'}
                                            </h1>
                                            <Badge variant="secondary" className="text-[10px] h-5 py-0 rounded-full shrink-0">
                                                {user?.role_name || user?.designation || 'Health Department'}
                                            </Badge>
                                            {user?.branch?.name ? (
                                                <Badge variant="outline" className="text-[10px] h-5 py-0 rounded-full flex items-center gap-1 shrink-0">
                                                    <Building2 className="size-3" />
                                                    {user.branch.name}
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {new Date(today + 'T00:00:00').toLocaleDateString('bn-BD', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Top Action Buttons (Analytics / Health Card / Fee Collection) */}
                                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="rounded-xl text-xs font-semibold h-8 shadow-2xs border-primary/30 text-primary hover:bg-primary/10"
                                    >
                                        <Link href="/health-cards">
                                            <CreditCard className="size-3.5 mr-1" />
                                            হেলথ কার্ড বিতরণ
                                        </Link>
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="rounded-xl text-xs font-semibold h-8 shadow-2xs border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10"
                                    >
                                        <Link href="/fee-collections">
                                            <Receipt className="size-3.5 mr-1 text-rose-600 dark:text-rose-400" />
                                            Fee Collection
                                        </Link>
                                    </Button>

                                    {user?.can_view_analytics || user?.role === 'admin' || user?.role === 'branch-manager' ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="rounded-xl text-xs font-semibold h-8 shadow-2xs border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10"
                                        >
                                            <Link href="/reports">
                                                <TrendingUp className="size-3.5 mr-1" />
                                                Reports & Analytics
                                            </Link>
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                {/* Active Household Session Alert Banner */}
                {activeHouseholdSession ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-card p-4 text-xs font-semibold text-foreground shadow-xs animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                                <Home className="size-5" />
                            </span>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
                                    <p className="font-bold text-sm text-foreground">
                                        খানা পরিদর্শন সেশন চালু রয়েছে (Active Session)
                                    </p>
                                    <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0">
                                        {activeHouseholdSession.householdsCount}টি খানা সংরক্ষিত
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    গ্রাম: <strong>{activeHouseholdSession.village || 'নির্ধারিত এলাকা'}</strong> • সমিতি: <strong>{activeHouseholdSession.samity_name || 'সমিতি'}</strong>
                                </p>
                            </div>
                        </div>

                        <Button
                            asChild
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 shadow-xs shrink-0"
                        >
                            <Link href="/tasks/household-visit">
                                সেশনে ফিরে যান (Resume Session) →
                            </Link>
                        </Button>
                    </div>
                ) : null}

                {/* Core Task & Action Quick Cards (Desktop & Tablet) */}
                <div className="hidden md:block space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            দৈনিক ফিল্ড কার্যক্রম ও সেবা এন্ট্রি (Quick Actions)
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs font-semibold h-8 border-primary/40 text-primary hover:bg-primary/10"
                            >
                                <Link href="/health-cards">
                                    <CreditCard className="size-3.5 mr-1" />
                                    + হেলথ কার্ড বিতরণ
                                </Link>
                            </Button>
                            <Button
                                onClick={handleSelectHealthCamp}
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs font-semibold h-8 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                            >
                                <Tent className="size-3.5 mr-1" />
                                + হেলথ ক্যাম্প (Health Camp)
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                        {/* Task 1: Samity Task */}
                        <button
                            type="button"
                            onClick={handleSelectSamityTask}
                            className="group flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-card p-3.5 sm:p-4 text-left shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs shrink-0">
                                    <Users className="size-5 sm:size-5.5" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition-colors truncate">
                                        সমিতি কার্যক্রম
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                        উঠান বৈঠক • স্যাটেলাইট • সচেতনতা
                                    </p>
                                </div>
                            </div>
                            <span className="flex size-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0 ml-2">
                                <Plus className="size-4" />
                            </span>
                        </button>

                        {/* Task 2: Household Visit (Direct Link) */}
                        <Link
                            href="/tasks/household-visit"
                            className="group flex items-center justify-between rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-card p-3.5 sm:p-4 text-left shadow-2xs hover:border-blue-500 hover:shadow-xs transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs shrink-0">
                                    <Home className="size-5 sm:size-5.5" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                                        বাড়ি পরিদর্শন
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                        খানা প্রধান ও পরিবার পরিদর্শন
                                    </p>
                                </div>
                            </div>
                            <span className="flex size-7 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 ml-2">
                                <Plus className="size-4" />
                            </span>
                        </Link>

                        {/* Task 3: Static Clinic (Direct Link) */}
                        <Link
                            href="/tasks/static-clinic"
                            className="group flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-card p-3.5 sm:p-4 text-left shadow-2xs hover:border-indigo-500 hover:shadow-xs transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs shrink-0">
                                    <Activity className="size-5 sm:size-5.5" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-600 transition-colors truncate">
                                        স্ট্যাটিক ক্লিনিক
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                        শাখাভিত্তিক রোগী সেবা ও চিকিৎসা
                                    </p>
                                </div>
                            </div>
                            <span className="flex size-7 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 ml-2">
                                <Plus className="size-4" />
                            </span>
                        </Link>

                        {/* Task 4: Fee & Diabetes Collection (Direct Link) */}
                        <Link
                            href="/fee-collections"
                            className="group flex items-center justify-between rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-card p-3.5 sm:p-4 text-left shadow-2xs hover:border-rose-500 hover:shadow-xs transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="flex size-10 sm:size-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xs shrink-0">
                                    <Receipt className="size-5 sm:size-5.5" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-foreground group-hover:text-rose-600 transition-colors truncate">
                                        ফি কালেকশন
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                        সদস্য/অ-সদস্য ফি ও ডায়াবেটিস
                                    </p>
                                </div>
                            </div>
                            <span className="flex size-7 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shrink-0 ml-2">
                                <Plus className="size-4" />
                            </span>
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Summary Bar */}
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 md:gap-4">
                    <StatCard
                        label="আজকের এন্ট্রি"
                        value={todayActivities.length}
                        subtitle={isDayCompleted ? 'কোটা সম্পন্ন' : '১টি সেশন বাকি'}
                        icon={ClipboardCheck}
                        color="text-emerald-600 dark:text-emerald-400"
                        bg="bg-emerald-500/10"
                    />
                    <StatCard
                        label="আজকের সেবাগ্রহীতা"
                        value={totalBeneficiariesToday}
                        subtitle="মোট সেবা প্রাপ্ত ব্যক্তি"
                        icon={HeartPulse}
                        color="text-teal-600 dark:text-teal-400"
                        bg="bg-teal-500/10"
                    />
                    <StatCard
                        label="আজকের হেলথ ক্যাম্প"
                        value={todayCampCount}
                        subtitle="ক্যাম্প সংখ্যা"
                        icon={Tent}
                        color="text-amber-600 dark:text-amber-400"
                        bg="bg-amber-500/10"
                    />
                    <StatCard
                        label="পূর্ববর্তী রেকর্ড"
                        value={recentActivities.length}
                        subtitle="সাম্প্রতিক দাখিলকৃত লগ"
                        icon={ClipboardList}
                        color="text-blue-600 dark:text-blue-400"
                        bg="bg-blue-500/10"
                    />
                </div>

                {/* Submissions Feed & Branch Camp Section */}
                <section className="grid gap-6 lg:grid-cols-3">
                    {/* Left 2 Cols: Activity Stream */}
                    <Card className="lg:col-span-2 rounded-3xl shadow-xs border-border/80">
                        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Activity className="size-5 text-emerald-600" />
                                    Activity Stream & Reports Log
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    All field entries and health activity submissions from your account
                                </CardDescription>
                            </div>

                            {/* Tabs Switcher */}
                            <div className="w-full sm:w-auto flex rounded-xl border bg-muted/40 p-1 text-xs justify-center">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('today')}
                                    className={`flex-1 sm:flex-initial text-center rounded-lg px-3 py-1.5 font-medium transition-all ${
                                        activeTab === 'today'
                                            ? 'bg-background text-foreground shadow-xs font-bold text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    আজকের লগ ({todayActivities.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('recent')}
                                    className={`flex-1 sm:flex-initial text-center rounded-lg px-3 py-1.5 font-medium transition-all ${
                                        activeTab === 'recent'
                                            ? 'bg-background text-foreground shadow-xs font-bold text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    পূর্বের রেকর্ড ({recentActivities.length})
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Search & Filter Bar */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="কার্যক্রমের নাম, সমিতি বা কর্মকর্তা দিয়ে খুঁজুন..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="h-9 pl-9 text-xs rounded-xl bg-background"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                                    {[
                                        { key: 'all', label: 'সকল' },
                                        { key: 'samity', label: 'সমিতি' },
                                        { key: 'household', label: 'বাড়ি পরিদর্শন' },
                                        { key: 'static', label: 'স্ট্যাটিক ক্লিনিক' },
                                    ].map((cat) => (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            onClick={() =>
                                                setFilterCategory(cat.key)
                                            }
                                            className={`rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                                                filterCategory === cat.key
                                                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                                                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submissions List */}
                            {filteredActivities.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                        <ClipboardList className="size-6 text-muted-foreground" />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-foreground">
                                        No submissions recorded yet for today
                                    </p>
                                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                                        Select 1 of the 3 primary options above to log your completed work.
                                    </p>
                                    <Button
                                        size="sm"
                                        className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                        onClick={handleSelectSamityTask}
                                    >
                                        <Plus className="size-4 mr-1" />
                                        Log Samity Task
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {filteredActivities.map((activity) => {
                                        const slug =
                                            activity.task_subtype?.slug ||
                                            activity.task_type?.slug ||
                                            '';
                                        const Icon =
                                            taskIcons[slug] ?? HeartPulse;
                                        const beneficiaries =
                                            activity.form_data?.attendees_count ??
                                            activity.form_data?.patients_served ??
                                            activity.form_data?.members_visited;

                                        return (
                                            <div
                                                key={activity.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 p-3 sm:p-3.5 transition-all hover:bg-accent/40 hover:border-emerald-500/40"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <Icon className="size-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-bold text-foreground truncate">
                                                                {activity
                                                                    .task_subtype
                                                                    ?.name ??
                                                                    activity
                                                                        .task_type
                                                                        ?.name}
                                                            </p>
                                                            {beneficiaries ? (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shrink-0"
                                                                >
                                                                    {beneficiaries} জন সেবাগ্রহীতা
                                                                </Badge>
                                                            ) : null}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                                                            <MapPin className="size-3 shrink-0 text-emerald-600" />
                                                            <span className="truncate">
                                                                {activity.samity
                                                                    ?.name ??
                                                                    activity.branch
                                                                        ?.name ??
                                                                    'শাখা পর্যায়'}
                                                            </span>
                                                            <span>•</span>
                                                            <Clock className="size-3 shrink-0" />
                                                            <span>{formatDate(activity.activity_date)}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2.5 text-xs rounded-xl"
                                                        onClick={() =>
                                                            setPreviewActivity(
                                                                activity,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="size-3.5 mr-1" />
                                                        দেখুন
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2.5 text-xs rounded-xl font-semibold"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/activities/${activity.id}`}
                                                        >
                                                            রিপোর্ট
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t">
                                <span>
                                    Displaying {filteredActivities.length} logs
                                </span>
                                <Link
                                    href="/activities"
                                    className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                    View Full Archive{' '}
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right 1 Col: Branch Health Camp Module */}
                    <div className="space-y-6">
                        {/* Common Branch Health Camp */}
                        <Card className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-xs">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                                        <Tent className="size-6" />
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold"
                                    >
                                        Branch Module
                                    </Badge>
                                </div>
                                <CardTitle className="text-base font-bold mt-2 text-foreground">
                                    Health Camp Services
                                </CardTitle>
                                <CardDescription className="text-xs leading-relaxed">
                                    Branch-level outreach camps and special medical drives conducted by the branch.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="rounded-2xl border bg-background/80 p-3.5 text-xs space-y-1">
                                    <div className="flex justify-between font-medium">
                                        <span className="text-muted-foreground">
                                            Camps Logged Today:
                                        </span>
                                        <span className="font-bold text-foreground">
                                            {todayCampCount}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Any signed-in officer at the branch can log camp records.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 pt-1">
                                    <Button
                                        onClick={handleSelectHealthCamp}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs h-10 font-bold shadow-xs"
                                    >
                                        <Plus className="size-4 mr-1.5" />
                                        Record Health Camp
                                    </Button>
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="w-full rounded-2xl text-xs h-9 font-semibold"
                                    >
                                        <Link href="/health-camps">
                                            Browse Health Camps
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </>
        )}
    </div>

            {/* SINGLE SCREEN QUICK TASK ENTRY MODAL */}
            <Dialog open={quickModalOpen} onOpenChange={setQuickModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
                    {/* STEP 1: SAMITY SUB-TASK SELECTION */}
                    {!isCampMode &&
                    selectedTaskType?.slug === 'samity-task' &&
                    modalStep === 'select_samity_subtask' ? (
                        <div className="space-y-4">
                            <DialogHeader className="text-left space-y-1">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                                        <Users className="size-5" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold text-foreground">
                                            Samity Task — Select Sub-activity
                                        </DialogTitle>
                                        <DialogDescription className="text-xs">
                                            Select which activity was conducted at the samity today
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="grid gap-3 pt-2">
                                {(samityTaskType?.subtypes ?? []).map((sub) => {
                                    const isUthan = sub.slug === 'uthan-boithok';
                                    const isSatellite = sub.slug === 'satellite-clinic';

                                    const Icon = isUthan
                                        ? Users
                                        : isSatellite
                                          ? Stethoscope
                                          : Sparkles;

                                    const colorTheme = isUthan
                                        ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                        : isSatellite
                                          ? 'border-teal-500/40 bg-teal-500/5 hover:border-teal-500 text-teal-700 dark:text-teal-300'
                                          : 'border-cyan-500/40 bg-cyan-500/5 hover:border-cyan-500 text-cyan-700 dark:text-cyan-300';

                                    return (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() =>
                                                handleChooseSamitySubtask(sub)
                                            }
                                            className={`flex items-center justify-between rounded-2xl border-2 p-4 text-left shadow-2xs transition-all hover:shadow-md active:scale-[0.99] ${colorTheme}`}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                                                    <Icon className="size-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground">
                                                        {sub.name}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {sub.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-5 text-muted-foreground" />
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-3 border-t flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setQuickModalOpen(false)}
                                    className="rounded-xl text-xs font-semibold"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* STEP 2: FILL FORM FOR SELECTED TASK / HEALTH CAMP */
                        <div className="space-y-4">
                            <DialogHeader className="text-left space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                                            <HeartPulse className="size-5" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-lg font-bold text-foreground">
                                                {isCampMode
                                                    ? 'Record Health Camp'
                                                    : activeSchema.title}
                                            </DialogTitle>
                                            <DialogDescription className="text-xs">
                                                {isCampMode
                                                    ? 'Branch-level medical camp service report'
                                                    : 'Complete the required fields for today'}
                                            </DialogDescription>
                                        </div>
                                    </div>

                                    {/* Back button if Samity Sub-task */}
                                    {!isCampMode &&
                                    selectedTaskType?.slug === 'samity-task' ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setModalStep(
                                                    'select_samity_subtask',
                                                )
                                            }
                                            className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold"
                                        >
                                            <ArrowLeft className="size-3.5 mr-1" />
                                            Change Sub-task
                                        </Button>
                                    ) : null}
                                </div>
                            </DialogHeader>

                            {isCampMode ? (
                                <form
                                    onSubmit={handleCampSubmit}
                                    className="space-y-4 pt-2"
                                >
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="camp_activity_date"
                                            className="text-xs font-semibold"
                                        >
                                            Camp Date <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="camp_activity_date"
                                            type="date"
                                            className="rounded-xl text-xs"
                                            value={campForm.data.activity_date}
                                            onChange={(e) =>
                                                campForm.setData(
                                                    'activity_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={campForm.errors.activity_date}
                                        />
                                    </div>

                                    {branches.length > 1 ? (
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="camp_branch_id"
                                                className="text-xs font-semibold"
                                            >
                                                Branch
                                            </Label>
                                            <select
                                                id="camp_branch_id"
                                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                value={campForm.data.branch_id}
                                                onChange={(e) =>
                                                    campForm.setData(
                                                        'branch_id',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">Select branch</option>
                                                {branches.map((b) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={campForm.errors.branch_id}
                                            />
                                        </div>
                                    ) : null}

                                    <DynamicFormFields
                                        schema={activeSchema}
                                        values={campForm.data.service_data}
                                        setValue={(name, val) =>
                                            campForm.setData('service_data', {
                                                ...campForm.data.service_data,
                                                [name]: val,
                                            })
                                        }
                                        errors={campForm.errors}
                                        prefix="service_data"
                                    />

                                    <PhotoAttachmentField
                                        attachments={(campForm.data.service_data?.attachments as unknown as string[]) || []}
                                        onChange={(urls) =>
                                            campForm.setData('service_data', {
                                                ...campForm.data.service_data,
                                                attachments: urls,
                                            })
                                        }
                                    />

                                    <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setQuickModalOpen(false)}
                                            className="rounded-xl text-xs font-semibold"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs h-10 px-6 shadow-xs"
                                            disabled={campForm.processing}
                                        >
                                            {campForm.processing && (
                                                <Spinner className="mr-2" />
                                            )}
                                            Submit Camp Record
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <form
                                    onSubmit={handleTaskSubmit}
                                    className="space-y-4 pt-2"
                                >
                                    <div className="grid gap-1.5">
                                        <Label
                                            htmlFor="modal_activity_date"
                                            className="text-xs font-semibold"
                                        >
                                            Activity Date <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="modal_activity_date"
                                            type="date"
                                            className="rounded-xl text-xs"
                                            value={taskForm.data.activity_date}
                                            onChange={(e) =>
                                                taskForm.setData(
                                                    'activity_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={taskForm.errors.activity_date}
                                        />
                                    </div>

                                    {/* Branch Indicator */}
                                    {branches.length > 1 ? (
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="modal_branch_id"
                                                className="text-xs font-semibold"
                                            >
                                                শাখা (Branch) <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="modal_branch_id"
                                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                value={taskForm.data.branch_id}
                                                onChange={(e) => {
                                                    taskForm.setData('branch_id', e.target.value);
                                                    taskForm.setData('samity_id', '');
                                                }}
                                            >
                                                <option value="">শাখা নির্বাচন করুন</option>
                                                {branches.map((b) => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={taskForm.errors.branch_id} />
                                        </div>
                                    ) : branches.length === 1 ? (
                                        <div className="grid gap-1.5">
                                            <Label className="text-xs font-semibold flex items-center gap-1">
                                                <Building2 className="size-3.5 text-muted-foreground" />
                                                শাখা (Branch)
                                            </Label>
                                            <div className="flex h-10 items-center justify-between rounded-xl border border-input bg-muted/30 px-3 text-xs font-medium text-foreground">
                                                <span>{branches[0].name}</span>
                                                <Badge variant="secondary" className="text-[10px] font-normal py-0 h-5">
                                                    অটোমেটিক (Auto)
                                                </Badge>
                                            </div>
                                        </div>
                                    ) : null}

                                    {activeSchema.requires_samity ? (
                                        <div className="grid gap-1.5">
                                            <Label
                                                htmlFor="modal_samity_id"
                                                className="text-xs font-semibold"
                                            >
                                                Samity <span className="text-destructive">*</span>
                                            </Label>
                                            <select
                                                id="modal_samity_id"
                                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                value={taskForm.data.samity_id}
                                                onChange={(e) =>
                                                    taskForm.setData(
                                                        'samity_id',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">Select samity</option>
                                                {samities.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name} {s.code ? `(${s.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={taskForm.errors.samity_id}
                                            />
                                        </div>
                                    ) : null}

                                    <DynamicFormFields
                                        schema={activeSchema}
                                        values={taskForm.data.form_data}
                                        setValue={(name, val) =>
                                            taskForm.setData('form_data', {
                                                ...taskForm.data.form_data,
                                                [name]: val,
                                            })
                                        }
                                        errors={taskForm.errors}
                                        prefix="form_data"
                                    />

                                    {selectedSubtype?.slug === 'satellite-clinic' ? (
                                        <SatellitePatientRepeater
                                            patients={
                                                (taskForm.data.form_data
                                                    ?.patients as unknown as PatientEntry[]) ||
                                                []
                                            }
                                            onChange={(patientsList) =>
                                                taskForm.setData('form_data', {
                                                    ...taskForm.data.form_data,
                                                    patients: patientsList,
                                                })
                                            }
                                        />
                                    ) : null}

                                    <PhotoAttachmentField
                                        attachments={(taskForm.data.form_data?.attachments as unknown as string[]) || []}
                                        onChange={(urls) =>
                                            taskForm.setData('form_data', {
                                                ...taskForm.data.form_data,
                                                attachments: urls,
                                            })
                                        }
                                    />

                                    <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setQuickModalOpen(false)}
                                            className="rounded-xl text-xs font-semibold"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs h-10 px-6 shadow-xs"
                                            disabled={taskForm.processing}
                                        >
                                            {taskForm.processing && (
                                                <Spinner className="mr-2" />
                                            )}
                                            Submit Activity
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* QUICK ACTIVITY DETAIL PREVIEW SHEET */}
            <Sheet
                open={Boolean(previewActivity)}
                onOpenChange={(open) => !open && setPreviewActivity(null)}
            >
                <SheetContent side="right" className="w-full sm:max-w-md p-6">
                    <SheetHeader className="text-left space-y-1 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                                <FileText className="size-4" />
                            </span>
                            <SheetTitle className="text-lg font-bold">
                                {previewActivity?.task_subtype?.name ||
                                    previewActivity?.task_type?.name}
                            </SheetTitle>
                        </div>
                        <SheetDescription className="text-xs">
                            দাখিলকৃত তারিখ: {formatDate(previewActivity?.activity_date)}
                        </SheetDescription>
                    </SheetHeader>

                    {previewActivity ? (
                        <div className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-muted/30 p-3.5">
                                <div>
                                    <p className="text-muted-foreground text-[11px]">
                                        Officer
                                    </p>
                                    <p className="font-bold text-foreground">
                                        {previewActivity.user?.name ||
                                            user?.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-[11px]">
                                        Location
                                    </p>
                                    <p className="font-bold text-foreground">
                                        {previewActivity.samity?.name ||
                                            previewActivity.branch?.name ||
                                            '—'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="font-bold text-foreground">
                                    Recorded Data:
                                </p>
                                {previewActivity.form_data &&
                                Object.keys(previewActivity.form_data).length >
                                    0 ? (
                                    <div className="space-y-2 rounded-2xl border p-3.5">
                                        {Object.entries(
                                            previewActivity.form_data,
                                        ).map(([key, val]) => (
                                            <div
                                                key={key}
                                                className="border-b pb-1.5 last:border-0"
                                            >
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">
                                                    {key.replaceAll('_', ' ')}
                                                </p>
                                                <p className="text-xs text-foreground whitespace-pre-wrap">
                                                    {val === null || val === ''
                                                        ? '—'
                                                        : String(val)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">
                                        No additional fields recorded.
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex justify-between items-center border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="rounded-xl text-xs font-semibold"
                                >
                                    <Link
                                        href={`/activities/${previewActivity.id}`}
                                    >
                                        Full Report Page
                                    </Link>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewActivity(null)}
                                    className="rounded-xl text-xs"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </SheetContent>
            </Sheet>
        </>
    );
}

function StatCard({
    label,
    value,
    subtitle,
    icon: Icon,
    color,
    bg,
}: {
    label: string;
    value: number | string;
    subtitle: string;
    icon: typeof ClipboardList;
    color: string;
    bg: string;
}) {
    return (
        <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-3 sm:p-4 shadow-2xs transition-all hover:shadow-xs">
            <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">
                    {label}
                </p>
                <div
                    className={`flex size-7 sm:size-8 items-center justify-center rounded-full shrink-0 ${bg} ${color}`}
                >
                    <Icon className="size-3.5 sm:size-4" />
                </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-baseline justify-between gap-1">
                <span className="inline-flex items-center justify-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-xl bg-muted/50 font-black text-lg sm:text-xl md:text-2xl text-foreground">
                    {value}
                </span>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium text-right truncate">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: "Today's Hub", href: dashboard() }],
};
