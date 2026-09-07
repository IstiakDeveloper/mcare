import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Coins,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    HeartPulse,
    Home,
    Layers,
    MapPin,
    Phone,
    PhoneCall,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Tent,
    TrendingUp,
    UserCheck,
    UserPlus,
    UserX,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import type { DailyActivity, DashboardProps } from '@/types/mcare';

export function AdminDashboardView({
    adminOverview,
    today,
    branches = [],
}: {
    adminOverview: NonNullable<DashboardProps['adminOverview']>;
    today: string;
    branches?: { id: number; name: string }[];
}) {
    const [activeTab, setActiveTab] = useState<'submitted' | 'pending' | 'hrm' | 'branches' | 'stream'>('submitted');
    const [hrmFilter, setHrmFilter] = useState<'all' | 'present' | 'movement' | 'leave' | 'absent'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [branchFilter, setBranchFilter] = useState<string>('all');

    const formattedToday = new Date(today + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const submittedFiltered = adminOverview.submitted_officers.filter((o) => {
        if (branchFilter !== 'all' && String(o.branch_id) !== branchFilter) return false;
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            return (
                o.name.toLowerCase().includes(q) ||
                o.employee_code.toLowerCase().includes(q) ||
                o.branch_name.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const pendingFiltered = adminOverview.pending_officers.filter((o) => {
        if (branchFilter !== 'all' && String(o.branch_id) !== branchFilter) return false;
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            return (
                o.name.toLowerCase().includes(q) ||
                o.employee_code.toLowerCase().includes(q) ||
                o.branch_name.toLowerCase().includes(q) ||
                o.phone.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. EXECUTIVE COMMAND HEADER */}
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-background to-card p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                            <Shield className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                                    System Command & Live Monitoring
                                </h1>
                                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider">
                                    Admin Center
                                </Badge>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                                    Live Sync Active
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <Calendar className="size-3.5" />
                                <span>{formattedToday}</span>
                                <span>•</span>
                                <span>Real-time Field Operations & Staff Monitoring</span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Admin Navigation Toolbar */}
                    <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                        <Button
                            asChild
                            className="rounded-xl text-xs font-semibold h-9 gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Link href="/admin/users">
                                <Users className="size-4" />
                                <span>User Management</span>
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            className="rounded-xl text-xs font-semibold h-9 gap-1.5 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 shadow-sm"
                        >
                            <Link href="/reports">
                                <FileText className="size-4" />
                                <span>Reports & Registers</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* HRM Live Integration Bar */}
                {adminOverview.hrm_today && (
                    <div className="mt-5 pt-4 border-t border-border/60">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-primary text-xs font-bold">
                                    HRM
                                </span>
                                <span className="text-xs font-bold text-foreground">
                                    Today's Staff Presence & Duty Status (Health Dept)
                                </span>
                                <Badge variant="outline" className="text-[10px] font-mono">
                                    {adminOverview.hrm_today.total_staff} Officers
                                </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="size-3" /> Live from HRM Database
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {/* HRM Present */}
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('hrm');
                                    setHrmFilter('present');
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                                    activeTab === 'hrm' && hrmFilter === 'present'
                                        ? 'border-emerald-500 bg-emerald-500/15 shadow-xs'
                                        : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
                                }`}
                            >
                                <div>
                                    <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                        <UserCheck className="size-3.5" /> Present / In Duty
                                    </div>
                                    <div className="text-lg font-extrabold text-foreground mt-0.5">
                                        {adminOverview.hrm_today.present_count}
                                    </div>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                    View →
                                </span>
                            </button>

                            {/* HRM Movement */}
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('hrm');
                                    setHrmFilter('movement');
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                                    activeTab === 'hrm' && hrmFilter === 'movement'
                                        ? 'border-blue-500 bg-blue-500/15 shadow-xs'
                                        : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60'
                                }`}
                            >
                                <div>
                                    <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                        <MapPin className="size-3.5" /> On Movement
                                    </div>
                                    <div className="text-lg font-extrabold text-foreground mt-0.5">
                                        {adminOverview.hrm_today.movement_count}
                                    </div>
                                </div>
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                                    View →
                                </span>
                            </button>

                            {/* HRM Leave */}
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('hrm');
                                    setHrmFilter('leave');
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                                    activeTab === 'hrm' && hrmFilter === 'leave'
                                        ? 'border-amber-500 bg-amber-500/15 shadow-xs'
                                        : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
                                }`}
                            >
                                <div>
                                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                        <Calendar className="size-3.5" /> On Leave
                                    </div>
                                    <div className="text-lg font-extrabold text-foreground mt-0.5">
                                        {adminOverview.hrm_today.leave_count}
                                    </div>
                                </div>
                                <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                                    View →
                                </span>
                            </button>

                            {/* HRM Absent */}
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('hrm');
                                    setHrmFilter('absent');
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                                    activeTab === 'hrm' && hrmFilter === 'absent'
                                        ? 'border-rose-500 bg-rose-500/15 shadow-xs'
                                        : 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60'
                                }`}
                            >
                                <div>
                                    <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                                        <UserX className="size-3.5" /> Absent
                                    </div>
                                    <div className="text-lg font-extrabold text-foreground mt-0.5">
                                        {adminOverview.hrm_today.absent_count}
                                    </div>
                                </div>
                                <span className="text-[10px] font-semibold text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                                    View →
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. REAL-TIME KPI SUMMARY METRICS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Submitted Today */}
                <Card className="border-border/70 bg-card/80 hover:border-emerald-500/40 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                Submitted Today
                            </span>
                            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                                <UserCheck className="size-5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {adminOverview.submitted_today_count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                / {adminOverview.total_active_officers} Staff ({adminOverview.submission_rate}%)
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                                style={{ width: `${Math.min(100, adminOverview.submission_rate)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Officers */}
                <Card className="border-border/70 bg-card/80 hover:border-amber-500/40 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                Pending Submissions
                            </span>
                            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                                <UserX className="size-5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                                {adminOverview.pending_today_count}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Officers haven't sent data
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" /> Awaiting daily field entry
                        </p>
                    </CardContent>
                </Card>

                {/* Total Beneficiaries Served Today */}
                <Card className="border-border/70 bg-card/80 hover:border-teal-500/40 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                                Beneficiaries Served
                            </span>
                            <div className="rounded-xl bg-teal-500/10 p-2 text-teal-600 dark:text-teal-400">
                                <HeartPulse className="size-5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                                {adminOverview.today_all_beneficiaries}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                Persons today
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                            Across {adminOverview.today_all_activities_count} field sessions
                        </p>
                    </CardContent>
                </Card>

                {/* Fees Collected Today */}
                <Card className="border-border/70 bg-card/80 hover:border-rose-500/40 transition-colors">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                Total Fees Collected
                            </span>
                            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                                <Coins className="size-5" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                ৳{adminOverview.today_all_fees.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                BDT
                            </span>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                            {adminOverview.today_all_camps > 0 ? `${adminOverview.today_all_camps} Health Camps` : 'Direct service fees'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 3. LIVE SUBMISSION & MONITORING WORKSPACE */}
            <Card className="border-border/80 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/50 bg-muted/20 px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Sub-Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            <button
                                type="button"
                                onClick={() => setActiveTab('submitted')}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'submitted'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <UserCheck className="size-4" />
                                <span>Submitted Today</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full ml-0.5">
                                    {adminOverview.submitted_today_count}
                                </Badge>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('pending')}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'pending'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <UserX className="size-4" />
                                <span>Pending Officers</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full ml-0.5">
                                    {adminOverview.pending_today_count}
                                </Badge>
                            </button>

                            {/* HRM Staff Status Tab Button */}
                            {adminOverview.hrm_today && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('hrm')}
                                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                        activeTab === 'hrm'
                                            ? 'bg-teal-600 text-white shadow-xs'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <Clock className="size-4" />
                                    <span>HRM Attendance & Duty</span>
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full ml-0.5">
                                        {adminOverview.hrm_today.total_staff}
                                    </Badge>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setActiveTab('branches')}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'branches'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Building2 className="size-4" />
                                <span>Branch Performance</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('stream')}
                                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === 'stream'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Activity className="size-4" />
                                <span>Live Activity Feed</span>
                            </button>
                        </div>

                        {/* Search & Branch filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search officer or branch..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-8 pl-8 text-xs w-48 rounded-xl bg-background"
                                />
                            </div>

                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                            >
                                <option value="all">All Branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* TAB 1: SUBMITTED OFFICERS TODAY */}
                    {/* TAB 1: SUBMITTED TODAY */}
                    {activeTab === 'submitted' && (
                        <div>
                            {submittedFiltered.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground">
                                    <UserCheck className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                                    <p className="text-sm font-semibold">No submissions match the current filter</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Cards View (< md) */}
                                    <div className="divide-y divide-border/40 md:hidden">
                                        {submittedFiltered.map((o) => (
                                            <div key={o.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">{o.name}</h4>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            #{o.employee_code} • {o.designation}
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        <Activity className="size-3.5" />
                                                        {o.activities_count} Tasks
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl">
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block">Branch</span>
                                                        <span className="font-semibold text-foreground flex items-center gap-1">
                                                            <MapPin className="size-3 text-primary" /> {o.branch_name}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block">Beneficiaries</span>
                                                        <span className="font-bold text-teal-600 dark:text-teal-400">
                                                            {o.beneficiaries_count} Persons
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block">Fee Collected</span>
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            ৳{o.fee_collected.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] text-muted-foreground block">Last Log</span>
                                                        <span className="font-medium text-foreground truncate block">
                                                            {o.last_submission_time || '—'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                                                        {o.last_task_name}
                                                    </span>
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs rounded-xl gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                                    >
                                                        <Link href={`/reports?user_id=${o.id}&branch_id=${o.branch_id || 'all'}`}>
                                                            <FileText className="size-3.5" />
                                                            <span>View Report</span>
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View (>= md) */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="border-b border-border/50 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">#</th>
                                                    <th className="px-4 py-3">Officer & PIN</th>
                                                    <th className="px-4 py-3">Branch</th>
                                                    <th className="px-4 py-3 text-center">Tasks Submitted</th>
                                                    <th className="px-4 py-3 text-center">Beneficiaries</th>
                                                    <th className="px-4 py-3 text-right">Fee Collected</th>
                                                    <th className="px-4 py-3">Last Submission</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                                {submittedFiltered.map((o, idx) => (
                                                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 font-semibold text-muted-foreground">{idx + 1}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-bold text-foreground">{o.name}</div>
                                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                                {o.employee_code} • {o.designation}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                                                <MapPin className="size-3 text-muted-foreground" />
                                                                {o.branch_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                                                <Activity className="size-3" />
                                                                {o.activities_count} Tasks
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-teal-600 dark:text-teal-400">
                                                            {o.beneficiaries_count}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                                                            ৳{o.fee_collected.toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-foreground">{o.last_submission_time || '—'}</div>
                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{o.last_task_name}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-xs px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                                            >
                                                                <Link href={`/reports?user_id=${o.id}&branch_id=${o.branch_id || 'all'}`}>
                                                                    <FileText className="size-3" />
                                                                    <span>View Report</span>
                                                                </Link>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB 2: PENDING OFFICERS TODAY */}
                    {activeTab === 'pending' && (
                        <div>
                            {pendingFiltered.length === 0 ? (
                                <div className="p-10 text-center text-emerald-600">
                                    <CheckCircle2 className="size-8 mx-auto mb-2" />
                                    <p className="text-sm font-bold">Excellent! All active officers have submitted data today.</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="size-4 text-amber-600 shrink-0" />
                                            <span>
                                                {pendingFiltered.length} officers have not submitted their daily activities or fee logs yet today.
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mobile Cards View (< md) */}
                                    <div className="divide-y divide-border/40 md:hidden">
                                        {pendingFiltered.map((o) => (
                                            <div key={o.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-sm text-foreground">{o.name}</h4>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            #{o.employee_code} • {o.designation}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 text-[10px] font-bold">
                                                        Pending
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between text-xs bg-muted/40 p-2.5 rounded-xl">
                                                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                        <MapPin className="size-3.5 text-primary shrink-0" />
                                                        <span>{o.branch_name}</span>
                                                    </div>
                                                    {o.phone && o.phone !== '—' ? (
                                                        <a
                                                            href={`tel:${o.phone}`}
                                                            className="inline-flex items-center gap-1 text-primary font-bold hover:underline"
                                                        >
                                                            <PhoneCall className="size-3.5" />
                                                            <span>{o.phone}</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground">No Phone</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 pt-1">
                                                    {o.phone && o.phone !== '—' ? (
                                                        <a
                                                            href={`tel:${o.phone}`}
                                                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs"
                                                        >
                                                            <PhoneCall className="size-3.5" />
                                                            <span>Call Officer</span>
                                                        </a>
                                                    ) : null}
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-9 rounded-xl text-xs gap-1"
                                                    >
                                                        <Link href={`/reports?user_id=${o.id}&branch_id=${o.branch_id || 'all'}`}>
                                                            <FileText className="size-3.5" />
                                                            <span>Past Logs</span>
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table View (>= md) */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="border-b border-border/50 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">#</th>
                                                    <th className="px-4 py-3">Officer Name</th>
                                                    <th className="px-4 py-3">Employee Code</th>
                                                    <th className="px-4 py-3">Branch</th>
                                                    <th className="px-4 py-3">Designation</th>
                                                    <th className="px-4 py-3">Contact Phone</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                                {pendingFiltered.map((o, idx) => (
                                                    <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 font-semibold text-muted-foreground">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-bold text-foreground">
                                                            {o.name}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-muted-foreground">
                                                            {o.employee_code}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                                                <MapPin className="size-3 text-muted-foreground" />
                                                                {o.branch_name}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {o.designation}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {o.phone && o.phone !== '—' ? (
                                                                <a
                                                                    href={`tel:${o.phone}`}
                                                                    className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                                                                >
                                                                    <PhoneCall className="size-3" />
                                                                    {o.phone}
                                                                </a>
                                                            ) : (
                                                                <span className="text-muted-foreground">No Phone</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 text-xs px-2.5 gap-1"
                                                            >
                                                                <Link href={`/reports?user_id=${o.id}&branch_id=${o.branch_id || 'all'}`}>
                                                                    <FileText className="size-3" />
                                                                    <span>Past Logs</span>
                                                                </Link>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: HRM LIVE ATTENDANCE, MOVEMENT, LEAVE & ABSENT STATUS */}
                    {activeTab === 'hrm' && adminOverview.hrm_today && (
                        <div>
                            {/* HRM Status Filter Pill Switcher */}
                            <div className="p-3 border-b border-border/50 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setHrmFilter('all')}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                            hrmFilter === 'all'
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        All ({adminOverview.hrm_today.total_staff})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHrmFilter('present')}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                            hrmFilter === 'present'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                                        }`}
                                    >
                                        Present ({adminOverview.hrm_today.present_count})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHrmFilter('movement')}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                            hrmFilter === 'movement'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20'
                                        }`}
                                    >
                                        Movement ({adminOverview.hrm_today.movement_count})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHrmFilter('leave')}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                            hrmFilter === 'leave'
                                                ? 'bg-amber-600 text-white shadow-xs'
                                                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                                        }`}
                                    >
                                        Leave ({adminOverview.hrm_today.leave_count})
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHrmFilter('absent')}
                                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                            hrmFilter === 'absent'
                                                ? 'bg-rose-600 text-white shadow-xs'
                                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                                        }`}
                                    >
                                        Absent ({adminOverview.hrm_today.absent_count})
                                    </button>
                                </div>

                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>HRM Live Sync</span>
                                </div>
                            </div>

                            {/* HRM Staff Table + Mobile Cards */}
                            {(() => {
                                const hrmData = adminOverview.hrm_today;
                                let rawList: any[] = [];
                                if (hrmFilter === 'all') {
                                    rawList = [
                                        ...hrmData.present_list,
                                        ...hrmData.movement_list,
                                        ...hrmData.leave_list,
                                        ...hrmData.absent_list,
                                    ];
                                } else if (hrmFilter === 'present') {
                                    rawList = hrmData.present_list;
                                } else if (hrmFilter === 'movement') {
                                    rawList = hrmData.movement_list;
                                } else if (hrmFilter === 'leave') {
                                    rawList = hrmData.leave_list;
                                } else if (hrmFilter === 'absent') {
                                    rawList = hrmData.absent_list;
                                }

                                const filteredList = rawList.filter((item) => {
                                    if (searchQuery.trim() !== '') {
                                        const q = searchQuery.toLowerCase();
                                        return (
                                            item.name.toLowerCase().includes(q) ||
                                            item.employee_id.toLowerCase().includes(q) ||
                                            item.branch_name.toLowerCase().includes(q) ||
                                            item.phone.toLowerCase().includes(q)
                                        );
                                    }
                                    return true;
                                });

                                if (filteredList.length === 0) {
                                    return (
                                        <div className="p-10 text-center text-muted-foreground">
                                            <p className="text-sm font-semibold">No health officers match the selected HRM status</p>
                                        </div>
                                    );
                                }

                                return (
                                    <>
                                        {/* Mobile Cards View (< md) */}
                                        <div className="divide-y divide-border/40 md:hidden">
                                            {filteredList.map((item, idx) => {
                                                const isPresent = item.status === 'present' || item.status === 'late' || item.status === 'half_day' || item.status === 'on_duty';
                                                const isMovement = item.status === 'movement';
                                                const isLeave = item.status === 'leave';

                                                return (
                                                    <div key={item.id + '-m-' + idx} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                                                                <p className="text-xs text-muted-foreground font-mono">
                                                                    HRM ID: #{item.employee_id} • {item.designation}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                {isPresent ? (
                                                                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5">
                                                                        <UserCheck className="size-3 mr-1" /> Present
                                                                    </Badge>
                                                                ) : isMovement ? (
                                                                    <Badge className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5">
                                                                        <MapPin className="size-3 mr-1" /> On Movement
                                                                    </Badge>
                                                                ) : isLeave ? (
                                                                    <Badge className="bg-amber-600 text-white font-bold text-[10px] px-2 py-0.5">
                                                                        <Calendar className="size-3 mr-1" /> On Leave
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="border-rose-500/40 text-rose-600 bg-rose-500/10 font-bold text-[10px] px-2 py-0.5">
                                                                        <UserX className="size-3 mr-1" /> Absent
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="text-xs bg-muted/40 p-2.5 rounded-xl space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-foreground flex items-center gap-1">
                                                                    <MapPin className="size-3 text-primary" /> {item.branch_name}
                                                                </span>
                                                                {isPresent && (
                                                                    <span className="font-mono text-muted-foreground">
                                                                        In: <strong className="text-foreground">{item.check_in || '—'}</strong>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isMovement && (
                                                                <p className="text-blue-700 dark:text-blue-300 font-medium">
                                                                    {item.movement_destination} • {item.movement_purpose}
                                                                </p>
                                                            )}
                                                            {isLeave && (
                                                                <p className="text-amber-700 dark:text-amber-300 font-medium">
                                                                    {item.leave_reason}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 pt-1">
                                                            {item.phone && item.phone !== '—' ? (
                                                                <a
                                                                    href={`tel:${item.phone}`}
                                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2 text-xs font-bold text-primary hover:bg-primary/20"
                                                                >
                                                                    <PhoneCall className="size-3.5" />
                                                                    <span>{item.phone}</span>
                                                                </a>
                                                            ) : null}
                                                            <Button
                                                                asChild
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1 h-9 rounded-xl text-xs gap-1"
                                                            >
                                                                <Link href={`/reports?user_id=${item.id}&branch_id=${item.branch_id || 'all'}`}>
                                                                    <FileText className="size-3.5" />
                                                                    <span>Mcare Log</span>
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Desktop Table View (>= md) */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="border-b border-border/50 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-4 py-3">#</th>
                                                        <th className="px-4 py-3">Officer Name & PIN</th>
                                                        <th className="px-4 py-3">Branch</th>
                                                        <th className="px-4 py-3">Designation</th>
                                                        <th className="px-4 py-3 text-center">HRM Duty Status</th>
                                                        <th className="px-4 py-3">Details / Movement / Leave</th>
                                                        <th className="px-4 py-3">Phone</th>
                                                        <th className="px-4 py-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/40">
                                                    {filteredList.map((item, idx) => {
                                                        const isPresent = item.status === 'present' || item.status === 'late' || item.status === 'half_day' || item.status === 'on_duty';
                                                        const isMovement = item.status === 'movement';
                                                        const isLeave = item.status === 'leave';
                                                        const isAbsent = item.status === 'absent';

                                                        return (
                                                            <tr key={item.id + '-' + idx} className="hover:bg-muted/30 transition-colors">
                                                                <td className="px-4 py-3 font-semibold text-muted-foreground">{idx + 1}</td>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-bold text-foreground">{item.name}</div>
                                                                    <div className="text-[10px] text-muted-foreground font-mono">
                                                                        HRM ID: {item.employee_id}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                                                        <MapPin className="size-3 text-muted-foreground" />
                                                                        {item.branch_name}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-muted-foreground">
                                                                    {item.designation}
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    {isPresent ? (
                                                                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-0.5">
                                                                            <UserCheck className="size-3 mr-1" /> Present
                                                                        </Badge>
                                                                    ) : isMovement ? (
                                                                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2 py-0.5">
                                                                            <MapPin className="size-3 mr-1" /> On Movement
                                                                        </Badge>
                                                                    ) : isLeave ? (
                                                                        <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2 py-0.5">
                                                                            <Calendar className="size-3 mr-1" /> On Leave
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="border-rose-500/40 text-rose-600 bg-rose-500/10 font-bold text-[10px] px-2 py-0.5">
                                                                            <UserX className="size-3 mr-1" /> Absent
                                                                        </Badge>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs">
                                                                    {isPresent && (
                                                                        <div className="font-mono text-muted-foreground">
                                                                            In: <strong className="text-foreground">{item.check_in || '—'}</strong>
                                                                            {item.check_out && ` • Out: ${item.check_out}`}
                                                                        </div>
                                                                    )}
                                                                    {isMovement && (
                                                                        <div className="max-w-[200px]">
                                                                            <p className="font-semibold text-foreground truncate">{item.movement_destination || 'Field movement'}</p>
                                                                            <p className="text-[10px] text-muted-foreground truncate">{item.movement_purpose || 'Official duty'}</p>
                                                                        </div>
                                                                    )}
                                                                    {isLeave && (
                                                                        <div className="max-w-[200px]">
                                                                            <p className="text-[11px] text-amber-700 dark:text-amber-300 truncate">{item.leave_reason || 'Approved leave'}</p>
                                                                        </div>
                                                                    )}
                                                                    {isAbsent && (
                                                                        <span className="text-[11px] text-muted-foreground italic">
                                                                            No check-in or movement recorded
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {item.phone && item.phone !== '—' ? (
                                                                        <a
                                                                            href={`tel:${item.phone}`}
                                                                            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                                                                        >
                                                                            <PhoneCall className="size-3" />
                                                                            {item.phone}
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-muted-foreground">No Phone</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <Button
                                                                        asChild
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-xs px-2.5 gap-1"
                                                                    >
                                                                        <Link href={`/reports?user_id=${item.id}&branch_id=${item.branch_id || 'all'}`}>
                                                                            <FileText className="size-3" />
                                                                            <span>Mcare Log</span>
                                                                        </Link>
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* TAB 3: BRANCH PERFORMANCE TODAY */}
                    {activeTab === 'branches' && (
                        <div>
                            {/* Mobile Cards View (< md) */}
                            <div className="divide-y divide-border/40 md:hidden">
                                {adminOverview.branch_progress.map((b) => (
                                    <div key={b.branch_id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-bold text-sm text-foreground">{b.branch_name}</h4>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    Code: {b.branch_code}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    b.pending_count === 0 && b.total_officers > 0
                                                        ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px] font-bold'
                                                        : 'border-amber-500/40 text-amber-600 bg-amber-500/10 text-[10px] font-bold'
                                                }
                                            >
                                                {b.submitted_count} / {b.total_officers} Submitted
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-muted/40 p-2.5 rounded-xl">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block">Activities</span>
                                                <span className="font-bold text-foreground">{b.activities_count}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block">Beneficiaries</span>
                                                <span className="font-bold text-teal-600 dark:text-teal-400">{b.beneficiaries_count}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground block">Total Fees</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">৳{b.fee_amount.toFixed(0)}</span>
                                            </div>
                                        </div>

                                        <div className="pt-1 flex justify-end">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8 text-xs rounded-xl gap-1.5 border-primary/30 text-primary"
                                            >
                                                <Link href={`/reports?branch_id=${b.branch_id}`}>
                                                    <FileText className="size-3.5" />
                                                    <span>View Branch Report</span>
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View (>= md) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border/50 bg-muted/30 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">#</th>
                                            <th className="px-4 py-3">Branch Name</th>
                                            <th className="px-4 py-3">Code</th>
                                            <th className="px-4 py-3 text-center">Staff Reporting</th>
                                            <th className="px-4 py-3 text-center">Activities Count</th>
                                            <th className="px-4 py-3 text-center">Beneficiaries</th>
                                            <th className="px-4 py-3 text-right">Total Fees</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {adminOverview.branch_progress.map((b, idx) => (
                                            <tr key={b.branch_id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-muted-foreground">{idx + 1}</td>
                                                <td className="px-4 py-3 font-bold text-foreground">{b.branch_name}</td>
                                                <td className="px-4 py-3 font-mono text-muted-foreground">{b.branch_code}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            b.pending_count === 0 && b.total_officers > 0
                                                                ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                                                                : 'border-amber-500/40 text-amber-600 bg-amber-500/10'
                                                        }
                                                    >
                                                        {b.submitted_count} / {b.total_officers} Submitted
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-foreground">
                                                    {b.activities_count}
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-teal-600 dark:text-teal-400">
                                                    {b.beneficiaries_count}
                                                </td>
                                                <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                                                    ৳{b.fee_amount.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs px-2.5 gap-1"
                                                    >
                                                        <Link href={`/reports?branch_id=${b.branch_id}`}>
                                                            <FileText className="size-3" />
                                                            <span>Branch Report</span>
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: LIVE ACTIVITY STREAM */}
                    {activeTab === 'stream' && (
                        <div className="divide-y divide-border/40">
                            {adminOverview.recent_system_activities.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No incoming activities recorded yet today.
                                </div>
                            ) : (
                                adminOverview.recent_system_activities.map((act) => {
                                    const data = act.form_data || {};
                                    return (
                                        <div key={act.id} className="p-4 flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                                                    <Activity className="size-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-sm text-foreground">
                                                            {act.task_subtype?.name || act.task_type?.name || 'Field Activity'}
                                                        </span>
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {act.branch?.name || 'Main Branch'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Submitted by <strong className="text-foreground">{act.user?.name}</strong> • Samity: {(data.samity_name as string) || act.samity?.name || 'General'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {String(data.attendees_count || data.patients_served || (Array.isArray(data.patients) ? data.patients.length : 0))} Beneficiaries
                                                </span>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {formatDate(act.activity_date)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
