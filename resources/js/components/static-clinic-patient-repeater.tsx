import React, { useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    CreditCard,
    Edit2,
    Plus,
    Stethoscope,
    Trash2,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type StaticClinicPatient = {
    id?: string;
    patient_name: string;
    patient_age: string | number;
    patient_gender: string;
    disease: string;
    advice: string;
    has_card: boolean;
};

type Props = {
    expectedTotal?: number | string;
    expectedMale?: number | string;
    expectedFemale?: number | string;
    patients: StaticClinicPatient[];
    onChange: (patients: StaticClinicPatient[]) => void;
};

const initialPatient: StaticClinicPatient = {
    patient_name: '',
    patient_age: '',
    patient_gender: 'নারী',
    disease: '',
    advice: '',
    has_card: true,
};

export function StaticClinicPatientRepeater({
    expectedTotal = 0,
    expectedMale = 0,
    expectedFemale = 0,
    patients = [],
    onChange,
}: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [current, setCurrent] = useState<StaticClinicPatient>(initialPatient);
    const [formError, setFormError] = useState<string | null>(null);

    const targetTotal = Number(expectedTotal) || 0;
    const targetMale = Number(expectedMale) || 0;
    const targetFemale = Number(expectedFemale) || 0;

    const maleCount = patients.filter((p) => p.patient_gender === 'পুরুষ').length;
    const femaleCount = patients.filter((p) => p.patient_gender === 'নারী').length;
    const otherCount = patients.filter(
        (p) => p.patient_gender !== 'পুরুষ' && p.patient_gender !== 'নারী',
    ).length;
    const cardHoldersCount = patients.filter((p) => p.has_card).length;

    const remainingCount = targetTotal > 0 ? Math.max(0, targetTotal - patients.length) : 0;
    const isCompleted = targetTotal > 0 ? patients.length >= targetTotal : patients.length > 0;

    const handleOpenAdd = (defaultGender?: string) => {
        setEditIndex(null);
        setCurrent({
            ...initialPatient,
            patient_gender: defaultGender || (femaleCount < targetFemale ? 'নারী' : 'পুরুষ'),
            id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (index: number) => {
        setEditIndex(index);
        setCurrent({ ...patients[index] });
        setFormError(null);
        setIsModalOpen(true);
    };

    const handleDelete = (index: number) => {
        if (!confirm('আপনি কি এই রোগীর রেকর্ডটি মুছে ফেলতে চান?')) return;
        const updated = patients.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!current.patient_name.trim()) {
            setFormError('অনুগ্রহ করে রোগীর নাম লিখুন।');
            return;
        }

        if (!String(current.patient_age).trim()) {
            setFormError('অনুগ্রহ করে রোগীর বয়স লিখুন।');
            return;
        }

        if (!current.disease.trim()) {
            setFormError('অনুগ্রহ করে রোগের বিবরণ বা কি সমস্যা তা লিখুন।');
            return;
        }

        if (!current.advice.trim()) {
            setFormError('অনুগ্রহ করে প্রদত্ত পরামর্শ বা চিকিৎসার বিবরণ লিখুন।');
            return;
        }

        const updated = [...patients];
        if (editIndex !== null && editIndex >= 0) {
            updated[editIndex] = current;
        } else {
            updated.push(current);
        }

        onChange(updated);
        setIsModalOpen(false);
        setEditIndex(null);
    };

    return (
        <div className="space-y-4 rounded-3xl border-2 border-indigo-500/30 bg-indigo-500/5 p-4 md:p-5 shadow-xs">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
                        <Stethoscope className="size-5" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground">
                                রোগীভিত্তিক স্বাস্থ্য তথ্য (Patient Details)
                            </h3>
                            {targetTotal > 0 ? (
                                <Badge
                                    className={`text-xs px-2.5 py-0.5 font-bold ${
                                        isCompleted
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-amber-600 text-white'
                                    }`}
                                >
                                    {patients.length} / {targetTotal} জন পূরণ হয়েছে
                                </Badge>
                            ) : (
                                <Badge className="bg-indigo-600 text-white text-xs px-2.5 py-0.5 font-bold">
                                    মোট: {patients.length} জন
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>পুরুষ: <strong className="text-foreground">{maleCount} জন</strong></span>
                            <span>•</span>
                            <span>মহিলা: <strong className="text-foreground">{femaleCount} জন</strong></span>
                            {otherCount > 0 ? (
                                <>
                                    <span>•</span>
                                    <span>অন্যান্য: <strong className="text-foreground">{otherCount} জন</strong></span>
                                </>
                            ) : null}
                            <span>•</span>
                            <span>কার্ডধারী: <strong className="text-indigo-600 dark:text-indigo-400">{cardHoldersCount} জন</strong></span>
                        </p>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={() => handleOpenAdd()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs h-9 shadow-xs self-start sm:self-auto cursor-pointer"
                >
                    <Plus className="size-4 mr-1" />
                    + রোগী যোগ করুন {targetTotal > 0 && remainingCount > 0 ? `(বাকি ${remainingCount} জন)` : ''}
                </Button>
            </div>

            {/* Target Progress Bar (If targetTotal > 0) */}
            {targetTotal > 0 ? (
                <div className="space-y-1.5 rounded-2xl border border-indigo-500/20 bg-background/80 p-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-foreground">
                            {isCompleted ? (
                                <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                                <AlertCircle className="size-4 text-amber-500" />
                            )}
                            {isCompleted
                                ? '✓ সকল নির্ধারিত রোগীর তথ্য সফলভাবে এন্ট্রি হয়েছে'
                                : `নির্ধারিত মোট ${targetTotal} জনের মধ্যে ${patients.length} জনের তথ্য দেওয়া হয়েছে (আরও ${remainingCount} জনের তথ্য প্রয়োজন)`}
                        </span>
                        <span className="text-muted-foreground font-mono">
                            {Math.round((patients.length / targetTotal) * 100)}%
                        </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={`h-full transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{
                                width: `${Math.min(100, (patients.length / targetTotal) * 100)}%`,
                            }}
                        />
                    </div>
                </div>
            ) : null}

            {/* Patients List View */}
            {patients.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-background/50 p-6 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Users className="size-6" />
                    </div>
                    <p className="mt-2.5 text-sm font-bold text-foreground">
                        এখনো কোনো রোগীর তথ্য যুক্ত করা হয়নি
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1">
                        {targetTotal > 0
                            ? `নির্ধারিত ${targetTotal} জন রোগীর নাম, বয়স, রোগ, পরামর্শ ও স্বাস্থ্য কার্ডের তথ্য একটি একটি করে যোগ করুন।`
                            : 'উপরে "+ রোগী যোগ করুন" বাটনে ক্লিক করে রোগীর নাম, বয়স, রোগ ও পরামর্শ যোগ করুন।'}
                    </p>
                    <Button
                        type="button"
                        onClick={() => handleOpenAdd()}
                        variant="outline"
                        size="sm"
                        className="mt-3.5 rounded-xl border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold"
                    >
                        <Plus className="size-3.5 mr-1" />
                        ১ম রোগীর তথ্য যোগ করুন
                    </Button>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {patients.map((p, idx) => (
                        <div
                            key={p.id || idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-2xs transition-all hover:border-indigo-500/40"
                        >
                            <div className="space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="flex size-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[11px] font-bold">
                                        {idx + 1}
                                    </span>
                                    <h4 className="text-sm font-bold text-foreground truncate">
                                        {p.patient_name}
                                    </h4>
                                    <Badge variant="outline" className="text-[10px] px-2 py-0">
                                        বয়স: {p.patient_age} বছর
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className={`text-[10px] px-2 py-0 ${
                                            p.patient_gender === 'পুরুষ'
                                                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                : 'bg-pink-500/15 text-pink-700 dark:text-pink-300'
                                        }`}
                                    >
                                        {p.patient_gender}
                                    </Badge>
                                    <Badge
                                        className={`text-[10px] px-2 py-0 ${
                                            p.has_card
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                        }`}
                                    >
                                        <CreditCard className="size-3 mr-1" />
                                        {p.has_card ? 'কার্ড আছে' : 'কার্ড নেই'}
                                    </Badge>
                                </div>

                                <div className="text-xs text-muted-foreground space-y-0.5 pt-0.5">
                                    <p>
                                        <strong className="text-foreground">রোগ:</strong>{' '}
                                        {p.disease}
                                    </p>
                                    <p>
                                        <strong className="text-foreground">পরামর্শ ও চিকিৎসা:</strong>{' '}
                                        {p.advice}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenEdit(idx)}
                                    className="h-8 px-2 text-xs rounded-xl hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
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
                    ))}

                    {/* Quick Add Button below list if more remaining */}
                    {targetTotal > 0 && remainingCount > 0 ? (
                        <Button
                            type="button"
                            onClick={() => handleOpenAdd()}
                            variant="outline"
                            className="w-full h-10 rounded-2xl border-dashed border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold"
                        >
                            <Plus className="size-4 mr-1.5" />
                            পরবর্তী রোগীর তথ্য যোগ করুন (রোগী #{patients.length + 1})
                        </Button>
                    ) : null}
                </div>
            )}

            {/* ADD / EDIT PATIENT MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
                    <DialogHeader className="text-left space-y-1 pb-2 border-b">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
                                <Stethoscope className="size-5" />
                            </span>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                                    {editIndex !== null
                                        ? `রোগীর তথ্য সম্পাদনা (#${editIndex + 1})`
                                        : `নতুন রোগীর তথ্য এন্ট্রি (#${patients.length + 1})`}
                                </DialogTitle>
                                <DialogDescription className="text-xs">
                                    স্ট্যাটিক ক্লিনিকে আগত রোগীর নাম, বয়স, রোগ, পরামর্শ ও স্বাস্থ্য কার্ড
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {formError ? (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-semibold">
                            {formError}
                        </div>
                    ) : null}

                    <form onSubmit={handleSave} className="space-y-4 pt-2">
                        {/* Name & Age */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    রোগীর নাম <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="রোগীর নাম"
                                    value={current.patient_name}
                                    onChange={(e) =>
                                        setCurrent({
                                            ...current,
                                            patient_name: e.target.value,
                                        })
                                    }
                                    className="h-9 rounded-xl text-xs bg-background"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    বয়স (বছর) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="বয়স"
                                    value={current.patient_age}
                                    onChange={(e) =>
                                        setCurrent({
                                            ...current,
                                            patient_age: e.target.value,
                                        })
                                    }
                                    className="h-9 rounded-xl text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* Gender & Health Card Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Gender */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    লিঙ্গ নির্বাচন
                                </Label>
                                <div className="flex gap-2">
                                    {['নারী', 'পুরুষ', 'অন্যান্য'].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() =>
                                                setCurrent({
                                                    ...current,
                                                    patient_gender: g,
                                                })
                                            }
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                                                current.patient_gender === g
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                                    : 'bg-background text-muted-foreground border-input'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Has Health Card */}
                            <div className="grid gap-1.5">
                                <Label className="text-xs font-bold text-foreground">
                                    স্বাস্থ্য কার্ড আছে কি না?
                                </Label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrent({
                                                ...current,
                                                has_card: true,
                                            })
                                        }
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                                            current.has_card
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                : 'bg-background text-muted-foreground border-input'
                                        }`}
                                    >
                                        হ্যাঁ (কার্ড আছে)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrent({
                                                ...current,
                                                has_card: false,
                                            })
                                        }
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                                            !current.has_card
                                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                                : 'bg-background text-muted-foreground border-input'
                                        }`}
                                    >
                                        না (কার্ড নেই)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Disease / Chief Complaint */}
                        <div className="grid gap-1">
                            <Label className="text-xs font-bold text-foreground">
                                রোগের বিবরণ / কি সমস্যা নিয়ে এসেছেন? <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                placeholder="রোগের নাম বা শারীরিক সমস্যা"
                                value={current.disease}
                                onChange={(e) =>
                                    setCurrent({
                                        ...current,
                                        disease: e.target.value,
                                    })
                                }
                                className="h-9 rounded-xl text-xs bg-background"
                            />
                        </div>

                        {/* Advice & Treatment */}
                        <div className="grid gap-1">
                            <Label className="text-xs font-bold text-foreground">
                                প্রদত্ত পরামর্শ ও চিকিৎসা সেবা <span className="text-destructive">*</span>
                            </Label>
                            <textarea
                                rows={3}
                                placeholder="প্রদত্ত প্রাথমিক চিকিৎসা, ওষুধ বা স্বাস্থ্য পরামর্শ লিখুন..."
                                value={current.advice}
                                onChange={(e) =>
                                    setCurrent({
                                        ...current,
                                        advice: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            />
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
                                type="submit"
                                size="sm"
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 shadow-xs"
                            >
                                {editIndex !== null
                                    ? 'সংরক্ষণ করুন'
                                    : 'রোগী যুক্ত করুন'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
