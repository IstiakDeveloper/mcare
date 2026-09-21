import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    Edit,
    Filter,
    Layers,
    MapPin,
    Phone,
    Plus,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import type { BranchOption, HealthCardDisburse, Paginated } from '@/types/mcare';

type Props = {
    cards: Paginated<HealthCardDisburse>;
    filters: {
        search?: string;
        branch_id?: string;
        status?: string;
        date?: string;
        month?: string;
    };
    stats: {
        total_count: number;
        month_count: number;
        active_count: number;
        expired_count: number;
        expiring_soon_count: number;
    };
    branches: BranchOption[];
    today: string;
    userBranchId?: number | null;
    userBranchName?: string;
    canManage?: boolean;
};

// Helper to calculate expire date by adding years to a base date
function calculateExpireDate(baseDateStr: string, yearsToAdd: number): string {
    if (!baseDateStr) return '';
    try {
        const parts = baseDateStr.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10) + yearsToAdd;
            return `${y}-${parts[1]}-${parts[2]}`;
        }
        const d = new Date(baseDateStr);
        d.setFullYear(d.getFullYear() + yearsToAdd);
        return d.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

export default function HealthCardsIndex({
    cards,
    filters,
    stats,
    branches,
    today,
    userBranchId,
    userBranchName,
    canManage = false,
}: Props) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<HealthCardDisburse | null>(null);
    const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

    // Filter states
    const [filterSearch, setFilterSearch] = useState(filters.search || '');
    const [filterBranch, setFilterBranch] = useState(filters.branch_id || '');
    const [filterStatus, setFilterStatus] = useState(filters.status || '');
    const [filterDate, setFilterDate] = useState(filters.date || '');
    const [filterMonth, setFilterMonth] = useState(filters.month || '');

    // Duration helper in Add Form
    const [addDurationYears, setAddDurationYears] = useState<number>(1);
    const [editDurationYears, setEditDurationYears] = useState<number>(1);

    // Initial expire date (today + 1 year)
    const initialExpireDate = calculateExpireDate(today, 1);

    // Add Form
    const addForm = useForm({
        member_name: '',
        member_code: '',
        health_card_number: '',
        entry_date: today,
        expire_date: initialExpireDate,
        phone: '',
        village_or_samity: '',
        notes: '',
        branch_id: userBranchId ? String(userBranchId) : '',
    });

    // Edit Form
    const editForm = useForm({
        member_name: '',
        member_code: '',
        health_card_number: '',
        entry_date: '',
        expire_date: '',
        phone: '',
        village_or_samity: '',
        notes: '',
        branch_id: '',
    });

    // Handle Entry Date change in Add Form
    const handleAddEntryDateChange = (newDate: string) => {
        addForm.setData('entry_date', newDate);
        if (newDate) {
            const newExpire = calculateExpireDate(newDate, addDurationYears);
            addForm.setData('expire_date', newExpire);
        }
    };

    // Handle Quick Duration Selection in Add Form
    const handleAddDurationSelect = (years: number) => {
        setAddDurationYears(years);
        if (addForm.data.entry_date) {
            const newExpire = calculateExpireDate(addForm.data.entry_date, years);
            addForm.setData('expire_date', newExpire);
        }
    };

    // Handle Entry Date change in Edit Form
    const handleEditEntryDateChange = (newDate: string) => {
        editForm.setData('entry_date', newDate);
        if (newDate) {
            const newExpire = calculateExpireDate(newDate, editDurationYears);
            editForm.setData('expire_date', newExpire);
        }
    };

    // Handle Quick Duration Selection in Edit Form
    const handleEditDurationSelect = (years: number) => {
        setEditDurationYears(years);
        if (editForm.data.entry_date) {
            const newExpire = calculateExpireDate(editForm.data.entry_date, years);
            editForm.setData('expire_date', newExpire);
        }
    };

    const handleApplyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/health-cards',
            {
                search: filterSearch || undefined,
                branch_id: filterBranch || undefined,
                status: filterStatus || undefined,
                date: filterDate || undefined,
                month: filterMonth || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setFilterSearch('');
        setFilterBranch('');
        setFilterStatus('');
        setFilterDate('');
        setFilterMonth('');
        router.get('/health-cards', {}, { preserveState: true });
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post('/health-cards', {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
                addForm.setData('entry_date', today);
                addForm.setData('expire_date', calculateExpireDate(today, 1));
                setAddDurationYears(1);
            },
        });
    };

    const handleOpenEdit = (card: HealthCardDisburse) => {
        setEditingCard(card);
        setEditDurationYears(1);
        editForm.setData({
            member_name: card.member_name,
            member_code: card.member_code,
            health_card_number: card.health_card_number,
            entry_date: card.entry_date,
            expire_date: card.expire_date,
            phone: card.phone || '',
            village_or_samity: card.village_or_samity || '',
            notes: card.notes || '',
            branch_id: card.branch_id ? String(card.branch_id) : '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard) return;

        editForm.put(`/health-cards/${editingCard.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCard(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('আপনি কি নিশ্চিত যে এই কার্ড বিতরণের তথ্যটি মুছে ফেলতে চান?')) {
            return;
        }

        router.delete(`/health-cards/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="হেলথ কার্ড বিতরণ তালিকা — M Care" />

            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-3 md:p-6 pb-24 md:pb-10">
                {/* 1. Header with Title & New Entry Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/80 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs shrink-0">
                            <CreditCard className="size-5" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                                    হেলথ কার্ড বিতরণ (Health Card Disburse)
                                </h1>
                                <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-bold">
                                    {userBranchName || 'সকল শাখা'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                সদস্যদের স্বাস্থ্য কার্ড বিতরণ, স্বয়ংক্রিয় মেয়াদ ও ভ্যালিডিটি পর্যবেক্ষণ
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs h-9 px-4 shadow-xs self-start sm:self-auto cursor-pointer"
                    >
                        <Plus className="size-4 mr-1.5" />
                        + নতুন কার্ড বিতরণ এন্ট্রি
                    </Button>
                </div>

                {/* 2. Key Statistics Ribbon */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Disbursed */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                মোট কার্ড বিতরণ
                            </span>
                            <p className="text-xl font-bold text-foreground">
                                {stats.total_count.toLocaleString()} টি
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                সর্বমোট নিবন্ধিত সদস্য
                            </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                            <CreditCard className="size-4.5" />
                        </span>
                    </div>

                    {/* Active Cards */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                সচল কার্ড (Active)
                            </span>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {stats.active_count.toLocaleString()} টি
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                পূর্ণ মেয়াদে কার্যকর
                            </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <ShieldCheck className="size-4.5" />
                        </span>
                    </div>

                    {/* Expiring Soon */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                শীঘ্রই শেষ হবে
                            </span>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {stats.expiring_soon_count.toLocaleString()} টি
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                ৩০ দিনের মধ্যে মেয়াদ শেষ
                            </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                            <Clock className="size-4.5" />
                        </span>
                    </div>

                    {/* Expired Cards */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-card shadow-2xs">
                        <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                মেয়াদ উত্তীর্ণ (Expired)
                            </span>
                            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                                {stats.expired_count.toLocaleString()} টি
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                নবায়ন প্রয়োজন
                            </p>
                        </div>
                        <span className="flex size-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                            <ShieldAlert className="size-4.5" />
                        </span>
                    </div>
                </div>

                {/* 3. Search & Filter Bar */}
                <div className="rounded-2xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs">
                    <form onSubmit={handleApplyFilters} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 text-xs">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                            <Input
                                placeholder="সদস্যের নাম, কোড, কার্ড নং, মোবাইল..."
                                value={filterSearch}
                                onChange={(e) => setFilterSearch(e.target.value)}
                                className="h-9 sm:h-8 pl-8 text-xs rounded-xl bg-background w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="h-9 sm:h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                            >
                                <option value="">সকল স্ট্যাটাস</option>
                                <option value="active">সচল কার্ড (Active)</option>
                                <option value="expiring_soon">শীঘ্রই মেয়াদ শেষ (Expiring Soon)</option>
                                <option value="expired">মেয়াদ উত্তীর্ণ (Expired)</option>
                            </select>

                            {/* Branch Filter (Only for Admin / multiple branches) */}
                            {branches.length > 1 ? (
                                <select
                                    value={filterBranch}
                                    onChange={(e) => setFilterBranch(e.target.value)}
                                    className="h-9 sm:h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                                >
                                    <option value="">সকল শাখা</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            ) : null}

                            {/* Date Filter */}
                            <Input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="h-9 sm:h-8 text-xs rounded-xl bg-background w-auto min-w-[130px]"
                                title="এন্ট্রির নির্দিষ্ট তারিখ"
                            />

                            {/* Filter Buttons */}
                            <div className="flex items-center gap-1.5 ml-auto">
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="h-9 sm:h-8 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    <Filter className="size-3 mr-1" />
                                    ফিল্টার
                                </Button>
                                {(filterSearch || filterBranch || filterStatus || filterDate || filterMonth) ? (
                                    <Button
                                        type="button"
                                        onClick={handleResetFilters}
                                        variant="outline"
                                        size="sm"
                                        className="h-9 sm:h-8 px-2.5 rounded-xl text-xs"
                                        title="ফিল্টার রিসেট করুন"
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </form>
                </div>

                {/* 4. Health Card Disburse Data List (Mobile Cards + Desktop Table) */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
                    <div className="p-3.5 border-b bg-muted/20 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <CreditCard className="size-3.5 text-primary" />
                            বিতরণকৃত কার্ডের তালিকা ({cards.total} টি রেকর্ড)
                        </h3>
                    </div>

                    {cards.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                <CreditCard className="size-6" />
                            </div>
                            <h4 className="mt-2.5 text-xs sm:text-sm font-bold text-foreground">
                                কোনো হেলথ কার্ডের রেকর্ড পাওয়া যায়নি
                            </h4>
                            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 max-w-xs">
                                উপরে <strong>"+ নতুন কার্ড বিতরণ এন্ট্রি"</strong> বাটনে ক্লিক করে নতুন কার্ড ইস্যু করুন।
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* MOBILE CARDS VIEW (< 768px) */}
                            <div className="grid gap-2.5 p-3 md:hidden">
                                {cards.data.map((item, idx) => {
                                    const days = item.days_remaining ?? 0;
                                    const isExpired = item.validity_status === 'expired' || days < 0;
                                    const isExpiringSoon = item.validity_status === 'expiring_soon';

                                    return (
                                        <div
                                            key={item.id}
                                            className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-background/60 p-3.5 shadow-2xs"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                                                            {(cards.current_page - 1) * cards.per_page + idx + 1}
                                                        </span>
                                                        <h4 className="text-sm font-bold text-foreground truncate">
                                                            {item.member_name}
                                                        </h4>
                                                        <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                                                            কোড: {item.member_code}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <CreditCard className="size-3 text-primary shrink-0" />
                                                        <span className="font-semibold text-foreground font-mono">
                                                            {item.health_card_number}
                                                        </span>
                                                        {item.phone ? <span>• 📞 {item.phone}</span> : null}
                                                    </p>
                                                </div>

                                                {/* Status Badge */}
                                                {isExpired ? (
                                                    <span className="inline-flex items-center text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-500/30 shrink-0">
                                                        🔴 মেয়াদোত্তীর্ণ ({Math.abs(days)} দিন পূর্বে)
                                                    </span>
                                                ) : isExpiringSoon ? (
                                                    <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30 shrink-0">
                                                        🟡 আর {days} দিন বাকি
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30 shrink-0">
                                                        🟢 সচল ({days} দিন বাকি)
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                                                <div>
                                                    <span>বিতরণ: <strong>{formatDate(item.entry_date)}</strong></span>
                                                    <span className="mx-1">→</span>
                                                    <span>মেয়াদ: <strong>{formatDate(item.expire_date)}</strong></span>
                                                </div>

                                                {item.village_or_samity ? (
                                                    <span className="truncate max-w-[120px]">
                                                        📍 {item.village_or_samity}
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                                                <span>শাখা: {item.branch?.name || 'প্রধান শাখা'}</span>
                                                <span>এন্ট্রি: {item.user?.name || '—'}</span>

                                                {canManage ? (
                                                    <div className="flex items-center gap-1 ml-auto">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="size-7 p-0 rounded-lg text-primary hover:bg-primary/10"
                                                            title="সম্পাদনা করুন"
                                                        >
                                                            <Edit className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(item.id)}
                                                            className="size-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                                                            title="মুছে ফেলুন"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {item.notes ? (
                                                <p className="text-[10px] text-muted-foreground italic bg-muted/30 px-2 py-1 rounded-lg">
                                                    মন্তব্য: {item.notes}
                                                </p>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* DESKTOP TABLE VIEW (>= 768px) */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2.5">#</th>
                                            <th className="px-3 py-2.5">সদস্যের নাম ও কোড</th>
                                            <th className="px-3 py-2.5">হেলথ কার্ড নম্বর</th>
                                            <th className="px-3 py-2.5">বিতরণের তারিখ</th>
                                            <th className="px-3 py-2.5">মেয়াদ উত্তীর্ণের তারিখ</th>
                                            <th className="px-3 py-2.5">মেয়াদ / ভ্যালিডিটি স্ট্যাটাস</th>
                                            <th className="px-3 py-2.5">শাখা ও সমিতি</th>
                                            <th className="px-3 py-2.5">এন্ট্রি প্রদানকারী</th>
                                            <th className="px-3 py-2.5">মন্তব্য</th>
                                            {canManage ? (
                                                <th className="px-3 py-2.5 text-right">অ্যাকশন</th>
                                            ) : null}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {cards.data.map((item, idx) => {
                                            const days = item.days_remaining ?? 0;
                                            const isExpired = item.validity_status === 'expired' || days < 0;
                                            const isExpiringSoon = item.validity_status === 'expiring_soon';

                                            return (
                                                <tr key={item.id} className="hover:bg-muted/15 transition-colors">
                                                    <td className="px-3 py-2.5 font-bold text-muted-foreground">
                                                        {(cards.current_page - 1) * cards.per_page + idx + 1}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="font-bold text-foreground">
                                                            {item.member_name}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-mono">
                                                            কোড: {item.member_code}
                                                            {item.phone ? ` • 📞 ${item.phone}` : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                                            {item.health_card_number}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap font-medium text-foreground">
                                                        {formatDate(item.entry_date)}
                                                    </td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-foreground">
                                                        {formatDate(item.expire_date)}
                                                    </td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                                        {isExpired ? (
                                                            <span className="inline-flex items-center text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-500/30">
                                                                🔴 মেয়াদোত্তীর্ণ ({Math.abs(days)} দিন পূর্বে)
                                                            </span>
                                                        ) : isExpiringSoon ? (
                                                            <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30">
                                                                🟡 আর {days} দিন বাকি
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                                                                🟢 সচল ({days} দিন বাকি)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 max-w-[140px] truncate text-foreground">
                                                        <div>{item.branch?.name || 'প্রধান শাখা'}</div>
                                                        {item.village_or_samity ? (
                                                            <div className="text-[10px] text-muted-foreground truncate">
                                                                {item.village_or_samity}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                                                        {item.user?.name || '—'}
                                                    </td>
                                                    <td className="px-3 py-2.5 max-w-[120px] truncate text-[10px] text-muted-foreground">
                                                        {item.notes || '—'}
                                                    </td>
                                                    {canManage ? (
                                                        <td className="px-3 py-2.5 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenEdit(item)}
                                                                    className="size-7 p-0 rounded-lg text-primary hover:bg-primary/10"
                                                                    title="সম্পাদনা করুন"
                                                                >
                                                                    <Edit className="size-3.5" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="size-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                                                                    title="মুছে ফেলুন"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {cards.last_page > 1 ? (
                        <div className="p-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <span className="text-muted-foreground text-[11px]">
                                পৃষ্ঠা {cards.current_page} এর {cards.last_page} (মোট {cards.total} টি)
                            </span>
                            <div className="flex gap-1 flex-wrap">
                                {cards.links.map((link, idx) => (
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

            {/* NEW HEALTH CARD MODAL */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-5">
                    <DialogHeader className="text-left pb-2 border-b">
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                                <CreditCard className="size-4" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    নতুন হেলথ কার্ড বিতরণ এন্ট্রি
                                </DialogTitle>
                                <DialogDescription className="text-[11px]">
                                    সদস্যের তথ্য ও কার্ড নম্বর দিন (স্বয়ংক্রিয় ১ বছর মেয়াদ ডিফল্ট)
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="space-y-3.5 pt-2">
                        {/* 1. Member Name & Member Code */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    সদস্যের নাম <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="যেমন: মোসাঃ ফাতেমা বেগম"
                                    value={addForm.data.member_name}
                                    onChange={(e) => addForm.setData('member_name', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                    required
                                />
                                {addForm.errors.member_name && (
                                    <p className="text-[10px] text-destructive">{addForm.errors.member_name}</p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    সদস্য কোড <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="যেমন: MEM-10452"
                                    value={addForm.data.member_code}
                                    onChange={(e) => addForm.setData('member_code', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background font-mono"
                                    required
                                />
                                {addForm.errors.member_code && (
                                    <p className="text-[10px] text-destructive">{addForm.errors.member_code}</p>
                                )}
                            </div>
                        </div>

                        {/* 2. Health Card Number & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    হেলথ কার্ড নম্বর <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="যেমন: HC-2026-0089"
                                    value={addForm.data.health_card_number}
                                    onChange={(e) => addForm.setData('health_card_number', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background font-mono"
                                    required
                                />
                                {addForm.errors.health_card_number && (
                                    <p className="text-[10px] text-destructive">{addForm.errors.health_card_number}</p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    মোবাইল নম্বর
                                </Label>
                                <Input
                                    placeholder="যেমন: 017xxxxxxxx"
                                    value={addForm.data.phone}
                                    onChange={(e) => addForm.setData('phone', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* 3. Dates and Validity Duration Selector */}
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Clock className="size-3.5 text-primary" />
                                    মেয়াদের সময়কাল (Validity Duration)
                                </span>
                                <span className="text-[10px] text-primary font-bold">
                                    স্বয়ংক্রিয় হিসাব
                                </span>
                            </div>

                            {/* Quick Year Selector Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {[
                                    { label: '১ বছর (ডিফল্ট)', years: 1 },
                                    { label: '২ বছর', years: 2 },
                                    { label: '৩ বছর', years: 3 },
                                    { label: '৫ বছর', years: 5 },
                                ].map((item) => (
                                    <button
                                        key={item.years}
                                        type="button"
                                        onClick={() => handleAddDurationSelect(item.years)}
                                        className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                            addDurationYears === item.years
                                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                                : 'bg-background hover:bg-muted text-foreground border-input'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <div className="grid gap-1">
                                    <Label className="text-[11px] font-bold text-foreground">
                                        বিতরণের তারিখ <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={addForm.data.entry_date}
                                        onChange={(e) => handleAddEntryDateChange(e.target.value)}
                                        className="h-8.5 rounded-xl text-xs bg-background"
                                        required
                                    />
                                    {addForm.errors.entry_date && (
                                        <p className="text-[10px] text-destructive">{addForm.errors.entry_date}</p>
                                    )}
                                </div>

                                <div className="grid gap-1">
                                    <Label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                                        <span>মেয়াদ উত্তীর্ণের তারিখ <span className="text-destructive">*</span></span>
                                        <span className="text-[9px] text-muted-foreground font-normal">(পরিবর্তনযোগ্য)</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={addForm.data.expire_date}
                                        onChange={(e) => addForm.setData('expire_date', e.target.value)}
                                        className="h-8.5 rounded-xl text-xs bg-background font-semibold"
                                        required
                                    />
                                    {addForm.errors.expire_date && (
                                        <p className="text-[10px] text-destructive">{addForm.errors.expire_date}</p>
                                    )}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                * বিতরণের তারিখ পরিবর্তনের সাথে সাথে স্বয়ংক্রিয়ভাবে মেয়াদ ক্যালকুলেট হবে। তবে চাইলে সরাসরি মেয়াদ শেষের তারিখ পরিবর্তন করা যাবে।
                            </p>
                        </div>

                        {/* 4. Village/Samity & Branch */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    সমিতি / গ্রাম / এলাকা
                                </Label>
                                <Input
                                    placeholder="যেমন: উত্তরপাড়া সমিতি"
                                    value={addForm.data.village_or_samity}
                                    onChange={(e) => addForm.setData('village_or_samity', e.target.value)}
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

                        {/* 5. Notes */}
                        <div className="grid gap-1">
                            <Label className="text-xs font-bold text-foreground">
                                মন্তব্য (ঐচ্ছিক)
                            </Label>
                            <Input
                                placeholder="কোনো বিশেষ মন্তব্য থাকলে লিখুন..."
                                value={addForm.data.notes}
                                onChange={(e) => addForm.setData('notes', e.target.value)}
                                className="h-8.5 rounded-xl text-xs bg-background"
                            />
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddModalOpen(false)}
                                className="rounded-xl text-xs"
                            >
                                বাতিল
                            </Button>
                            <Button
                                type="submit"
                                disabled={addForm.processing}
                                size="sm"
                                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground px-4 shadow-xs cursor-pointer"
                            >
                                {addForm.processing ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT HEALTH CARD MODAL (FOR ADMIN) */}
            <Dialog open={editingCard !== null} onOpenChange={(open) => !open && setEditingCard(null)}>
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-5">
                    <DialogHeader className="text-left pb-2 border-b">
                        <div className="flex items-center gap-2">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                                <Edit className="size-4" />
                            </span>
                            <div>
                                <DialogTitle className="text-base font-bold text-foreground">
                                    হেলথ কার্ড তথ্য সংশোধন (Edit)
                                </DialogTitle>
                                <DialogDescription className="text-[11px]">
                                    প্রয়োজন অনুযায়ী সদস্য ও মেয়াদের তথ্য আপডেট করুন
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-3.5 pt-2">
                        {/* Member Name & Member Code */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    সদস্যের নাম <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={editForm.data.member_name}
                                    onChange={(e) => editForm.setData('member_name', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                    required
                                />
                                {editForm.errors.member_name && (
                                    <p className="text-[10px] text-destructive">{editForm.errors.member_name}</p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    সদস্য কোড <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={editForm.data.member_code}
                                    onChange={(e) => editForm.setData('member_code', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background font-mono"
                                    required
                                />
                                {editForm.errors.member_code && (
                                    <p className="text-[10px] text-destructive">{editForm.errors.member_code}</p>
                                )}
                            </div>
                        </div>

                        {/* Health Card Number & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    হেলথ কার্ড নম্বর <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    value={editForm.data.health_card_number}
                                    onChange={(e) => editForm.setData('health_card_number', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background font-mono"
                                    required
                                />
                                {editForm.errors.health_card_number && (
                                    <p className="text-[10px] text-destructive">{editForm.errors.health_card_number}</p>
                                )}
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    মোবাইল নম্বর
                                </Label>
                                <Input
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* Dates & Quick Year buttons */}
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Clock className="size-3.5 text-primary" />
                                    মেয়াদের সময়কাল (পুনর্নির্ধারণ)
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                                {[
                                    { label: '১ বছর', years: 1 },
                                    { label: '২ বছর', years: 2 },
                                    { label: '৩ বছর', years: 3 },
                                    { label: '৫ বছর', years: 5 },
                                ].map((item) => (
                                    <button
                                        key={item.years}
                                        type="button"
                                        onClick={() => handleEditDurationSelect(item.years)}
                                        className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                            editDurationYears === item.years
                                                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                                : 'bg-background hover:bg-muted text-foreground border-input'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                                <div className="grid gap-1">
                                    <Label className="text-[11px] font-bold text-foreground">
                                        বিতরণের তারিখ <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={editForm.data.entry_date}
                                        onChange={(e) => handleEditEntryDateChange(e.target.value)}
                                        className="h-8.5 rounded-xl text-xs bg-background"
                                        required
                                    />
                                </div>

                                <div className="grid gap-1">
                                    <Label className="text-[11px] font-bold text-foreground">
                                        মেয়াদ উত্তীর্ণের তারিখ <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={editForm.data.expire_date}
                                        onChange={(e) => editForm.setData('expire_date', e.target.value)}
                                        className="h-8.5 rounded-xl text-xs bg-background font-semibold"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Village & Notes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    সমিতি / গ্রাম / এলাকা
                                </Label>
                                <Input
                                    value={editForm.data.village_or_samity}
                                    onChange={(e) => editForm.setData('village_or_samity', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>

                            <div className="grid gap-1">
                                <Label className="text-xs font-bold text-foreground">
                                    মন্তব্য
                                </Label>
                                <Input
                                    value={editForm.data.notes}
                                    onChange={(e) => editForm.setData('notes', e.target.value)}
                                    className="h-8.5 rounded-xl text-xs bg-background"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 flex items-center justify-end gap-2 border-t">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCard(null)}
                                className="rounded-xl text-xs"
                            >
                                বাতিল
                            </Button>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                                size="sm"
                                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground px-4 shadow-xs cursor-pointer"
                            >
                                {editForm.processing ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
