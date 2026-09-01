import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Building2,
    Calendar,
    ClipboardList,
    Eye,
    Filter,
    HeartPulse,
    Home,
    MapPin,
    Plus,
    Search,
    Sparkles,
    Stethoscope,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';
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
};

export default function ActivitiesIndex({ activities }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filteredList = activities.data.filter((act) => {
        if (categoryFilter !== 'all') {
            if (categoryFilter === 'samity' && act.task_type?.slug !== 'samity-task') return false;
            if (categoryFilter === 'household' && act.task_type?.slug !== 'household-visit') return false;
            if (categoryFilter === 'static' && act.task_type?.slug !== 'static-clinic') return false;
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const taskName = (act.task_subtype?.name || act.task_type?.name || '').toLowerCase();
            const location = (act.samity?.name || act.branch?.name || '').toLowerCase();
            const officer = (act.user?.name || '').toLowerCase();
            return taskName.includes(q) || location.includes(q) || officer.includes(q);
        }
        return true;
    });

    return (
        <>
            <Head title="Daily Activities — M Care" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header Row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ClipboardList className="size-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Daily Activities
                            </h1>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Complete archive of field logs, health sessions, and clinic visits
                        </p>
                    </div>

                    <Button asChild className="rounded-xl shadow-xs self-start sm:self-auto">
                        <Link href={dashboard()}>
                            <Plus className="size-4 mr-1.5" />
                            Log New Activity
                        </Link>
                    </Button>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by task name, samity, or officer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-9 text-xs rounded-xl bg-background/50"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                            <Filter className="size-3" /> Filter:
                        </span>
                        {['all', 'samity', 'household', 'static'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategoryFilter(cat)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                                    categoryFilter === cat
                                        ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                                        : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {cat}
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
                            Try adjusting your search filters or record a new activity from the dashboard.
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
                                    activity.form_data?.members_visited;

                                return (
                                    <Link
                                        key={activity.id}
                                        href={`/activities/${activity.id}`}
                                        className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all active:bg-accent/50"
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
                                                    className="text-[10px]"
                                                >
                                                    {beneficiaries} reached
                                                </Badge>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                                                <MapPin className="size-3 shrink-0" />
                                                {activity.samity?.name ??
                                                    activity.branch?.name ??
                                                    'Branch level'}
                                            </span>
                                            <span className="text-primary font-semibold flex items-center gap-0.5">
                                                View Report <ArrowRight className="size-3" />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Desktop Table View (>= 768px) */}
                        <div className="hidden md:block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
                            <table className="w-full text-xs">
                                <thead className="bg-muted/40 text-left border-b border-border/70">
                                    <tr>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Date
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Activity / Task
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Location (Samity/Branch)
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Coverage
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Officer
                                        </th>
                                        <th className="px-5 py-3.5 text-right font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Action
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
                                            activity.form_data?.members_visited;

                                        return (
                                            <tr
                                                key={activity.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                                                    {formatDate(activity.activity_date)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <Icon className="size-3.5" />
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
                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="size-3 text-primary shrink-0" />
                                                        {activity.samity?.name ??
                                                            activity.branch?.name ??
                                                            'Branch level'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {beneficiaries ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] font-medium"
                                                        >
                                                            {beneficiaries} beneficiaries
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px]"
                                                    >
                                                        {activity.user?.name ?? 'Officer'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
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
        </>
    );
}

ActivitiesIndex.layout = {
    breadcrumbs: [
        { title: "Today's Task", href: dashboard() },
        { title: 'Activities', href: '/activities' },
    ],
};
