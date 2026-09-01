import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    FileImage,
    HeartPulse,
    Home,
    MapPin,
    Play,
    Plus,
    RefreshCw,
    Send,
    ShieldAlert,
    Trash2,
    Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
    HouseholdEntry,
    HouseholdRepeater,
} from '@/components/household-repeater';
import { PhotoAttachmentField } from '@/components/photo-attachment-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import type {
    BranchOption,
    FormSchema,
    SamityOption,
    TaskSubtype,
    TaskType,
} from '@/types/mcare';

type Props = {
    taskType: TaskType;
    taskSubtype: TaskSubtype | null;
    schema: FormSchema;
    samities: SamityOption[];
    branches: BranchOption[];
    selectedBranchId: number | null;
    today: string;
};

const STORAGE_KEY = 'mcare_active_household_session';

type ActiveSession = {
    is_active: boolean;
    session_id: string;
    opened_at: string;
    activity_date: string;
    branch_id: string;
    branch_name: string;
    samity_name: string;
    samity_number: string;
    samity_code?: string;
    village: string;
    notes: string;
    households: HouseholdEntry[];
    attachments: string[];
};

export default function HouseholdSession({
    taskType,
    taskSubtype,
    schema,
    samities,
    branches,
    selectedBranchId,
    today,
}: Props) {
    const assignedBranch =
        branches.find((b) => String(b.id) === String(selectedBranchId)) ||
        branches[0];

    const [session, setSession] = useState<ActiveSession>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.is_active) {
                    return {
                        ...parsed,
                        samity_number: parsed.samity_number || parsed.samity_code || '',
                    };
                }
            }
        } catch {
            // ignore
        }

        return {
            is_active: false,
            session_id: '',
            opened_at: '',
            activity_date: today,
            branch_id: assignedBranch ? String(assignedBranch.id) : '',
            branch_name: assignedBranch ? assignedBranch.name : '',
            samity_name: '',
            samity_number: '',
            village: '',
            notes: '',
            households: [],
            attachments: [],
        };
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);
    const [lastSavedTime, setLastSavedTime] = useState<string>('এখনই সেভ করা');

    // Auto-save to localStorage whenever session state changes
    useEffect(() => {
        if (session.is_active) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
                setLastSavedTime(
                    new Date().toLocaleTimeString('bn-BD', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                );
            } catch {
                // local storage full or error
            }
        }
    }, [session]);

    // Handle Start / Open Session
    const handleStartSession = (e: React.FormEvent) => {
        e.preventDefault();
        setSetupError(null);

        if (!session.samity_name.trim()) {
            setSetupError('অনুগ্রহ করে সমিতির নাম লিখুন।');
            return;
        }

        if (!session.village.trim()) {
            setSetupError('অনুগ্রহ করে গ্রামের নাম লিখুন।');
            return;
        }

        const nowTime = new Date().toLocaleTimeString('bn-BD', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const newSession: ActiveSession = {
            ...session,
            is_active: true,
            session_id: 'session_' + Date.now(),
            opened_at: nowTime,
            activity_date: session.activity_date || today,
            branch_id: session.branch_id || (assignedBranch ? String(assignedBranch.id) : ''),
            branch_name: session.branch_name || (assignedBranch ? assignedBranch.name : ''),
        };

        setSession(newSession);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    };

    // Handle Discard Session
    const handleDiscardSession = () => {
        if (
            !confirm(
                'আপনি কি এই খানা পরিদর্শন সেশনটি বাতিল করতে চান? এতে যুক্ত করা সমস্ত খানার ড্রাফট তথ্য মুছে যাবে।',
            )
        ) {
            return;
        }

        localStorage.removeItem(STORAGE_KEY);
        setSession({
            is_active: false,
            session_id: '',
            opened_at: '',
            activity_date: today,
            branch_id: assignedBranch ? String(assignedBranch.id) : '',
            branch_name: assignedBranch ? assignedBranch.name : '',
            samity_name: '',
            samity_number: '',
            village: '',
            notes: '',
            households: [],
            attachments: [],
        });
        setSetupError(null);
    };

    // Handle Final Submit & Close Session
    const handleFinalSubmit = () => {
        if (session.households.length === 0) {
            alert('সেশন সম্পন্ন করতে কমপক্ষে ১টি খানার তথ্য যুক্ত করুন।');
            return;
        }

        if (
            !confirm(
                `আপনি কি মোট ${session.households.length}টি খানার তথ্য সহ খানা পরিদর্শন সেশনটি সম্পন্ন ও সাবমিট করতে চান?`,
            )
        ) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            task_type_id: taskType.id,
            task_subtype_id: taskSubtype?.id ?? null,
            activity_date: session.activity_date,
            branch_id: session.branch_id || selectedBranchId || null,
            form_data: {
                samity_name: session.samity_name,
                samity_number: session.samity_number,
                samity_code: session.samity_number,
                village: session.village,
                notes: session.notes,
                households: session.households,
                attachments: session.attachments,
            },
        };

        router.post('/activities', payload, {
            onSuccess: () => {
                localStorage.removeItem(STORAGE_KEY);
            },
            onError: (errors) => {
                setIsSubmitting(false);
                alert(
                    'সাবমিট করার সময় ত্রুটি হয়েছে: ' +
                        Object.values(errors).join(', '),
                );
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const totalMembers = session.households.reduce(
        (sum, h) => sum + Number(h.member_count || 0),
        0,
    );

    return (
        <>
            <Head title="খানা পরিদর্শন সেশন — M Care" />

            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-7 pb-28 md:pb-12">
                {/* Top Back & Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <Link
                            href={dashboard()}
                            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="size-4" />
                            ড্যাশবোর্ডে ফিরুন (Back to Dashboard)
                        </Link>
                        <div className="flex items-center gap-2.5 mt-1">
                            <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                                <Home className="size-5" />
                            </span>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                                    খানা পরিদর্শন সেশন (Household Visits)
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    মাঠপর্যায়ে একাধিক খানা পরিদর্শন ও শর্তসাপেক্ষ স্বাস্থ্য তথ্য সংগ্রহ
                                </p>
                            </div>
                        </div>
                    </div>

                    {session.is_active ? (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-xs">
                                <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>🟢 সেশন চলমান আছে</span>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* STAGE 1: SESSION SETUP & OPENING FORM (Only if session is NOT active) */}
                {!session.is_active ? (
                    <Card className="rounded-3xl border-2 border-blue-500/40 shadow-xs">
                        <CardHeader className="border-b bg-blue-500/5 pb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                                    <Play className="size-4" />
                                </span>
                                <div>
                                    <CardTitle className="text-base font-bold text-foreground">
                                        ১ম ধাপ: খানা পরিদর্শন সেশন শুরু করুন
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        আজকের পরিদর্শনের এলাকা ও সমিতির তথ্য দিয়ে সেশন ওপেন করুন
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-5 md:p-6">
                            {setupError ? (
                                <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                                    <AlertTriangle className="size-4 shrink-0" />
                                    <span>{setupError}</span>
                                </div>
                            ) : null}

                            <form onSubmit={handleStartSession} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Date */}
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-bold flex items-center gap-1.5">
                                            <Calendar className="size-3.5 text-muted-foreground" />
                                            তারিখ (Date)
                                        </Label>
                                        <Input
                                            type="date"
                                            value={session.activity_date}
                                            onChange={(e) =>
                                                setSession({
                                                    ...session,
                                                    activity_date: e.target.value,
                                                })
                                            }
                                            className="h-10 rounded-xl text-xs bg-muted/20"
                                        />
                                    </div>

                                    {/* Auto Branch */}
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-bold flex items-center gap-1.5">
                                            <Building2 className="size-3.5 text-muted-foreground" />
                                            শাখা (Branch)
                                        </Label>
                                        <Input
                                            disabled
                                            value={session.branch_name || assignedBranch?.name || 'প্রধান শাখা'}
                                            className="h-10 rounded-xl text-xs bg-muted/50 font-semibold text-foreground"
                                        />
                                    </div>

                                    {/* Samity Name */}
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-bold">
                                            সমিতির নাম (Samity Name) <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            placeholder="সমিতির নাম"
                                            value={session.samity_name}
                                            onChange={(e) =>
                                                setSession({
                                                    ...session,
                                                    samity_name: e.target.value,
                                                })
                                            }
                                            className="h-10 rounded-xl text-xs bg-background"
                                        />
                                    </div>

                                    {/* Samity Number */}
                                    <div className="grid gap-1.5">
                                        <Label className="text-xs font-bold">
                                            সমিতি নম্বর (Samity Number)
                                        </Label>
                                        <Input
                                            placeholder="সমিতি নম্বর"
                                            value={session.samity_number}
                                            onChange={(e) =>
                                                setSession({
                                                    ...session,
                                                    samity_number: e.target.value,
                                                })
                                            }
                                            className="h-10 rounded-xl text-xs bg-background"
                                        />
                                    </div>

                                    {/* Village */}
                                    <div className="grid gap-1.5 sm:col-span-2">
                                        <Label className="text-xs font-bold flex items-center gap-1.5">
                                            <MapPin className="size-3.5 text-blue-600" />
                                            গ্রামের নাম (Village Name) <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            placeholder="গ্রামের নাম"
                                            value={session.village}
                                            onChange={(e) =>
                                                setSession({
                                                    ...session,
                                                    village: e.target.value,
                                                })
                                            }
                                            className="h-10 rounded-xl text-xs bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-end">
                                    <Button
                                        type="submit"
                                        className="h-11 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                                    >
                                        <Play className="size-4 mr-1.5" />
                                        সেশন শুরু করুন (Open Session)
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    /* STAGE 2: ONGOING ACTIVE SESSION (CRASH-PROOF & AUTO-SAVED) */
                    <div className="space-y-6">
                        {/* Live Session Active Status Card */}
                        <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-card to-card p-4 sm:p-5 shadow-2xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
                                        <h3 className="text-base font-bold text-foreground">
                                            সক্রিয় খানা পরিদর্শন সেশন
                                        </h3>
                                        <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0">
                                            লাইভ মোড
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                        <span>📍 গ্রাম: <strong>{session.village}</strong></span>
                                        <span>•</span>
                                        <span>👥 সমিতি: <strong>{session.samity_name} {session.samity_code ? `(${session.samity_code})` : ''}</strong></span>
                                        <span>•</span>
                                        <span>⏰ শুরু: <strong>{session.opened_at}</strong></span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-muted/40 px-2.5 py-1 rounded-xl border">
                                        <CheckCircle2 className="size-3 text-emerald-500" />
                                        অটো-সেভ: {lastSavedTime}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Household Repeater Component with Full Conditional Questionnaire */}
                        <HouseholdRepeater
                            households={session.households}
                            onChange={(updatedList) =>
                                setSession({
                                    ...session,
                                    households: updatedList,
                                })
                            }
                        />

                        {/* Overall Session Notes & Field Photos */}
                        <Card className="rounded-3xl border border-border/80 shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-foreground">
                                    সার্বিক মন্তব্য ও ফিল্ড ফটো (Overall Notes & Photos)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs font-semibold">
                                        সেশনের সার্বিক মন্তব্য বা পর্যবেক্ষণ
                                    </Label>
                                    <textarea
                                        rows={2}
                                        placeholder="গ্রাম বা এলাকার সার্বিক স্বাস্থ্য পর্যবেক্ষণ, সুপারিশ বা ফলোআপ মন্তব্য লিখুন..."
                                        value={session.notes}
                                        onChange={(e) =>
                                            setSession({
                                                ...session,
                                                notes: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-2xl border border-input bg-background p-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    />
                                </div>

                                <PhotoAttachmentField
                                    attachments={session.attachments}
                                    onChange={(urls) =>
                                        setSession({
                                            ...session,
                                            attachments: urls,
                                        })
                                    }
                                />
                            </CardContent>
                        </Card>

                        {/* Sticky Bottom Action Bar (Discard vs Final Submit & Close) */}
                        <div className="sticky bottom-4 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/95 p-4 shadow-xl backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs font-bold px-3 py-1 bg-blue-500/15 text-blue-700 dark:text-blue-300">
                                    মোট খানা: {session.households.length}টি
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    (সদস্য: {totalMembers} জন)
                                </span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDiscardSession}
                                    className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30"
                                >
                                    <Trash2 className="size-3.5 mr-1" />
                                    সেশন বাতিল
                                </Button>

                                <Button
                                    type="button"
                                    disabled={isSubmitting || session.households.length === 0}
                                    onClick={handleFinalSubmit}
                                    className="h-10 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <Spinner className="mr-2" />
                                    ) : (
                                        <Send className="size-4 mr-1.5" />
                                    )}
                                    সেশন সম্পন্ন ও সাবমিট করুন
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
