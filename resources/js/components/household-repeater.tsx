import React, { useState } from 'react';
import {
    Activity,
    Baby,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Edit2,
    Eye,
    Heart,
    HeartPulse,
    HelpCircle,
    Home,
    Layers,
    Pill,
    Plus,
    ShieldAlert,
    Smile,
    Stethoscope,
    Trash2,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type ChronicDiseaseStatus = {
    affected: boolean;
    taking_medication: boolean;
};

export type HouseholdEntry = {
    id?: string;
    household_head: string;
    member_count: number | string;

    // ১. গর্ভবতী মা
    has_pregnant: boolean;
    pregnancy_duration?: string;
    has_anc?: boolean;
    has_tt?: boolean;
    pregnant_advice?: string;

    // ২. প্রসব করেছে এমন কেউ
    has_delivered: boolean;
    delivery_place?: string;
    has_pnc?: boolean;

    // ৩. শিশু
    has_child: boolean;
    is_stunting?: boolean;
    is_wasting?: boolean;
    is_underweight?: boolean;

    // ৪. প্রতিবন্ধী
    has_disabled: boolean;
    disabled_gender?: string;

    // ৫. প্রবীণ ব্যক্তি
    has_elderly: boolean;
    elderly_diseases?: {
        malnutrition: ChronicDiseaseStatus;
        diabetes: ChronicDiseaseStatus;
        hypertension: ChronicDiseaseStatus;
        tuberculosis: ChronicDiseaseStatus;
        kidney_disease: ChronicDiseaseStatus;
        eye_disease: ChronicDiseaseStatus;
        asthma: ChronicDiseaseStatus;
        other_chronic: ChronicDiseaseStatus;
    };

    // ৬. সাধারণ রোগ
    general_illness_count: number | string;
    took_treatment?: boolean;
};

type Props = {
    households: HouseholdEntry[];
    onChange: (households: HouseholdEntry[]) => void;
};

const defaultDiseaseState: ChronicDiseaseStatus = {
    affected: false,
    taking_medication: false,
};

const initialHousehold: HouseholdEntry = {
    household_head: '',
    member_count: 4,

    has_pregnant: false,
    pregnancy_duration: '',
    has_anc: false,
    has_tt: false,
    pregnant_advice: '',

    has_delivered: false,
    delivery_place: 'স্বাস্থ্য কেন্দ্র',
    has_pnc: false,

    has_child: false,
    is_stunting: false,
    is_wasting: false,
    is_underweight: false,

    has_disabled: false,
    disabled_gender: 'নারী',

    has_elderly: false,
    elderly_diseases: {
        malnutrition: { ...defaultDiseaseState },
        diabetes: { ...defaultDiseaseState },
        hypertension: { ...defaultDiseaseState },
        tuberculosis: { ...defaultDiseaseState },
        kidney_disease: { ...defaultDiseaseState },
        eye_disease: { ...defaultDiseaseState },
        asthma: { ...defaultDiseaseState },
        other_chronic: { ...defaultDiseaseState },
    },

    general_illness_count: 0,
    took_treatment: false,
};

const diseaseList = [
    { key: 'malnutrition', label: '১. অপুষ্টিতে আক্রান্ত' },
    { key: 'diabetes', label: '২. ডায়াবেটিসে আক্রান্ত' },
    { key: 'hypertension', label: '৩. উচ্চ রক্তচাপ' },
    { key: 'tuberculosis', label: '৪. যক্ষায় আক্রান্ত (TB)' },
    { key: 'kidney_disease', label: '৫. কিডনি রোগে আক্রান্ত' },
    { key: 'eye_disease', label: '৬. চোখের রোগে আক্রান্ত' },
    { key: 'asthma', label: '৭. হাঁপানি / শ্বাসকষ্ট' },
    { key: 'other_chronic', label: '৮. অন্য কোনো জটিল রোগ' },
] as const;

export function HouseholdRepeater({ households = [], onChange }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [currentEntry, setCurrentEntry] = useState<HouseholdEntry>(initialHousehold);
    const [formError, setFormError] = useState<string | null>(null);

    const handleOpenAdd = () => {
        setEditIndex(null);
        setCurrentEntry({
            ...initialHousehold,
            id: 'h_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (index: number) => {
        setEditIndex(index);
        setCurrentEntry(JSON.parse(JSON.stringify(households[index])));
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (!confirm('আপনি কি এই খানার রেকর্ডটি মুছে ফেলতে চান?')) return;
        const updated = households.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleSaveEntry = () => {
        if (!currentEntry.household_head.trim()) {
            setFormError('অনুগ্রহ করে খানা প্রধানের নাম লিখুন।');
            return;
        }

        const count = Number(currentEntry.member_count);
        if (isNaN(count) || count < 1) {
            setFormError('সদস্য সংখ্যা কমপক্ষে ১ হতে হবে।');
            return;
        }

        const updated = [...households];
        if (editIndex !== null && editIndex >= 0) {
            updated[editIndex] = currentEntry;
        } else {
            updated.push(currentEntry);
        }

        onChange(updated);
        setIsModalOpen(false);
        setEditIndex(null);
    };

    const toggleDiseaseAffected = (key: keyof NonNullable<HouseholdEntry['elderly_diseases']>) => {
        const curDiseases = currentEntry.elderly_diseases || {
            malnutrition: { ...defaultDiseaseState },
            diabetes: { ...defaultDiseaseState },
            hypertension: { ...defaultDiseaseState },
            tuberculosis: { ...defaultDiseaseState },
            kidney_disease: { ...defaultDiseaseState },
            eye_disease: { ...defaultDiseaseState },
            asthma: { ...defaultDiseaseState },
            other_chronic: { ...defaultDiseaseState },
        };

        const target = curDiseases[key] || { ...defaultDiseaseState };
        const nextAffected = !target.affected;

        setCurrentEntry({
            ...currentEntry,
            elderly_diseases: {
                ...curDiseases,
                [key]: {
                    affected: nextAffected,
                    taking_medication: nextAffected ? target.taking_medication : false,
                },
            },
        });
    };

    const toggleDiseaseMedication = (key: keyof NonNullable<HouseholdEntry['elderly_diseases']>) => {
        const curDiseases = currentEntry.elderly_diseases || {
            malnutrition: { ...defaultDiseaseState },
            diabetes: { ...defaultDiseaseState },
            hypertension: { ...defaultDiseaseState },
            tuberculosis: { ...defaultDiseaseState },
            kidney_disease: { ...defaultDiseaseState },
            eye_disease: { ...defaultDiseaseState },
            asthma: { ...defaultDiseaseState },
            other_chronic: { ...defaultDiseaseState },
        };

        const target = curDiseases[key] || { ...defaultDiseaseState };

        setCurrentEntry({
            ...currentEntry,
            elderly_diseases: {
                ...curDiseases,
                [key]: {
                    ...target,
                    taking_medication: !target.taking_medication,
                },
            },
        });
    };

    const totalMembers = households.reduce((sum, h) => sum + Number(h.member_count || 0), 0);

    return (
        <div className="space-y-4 rounded-3xl border-2 border-blue-500/30 bg-blue-500/5 p-4 md:p-5 shadow-xs">
            {/* Header & Household Count Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                        <Home className="size-5" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-foreground">
                                খানা পরিদর্শন তালিকা (Households)
                            </h3>
                            <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 font-bold">
                                {households.length}টি খানা যুক্ত
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            মোট পরিদর্শনকৃত পরিবার সদস্য: <strong className="text-foreground">{totalMembers} জন</strong>
                        </p>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={handleOpenAdd}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs h-9 shadow-xs self-start sm:self-auto cursor-pointer"
                >
                    <Plus className="size-4 mr-1" />
                    + নতুন খানা যুক্ত করুন
                </Button>
            </div>

            {/* List of Added Households */}
            {households.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-background/50 p-6 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Users className="size-6" />
                    </div>
                    <p className="mt-2.5 text-sm font-bold text-foreground">
                        এখনো কোনো খানার তথ্য যুক্ত করা হয়নি
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        উপরে <strong>"+ নতুন খানা যুক্ত করুন"</strong> বাটনে ক্লিক করে প্রতিটি খানার বিস্তারিত তথ্য যোগ করুন।
                    </p>
                    <Button
                        type="button"
                        onClick={handleOpenAdd}
                        variant="outline"
                        size="sm"
                        className="mt-3.5 rounded-xl border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 text-xs font-semibold"
                    >
                        <Plus className="size-3.5 mr-1" />
                        প্রথম খানা যুক্ত করুন
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {households.map((h, idx) => {
                        const chronicCount = Object.values(h.elderly_diseases || {}).filter(
                            (d) => d.affected,
                        ).length;

                        return (
                            <div
                                key={h.id || idx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all hover:border-blue-500/40"
                            >
                                <div className="space-y-1.5 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                                            {idx + 1}
                                        </span>
                                        <h4 className="text-sm font-bold text-foreground truncate">
                                            {h.household_head}
                                        </h4>
                                        <Badge variant="outline" className="text-[10px] px-2 py-0">
                                            সদস্য: {h.member_count} জন
                                        </Badge>
                                    </div>

                                    {/* Summary Feature Badges */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                        {h.has_pregnant ? (
                                            <Badge className="bg-pink-500/15 text-pink-700 dark:text-pink-300 text-[10px] px-2 py-0 border-pink-500/30">
                                                🤰 গর্ভবতী মা ({h.pregnancy_duration || 'হ্যাঁ'})
                                            </Badge>
                                        ) : null}

                                        {h.has_delivered ? (
                                            <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-0 border-purple-500/30">
                                                🤱 প্রসব: {h.delivery_place}
                                            </Badge>
                                        ) : null}

                                        {h.has_child ? (
                                            <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 text-[10px] px-2 py-0 border-sky-500/30">
                                                👶 শিশু: {h.is_stunting || h.is_wasting || h.is_underweight ? 'পুষ্টি ঝুঁকি' : 'স্বাভাবিক'}
                                            </Badge>
                                        ) : null}

                                        {h.has_disabled ? (
                                            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0 border-amber-500/30">
                                                ♿ প্রতিবন্ধী ({h.disabled_gender})
                                            </Badge>
                                        ) : null}

                                        {h.has_elderly ? (
                                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0 border-emerald-500/30">
                                                👴 প্রবীণ ({chronicCount > 0 ? `${chronicCount}টি ক্রনিক রোগ` : 'সুস্থ'})
                                            </Badge>
                                        ) : null}

                                        {Number(h.general_illness_count) > 0 ? (
                                            <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] px-2 py-0 border-indigo-500/30">
                                                🩺 সাধারণ রোগী: {h.general_illness_count} জন ({h.took_treatment ? 'চিকিৎসা নিয়েছে' : 'চিকিৎসা নেয়নি'})
                                            </Badge>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenEdit(idx)}
                                        className="h-8 px-2 text-xs rounded-xl hover:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                    >
                                        <Edit2 className="size-3.5 mr-1" />
                                        সম্পাদনা
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(idx)}
                                        className="h-8 px-2 text-xs rounded-xl hover:bg-destructive/10 text-destructive"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CONDITIONAL HOUSEHOLD ENTRY MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
                    <DialogHeader className="text-left space-y-1 pb-2 border-b">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                                <Home className="size-5" />
                            </span>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                                    {editIndex !== null ? 'খানার তথ্য সম্পাদনা' : 'নতুন খানা পরিদর্শন এন্ট্রি'}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    খানার প্রধান ও পরিবারের সদস্যদের শর্তসাপেক্ষ স্বাস্থ্য তথ্য
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {formError ? (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                            {formError}
                        </div>
                    ) : null}

                    <div className="space-y-4 pt-2">
                        {/* ১. মৌলিক তথ্য (Basic Info) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3.5 rounded-2xl border">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    খানা প্রধানের নাম <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="খানা প্রধানের নাম"
                                    value={currentEntry.household_head}
                                    onChange={(e) =>
                                        setCurrentEntry({
                                            ...currentEntry,
                                            household_head: e.target.value,
                                        })
                                    }
                                    className="h-9 rounded-xl text-xs bg-background"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    মোট সদস্য সংখ্যা <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="মোট সদস্য"
                                    value={currentEntry.member_count}
                                    onChange={(e) =>
                                        setCurrentEntry({
                                            ...currentEntry,
                                            member_count: e.target.value,
                                        })
                                    }
                                    className="h-9 rounded-xl text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* ২. গর্ভবতী মা (Pregnant Mother) */}
                        <div className="rounded-2xl border p-3.5 space-y-3 bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🤰</span>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                            গর্ভবতী মা আছে কি না?
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            পরিবারে কোনো গর্ভবতী নারী সদস্য আছেন কি না
                                        </p>
                                    </div>
                                </div>

                                <div className="flex rounded-xl border bg-muted/40 p-0.5 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_pregnant: true,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            currentEntry.has_pregnant
                                                ? 'bg-pink-600 text-white shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        হ্যাঁ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_pregnant: false,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            !currentEntry.has_pregnant
                                                ? 'bg-muted-foreground/20 text-foreground font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        না
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Pregnant Fields */}
                            {currentEntry.has_pregnant ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-pink-500/20 bg-pink-500/5 p-3 rounded-xl">
                                    <div className="grid gap-1">
                                        <Label className="text-xs font-semibold">
                                            ১। গর্ভের সময়কাল (মাস/ত্রৈমাসিক)
                                        </Label>
                                        <Input
                                            placeholder="গর্ভের সময়কাল"
                                            value={currentEntry.pregnancy_duration || ''}
                                            onChange={(e) =>
                                                setCurrentEntry({
                                                    ...currentEntry,
                                                    pregnancy_duration: e.target.value,
                                                })
                                            }
                                            className="h-8 rounded-lg text-xs bg-background"
                                        />
                                    </div>

                                    <div className="grid gap-1">
                                        <Label className="text-xs font-semibold">
                                            ২। ANC সেবা নিয়েছে কি না?
                                        </Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        has_anc: true,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-colors ${
                                                    currentEntry.has_anc
                                                        ? 'bg-pink-600 text-white border-pink-600'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                হ্যাঁ (ANC প্রাপ্ত)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        has_anc: false,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-colors ${
                                                    !currentEntry.has_anc
                                                        ? 'bg-muted text-foreground border-border'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                না
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-1">
                                        <Label className="text-xs font-semibold">
                                            ৩। টিটেনাস (TT) টিকা নিয়েছে কি না?
                                        </Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        has_tt: true,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-colors ${
                                                    currentEntry.has_tt
                                                        ? 'bg-pink-600 text-white border-pink-600'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                হ্যাঁ (টিটেনাস প্রাপ্ত)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        has_tt: false,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-colors ${
                                                    !currentEntry.has_tt
                                                        ? 'bg-muted text-foreground border-border'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                না
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid gap-1">
                                        <Label className="text-xs font-semibold">
                                            ৪। গর্ভকালীন পরামর্শ ও নোট
                                        </Label>
                                        <Input
                                            placeholder="পরামর্শ ও মন্তব্য"
                                            value={currentEntry.pregnant_advice || ''}
                                            onChange={(e) =>
                                                setCurrentEntry({
                                                    ...currentEntry,
                                                    pregnant_advice: e.target.value,
                                                })
                                            }
                                            className="h-8 rounded-lg text-xs bg-background"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* ৩. প্রসব করেছে এমন কেউ (Delivered Mother & PNC) */}
                        <div className="rounded-2xl border p-3.5 space-y-3 bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">🤱</span>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                            প্রসব করেছে এমন কেউ আছে?
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            সাম্প্রতিক প্রসববর্তী নারী ও সন্তান প্রসবের তথ্য
                                        </p>
                                    </div>
                                </div>

                                <div className="flex rounded-xl border bg-muted/40 p-0.5 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_delivered: true,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            currentEntry.has_delivered
                                                ? 'bg-purple-600 text-white shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        হ্যাঁ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_delivered: false,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            !currentEntry.has_delivered
                                                ? 'bg-muted-foreground/20 text-foreground font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        না
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Delivered Fields */}
                            {currentEntry.has_delivered ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-500/20 bg-purple-500/5 p-3 rounded-xl">
                                    <div className="grid gap-1">
                                        <Label className="text-xs font-semibold">
                                            ১। কোথায় বাচ্চা হয়েছে?
                                        </Label>
                                        <select
                                            value={currentEntry.delivery_place || 'স্বাস্থ্য কেন্দ্র'}
                                            onChange={(e) =>
                                                setCurrentEntry({
                                                    ...currentEntry,
                                                    delivery_place: e.target.value,
                                                })
                                            }
                                            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium"
                                        >
                                            <option value="স্বাস্থ্য কেন্দ্র">স্বাস্থ্য কেন্দ্র</option>
                                            <option value="ক্লিনিক">ক্লিনিক</option>
                                            <option value="হাসপাতাল">হাসপাতাল</option>
                                            <option value="সিজার সেকশন">সিজার সেকশন</option>
                                            <option value="বাড়ি">বাড়ি</option>
                                        </select>
                                    </div>

                                    <div className="grid gap-1">
                                        <Label className="text-xs font-semibold">
                                            ২। PNC (প্রসবোত্তর সেবা) সেবা নিয়েছে কি না?
                                        </Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        has_pnc: true,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-colors ${
                                                    currentEntry.has_pnc
                                                        ? 'bg-purple-600 text-white border-purple-600'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                হ্যাঁ (PNC প্রাপ্ত)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        has_pnc: false,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs rounded-lg font-bold border transition-colors ${
                                                    !currentEntry.has_pnc
                                                        ? 'bg-muted text-foreground border-border'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                না
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* ৪. শিশু স্বাস্থ্য ও পুষ্টি (Child Nutrition) */}
                        <div className="rounded-2xl border p-3.5 space-y-3 bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">👶</span>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                            শিশু আছে কি না?
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            ৫ বছরের কম বয়সী শিশু ও তাদের পুষ্টি অবস্থা
                                        </p>
                                    </div>
                                </div>

                                <div className="flex rounded-xl border bg-muted/40 p-0.5 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_child: true,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            currentEntry.has_child
                                                ? 'bg-sky-600 text-white shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        হ্যাঁ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_child: false,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            !currentEntry.has_child
                                                ? 'bg-muted-foreground/20 text-foreground font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        না
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Child Fields */}
                            {currentEntry.has_child ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-sky-500/20 bg-sky-500/5 p-3 rounded-xl">
                                    {/* 1. Stunting */}
                                    <div className="rounded-xl border bg-background p-2.5 space-y-1.5">
                                        <Label className="text-xs font-bold block">
                                            ১। Stunting (খর্বকায়)?
                                        </Label>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        is_stunting: true,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                                                    currentEntry.is_stunting
                                                        ? 'bg-amber-600 text-white border-amber-600'
                                                        : 'bg-muted/40 text-muted-foreground'
                                                }`}
                                            >
                                                হ্যাঁ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        is_stunting: false,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                                                    !currentEntry.is_stunting
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-muted/40 text-muted-foreground'
                                                }`}
                                            >
                                                না
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2. Wasting */}
                                    <div className="rounded-xl border bg-background p-2.5 space-y-1.5">
                                        <Label className="text-xs font-bold block">
                                            ২। Wasting (কৃশকায়)?
                                        </Label>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        is_wasting: true,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                                                    currentEntry.is_wasting
                                                        ? 'bg-amber-600 text-white border-amber-600'
                                                        : 'bg-muted/40 text-muted-foreground'
                                                }`}
                                            >
                                                হ্যাঁ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        is_wasting: false,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                                                    !currentEntry.is_wasting
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-muted/40 text-muted-foreground'
                                                }`}
                                            >
                                                না
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3. Under Weight */}
                                    <div className="rounded-xl border bg-background p-2.5 space-y-1.5">
                                        <Label className="text-xs font-bold block">
                                            ৩। Under Weight (কম ওজন)?
                                        </Label>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        is_underweight: true,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                                                    currentEntry.is_underweight
                                                        ? 'bg-amber-600 text-white border-amber-600'
                                                        : 'bg-muted/40 text-muted-foreground'
                                                }`}
                                            >
                                                হ্যাঁ
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        is_underweight: false,
                                                    })
                                                }
                                                className={`flex-1 py-1 text-xs font-bold rounded-lg border ${
                                                    !currentEntry.is_underweight
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-muted/40 text-muted-foreground'
                                                }`}
                                            >
                                                না
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* ৫. প্রতিবন্ধী ব্যক্তি (Person with Disability) */}
                        <div className="rounded-2xl border p-3.5 space-y-3 bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">♿</span>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                            প্রতিবন্ধী ব্যক্তি আছে কি না?
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            পরিবারে বিশেষ চাহিদা সম্পন্ন ব্যক্তি আছেন কি না
                                        </p>
                                    </div>
                                </div>

                                <div className="flex rounded-xl border bg-muted/40 p-0.5 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_disabled: true,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            currentEntry.has_disabled
                                                ? 'bg-amber-600 text-white shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        হ্যাঁ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_disabled: false,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            !currentEntry.has_disabled
                                                ? 'bg-muted-foreground/20 text-foreground font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        না
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Disability Fields */}
                            {currentEntry.has_disabled ? (
                                <div className="pt-2 border-t border-amber-500/20 bg-amber-500/5 p-3 rounded-xl">
                                    <Label className="text-xs font-semibold block mb-1">
                                        প্রতিবন্ধী ব্যক্তির লিঙ্গ নির্বাচন করুন:
                                    </Label>
                                    <div className="flex gap-2">
                                        {['নারী', 'পুরুষ', 'তৃতীয় লিঙ্গ'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        disabled_gender: g,
                                                    })
                                                }
                                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                                    currentEntry.disabled_gender === g
                                                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* ৬. প্রবীণ ব্যক্তি ও ক্রনিক ডিজিজ ম্যাট্রিক্স (Elderly & Chronic Illnesses) */}
                        <div className="rounded-2xl border p-3.5 space-y-3 bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-base">👴</span>
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                            প্রবীণ ব্যক্তি আছে কি না?
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground">
                                            ৬০+ বয়সী বয়োজ্যেষ্ঠ ও তাদের দীর্ঘমেয়াদী অসংক্রামক রোগ
                                        </p>
                                    </div>
                                </div>

                                <div className="flex rounded-xl border bg-muted/40 p-0.5 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_elderly: true,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            currentEntry.has_elderly
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        হ্যাঁ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                has_elderly: false,
                                            })
                                        }
                                        className={`px-3 py-1 rounded-lg transition-all ${
                                            !currentEntry.has_elderly
                                                ? 'bg-muted-foreground/20 text-foreground font-bold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        না
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Elderly Chronic Diseases List */}
                            {currentEntry.has_elderly ? (
                                <div className="pt-2 border-t border-emerald-500/20 bg-emerald-500/5 p-3 rounded-xl space-y-2">
                                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                                        রোগভিত্তিক স্বাস্থ্য ও ওষুধ গ্রহণের অবস্থা:
                                    </p>

                                    <div className="space-y-2">
                                        {diseaseList.map((disease) => {
                                            const status =
                                                currentEntry.elderly_diseases?.[disease.key] || {
                                                    affected: false,
                                                    taking_medication: false,
                                                };

                                            return (
                                                <div
                                                    key={disease.key}
                                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
                                                        status.affected
                                                            ? 'bg-background border-emerald-500/40 shadow-xs'
                                                            : 'bg-background/60 border-border/60'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold text-foreground">
                                                        {disease.label}
                                                    </span>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {/* Affected Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleDiseaseAffected(disease.key)}
                                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                                                status.affected
                                                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                                                    : 'bg-muted/40 text-muted-foreground border-input'
                                                            }`}
                                                        >
                                                            {status.affected ? '✓ আক্রান্ত' : 'আক্রান্ত নন'}
                                                        </button>

                                                        {/* Medication Button (only visible if affected) */}
                                                        {status.affected ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleDiseaseMedication(disease.key)}
                                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors ${
                                                                    status.taking_medication
                                                                        ? 'bg-teal-600 text-white border-teal-600'
                                                                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                                                }`}
                                                            >
                                                                <Pill className="size-3" />
                                                                {status.taking_medication
                                                                    ? 'নিয়মিত ওষুধ খান'
                                                                    : 'ওষুধ খান না'}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* ৭. সাধারণ রোগ ও চিকিৎসা (General Illness) */}
                        <div className="rounded-2xl border p-3.5 space-y-3 bg-card">
                            <div className="flex items-center gap-2">
                                <span className="text-base">🩺</span>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                        গত এক মাসে সাধারণ রোগ (সর্দি, কাশি, ডায়রিয়া ইত্যাদি)
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground">
                                        পরিবারে সাধারণ রোগে আক্রান্তের সংখ্যা ও চিকিৎসা গ্রহণের তথ্য
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="grid gap-1">
                                    <Label className="text-xs font-bold">
                                        আক্রান্ত ব্যক্তির সংখ্যা
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="0 বা আক্রান্ত সংখ্যা"
                                        value={currentEntry.general_illness_count}
                                        onChange={(e) =>
                                            setCurrentEntry({
                                                ...currentEntry,
                                                general_illness_count: e.target.value,
                                            })
                                        }
                                        className="h-9 rounded-xl text-xs bg-background"
                                    />
                                </div>

                                {Number(currentEntry.general_illness_count) > 0 ? (
                                    <div className="grid gap-1">
                                        <Label className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                            চিকিৎসা নিয়েছেন কি না?
                                        </Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        took_treatment: true,
                                                    })
                                                }
                                                className={`flex-1 py-1.5 text-xs rounded-xl font-bold border transition-colors ${
                                                    currentEntry.took_treatment
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                হ্যাঁ (চিকিৎসা প্রাপ্ত)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentEntry({
                                                        ...currentEntry,
                                                        took_treatment: false,
                                                    })
                                                }
                                                className={`flex-1 py-1.5 text-xs rounded-xl font-bold border transition-colors ${
                                                    !currentEntry.took_treatment
                                                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                                        : 'bg-background text-muted-foreground border-input'
                                                }`}
                                            >
                                                না (চিকিৎসা নেননি)
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t flex justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-xl text-xs font-semibold"
                        >
                            বাতিল
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveEntry}
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 shadow-xs"
                        >
                            <Check className="size-3.5 mr-1" />
                            {editIndex !== null ? 'সংরক্ষণ করুন' : 'খানা যুক্ত করুন'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
