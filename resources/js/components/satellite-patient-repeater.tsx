import {
    Edit2,
    HeartHandshake,
    Plus,
    Stethoscope,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type PatientEntry = {
    id: string;
    member_name: string;
    member_number: string;
    member_age: string;
    member_gender: string;
    patient_name: string;
    patient_age: string;
    patient_gender: string;
    patient_type: string;
    services_provided: string;
};

type Props = {
    patients: PatientEntry[];
    onChange: (patients: PatientEntry[]) => void;
};

const emptyPatient: Omit<PatientEntry, 'id'> = {
    member_name: '',
    member_number: '',
    member_age: '',
    member_gender: 'নারী',
    patient_name: '',
    patient_age: '',
    patient_gender: 'নারী',
    patient_type: 'সদস্য নিজে',
    services_provided: '',
};

export function SatellitePatientRepeater({ patients = [], onChange }: Props) {
    const [current, setCurrent] = useState<Omit<PatientEntry, 'id'>>({ ...emptyPatient });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Auto sync when "সদস্য নিজে" is selected
    const handleMemberNameChange = (val: string) => {
        setCurrent((prev) => ({
            ...prev,
            member_name: val,
            patient_name: prev.patient_type === 'সদস্য নিজে' ? val : prev.patient_name,
        }));
    };

    const handleMemberAgeChange = (val: string) => {
        setCurrent((prev) => ({
            ...prev,
            member_age: val,
            patient_age: prev.patient_type === 'সদস্য নিজে' && val ? `${val} বছর` : prev.patient_age,
        }));
    };

    const handleMemberGenderChange = (val: string) => {
        setCurrent((prev) => ({
            ...prev,
            member_gender: val,
            patient_gender: prev.patient_type === 'সদস্য নিজে' ? val : prev.patient_gender,
        }));
    };

    const handlePatientTypeChange = (val: string) => {
        setCurrent((prev) => {
            const next = { ...prev, patient_type: val };
            if (val === 'সদস্য নিজে') {
                next.patient_name = prev.member_name;
                next.patient_age = prev.member_age ? `${prev.member_age} বছর` : '';
                next.patient_gender = prev.member_gender || 'নারী';
            } else {
                next.patient_name = '';
                next.patient_age = '';
                next.patient_gender = val === 'গর্ভবতী মা' || val === 'প্রসূতি মা' ? 'নারী' : 'নারী';
            }
            return next;
        });
    };

    const handleAddOrUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!current.member_name.trim()) {
            setErrorMsg('অনুগ্রহ করে সদস্যের নাম লিখুন।');
            return;
        }

        if (!current.patient_name.trim()) {
            setErrorMsg('অনুগ্রহ করে সেবা প্রাপ্ত ব্যক্তির নাম লিখুন।');
            return;
        }

        if (!current.patient_age.trim()) {
            setErrorMsg('অনুগ্রহ করে সেবা প্রাপ্ত ব্যক্তির বয়স লিখুন।');
            return;
        }

        if (!current.services_provided.trim()) {
            setErrorMsg('অনুগ্রহ করে প্রদত্ত সেবার বিবরণ লিখুন।');
            return;
        }

        if (editingId) {
            // Update existing entry
            const updated = patients.map((p) =>
                p.id === editingId ? { ...current, id: editingId } : p,
            );
            onChange(updated);
            setEditingId(null);
        } else {
            // Add new entry
            const newEntry: PatientEntry = {
                ...current,
                id: `patient_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            };
            onChange([...patients, newEntry]);
        }

        // Reset form
        setCurrent({ ...emptyPatient });
    };

    const handleEdit = (entry: PatientEntry) => {
        setEditingId(entry.id);
        setCurrent({
            member_name: entry.member_name,
            member_number: entry.member_number,
            member_age: entry.member_age,
            member_gender: entry.member_gender,
            patient_name: entry.patient_name,
            patient_age: entry.patient_age,
            patient_gender: entry.patient_gender,
            patient_type: entry.patient_type,
            services_provided: entry.services_provided,
        });
        setErrorMsg(null);
    };

    const handleRemove = (idToRemove: string) => {
        onChange(patients.filter((p) => p.id !== idToRemove));
        if (editingId === idToRemove) {
            setEditingId(null);
            setCurrent({ ...emptyPatient });
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setCurrent({ ...emptyPatient });
        setErrorMsg(null);
    };

    return (
        <div className="space-y-5 rounded-2xl border border-border/80 bg-muted/15 p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300">
                        <Stethoscope className="size-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">
                            সেবাগ্রহীতা এন্ট্রি (Patient & Member Information)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                            একজন একজন করে সদস্যের সেবার তথ্য যুক্ত করুন
                        </p>
                    </div>
                </div>

                <Badge variant="secondary" className="text-xs self-start sm:self-auto font-semibold">
                    মোট সেবাগ্রহীতা: {patients.length} জন
                </Badge>
            </div>

            {/* Patient Add / Edit Card */}
            <div className="rounded-xl border border-primary/20 bg-card p-4 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <UserCheck className="size-4 text-primary" />
                        {editingId ? 'সেবাগ্রহীতার তথ্য সংশোধন করুন' : 'নতুন সেবাগ্রহীতা যোগ করুন'}
                    </span>
                    {editingId ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="text-xs h-7 px-2"
                        >
                            সংশোধন বাতিল
                        </Button>
                    ) : null}
                </div>

                {errorMsg ? (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive font-medium">
                        {errorMsg}
                    </div>
                ) : null}

                {/* Section A: Member Details */}
                <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        ক. সমিতির সদস্যের তথ্য (Member Details)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">
                                সদস্যের নাম <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="সদস্যের নাম"
                                value={current.member_name}
                                onChange={(e) => handleMemberNameChange(e.target.value)}
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">সদস্য নম্বর</Label>
                            <Input
                                type="text"
                                placeholder="সদস্য নম্বর / কোড"
                                value={current.member_number}
                                onChange={(e) =>
                                    setCurrent((prev) => ({ ...prev, member_number: e.target.value }))
                                }
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">সদস্যের বয়স (বছর)</Label>
                            <Input
                                type="number"
                                placeholder="যেমন: ৩৫"
                                min={0}
                                value={current.member_age}
                                onChange={(e) => handleMemberAgeChange(e.target.value)}
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">সদস্যের লিঙ্গ</Label>
                            <select
                                value={current.member_gender}
                                onChange={(e) => handleMemberGenderChange(e.target.value)}
                                className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <option value="নারী">নারী</option>
                                <option value="পুরুষ">পুরুষ</option>
                                <option value="তৃতীয় লিঙ্গ">তৃতীয় লিঙ্গ</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section B: Patient & Beneficiary Details */}
                <div className="space-y-2 border-t pt-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        খ. সেবা প্রাপ্ত ব্যক্তি ও সেবার তথ্য (Beneficiary & Service)
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">
                                সেবা প্রাপ্ত ব্যক্তির ধরণ <span className="text-destructive">*</span>
                            </Label>
                            <select
                                value={current.patient_type}
                                onChange={(e) => handlePatientTypeChange(e.target.value)}
                                className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary font-medium"
                            >
                                <option value="সদস্য নিজে">সদস্য নিজে</option>
                                <option value="শিশু (০-৫ বছর)">শিশু (০-৫ বছর)</option>
                                <option value="গর্ভবতী মা">গর্ভবতী মা</option>
                                <option value="প্রসূতি মা">প্রসূতি মা</option>
                                <option value="কিশোর / কিশোরী">কিশোর / কিশোরী</option>
                                <option value="পরিবারের অন্যান্য সদস্য">পরিবারের অন্যান্য সদস্য</option>
                            </select>
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">
                                সেবা প্রাপ্ত ব্যক্তির নাম <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="রোগী / ব্যক্তির নাম"
                                value={current.patient_name}
                                onChange={(e) =>
                                    setCurrent((prev) => ({ ...prev, patient_name: e.target.value }))
                                }
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">
                                বয়স <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                type="text"
                                placeholder="যেমন: ২৮ বছর বা ৮ মাস"
                                value={current.patient_age}
                                onChange={(e) =>
                                    setCurrent((prev) => ({ ...prev, patient_age: e.target.value }))
                                }
                                className="h-9 rounded-xl text-xs"
                            />
                        </div>

                        <div className="grid gap-1">
                            <Label className="text-xs font-semibold">
                                লিঙ্গ <span className="text-destructive">*</span>
                            </Label>
                            <select
                                value={current.patient_gender}
                                onChange={(e) =>
                                    setCurrent((prev) => ({ ...prev, patient_gender: e.target.value }))
                                }
                                className="h-9 w-full rounded-xl border border-input bg-background px-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                                <option value="নারী">নারী</option>
                                <option value="পুরুষ">পুরুষ</option>
                                <option value="তৃতীয় লিঙ্গ">তৃতীয় লিঙ্গ</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-1 pt-1">
                        <Label className="text-xs font-semibold">
                            কি সেবা প্রদান করা হয়েছে <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            rows={2}
                            placeholder="প্রদত্ত সেবা ও চিকিৎসার বিবরণ লিখুন (যেমন: সাধারণ স্বাস্থ্য পরীক্ষা, ব্লাড প্রেসার ও ডায়াবেটিস টেস্ট, পুষ্টি পরামর্শ, ওষুধ ইত্যাদি)..."
                            value={current.services_provided}
                            onChange={(e) =>
                                setCurrent((prev) => ({ ...prev, services_provided: e.target.value }))
                            }
                            className="rounded-xl text-xs leading-relaxed"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-1">
                    <Button
                        type="button"
                        onClick={handleAddOrUpdate}
                        size="sm"
                        className="w-full sm:w-auto rounded-xl px-5 py-2.5 sm:py-2 text-xs font-bold shadow-xs bg-teal-600 hover:bg-teal-700 text-white"
                    >
                        <Plus className="size-3.5 mr-1" />
                        {editingId ? 'সংশোধন সংরক্ষণ করুন' : 'তালিকায় যুক্ত করুন (Add Member)'}
                    </Button>
                </div>
            </div>

            {/* Patients Appended List */}
            {patients.length > 0 ? (
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                            যুক্ত হওয়া সেবাগ্রহীতার তালিকা ({patients.length})
                        </span>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="grid grid-cols-1 gap-2.5 md:hidden">
                        {patients.map((p, idx) => (
                            <div
                                key={p.id}
                                className="rounded-xl border border-border/80 bg-card p-3.5 space-y-2.5 shadow-2xs"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-foreground leading-tight">{p.patient_name}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                বয়স: {p.patient_age} • {p.patient_gender}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-normal py-0 h-5 shrink-0">
                                        {p.patient_type}
                                    </Badge>
                                </div>

                                <div className="rounded-lg bg-muted/40 p-2 text-[11px] space-y-1">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>সমিতির সদস্য:</span>
                                        <span className="font-semibold text-foreground">
                                            {p.member_name} {p.member_number ? `(${p.member_number})` : ''}
                                        </span>
                                    </div>
                                    {p.services_provided ? (
                                        <div className="pt-1 border-t border-border/40 text-muted-foreground">
                                            <span className="font-medium text-foreground">প্রদত্ত সেবা: </span>
                                            {p.services_provided}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(p)}
                                        className="h-7 text-xs px-2.5 rounded-lg text-primary hover:text-primary"
                                    >
                                        <Edit2 className="size-3 mr-1" />
                                        সংশোধন
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemove(p.id)}
                                        className="h-7 text-xs px-2.5 rounded-lg text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="size-3 mr-1" />
                                        মুছুন
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-card">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2.5">#</th>
                                    <th className="px-3 py-2.5">সদস্যের নাম ও নম্বর</th>
                                    <th className="px-3 py-2.5">সেবাগ্রহীতা ও বয়স</th>
                                    <th className="px-3 py-2.5">ধরণ ও লিঙ্গ</th>
                                    <th className="px-3 py-2.5">প্রদত্ত সেবাসমূহ</th>
                                    <th className="px-3 py-2.5 text-right">অ্যাকশন</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {patients.map((p, idx) => (
                                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-3 py-2.5 font-bold text-muted-foreground">
                                            {idx + 1}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <p className="font-semibold text-foreground">{p.member_name}</p>
                                            {p.member_number ? (
                                                <p className="text-[10px] text-muted-foreground">
                                                    আইডি: {p.member_number}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <p className="font-medium text-foreground">{p.patient_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{p.patient_age}</p>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <Badge variant="outline" className="text-[10px] font-normal py-0 h-5">
                                                {p.patient_type}
                                            </Badge>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {p.patient_gender}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 max-w-xs">
                                            <p className="line-clamp-2 text-muted-foreground text-[11px]">
                                                {p.services_provided}
                                            </p>
                                        </td>
                                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(p)}
                                                    className="size-7 p-0 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="size-3.5 text-muted-foreground hover:text-primary" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemove(p.id)}
                                                    className="size-7 p-0 rounded-lg hover:bg-destructive/10"
                                                    title="Remove"
                                                >
                                                    <Trash2 className="size-3.5 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground bg-background/50">
                    <Users className="size-6 mx-auto mb-1.5 opacity-40 text-muted-foreground" />
                    এখনো কোনো সদস্য/সেবাগ্রহীতা যোগ করা হয়নি। উপরের ফর্মে তথ্য পূরণ করে <strong>"তালিকায় যুক্ত করুন"</strong> বাটনে ক্লিক করুন।
                </div>
            )}
        </div>
    );
}
