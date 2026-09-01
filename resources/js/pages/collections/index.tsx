import { Head, router, useForm } from '@inertiajs/react';
import {
    Activity,
    Building2,
    Calendar,
    Coins,
    DollarSign,
    Droplet,
    Filter,
    Layers,
    MapPin,
    Phone,
    Plus,
    Receipt,
    Search,
    Stethoscope,
    Tent,
    Trash2,
    TrendingUp,
    X,
} from 'lucide-react';
import React, { useState } from 'react';
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
import { formatDate } from '@/lib/utils';
import type { BranchOption, FeeCollection, Paginated } from '@/types/mcare';

type Props = {
    collections: Paginated<FeeCollection>;
    filters: {
        date?: string;
        month?: string;
        collection_type?: string;
        branch_id?: string;
        search?: string;
    };
    stats: {
        today_amount: number;
        today_count: number;
        today_diabetes_count: number;
        month_amount: number;
        month_count: number;
    };
    branches: BranchOption[];
    today: string;
    userBranchId?: number | null;
    userBranchName?: string;
};

const COLLECTION_TYPES = [
    { label: 'ডায়াবেটিস পরীক্ষা', icon: Droplet, color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
    { label: 'স্ট্যাটিক ক্লিনিক', icon: Activity, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/30' },
    { label: 'স্যাটেলাইট ক্লিনিক', icon: Stethoscope, color: 'text-teal-600 bg-teal-500/10 border-teal-500/30' },
    { label: 'স্বাস্থ্যক্যাম্প', icon: Tent, color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
    { label: 'অন্যান্য', icon: Layers, color: 'text-slate-600 bg-slate-500/10 border-slate-500/30' },
];

export default function FeeCollectionsIndex({
    collections,
    filters,
    stats,
    branches,
    today,
    userBranchId,
    userBranchName,
}: Props) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [filterSearch, setFilterSearch] = useState(filters.search || '');
    const [filterDate, setFilterDate] = useState(filters.date || '');
    const [filterMonth, setFilterMonth] = useState(filters.month || '');
    const [filterType, setFilterType] = useState(filters.collection_type || '');
    const [filterBranch, setFilterBranch] = useState(filters.branch_id || '');

    const form = useForm({
        collection_date: today,
        collection_type: 'ডায়াবেটিস পরীক্ষা',
        beneficiary_name: '',
        beneficiary_type: 'সদস্য' as 'সদস্য' | 'অ-সদস্য',
        age: '',
        phone: '',
        location_info: '',
        diabetes_reading: '',
        amount: '',
        notes: '',
        branch_id: userBranchId ? String(userBranchId) : '',
    });

    const handleApplyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/fee-collections',
            {
                search: filterSearch || undefined,
                date: filterDate || undefined,
                month: filterMonth || undefined,
                collection_type: filterType || undefined,
                branch_id: filterBranch || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setFilterSearch('');
        setFilterDate('');
        setFilterMonth('');
        setFilterType('');
        setFilterBranch('');
        router.get('/fee-collections', {}, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/fee-collections', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                form.reset();
                form.setData('collection_date', today);
                form.setData('collection_type', 'ডায়াবেটিস পরীক্ষা');
                form.setData('beneficiary_type', 'সদস্য');
                form.setData('branch_id', userBranchId ? String(userBranchId) : '');
            },
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('আপনি কি এই ফি আদায়ের রেকর্ডটি মুছে ফেলতে চান?')) return;
        router.delete(`/fee-collections/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="ফি আদায় পোস্টিং — M Care" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 md:p-6 pb-24 md:pb-10">
                {/* 1. Clean Compact Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                            <Receipt className="size-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                    ফি আদায় পোস্টিং (Fee Collections)
                                </h1>
                                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                                    {userBranchName || 'প্রধান শাখা'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                দৈনিক ফি সংগ্রহ, ডায়াবেটিস মাত্রা ও আয় সংক্রান্ত হিসাব
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-9 px-4 shadow-xs self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="size-4 mr-1" />
                        + নতুন ফি পোস্টিং
                    </Button>
                </div>

                {/* 2. Compact 3-Column Stats Ribbon */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Today's Collection */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                আজকের মোট আদায়
                            </span>
                            <p className="text-xl font-bold text-foreground">
                                ৳{stats.today_amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                মোট {stats.today_count} জন উপকারভোগী
                            </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <Coins className="size-4.5" />
                        </span>
                    </div>

                    {/* Month's Collection */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                চলতি মাসের মোট আদায়
                            </span>
                            <p className="text-xl font-bold text-foreground">
                                ৳{stats.month_amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                চলতি মাসে মোট {stats.month_count} জন
                            </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                            <TrendingUp className="size-4.5" />
                        </span>
                    </div>

                    {/* Diabetes Tests Today */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                আজকের ডায়াবেটিস পরীক্ষা
                            </span>
                            <p className="text-xl font-bold text-foreground">
                                {stats.today_diabetes_count} জন
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                মাত্রা নির্ণয় ও ফি পোস্টিং
                            </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                            <Droplet className="size-4.5" />
                        </span>
                    </div>
                </div>

                {/* 3. Compact Filter Bar */}
                <div className="rounded-2xl border border-border/80 bg-card p-3 shadow-2xs">
                    <form onSubmit={handleApplyFilters} className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[160px]">
                            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                            <Input
                                placeholder="নাম, মোবাইল বা গ্রাম..."
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                className="h-8 pl-8 text-xs rounded-xl bg-background"
                            />
                        </div>

                        {/* Collection Type Filter */}
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                        >
                            <option value="">সকল ধরণ</option>
                            {COLLECTION_TYPES.map((t) => (
                                <option key={t.label} value={t.label}>
                                    {t.label}
                                </option>
                            ))}
                        </select>

                        {/* Date Filter */}
                        <Input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="h-8 text-xs rounded-xl bg-background w-auto"
                        />

                        {/* Branch Filter (if multiple) */}
                        {branches.length > 1 ? (
                            <select
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                                className="h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                            >
                                <option value="">সকল শাখা</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        ) : null}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 ml-auto">
                            <Button
                                type="submit"
                                size="sm"
                                className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                            >
                                <Filter className="size-3 mr-1" />
                                ফিল্টার
                            </Button>
                            {(filterSearch || filterDate || filterMonth || filterType || filterBranch) ? (
                                <Button
                                    type="button"
                                    onClick={handleResetFilters}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 rounded-xl text-xs"
                                >
                                    <X className="size-3" />
                                </Button>
                            ) : null}
                        </div>
                    </form>
                </div>

                {/* 4. Professional Collections Data Table */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
                    <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Receipt className="size-3.5 text-emerald-600" />
                            আদায়কৃত ফি তালিকা ({collections.total} টি রেকর্ড)
                        </h3>
                    </div>

                    {collections.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                <Receipt className="size-6" />
                            </div>
                            <h4 className="mt-2.5 text-xs font-bold text-foreground">
                                কোনো ফি আদায়ের রেকর্ড পাওয়া যায়নি
                            </h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                                উপরে <strong>"+ নতুন ফি পোস্টিং"</strong> বাটনে ক্লিক করে আজকের সংগৃহীত ফি এন্ট্রি করুন।
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground">
                                    <tr>
                                        <th className="px-3 py-2.5">#</th>
                                        <th className="px-3 py-2.5">তারিখ</th>
                                        <th className="px-3 py-2.5">উপকারভোগীর নাম</th>
                                        <th className="px-3 py-2.5">ধরণ</th>
                                        <th className="px-3 py-2.5">বয়স ও মোবাইল</th>
                                        <th className="px-3 py-2.5">সমিতি / গ্রাম</th>
                                        <th className="px-3 py-2.5">ফি আদায়ের ধরণ ও মাত্রা</th>
                                        <th className="px-3 py-2.5 text-right">আদায় (টাকা)</th>
                                        <th className="px-3 py-2.5">মন্তব্য</th>
                                        <th className="px-3 py-2.5 text-right">অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {collections.data.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                                            <td className="px-3 py-2.5 font-bold text-muted-foreground">
                                                {(collections.current_page - 1) * collections.per_page + idx + 1}
                                            </td>
                                            <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                                                {formatDate(item.collection_date)}
                                            </td>
                                            <td className="px-3 py-2.5 font-bold text-foreground">
                                                {item.beneficiary_name}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-[9px] px-1.5 py-0 h-4.5 ${
                                                        item.beneficiary_type === 'সদস্য'
                                                            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                                                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                                    }`}
                                                >
                                                    {item.beneficiary_type}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-medium text-foreground">
                                                    {item.age ? `${item.age} ব.` : '—'}
                                                </span>
                                                {item.phone ? (
                                                    <span className="text-[10px] text-muted-foreground ml-1">
                                                        ({item.phone})
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2.5 max-w-[140px] truncate text-foreground">
                                                {item.location_info || '—'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[9px] px-1.5 py-0 h-4.5 font-semibold ${
                                                            item.collection_type === 'ডায়াবেটিস পরীক্ষা'
                                                                ? 'border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10'
                                                                : item.collection_type === 'স্ট্যাটিক ক্লিনিক'
                                                                ? 'border-indigo-500/40 text-indigo-700 dark:text-indigo-300 bg-indigo-500/10'
                                                                : 'border-border text-foreground'
                                                        }`}
                                                    >
                                                        {item.collection_type}
                                                    </Badge>

                                                    {item.diabetes_reading ? (
                                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/30">
                                                            {item.diabetes_reading}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <span className="inline-flex items-center font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                                    ৳{Number(item.amount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 max-w-[120px] truncate text-muted-foreground text-[10px]">
                                                {item.notes || '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="size-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {collections.last_page > 1 ? (
                        <div className="p-3 border-t flex items-center justify-between text-xs">
                            <span className="text-muted-foreground text-[11px]">
                                পৃষ্ঠা {collections.current_page} এর {collections.last_page} (মোট {collections.total} টি)
                            </span>
                            <div className="flex gap-1">
                                {collections.links.map((link, idx) => (
                                    <Button
                                        key={idx}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="h-7 min-w-7 text-[11px] rounded-lg"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* ADD FEE COLLECTION MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-5">
                    <DialogHeader className="text-left pb-2 border-b">
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                                <Receipt className="size-4" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    নতুন ফি আদায় পোস্টিং
                                </DialogTitle>
                                <DialogDescription className="text-[11px]">
                                    প্রতিদিনের সংগৃহীত ফি ও ডায়াবেটিস মাত্রা পোস্টিং দিন
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
                        {/* 1. ফি আদায়ের ধরণ (Type First) */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                                <Layers className="size-3.5 text-emerald-600" />
                                ফি আদায়ের ধরণ <span className="text-destructive">*</span>
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {COLLECTION_TYPES.map((t) => {
                                    const Icon = t.icon;
                                    const isSelected = form.data.collection_type === t.label;
                                    return (
                                        <button
                                            key={t.label}
                                            type="button"
                                            onClick={() => {
                                                form.setData('collection_type', t.label);
                                                if (t.label !== 'ডায়াবেটিস পরীক্ষা') {
                                                    form.setData('diabetes_reading', '');
                                                }
                                            }}
                                            className={`flex items-center gap-1.5 p-2 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                    : 'bg-background hover:bg-muted/40 border-input text-foreground'
                                            }`}
                                        >
                                            <span className={`flex size-5 items-center justify-center rounded ${isSelected ? 'bg-white/20 text-white' : t.color}`}>
                                                <Icon className="size-3" />
                                            </span>
                                            <span className="truncate text-[11px]">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. ডায়াবেটিস মাত্রা (CONDITIONAL) */}
                        {form.data.collection_type === 'ডায়াবেটিস পরীক্ষা' ? (
                            <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-2.5 space-y-1">
                                <Label className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                                    <Droplet className="size-3.5 text-rose-600" />
                                    মাত্রা (ডায়াবেটিস রিডিং / গ্লুকোজ মাত্রা) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="যেমন: 6.5 mmol/L বা 110 mg/dL"
                                    value={form.data.diabetes_reading}
                                    onChange={(e) => form.setData('diabetes_reading', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background border-rose-500/30"
                                />
                            </div>
                        ) : null}

                        {/* 3. তারিখ ও শাখা */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    তারিখ (Date) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={form.data.collection_date}
                                    onChange={(e) => form.setData('collection_date', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    শাখা (Branch)
                                </Label>
                                <Input
                                    disabled
                                    value={userBranchName || 'প্রধান শাখা'}
                                    className="h-8.5 rounded-xl text-xs bg-muted/50 font-semibold text-foreground"
                                />
                            </div>
                        </div>

                        {/* 4. উপকারভোগীর নাম ও ধরন */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2 grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    উপকারভোগীর নাম <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="উপকারভোগীর নাম"
                                    value={form.data.beneficiary_name}
                                    onChange={(e) => form.setData('beneficiary_name', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    ধরন
                                </Label>
                                <div className="flex gap-1">
                                    {(['সদস্য', 'অ-সদস্য'] as const).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => form.setData('beneficiary_type', type)}
                                            className={`flex-1 py-1 text-xs font-bold rounded-xl border transition-colors ${
                                                form.data.beneficiary_type === type
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'bg-background text-muted-foreground border-input'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 5. বয়স ও মোবাইল */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    বয়স (বছর)
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    placeholder="বয়স"
                                    value={form.data.age}
                                    onChange={(e) => form.setData('age', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    মোবাইল নম্বর
                                </Label>
                                <Input
                                    placeholder="মোবাইল নম্বর"
                                    value={form.data.phone}
                                    onChange={(e) => form.setData('phone', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* 6. সমিতি / গ্রাম ও টাকা */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    সমিতি / শাখা / গ্রামের নাম
                                </Label>
                                <Input
                                    placeholder="সমিতির নাম বা গ্রামের নাম"
                                    value={form.data.location_info}
                                    onChange={(e) => form.setData('location_info', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    আদায়কৃত ফি (টাকা) <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="টাকার পরিমাণ (যেমন: ৫০)"
                                    value={form.data.amount}
                                    onChange={(e) => form.setData('amount', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background font-bold text-foreground border-emerald-500/40"
                                />
                            </div>
                        </div>

                        {/* 7. মন্তব্য */}
                        <div className="grid gap-1">
                            <Label className="text-xs font-bold text-foreground">
                                মন্তব্য (যদি থাকে)
                            </Label>
                            <Input
                                placeholder="কোনো মন্তব্য..."
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                className="h-8.5 rounded-xl text-xs bg-background"
                            />
                        </div>

                        <div className="mt-3 pt-2.5 border-t flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddModalOpen(false)}
                                className="rounded-xl text-xs font-semibold h-8"
                            >
                                বাতিল
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                size="sm"
                                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 h-8 shadow-xs"
                            >
                                {form.processing ? 'পোস্টিং হচ্ছে...' : 'পোস্টিং সংরক্ষণ করুন'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
