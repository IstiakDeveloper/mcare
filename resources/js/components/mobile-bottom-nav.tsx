import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    Building2,
    ChevronRight,
    ClipboardList,
    HeartPulse,
    Home,
    Layers,
    Menu,
    Moon,
    Plus,
    Receipt,
    Sparkles,
    Stethoscope,
    Sun,
    Tent,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard } from '@/routes';

export function MobileBottomNav() {
    const { url } = usePage();
    const { setOpenMobile } = useSidebar();
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const [sheetStep, setSheetStep] = useState<'main_categories' | 'samity_subtypes'>(
        'main_categories',
    );
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const isDashboard = url === '/dashboard' || url === '/';
    const isActivities = url.startsWith('/activities');
    const isHealthCamps = url.startsWith('/health-camps');

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    const handleOpenSheet = () => {
        setSheetStep('main_categories');
        setQuickMenuOpen(true);
    };

    const samitySubTasks = [
        {
            title: '1. Uthan Boithok (Yard Meeting)',
            desc: 'Health awareness, disease prevention & primary care counseling',
            href: '/tasks/samity-task/uthan-boithok',
            icon: Users,
            color: 'bg-emerald-600 text-white',
            border: 'border-emerald-500/40 bg-emerald-500/5',
        },
        {
            title: '2. Satellite Clinic (Outreach)',
            desc: 'Paramedic clinical outreach & member consultations',
            href: '/tasks/samity-task/satellite-clinic',
            icon: Stethoscope,
            color: 'bg-teal-600 text-white',
            border: 'border-teal-500/40 bg-teal-500/5',
        },
        {
            title: '3. Awareness Session (Health Ed)',
            desc: 'Focused health education & community motivation',
            href: '/tasks/samity-task/awareness-session',
            icon: Sparkles,
            color: 'bg-cyan-600 text-white',
            border: 'border-cyan-500/40 bg-cyan-500/5',
        },
    ];

    return (
        <>
            <div className="fixed inset-x-0 bottom-0 z-40 block border-t border-border/80 bg-background/95 backdrop-blur-lg shadow-lg md:hidden">
                <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
                    {/* 1. Dashboard / Today */}
                    <Link
                        href={dashboard()}
                        className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                            isDashboard
                                ? 'text-primary font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex size-8 items-center justify-center rounded-full transition-all ${
                                isDashboard
                                    ? 'bg-primary/15 text-primary scale-110'
                                    : ''
                            }`}
                        >
                            <Home className="size-5" />
                        </div>
                        <span className="text-[10px] tracking-tight font-medium">Today</span>
                    </Link>

                    {/* 2. Activities Log */}
                    <Link
                        href="/activities"
                        className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                            isActivities
                                ? 'text-primary font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex size-8 items-center justify-center rounded-full transition-all ${
                                isActivities
                                    ? 'bg-primary/15 text-primary scale-110'
                                    : ''
                            }`}
                        >
                            <ClipboardList className="size-5" />
                        </div>
                        <span className="text-[10px] tracking-tight font-medium">Activities</span>
                    </Link>

                    {/* 3. Quick Center Action Button */}
                    <div className="flex flex-1 flex-col items-center justify-center -translate-y-3">
                        <button
                            type="button"
                            onClick={handleOpenSheet}
                            className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-background transition-transform active:scale-95 hover:scale-105 cursor-pointer"
                            aria-label="New Task Entry"
                        >
                            <Plus className="size-6 stroke-[2.5]" />
                        </button>
                        <span className="mt-0.5 text-[10px] font-bold text-foreground">
                            New Log
                        </span>
                    </div>

                    {/* 4. Health Camps */}
                    <Link
                        href="/health-camps"
                        className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                            isHealthCamps
                                ? 'text-amber-600 dark:text-amber-400 font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <div
                            className={`flex size-8 items-center justify-center rounded-full transition-all ${
                                isHealthCamps
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 scale-110'
                                    : ''
                            }`}
                        >
                            <Tent className="size-5" />
                        </div>
                        <span className="text-[10px] tracking-tight font-medium">Camps</span>
                    </Link>

                    {/* 5. Mobile Sidebar Menu Trigger (Replaced Settings) */}
                    <button
                        type="button"
                        onClick={() => setOpenMobile(true)}
                        className="flex flex-1 flex-col items-center justify-center py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <div className="flex size-8 items-center justify-center rounded-full hover:bg-muted/60 transition-all">
                            <Menu className="size-5" />
                        </div>
                        <span className="text-[10px] tracking-tight font-medium">Menu</span>
                    </button>
                </div>
            </div>

            {/* Categorized 2-Step Mobile Task Launcher Sheet */}
            <Sheet open={quickMenuOpen} onOpenChange={setQuickMenuOpen}>
                <SheetContent
                    side="bottom"
                    className="max-h-[88vh] rounded-t-3xl border-t p-5 pb-8 overflow-y-auto"
                >
                    {/* STEP 1: Main 3 Primary Activity Options + Health Camp */}
                    {sheetStep === 'main_categories' ? (
                        <div className="space-y-4">
                            <SheetHeader className="text-left mb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                                            <Layers className="size-5" />
                                        </span>
                                        <div>
                                            <SheetTitle className="text-base font-bold text-foreground">
                                                Select Activity
                                            </SheetTitle>
                                            <SheetDescription className="text-xs">
                                                Choose 1 of the 3 primary options to record today
                                            </SheetDescription>
                                        </div>
                                    </div>

                                    {/* Theme Toggle */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleTheme}
                                        className="size-8 rounded-full p-0"
                                    >
                                        {resolvedAppearance === 'dark' ? (
                                            <Sun className="size-4 text-amber-400" />
                                        ) : (
                                            <Moon className="size-4 text-slate-700" />
                                        )}
                                    </Button>
                                </div>
                            </SheetHeader>

                            <div className="space-y-2.5 pt-1">
                                {/* Option 1: Samity Work */}
                                <button
                                    type="button"
                                    onClick={() => setSheetStep('samity_subtypes')}
                                    className="w-full flex items-center justify-between rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-card p-4 text-left shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                                            <Users className="size-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                                                    1
                                                </span>
                                                <h4 className="text-sm font-bold text-foreground">
                                                    Samity Work
                                                </h4>
                                                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                                    3 Sub-types
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Yard Meeting, Satellite Clinic, or Awareness Session
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-emerald-600 shrink-0" />
                                </button>

                                {/* Option 2: Household Visit */}
                                <Link
                                    href="/tasks/household-visit"
                                    onClick={() => setQuickMenuOpen(false)}
                                    className="w-full flex items-center justify-between rounded-2xl border-2 border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-card p-4 text-left shadow-2xs transition-all active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                                            <Home className="size-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                                                    2
                                                </span>
                                                <h4 className="text-sm font-bold text-foreground">
                                                    Household Visit
                                                </h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Door-to-door follow-up & family health care
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-blue-600 shrink-0" />
                                </Link>

                                {/* Option 3: Static Clinic */}
                                <Link
                                    href="/tasks/static-clinic"
                                    onClick={() => setQuickMenuOpen(false)}
                                    className="w-full flex items-center justify-between rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-card p-4 text-left shadow-2xs transition-all active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
                                            <Activity className="size-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                                                    3
                                                </span>
                                                <h4 className="text-sm font-bold text-foreground">
                                                    Static Clinic
                                                </h4>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Branch facility consultations & patient care
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-indigo-600 shrink-0" />
                                </Link>

                                {/* Branch Module: Health Camp */}
                                <div className="pt-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">
                                        Branch Outreach Module
                                    </p>
                                    <Link
                                        href="/health-camps/create"
                                        onClick={() => setQuickMenuOpen(false)}
                                        className="w-full flex items-center justify-between rounded-2xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-card p-3.5 text-left shadow-2xs transition-all active:scale-[0.99]"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                                                <Tent className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-foreground">
                                                    Health Camp (Special)
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Special outreach medical camp drive
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="size-4 text-amber-600 shrink-0" />
                                    </Link>

                                    {/* Fee Collections */}
                                    <Link
                                        href="/fee-collections"
                                        onClick={() => setQuickMenuOpen(false)}
                                        className="w-full flex items-center justify-between rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-card p-3.5 text-left shadow-2xs transition-all active:scale-[0.99] mt-2"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                                                <Receipt className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-foreground">
                                                    Fee Collections (ফি আদায়)
                                                </h4>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Post daily income & diabetes test records
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="size-4 text-emerald-600 shrink-0" />
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setQuickMenuOpen(false)}
                                    className="rounded-xl text-xs font-semibold"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* STEP 2: Samity Work Sub-task Selection */
                        <div className="space-y-4">
                            <SheetHeader className="text-left mb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className="flex size-9 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                                            <Users className="size-5" />
                                        </span>
                                        <div>
                                            <SheetTitle className="text-base font-bold text-foreground">
                                                Samity Sub-tasks
                                            </SheetTitle>
                                            <SheetDescription className="text-xs">
                                                Select which samity activity you conducted
                                            </SheetDescription>
                                        </div>
                                    </div>

                                    {/* Back Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSheetStep('main_categories')}
                                        className="text-xs text-primary font-bold"
                                    >
                                        <ArrowLeft className="size-3.5 mr-1" />
                                        Back
                                    </Button>
                                </div>
                            </SheetHeader>

                            <div className="space-y-2.5 pt-1">
                                {samitySubTasks.map((task) => {
                                    const Icon = task.icon;
                                    return (
                                        <Link
                                            key={task.title}
                                            href={task.href}
                                            onClick={() => setQuickMenuOpen(false)}
                                            className={`w-full flex items-center justify-between rounded-2xl border-2 p-4 text-left shadow-2xs transition-all active:scale-[0.99] ${task.border}`}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div
                                                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${task.color} shadow-xs`}
                                                >
                                                    <Icon className="size-5.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-foreground">
                                                        {task.title}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {task.desc}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSheetStep('main_categories')}
                                    className="rounded-xl text-xs font-semibold text-muted-foreground"
                                >
                                    <ArrowLeft className="size-3.5 mr-1" />
                                    Back to Main Options
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setQuickMenuOpen(false)}
                                    className="rounded-xl text-xs font-semibold"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
