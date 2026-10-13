import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, Plus, Search, XCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import type { Paginated } from '@/types/mcare';

type ReferralRow = {
    id: number;
    member_name: string;
    member_code: string | null;
    phone: string | null;
    age: string | null;
    gender: string | null;
    village_or_samity: string | null;
    reason: string;
    referral_date: string;
    status: 'pending' | 'went' | 'did_not_go';
    referred_by?: {
        id: number;
        name: string;
        employee_code: string | null;
        designation: string | null;
    } | null;
    branch?: { id: number; name: string } | null;
    recorded_by?: { id: number; name: string } | null;
};

type EmployeeOption = {
    id: number;
    name: string;
    employee_code: string | null;
    designation: string | null;
    branch_name: string | null;
};

type Props = {
    referrals: Paginated<ReferralRow>;
    stats: { total: number; pending: number; went: number; did_not_go: number };
    filters: {
        search: string;
        status: string;
        start_date: string;
        end_date: string;
        branch_id: string;
    };
    branches: { id: number; name: string }[];
    employees: EmployeeOption[];
    canChooseEmployee: boolean;
    canFollowUp: boolean;
    today: string;
};

const STATUS_META = {
    pending: {
        label: 'অপেক্ষমাণ',
        icon: Clock,
        badge: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
        button: 'border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200',
    },
    went: {
        label: 'গিয়েছে',
        icon: CheckCircle2,
        badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
        button: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-200',
    },
    did_not_go: {
        label: 'যায়নি',
        icon: XCircle,
        badge: 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300',
        button: 'border-rose-500/40 bg-rose-500/10 text-rose-800 hover:bg-rose-500/20 dark:text-rose-200',
    },
} as const;

type ReferralStatus = keyof typeof STATUS_META;

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status as ReferralStatus] ?? STATUS_META.pending;
    const Icon = meta.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
            <Icon className="size-3.5" />
            {meta.label}
        </span>
    );
}

export default function ReferralsIndex({
    referrals,
    stats,
    filters,
    branches,
    employees,
    canChooseEmployee,
    canFollowUp,
    today,
}: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');
    const [employeeSearch, setEmployeeSearch] = useState('');

    const form = useForm({
        referred_by: '',
        member_name: '',
        member_code: '',
        phone: '',
        age: '',
        gender: '',
        village_or_samity: '',
        reason: '',
        referral_date: today,
    });

    const applyFilters = () => {
        router.get(
            '/referrals',
            {
                search,
                status,
                start_date: startDate,
                end_date: endDate,
                branch_id: branchId,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filteredEmployees = employees.filter((employee) => {
        const needle = employeeSearch.trim().toLowerCase();
        if (!needle) {
            return true;
        }

        return [employee.name, employee.employee_code, employee.designation, employee.branch_name]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle));
    });

    const submitReferral = (event: FormEvent) => {
        event.preventDefault();
        form.post('/referrals', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData('referral_date', today);
                setCreateOpen(false);
            },
        });
    };

    return (
        <>
            <Head title="Referrals — M Care" />
            <div className="space-y-4 p-3 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">রেফারেল</h1>
                        <p className="text-xs text-muted-foreground">
                            রেফার করলে অপেক্ষমাণ থাকে। পরে Follow Up থেকে লিখবেন গিয়েছেন কি না, গেলে কোন ওষুধ ও চিকিৎসা দেওয়া হয়েছে।
                        </p>
                    </div>
                    <Button type="button" onClick={() => setCreateOpen(true)} className="rounded-xl">
                        <Plus className="size-4" />
                        নতুন রেফারেল
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                        { label: 'মোট রেফার', value: stats.total, icon: null, tone: 'text-foreground' },
                        { label: STATUS_META.pending.label, value: stats.pending, icon: STATUS_META.pending.icon, tone: 'text-amber-700 dark:text-amber-300' },
                        { label: STATUS_META.went.label, value: stats.went, icon: STATUS_META.went.icon, tone: 'text-emerald-700 dark:text-emerald-300' },
                        { label: STATUS_META.did_not_go.label, value: stats.did_not_go, icon: STATUS_META.did_not_go.icon, tone: 'text-rose-700 dark:text-rose-300' },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <div key={item.label} className="rounded-xl border bg-card p-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase ${item.tone}`}>
                                    {Icon ? <Icon className="size-3.5" /> : null}
                                    {item.label}
                                </span>
                                <p className="text-lg font-bold">{item.value}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="relative lg:col-span-2">
                        <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="নাম, কোড, ফোন, গ্রাম"
                            className="h-9 rounded-xl pl-8 text-xs"
                        />
                    </div>
                    <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-xl border bg-background px-2 text-xs">
                        <option value="all">সব স্ট্যাটাস</option>
                        <option value="pending">অপেক্ষমাণ</option>
                        <option value="went">গিয়েছে</option>
                        <option value="did_not_go">যায়নি</option>
                    </select>
                    <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-9 rounded-xl text-xs" />
                    <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-9 rounded-xl text-xs" />
                    {canChooseEmployee ? (
                        <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="h-9 rounded-xl border bg-background px-2 text-xs">
                            <option value="all">সব শাখা</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    ) : (
                        <Button type="button" onClick={applyFilters} className="h-9 rounded-xl">খুঁজুন</Button>
                    )}
                    {canChooseEmployee ? (
                        <Button type="button" onClick={applyFilters} className="h-9 rounded-xl lg:col-span-6">খুঁজুন</Button>
                    ) : null}
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2">তারিখ</th>
                                    <th className="px-3 py-2">সদস্য</th>
                                    <th className="px-3 py-2">কারণ</th>
                                    <th className="px-3 py-2">রেফার করেছেন</th>
                                    <th className="px-3 py-2">স্ট্যাটাস</th>
                                    {canFollowUp ? <th className="px-3 py-2 text-right">ফলোআপ</th> : null}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {referrals.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={canFollowUp ? 6 : 5} className="p-8 text-center text-muted-foreground">
                                            এই ফিল্টারে কোনো রেফারেল নেই।
                                        </td>
                                    </tr>
                                ) : (
                                    referrals.data.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.referral_date)}</td>
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-foreground">{row.member_name}</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {[row.member_code, row.phone, row.village_or_samity].filter(Boolean).join(' · ') || '—'}
                                                </div>
                                            </td>
                                            <td className="max-w-xs px-3 py-2">{row.reason}</td>
                                            <td className="px-3 py-2">
                                                <div className="font-semibold">{row.referred_by?.name || '—'}</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {[row.referred_by?.employee_code, row.referred_by?.designation, row.branch?.name].filter(Boolean).join(' · ')}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            {canFollowUp ? (
                                                <td className="px-3 py-2 text-right">
                                                    {row.status === 'pending' ? (
                                                        <Button asChild type="button" size="sm" variant="outline" className="h-7 rounded-lg text-[11px]">
                                                            <Link href={`/follow-ups?referral=${row.id}`}>Follow Up</Link>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground">হয়ে গেছে</span>
                                                    )}
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {referrals.last_page > 1 ? (
                        <div className="flex flex-col gap-2 border-t p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <span className="text-[11px] text-muted-foreground">
                                পৃষ্ঠা {referrals.current_page} এর {referrals.last_page} (মোট {referrals.total} টি)
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {referrals.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className="h-7 min-w-7 rounded-lg text-[11px]"
                                    />
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-3xl p-4 sm:max-w-xl sm:p-5">
                    <DialogHeader className="border-b pb-2 text-left">
                        <DialogTitle>নতুন রেফারেল</DialogTitle>
                        <DialogDescription>সদস্যের তথ্য দিন। রেফারের ক্রেডিট নির্বাচিত কর্মীর নামে যাবে।</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitReferral} className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2">
                        {canChooseEmployee ? (
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>রেফার করেছেন</Label>
                                <Input
                                    value={employeeSearch}
                                    onChange={(event) => setEmployeeSearch(event.target.value)}
                                    placeholder="নাম, কোড বা পদবি দিয়ে খুঁজুন"
                                    className="h-9 rounded-xl text-xs"
                                />
                                <select
                                    value={form.data.referred_by}
                                    onChange={(event) => form.setData('referred_by', event.target.value)}
                                    className="h-9 w-full rounded-xl border bg-background px-2 text-xs"
                                    required
                                >
                                    <option value="">কর্মী নির্বাচন করুন</option>
                                    {filteredEmployees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name} · {employee.employee_code || '—'} · {employee.designation || '—'} · {employee.branch_name || '—'}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.referred_by ? <p className="text-xs text-destructive">{form.errors.referred_by}</p> : null}
                            </div>
                        ) : null}
                        <div className="space-y-1.5">
                            <Label>সদস্যের নাম</Label>
                            <Input value={form.data.member_name} onChange={(event) => form.setData('member_name', event.target.value)} className="h-9 rounded-xl" required />
                            {form.errors.member_name ? <p className="text-xs text-destructive">{form.errors.member_name}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                            <Label>সদস্য কোড</Label>
                            <Input value={form.data.member_code} onChange={(event) => form.setData('member_code', event.target.value)} className="h-9 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>ফোন</Label>
                            <Input value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} className="h-9 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>বয়স</Label>
                            <Input value={form.data.age} onChange={(event) => form.setData('age', event.target.value)} className="h-9 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>লিঙ্গ</Label>
                            <select value={form.data.gender} onChange={(event) => form.setData('gender', event.target.value)} className="h-9 w-full rounded-xl border bg-background px-2 text-xs">
                                <option value="">নির্বাচন করুন</option>
                                <option value="মহিলা">মহিলা</option>
                                <option value="পুরুষ">পুরুষ</option>
                                <option value="অন্যান্য">অন্যান্য</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>রেফারেল তারিখ</Label>
                            <Input type="date" value={form.data.referral_date} onChange={(event) => form.setData('referral_date', event.target.value)} className="h-9 rounded-xl" required />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>গ্রাম / সমিতি</Label>
                            <Input value={form.data.village_or_samity} onChange={(event) => form.setData('village_or_samity', event.target.value)} className="h-9 rounded-xl" />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>কারণ</Label>
                            <Textarea value={form.data.reason} onChange={(event) => form.setData('reason', event.target.value)} required />
                            {form.errors.reason ? <p className="text-xs text-destructive">{form.errors.reason}</p> : null}
                        </div>
                        <div className="sm:col-span-2">
                            <Button type="submit" disabled={form.processing} className="rounded-xl">সংরক্ষণ করুন</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

        </>
    );
}
