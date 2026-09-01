import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    Calendar,
    Eye,
    MapPin,
    Plus,
    Search,
    Tent,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { HealthCamp, Paginated } from '@/types/mcare';

type Props = {
    camps: Paginated<HealthCamp>;
};

export default function HealthCampsIndex({ camps }: Props) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCamps = camps.data.filter((camp) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const campName = String(
            camp.service_data?.camp_name ?? 'Health Camp',
        ).toLowerCase();
        const location = String(
            camp.service_data?.location ?? camp.branch?.name ?? '',
        ).toLowerCase();
        const officer = (camp.entered_by?.name ?? '').toLowerCase();
        return (
            campName.includes(q) || location.includes(q) || officer.includes(q)
        );
    });

    return (
        <>
            <Head title="Health Camps — M Care" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Tent className="size-5" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Health Camps
                            </h1>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Branch-level health camps, community outreach, and special clinic drives
                        </p>
                    </div>

                    <Button
                        asChild
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs self-start sm:self-auto"
                    >
                        <Link href="/health-camps/create">
                            <Plus className="size-4 mr-1.5" />
                            Record Health Camp
                        </Link>
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by camp name, venue, or branch..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 pl-9 text-xs rounded-xl bg-background/50"
                        />
                    </div>
                </div>

                {/* Main Content: Mobile Cards + Desktop Table */}
                {filteredCamps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card">
                        <Tent className="size-10 text-muted-foreground/60" />
                        <h3 className="mt-3 text-sm font-semibold text-foreground">
                            No health camps recorded yet
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                            Log medical camp drives and outreach services conducted by your branch.
                        </p>
                        <Button
                            asChild
                            size="sm"
                            className="mt-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
                        >
                            <Link href="/health-camps/create">
                                <Plus className="size-4 mr-1" />
                                Record First Camp
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards View (< 768px) */}
                        <div className="grid gap-3 md:hidden">
                            {filteredCamps.map((camp) => {
                                const campName = String(
                                    camp.service_data?.camp_name ?? 'Health Camp',
                                );
                                const location = String(
                                    camp.service_data?.location ??
                                        camp.branch?.name ??
                                        '—',
                                );
                                const patients = camp.service_data?.patients_served;

                                return (
                                    <Link
                                        key={camp.id}
                                        href={`/health-camps/${camp.id}`}
                                        className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs transition-all active:bg-accent/50"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                                                    <Tent className="size-4.5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {campName}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Calendar className="size-3" />
                                                        {formatDate(camp.activity_date)}
                                                    </p>
                                                </div>
                                            </div>
                                            {patients ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                                >
                                                    {patients} served
                                                </Badge>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                                                <MapPin className="size-3 shrink-0" />
                                                {location}
                                            </span>
                                            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                                                View Details <ArrowRight className="size-3" />
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
                                            Camp Details
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Branch / Location
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Patients Reached
                                        </th>
                                        <th className="px-5 py-3.5 font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Entered By
                                        </th>
                                        <th className="px-5 py-3.5 text-right font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filteredCamps.map((camp) => {
                                        const campName = String(
                                            camp.service_data?.camp_name ??
                                                'Health Camp',
                                        );
                                        const location = String(
                                            camp.service_data?.location ??
                                                camp.branch?.name ??
                                                '—',
                                        );
                                        const patients =
                                            camp.service_data?.patients_served;

                                        return (
                                            <tr
                                                key={camp.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                                                    {formatDate(camp.activity_date)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                            <Tent className="size-3.5" />
                                                        </div>
                                                        <Link
                                                            href={`/health-camps/${camp.id}`}
                                                            className="font-bold text-foreground hover:text-amber-600 hover:underline"
                                                        >
                                                            {campName}
                                                        </Link>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="size-3 text-amber-600 shrink-0" />
                                                        {location}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {patients ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]"
                                                        >
                                                            {patients} patients
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
                                                        {camp.entered_by?.name ?? 'Officer'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                        className="h-8 rounded-lg text-xs"
                                                    >
                                                        <Link href={`/health-camps/${camp.id}`}>
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

                {/* Pagination */}
                {camps.last_page > 1 ? (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                        {camps.links.map((link) =>
                            link.url ? (
                                <Link
                                    key={link.label}
                                    href={link.url}
                                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        link.active
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
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

HealthCampsIndex.layout = {
    breadcrumbs: [
        { title: "Today's Task", href: dashboard() },
        { title: 'Health Camps', href: '/health-camps' },
    ],
};
