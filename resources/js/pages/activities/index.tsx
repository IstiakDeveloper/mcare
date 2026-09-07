import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Building2,
    Calendar,
    CheckCircle2,
    ClipboardList,
    Edit,
    Eye,
    Filter,
    HeartPulse,
    Home,
    MapPin,
    Pen,
    Plus,
    Search,
    Sparkles,
    Stethoscope,
    Trash2,
    User,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { Auth } from '@/types';
import type { DailyActivity, Paginated } from '@/types/mcare';

const taskIcons: Record<string, typeof Users> = {
    'samity-task': Users,
    'uthan-boithok': Users,
    'satellite-clinic': Stethoscope,
    'awareness-session': Sparkles,
    'household-visit': Home,
    'static-clinic': Activity,
};

type Props = {
    activities: Paginated<DailyActivity>;
    branches?: { id: number; name: string }[];
    officers?: { id: number; name: string; branch_id?: number; employee_code?: string }[];
    filters?: {
        branch_id: string;
        user_id: string;
        search: string;
    };
};

export default function ActivitiesIndex({
    activities,
    branches = [],
    officers = [],
    filters = { branch_id: 'all', user_id: 'all', search: '' },
}: Props) {
    const { props } = usePage<{ auth?: Auth; flash?: { status?: string; toast?: { message: string } } }>();
    const user = props.auth?.user;
    const isAdmin = user?.role === 'admin';

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [branchFilter, setBranchFilter] = useState(filters.branch_id || 'all');
    const [officerFilter, setOfficerFilter] = useState(filters.user_id || 'all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Modals
    const [editingActivity, setEditingActivity] = useState<DailyActivity | null>(null);
    const [editForm, setEditForm] = useState({
        activity_date: '',
        attendees_count: '',
        remarks: '',
    });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const [deletingActivity, setDeletingActivity] = useState<DailyActivity | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleApplyServerFilters = (newBranch?: string, newUser?: string, newSearch?: string) => {
        const b = newBranch !== undefined ? newBranch : branchFilter;
        const u = newUser !== undefined ? newUser : officerFilter;
        const s = newSearch !== undefined ? newSearch : searchQuery;

        router.get(
            '/activities',
            {
                branch_id: b,
                user_id: u,
                search: s,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleOpenEdit = (act: DailyActivity) => {
        const data = act.form_data || {};
        const count =
            data.attendees_count ||
            data.patients_served ||
            data.members_visited ||
            (Array.isArray(data.patients) ? data.patients.length : '');

        setEditForm({
            activity_date: act.activity_date || '',
            attendees_count: count ? String(count) : '',
            remarks: (data.notes as string) || (data.remarks as string) || '',
        });
        setEditingActivity(act);
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingActivity) return;

        setIsSavingEdit(true);

        const updatedFormData: Record<string, unknown> = {
            ...(editingActivity.form_data || {}),
            notes: editForm.remarks,
        };

        if (editForm.attendees_count !== '') {
            if (editingActivity.task_type?.slug === 'household-visit') {
                updatedFormData.members_visited = Number(editForm.attendees_count);
            } else if (editingActivity.task_type?.slug === 'static-clinic') {
                updatedFormData.patients_served = Number(editForm.attendees_count);
            } else {
                updatedFormData.attendees_count = Number(editForm.attendees_count);
            }
        }

        router.put(
            `/activities/${editingActivity.id}`,
            {
                activity_date: editForm.activity_date,
                form_data: updatedFormData,
                remarks: editForm.remarks,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingActivity(null);
                    setIsSavingEdit(false);
                },
                onError: () => {
                    setIsSavingEdit(false);
                },
            },
        );
    };

    const handleConfirmDelete = () => {
        if (!deletingActivity) return;

        setIsDeleting(true);
        router.delete(`/activities/${deletingActivity.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingActivity(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    // Client-side quick filter for task categories
    const filteredList = activities.data.filter((act) => {
        if (categoryFilter !== 'all') {
            if (categoryFilter === 'samity' && act.task_type?.slug !== 'samity-task') return false;
            if (categoryFilter === 'household' && act.task_type?.slug !== 'household-visit') return false;
            if (categoryFilter === 'static' && act.task_type?.slug !== 'static-clinic') return false;
        }
        return true;
    });

    const filteredOfficers = officers.filter((o) => {
        if (branchFilter === 'all') return true;
        return String(o.branch_id) === String(branchFilter);
    });

    return (
        <>
            <Head title="Activity Logs — M Care System" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ClipboardList className="size-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Activity Logs & Field Records
                            </h1>
                            {isAdmin && (
                                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold">
                                    Admin Master View (All Staff)
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {isAdmin
                                ? 'Full operational log of all health officers and field workers with management privileges'
                                : 'Complete archive of your field activities and health session logs'}
                        </p>
                    </div>

                    {!isAdmin && (
                        <Button asChild className="rounded-xl shadow-xs self-start sm:self-auto">
                            <Link href={dashboard()}>
                                <Plus className="size-4 mr-1.5" />
                                Log New Activity
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                    {/* Top row: Search & Multi-level dropdowns (Branch / Officer) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by task, samity, or officer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleApplyServerFilters(branchFilter, officerFilter, searchQuery);
                                }}
                                className="h-9 pl-9 text-xs rounded-xl bg-background/50"
                            />
                        </div>

                        {/* Branch Filter (Admin Only) */}
                        {isAdmin && (
                            <div>
                                <select
                                    value={branchFilter}
                                    onChange={(e) => {
                                        setBranchFilter(e.target.value);
                                        setOfficerFilter('all');
                                        handleApplyServerFilters(e.target.value, 'all', searchQuery);
                                    }}
                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground"
                                >
                                    <option value="all">All Branches (সকল শাখা)</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Officer Filter (Admin Only) */}
                        {isAdmin && (
                            <div>
                                <select
                                    value={officerFilter}
                                    onChange={(e) => {
                                        setOfficerFilter(e.target.value);
                                        handleApplyServerFilters(branchFilter, e.target.value, searchQuery);
                                    }}
                                    className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground"
                                >
                                    <option value="all">All Officers (সকল কর্মকর্তা)</option>
                                    {filteredOfficers.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name} {o.employee_code ? `(${o.employee_code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Search Action Button */}
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => handleApplyServerFilters(branchFilter, officerFilter, searchQuery)}
                                className="h-9 rounded-xl text-xs font-semibold px-4 flex-1"
                            >
                                <Search className="size-3.5 mr-1" /> Search
                            </Button>
                            {(branchFilter !== 'all' || officerFilter !== 'all' || searchQuery !== '') && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setBranchFilter('all');
                                        setOfficerFilter('all');
                                        setSearchQuery('');
                                        handleApplyServerFilters('all', 'all', '');
                                    }}
                                    className="h-9 rounded-xl text-xs"
                                >
                                    <X className="size-3.5 mr-1" /> Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Row: Quick Category Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 pt-1 border-t border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                            <Filter className="size-3" /> Category:
                        </span>
                        {[
                            { key: 'all', label: 'All Activities' },
                            { key: 'samity', label: 'Samity Task' },
                            { key: 'household', label: 'Household Visit' },
                            { key: 'static', label: 'Static Clinic' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => setCategoryFilter(cat.key)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                    categoryFilter === cat.key
                                        ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content View: Desktop Table + Mobile Cards */}
                {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card">
                        <ClipboardList className="size-10 text-muted-foreground/60" />
                        <h3 className="mt-3 text-sm font-semibold text-foreground">
                            No activities match your criteria
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                            Try adjusting your filters or search terms.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View (< 768px) */}
                        <div className="grid gap-3 md:hidden">
                            {filteredList.map((activity) => {
                                const slug =
                                    activity.task_subtype?.slug ||
                                    activity.task_type?.slug ||
                                    '';
                                const Icon = taskIcons[slug] ?? HeartPulse;
                                const beneficiaries =
                                    activity.form_data?.attendees_count ??
                                    activity.form_data?.patients_served ??
                                    activity.form_data?.members_visited ??
                                    (Array.isArray(activity.form_data?.patients) ? activity.form_data.patients.length : null);

                                return (
                                    <div
                                        key={activity.id}
                                        className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                                                    <Icon className="size-4.5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {activity.task_subtype?.name ??
                                                            activity.task_type?.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Calendar className="size-3" />
                                                        {formatDate(activity.activity_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            {beneficiaries ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold"
                                                >
                                                    {beneficiaries} Beneficiaries
                                                </Badge>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                                                <MapPin className="size-3 shrink-0 text-emerald-600" />
                                                {activity.samity?.name ??
                                                    activity.branch?.name ??
                                                    'Branch level'}
                                            </span>
                                            <span className="font-medium text-foreground">
                                                By: <strong>{activity.user?.name || 'Officer'}</strong>
                                            </span>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-xl text-xs gap-1"
                                            >
                                                <Link href={`/activities/${activity.id}`}>
                                                    <Eye className="size-3.5" /> View Report
                                                </Link>
                                            </Button>

                                            {isAdmin && (
                                                <div className="flex items-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenEdit(activity)}
                                                        className="h-8 px-2 text-xs text-blue-600 hover:bg-blue-500/10"
                                                    >
                                                        <Pen className="size-3.5 mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingActivity(activity)}
                                                        className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-500/10"
                                                    >
                                                        <Trash2 className="size-3.5 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View (>= 768px) */}
                        <div className="hidden md:block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/40 text-left border-b border-border/70">
                                    <tr>
                                        <th className="px-4 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Date
                                        </th>
                                        <th className="px-4 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Activity / Task
                                        </th>
                                        <th className="px-4 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Location & Samity
                                        </th>
                                        <th className="px-4 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Beneficiaries
                                        </th>
                                        <th className="px-4 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Submitted Officer
                                        </th>
                                        <th className="px-4 py-3.5 text-right font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredList.map((activity) => {
                                        const slug =
                                            activity.task_subtype?.slug ||
                                            activity.task_type?.slug ||
                                            '';
                                        const Icon = taskIcons[slug] ?? HeartPulse;
                                        const beneficiaries =
                                            activity.form_data?.attendees_count ??
                                            activity.form_data?.patients_served ??
                                            activity.form_data?.members_visited ??
                                            (Array.isArray(activity.form_data?.patients) ? activity.form_data.patients.length : null);

                                        return (
                                            <tr
                                                key={activity.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                                                    {formatDate(activity.activity_date)}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                                                            <Icon className="size-4" />
                                                        </div>
                                                        <div>
                                                            <Link
                                                                href={`/activities/${activity.id}`}
                                                                className="font-bold text-foreground hover:text-primary hover:underline"
                                                            >
                                                                {activity.task_subtype?.name ??
                                                                    activity.task_type?.name}
                                                            </Link>
                                                            {activity.task_subtype ? (
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {activity.task_type?.name}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-muted-foreground">
                                                    <div className="font-medium text-foreground flex items-center gap-1">
                                                        <MapPin className="size-3 text-emerald-600 shrink-0" />
                                                        {activity.samity?.name || 'General Area'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {activity.branch?.name || 'Main Branch'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {beneficiaries ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                                        >
                                                            {beneficiaries} Person(s)
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-foreground">
                                                        {activity.user?.name ?? 'Officer'}
                                                    </div>
                                                    {activity.user?.employee_code && (
                                                        <div className="text-[10px] font-mono text-muted-foreground">
                                                            {activity.user.employee_code}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className="h-8 rounded-lg text-xs"
                                                        >
                                                            <Link href={`/activities/${activity.id}`}>
                                                                <Eye className="size-3.5 mr-1" />
                                                                View
                                                            </Link>
                                                        </Button>

                                                        {isAdmin && (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOpenEdit(activity)}
                                                                    className="h-8 px-2.5 rounded-lg text-xs border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10"
                                                                >
                                                                    <Pen className="size-3.5 mr-1" /> Edit
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setDeletingActivity(activity)}
                                                                    className="h-8 px-2.5 rounded-lg text-xs border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10"
                                                                >
                                                                    <Trash2 className="size-3.5 mr-1" /> Delete
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Pagination Controls */}
                {activities.last_page > 1 ? (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                        {activities.links.map((link) =>
                            link.url ? (
                                <Link
                                    key={link.label}
                                    href={link.url}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                                            : 'border-border/80 hover:bg-muted text-foreground'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={link.label}
                                    className="rounded-xl border border-border/50 px-3 py-1.5 text-xs text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </div>
                ) : null}
            </div>

            {/* ADMIN EDIT ACTIVITY MODAL */}
            <Dialog open={Boolean(editingActivity)} onOpenChange={(open) => !open && setEditingActivity(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <Pen className="size-4 text-primary" /> Edit Activity Record
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Update the activity date, beneficiaries count, or notes for{' '}
                            <strong>
                                {editingActivity?.task_subtype?.name || editingActivity?.task_type?.name}
                            </strong>
                        </DialogDescription>
                    </DialogHeader>

                    {editingActivity && (
                        <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Activity Date</Label>
                                <Input
                                    type="date"
                                    value={editForm.activity_date}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, activity_date: e.target.value })
                                    }
                                    required
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Beneficiaries / Attendees Count
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editForm.attendees_count}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, attendees_count: e.target.value })
                                    }
                                    placeholder="e.g. 15"
                                    className="h-9 text-xs rounded-xl"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Remarks / Notes</Label>
                                <Textarea
                                    rows={3}
                                    value={editForm.remarks}
                                    onChange={(e) =>
                                        setEditForm({ ...editForm, remarks: e.target.value })
                                    }
                                    placeholder="Enter additional activity notes..."
                                    className="text-xs rounded-xl resize-none"
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingActivity(null)}
                                    className="rounded-xl text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSavingEdit}
                                    className="rounded-xl text-xs font-bold"
                                >
                                    {isSavingEdit ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ADMIN DELETE CONFIRMATION DIALOG */}
            <Dialog open={Boolean(deletingActivity)} onOpenChange={(open) => !open && setDeletingActivity(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
                            <AlertCircle className="size-5 text-destructive" /> Delete Activity Record?
                        </DialogTitle>
                        <DialogDescription className="text-xs leading-relaxed">
                            Are you sure you want to delete this activity record submitted by{' '}
                            <strong>{deletingActivity?.user?.name}</strong> on{' '}
                            <strong>{deletingActivity?.activity_date}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="pt-2 gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingActivity(null)}
                            className="rounded-xl text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                            onClick={handleConfirmDelete}
                            className="rounded-xl text-xs font-bold"
                        >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete Record'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ActivitiesIndex.layout = {
    breadcrumbs: [
        { title: "Today's Task", href: dashboard() },
        { title: 'Activities', href: '/activities' },
    ],
};
