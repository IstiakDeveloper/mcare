import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    FileText,
    MapPin,
    Plus,
    Printer,
    Tent,
    User,
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
import { formatDate } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { HealthCamp } from '@/types/mcare';
import { Eye, FileImage } from 'lucide-react';

type Props = {
    camp: HealthCamp;
};

export default function HealthCampShow({ camp }: Props) {
    const rawData = camp.service_data ?? {};
    const attachments = (Array.isArray(rawData.attachments) ? rawData.attachments : []) as string[];
    const entries = Object.entries(rawData).filter(([k]) => k !== 'attachments');
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const campName = String(rawData.camp_name ?? 'Health Camp');

    return (
        <>
            <Head title={`${campName} Summary — M Care`} />

            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Actions & Back Button */}
                <div className="flex items-center justify-between print:hidden">
                    <Link
                        href="/health-camps"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Health Camps
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
                        <Button
                            size="sm"
                            asChild
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs"
                        >
                            <Link href="/health-camps/create">
                                <Plus className="size-3.5 mr-1" />
                                Record Another Camp
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Report Card */}
                <div className="rounded-2xl border border-amber-500/30 bg-card p-6 md:p-8 shadow-xs space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                        <div className="flex items-center gap-3.5">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-xs">
                                <Tent className="size-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    Branch Medical Camp Report
                                </span>
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    {campName}
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Special Community Health Drive
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-1">
                            <Badge
                                variant="secondary"
                                className="px-3 py-1 text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 self-start sm:self-auto"
                            >
                                <Calendar className="size-3 mr-1" />
                                {formatDate(camp.activity_date)}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <CheckCircle2 className="size-3 text-emerald-500" /> Branch Verified
                            </span>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border bg-muted/20 p-4">
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Building2 className="size-3" /> Conducting Branch
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {camp.branch?.name ?? 'Branch'}
                            </p>
                        </div>

                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <User className="size-3" /> Recorded By
                            </p>
                            <p className="text-sm font-semibold text-foreground">
                                {camp.entered_by?.name ?? 'Health Officer'}
                            </p>
                        </div>
                    </div>

                    {/* Services Breakdown */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                            <FileText className="size-4 text-amber-600" />
                            Camp Services & Beneficiary Statistics
                        </h2>

                        {entries.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                                No specific parameters recorded.
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {entries.map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs space-y-1"
                                    >
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {key.replaceAll('_', ' ')}
                                        </p>
                                        <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                                            {value === null || value === ''
                                                ? '—'
                                                : String(value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Attached Photos Gallery */}
                    {attachments.length > 0 ? (
                        <div className="space-y-3 border-t pt-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <FileImage className="size-4 text-amber-600" />
                                    ক্যাম্পের ছবিসমূহ (Camp Field Photos)
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
                                            alt={`Camp photo ${idx + 1}`}
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
                                    Health Camp Photo Preview
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

                    {/* Footer */}
                    <div className="pt-8 border-t flex flex-col sm:flex-row justify-between items-start sm:items-end text-xs text-muted-foreground gap-4">
                        <div>
                            <p className="font-semibold text-foreground">M Care Health Information System</p>
                            <p className="text-[11px]">Branch Health Camp Log Module</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[11px]">Report Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

HealthCampShow.layout = {
    breadcrumbs: [
        { title: "Today's Task", href: dashboard() },
        { title: 'Health Camps', href: '/health-camps' },
        { title: 'Camp Report', href: '/health-camps' },
    ],
};
