import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Building2,
    CheckCircle2,
    ChevronRight,
    Edit2,
    Eye,
    FileText,
    Filter,
    KeyRound,
    Lock,
    Mail,
    MapPin,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type UserItem = {
    id: number;
    external_hrm_id: number | null;
    name: string;
    username: string;
    email: string;
    phone: string | null;
    designation: string | null;
    employee_code: string | null;
    role_id: number | null;
    role: { id: number; name: string; slug: string } | null;
    branch_id: number | null;
    branch: { id: number; name: string; branch_code: string } | null;
    daily_activities_count: number;
    health_camps_count: number;
    created_at: string | null;
};

type BranchItem = {
    id: number;
    name: string;
    branch_code: string;
};

type RoleItem = {
    id: number;
    name: string;
    slug: string;
};

type Props = {
    users: UserItem[];
    branches: BranchItem[];
    roles: RoleItem[];
    summary: {
        total_users: number;
        total_admins: number;
        total_workers: number;
        total_managers: number;
        total_branches: number;
    };
    filters: {
        search: string;
        branch_id: string;
        role_id: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ড্যাশবোর্ড', href: dashboard() },
    { title: 'প্রশাসন', href: '/admin/users' },
    { title: 'ব্যবহারকারী ব্যবস্থাপনা', href: '/admin/users' },
];

export default function AdminUsersIndex({
    users = [],
    branches = [],
    roles = [],
    summary,
    filters,
}: Props) {
    const { flash, errors: pageErrors } = usePage<{
        flash?: { status?: string; error?: string };
        errors?: Record<string, string>;
    }>().props;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedBranch, setSelectedBranch] = useState(filters.branch_id || 'all');
    const [selectedRole, setSelectedRole] = useState(filters.role_id || 'all');

    // Add User Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const {
        data: createData,
        setData: setCreateData,
        post: submitCreate,
        processing: createProcessing,
        errors: createErrors,
        reset: resetCreate,
    } = useForm({
        name: '',
        username: '',
        email: '',
        phone: '',
        employee_code: '',
        designation: '',
        role_id: roles.find((r) => r.slug === 'worker')?.id ? String(roles.find((r) => r.slug === 'worker')?.id) : '',
        branch_id: branches.length > 0 ? String(branches[0].id) : '',
        password: '',
    });

    // Edit User Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const {
        data: editData,
        setData: setEditData,
        put: submitEdit,
        processing: editProcessing,
        errors: editErrors,
        reset: resetEdit,
    } = useForm({
        name: '',
        username: '',
        email: '',
        phone: '',
        employee_code: '',
        designation: '',
        role_id: '',
        branch_id: '',
        password: '',
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

    const applyFilters = (search?: string, branch?: string, role?: string) => {
        const s = search !== undefined ? search : searchQuery;
        const b = branch !== undefined ? branch : selectedBranch;
        const r = role !== undefined ? role : selectedRole;

        router.get(
            '/admin/users',
            {
                search: s,
                branch_id: b,
                role_id: r,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(searchQuery, selectedBranch, selectedRole);
    };

    const handleOpenEdit = (u: UserItem) => {
        setEditingUser(u);
        setEditData({
            name: u.name,
            username: u.username || '',
            email: u.email,
            phone: u.phone || '',
            employee_code: u.employee_code || '',
            designation: u.designation || '',
            role_id: u.role_id ? String(u.role_id) : '',
            branch_id: u.branch_id ? String(u.branch_id) : '',
            password: '',
        });
        setEditModalOpen(true);
    };

    const handleSaveCreate = (e: React.FormEvent) => {
        e.preventDefault();
        submitCreate('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                setCreateModalOpen(false);
                resetCreate();
            },
        });
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        submitEdit(`/admin/users/${editingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditModalOpen(false);
                setEditingUser(null);
                resetEdit();
            },
        });
    };

    const handleConfirmDelete = () => {
        if (!deletingUser) return;
        router.delete(`/admin/users/${deletingUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteModalOpen(false);
                setDeletingUser(null);
            },
        });
    };

    const getRoleBadge = (roleSlug?: string) => {
        if (roleSlug === 'admin') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <ShieldAlert className="size-3" /> অ্যাডমিন
                </span>
            );
        }
        if (roleSlug === 'branch-manager') {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Building2 className="size-3" /> ব্রাঞ্চ ম্যানেজার
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <UserCheck className="size-3" /> ফিল্ড কর্মী
            </span>
        );
    };

    return (
        <>
            <Head title="User Management — M Care Health System" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Notification Alerts */}
                {flash?.status && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{flash.status}</span>
                    </div>
                )}
                {(flash?.error || pageErrors?.error) && (
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-medium text-rose-800 dark:text-rose-200 animate-in fade-in">
                        <AlertCircle className="size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>{flash?.error || pageErrors?.error}</span>
                    </div>
                )}

                {/* Header & Title Banner */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Users className="size-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                ব্যবহারকারী ও কর্মী ব্যবস্থাপনা
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            সকল ফিল্ড অফিসার, ব্রাঞ্চ ম্যানেজার ও অ্যাডমিন অ্যাকাউন্ট নিয়ন্ত্রণ, রোল অ্যাসাইন এবং কার্যক্রম পর্যবেক্ষণ করুন।
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => {
                                resetCreate();
                                setCreateModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <UserPlus className="size-4" />
                            <span>নতুন ব্যবহারকারী যোগ করুন</span>
                        </Button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
                    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4 sm:p-5">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    মোট ইউজার
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-foreground sm:text-3xl">
                                    {summary.total_users}
                                </p>
                            </div>
                            <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                <Users className="size-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4 sm:p-5">
                            <div>
                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    ফিল্ড কর্মী
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                                    {summary.total_workers}
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                                <UserCheck className="size-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4 sm:p-5">
                            <div>
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                    ব্রাঞ্চ ম্যানেজার
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-amber-600 dark:text-amber-400 sm:text-3xl">
                                    {summary.total_managers}
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                                <Building2 className="size-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4 sm:p-5">
                            <div>
                                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                    সিস্টেম অ্যাডমিন
                                </p>
                                <p className="mt-1 text-2xl font-extrabold text-rose-600 dark:text-rose-400 sm:text-3xl">
                                    {summary.total_admins}
                                </p>
                            </div>
                            <div className="rounded-xl bg-rose-500/10 p-3 text-rose-600 dark:text-rose-400">
                                <Shield className="size-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <Card className="border-border/60 bg-card/80">
                    <CardContent className="p-4 sm:p-5">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="নাম, ইউজারনেম, কোড, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-8"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            applyFilters('', selectedBranch, selectedRole);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            {/* Branch Filter */}
                            <div className="w-full md:w-56">
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => {
                                        setSelectedBranch(e.target.value);
                                        applyFilters(searchQuery, e.target.value, selectedRole);
                                    }}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="all">সকল শাখা (All Branches)</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.branch_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Filter */}
                            <div className="w-full md:w-48">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => {
                                        setSelectedRole(e.target.value);
                                        applyFilters(searchQuery, selectedBranch, e.target.value);
                                    }}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="all">সকল রোল (All Roles)</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button type="submit" variant="secondary" className="gap-2">
                                <Filter className="size-4" />
                                <span>ফিল্টার</span>
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Users Table / List */}
                <Card className="border-border/60 overflow-hidden shadow-sm">
                    <CardHeader className="border-b border-border/40 bg-muted/20 px-5 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">
                                    ব্যবহারকারী তালিকা ({users.length} জন)
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    প্রতিটি ইউজারের তথ্য সম্পাদনা করুন বা নির্দিষ্ট ইউজারের রিপোর্ট দেখুন
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="rounded-full bg-muted p-4 text-muted-foreground">
                                    <Users className="size-8" />
                                </div>
                                <h3 className="mt-3 text-base font-semibold text-foreground">
                                    কোন ব্যবহারকারী পাওয়া যায়নি
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা নতুন ব্যবহারকারী তৈরি করুন।
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile Cards View (< md) */}
                                <div className="divide-y divide-border/40 md:hidden">
                                    {users.map((u) => (
                                        <div key={u.id} className="p-4 space-y-3 transition-colors hover:bg-muted/20">
                                            {/* Header row: Avatar + Name + Code + Role */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary text-sm shadow-2xs">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-sm text-foreground truncate">{u.name}</h4>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {u.employee_code ? `#${u.employee_code} • ` : ''}@{u.username}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">{getRoleBadge(u.role?.slug)}</div>
                                            </div>

                                            {/* Info Badges & Branch */}
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
                                                <div className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium text-foreground">
                                                    <MapPin className="size-3 text-primary shrink-0" />
                                                    <span className="truncate max-w-[140px]">{u.branch?.name || 'প্রধান কার্যালয়'}</span>
                                                </div>
                                                {u.designation && (
                                                    <div className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-muted-foreground">
                                                        <span>{u.designation}</span>
                                                    </div>
                                                )}
                                                <div className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 font-bold text-blue-600 dark:text-blue-400 ml-auto">
                                                    <Activity className="size-3" />
                                                    <span>{u.daily_activities_count} কাজ</span>
                                                </div>
                                            </div>

                                            {/* Contact Details */}
                                            <div className="space-y-1 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <Mail className="size-3 text-muted-foreground shrink-0" />
                                                        <span className="truncate">{u.email}</span>
                                                    </span>
                                                </div>
                                                {u.phone && (
                                                    <div className="flex items-center justify-between pt-1 border-t border-border/30">
                                                        <a href={`tel:${u.phone}`} className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
                                                            <Phone className="size-3 shrink-0" />
                                                            <span>{u.phone}</span>
                                                        </a>
                                                        <span className="text-[10px] text-muted-foreground">ট্যাপ করে কল করুন</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions Toolbar */}
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <Link
                                                    href={`/reports?user_id=${u.id}&branch_id=${u.branch_id || 'all'}`}
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 py-2 text-xs font-bold text-primary transition hover:bg-primary/15"
                                                >
                                                    <FileText className="size-3.5" />
                                                    <span>রিপোর্ট দেখুন</span>
                                                </Link>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(u)}
                                                    className="h-9 px-3 text-xs gap-1.5 rounded-xl"
                                                >
                                                    <Edit2 className="size-3.5" />
                                                    <span>এডিট</span>
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDeletingUser(u);
                                                        setDeleteModalOpen(true);
                                                    }}
                                                    className="h-9 px-3 text-xs text-rose-600 hover:bg-rose-500/10 rounded-xl"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View (>= md) */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-border/40 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3.5">কর্মকর্তা / ইউজার</th>
                                                <th className="px-4 py-3.5">রোল ও পদবী</th>
                                                <th className="px-4 py-3.5">শাখা</th>
                                                <th className="px-4 py-3.5">যোগাযোগ</th>
                                                <th className="px-4 py-3.5 text-center">অ্যাক্টিভিটি সংখ্যা</th>
                                                <th className="px-4 py-3.5 text-right">পদক্ষেপ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                            {users.map((u) => (
                                                <tr
                                                    key={u.id}
                                                    className="group transition-colors hover:bg-muted/30"
                                                >
                                                    {/* Officer Name & Code */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                                                {u.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-foreground flex items-center gap-2">
                                                                    <span>{u.name}</span>
                                                                    {u.employee_code && (
                                                                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                                                                            {u.employee_code}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    ইউজারনেম: <span className="font-mono">{u.username}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Role & Designation */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="space-y-1">
                                                            <div>{getRoleBadge(u.role?.slug)}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {u.designation || 'পদবী নেই'}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Branch */}
                                                    <td className="px-4 py-3.5">
                                                        {u.branch ? (
                                                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                                                                <MapPin className="size-3.5 text-muted-foreground" />
                                                                <span>{u.branch.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                প্রধান কার্যালয় / অনির্ধারিত
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Contact */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="space-y-0.5 text-xs">
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Mail className="size-3" />
                                                                <span className="truncate max-w-[160px]">{u.email}</span>
                                                            </div>
                                                            {u.phone && (
                                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                                    <Phone className="size-3" />
                                                                    <span>{u.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Activity Stats */}
                                                    <td className="px-4 py-3.5 text-center">
                                                        <div className="inline-flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                                <Activity className="size-3" />
                                                                {u.daily_activities_count} কাজ
                                                            </span>
                                                            {u.health_camps_count > 0 && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                                                                    {u.health_camps_count} ক্যাম্প
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {/* Direct View User Report */}
                                                            <Link
                                                                href={`/reports?user_id=${u.id}&branch_id=${u.branch_id || 'all'}`}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                                                                title="ইউজারের রিপোর্ট দেখুন"
                                                            >
                                                                <FileText className="size-3.5" />
                                                                <span className="hidden sm:inline">রিপোর্ট</span>
                                                            </Link>

                                                            {/* Edit Button */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleOpenEdit(u)}
                                                                className="h-8 px-2.5 text-xs gap-1"
                                                                title="তথ্য সম্পাদন করুন"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                                <span className="hidden sm:inline">এডিট</span>
                                                            </Button>

                                                            {/* Delete Button */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setDeletingUser(u);
                                                                    setDeleteModalOpen(true);
                                                                }}
                                                                className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                                                                title="ইউজার মুছুন"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Add User Modal Dialog */}
                <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserPlus className="size-5 text-primary" />
                                <span>নতুন ব্যবহারকারী অ্যাকাউন্ট তৈরি করুন</span>
                            </DialogTitle>
                            <DialogDescription>
                                ফিল্ড অফিসার, ম্যানেজার বা অ্যাডমিন অ্যাকাউন্টের বিস্তারিত তথ্য প্রদান করুন।
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveCreate} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="create_name">কর্মকর্তার পুরো নাম *</Label>
                                    <Input
                                        id="create_name"
                                        required
                                        placeholder="যেমন: মোঃ কামাল হোসেন"
                                        value={createData.name}
                                        onChange={(e) => setCreateData('name', e.target.value)}
                                    />
                                    <InputError message={createErrors.name} />
                                </div>

                                {/* Username */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_username">ইউজারনেম (Username)</Label>
                                    <Input
                                        id="create_username"
                                        placeholder="যেমন: kamal.phcp"
                                        value={createData.username}
                                        onChange={(e) => setCreateData('username', e.target.value)}
                                    />
                                    <InputError message={createErrors.username} />
                                </div>

                                {/* Employee Code */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_employee_code">কর্মচারী কোড (PIN / Code)</Label>
                                    <Input
                                        id="create_employee_code"
                                        placeholder="যেমন: PHCP-1042"
                                        value={createData.employee_code}
                                        onChange={(e) => setCreateData('employee_code', e.target.value)}
                                    />
                                    <InputError message={createErrors.employee_code} />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_email">ইমেইল ঠিকানা *</Label>
                                    <Input
                                        id="create_email"
                                        type="email"
                                        required
                                        placeholder="officer@mcare.local"
                                        value={createData.email}
                                        onChange={(e) => setCreateData('email', e.target.value)}
                                    />
                                    <InputError message={createErrors.email} />
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_phone">মোবাইল নম্বর</Label>
                                    <Input
                                        id="create_phone"
                                        placeholder="017xxxxxxxx"
                                        value={createData.phone}
                                        onChange={(e) => setCreateData('phone', e.target.value)}
                                    />
                                    <InputError message={createErrors.phone} />
                                </div>

                                {/* Designation */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="create_designation">পদবী (Designation)</Label>
                                    <Input
                                        id="create_designation"
                                        placeholder="যেমন: প্যারামেডিক / হেলথ অফিসার"
                                        value={createData.designation}
                                        onChange={(e) => setCreateData('designation', e.target.value)}
                                    />
                                    <InputError message={createErrors.designation} />
                                </div>

                                {/* Role */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_role_id">সিস্টেম রোল (Role) *</Label>
                                    <select
                                        id="create_role_id"
                                        required
                                        value={createData.role_id}
                                        onChange={(e) => setCreateData('role_id', e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">রোল নির্বাচন করুন</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={createErrors.role_id} />
                                </div>

                                {/* Branch */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_branch_id">কর্মরত শাখা (Branch)</Label>
                                    <select
                                        id="create_branch_id"
                                        value={createData.branch_id}
                                        onChange={(e) => setCreateData('branch_id', e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">প্রধান কার্যালয় / অনির্ধারিত</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} ({b.branch_code})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={createErrors.branch_id} />
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="create_password">লগইন পাসওয়ার্ড *</Label>
                                    <Input
                                        id="create_password"
                                        type="password"
                                        required
                                        placeholder="পাসওয়ার্ড লিখুন (কমপক্ষে ৮ অক্ষর)"
                                        value={createData.password}
                                        onChange={(e) => setCreateData('password', e.target.value)}
                                    />
                                    <InputError message={createErrors.password} />
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCreateModalOpen(false)}
                                    disabled={createProcessing}
                                >
                                    বাতিল
                                </Button>
                                <Button type="submit" disabled={createProcessing} className="gap-2">
                                    {createProcessing ? <RefreshCw className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                                    <span>অ্যাকাউন্ট তৈরি করুন</span>
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit User Modal Dialog */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit2 className="size-5 text-primary" />
                                <span>ব্যবহারকারীর তথ্য পরিবর্তন ও হালনাগাদ</span>
                            </DialogTitle>
                            <DialogDescription>
                                {editingUser?.name} এর তথ্য ও রোল পরিবর্তন করুন।
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="edit_name">কর্মকর্তার পুরো নাম *</Label>
                                    <Input
                                        id="edit_name"
                                        required
                                        value={editData.name}
                                        onChange={(e) => setEditData('name', e.target.value)}
                                    />
                                    <InputError message={editErrors.name} />
                                </div>

                                {/* Username */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_username">ইউজারনেম (Username)</Label>
                                    <Input
                                        id="edit_username"
                                        value={editData.username}
                                        onChange={(e) => setEditData('username', e.target.value)}
                                    />
                                    <InputError message={editErrors.username} />
                                </div>

                                {/* Employee Code */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_employee_code">কর্মচারী কোড (PIN / Code)</Label>
                                    <Input
                                        id="edit_employee_code"
                                        value={editData.employee_code}
                                        onChange={(e) => setEditData('employee_code', e.target.value)}
                                    />
                                    <InputError message={editErrors.employee_code} />
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_email">ইমেইল ঠিকানা *</Label>
                                    <Input
                                        id="edit_email"
                                        type="email"
                                        required
                                        value={editData.email}
                                        onChange={(e) => setEditData('email', e.target.value)}
                                    />
                                    <InputError message={editErrors.email} />
                                </div>

                                {/* Phone */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_phone">মোবাইল নম্বর</Label>
                                    <Input
                                        id="edit_phone"
                                        value={editData.phone}
                                        onChange={(e) => setEditData('phone', e.target.value)}
                                    />
                                    <InputError message={editErrors.phone} />
                                </div>

                                {/* Designation */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="edit_designation">পদবী (Designation)</Label>
                                    <Input
                                        id="edit_designation"
                                        value={editData.designation}
                                        onChange={(e) => setEditData('designation', e.target.value)}
                                    />
                                    <InputError message={editErrors.designation} />
                                </div>

                                {/* Role */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_role_id">সিস্টেম রোল (Role)</Label>
                                    <select
                                        id="edit_role_id"
                                        value={editData.role_id}
                                        onChange={(e) => setEditData('role_id', e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">রোল নির্বাচন করুন</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={editErrors.role_id} />
                                </div>

                                {/* Branch */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_branch_id">কর্মরত শাখা (Branch)</Label>
                                    <select
                                        id="edit_branch_id"
                                        value={editData.branch_id}
                                        onChange={(e) => setEditData('branch_id', e.target.value)}
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="">প্রধান কার্যালয় / অনির্ধারিত</option>
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} ({b.branch_code})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={editErrors.branch_id} />
                                </div>

                                {/* Password Reset (Optional) */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label htmlFor="edit_password">
                                        নতুন পাসওয়ার্ড সেট করুন (পরিবর্তন না করতে চাইলে খালি রাখুন)
                                    </Label>
                                    <Input
                                        id="edit_password"
                                        type="password"
                                        placeholder="পাসওয়ার্ড অপরিবর্তিত রাখতে খালি রাখুন"
                                        value={editData.password}
                                        onChange={(e) => setEditData('password', e.target.value)}
                                    />
                                    <InputError message={editErrors.password} />
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditModalOpen(false)}
                                    disabled={editProcessing}
                                >
                                    বাতিল
                                </Button>
                                <Button type="submit" disabled={editProcessing} className="gap-2">
                                    {editProcessing ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                                    <span>হালনাগাদ সংরক্ষণ করুন</span>
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-rose-600">
                                <AlertCircle className="size-5" />
                                <span>ব্যবহারকারী অ্যাকাউন্ট মুছে ফেলুন</span>
                            </DialogTitle>
                            <DialogDescription>
                                আপনি কি নিশ্চিত যে আপনি <strong>{deletingUser?.name}</strong> এর অ্যাকাউন্ট মুছে ফেলতে চান?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-800 dark:text-rose-200">
                            এই কর্মীর সাবমিট করা পূর্বের ফিল্ড কার্যক্রম ও তথ্য ডাটাবেজে সংরক্ষিত থাকবে, কিন্তু তিনি আর লগইন করতে পারবেন না।
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeleteModalOpen(false)}
                            >
                                বাতিল
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                className="gap-2"
                            >
                                <Trash2 className="size-4" />
                                <span>হ্যাঁ, মুছে ফেলুন</span>
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AdminUsersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'User Management', href: '/admin/users' },
    ],
};
