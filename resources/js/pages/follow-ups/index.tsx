import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
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

type PendingReferral = {
    id: number;
    member_name: string;
    member_code: string | null;
    phone: string | null;
    village_or_samity: string | null;
    reason: string;
    referral_date: string;
    employee_name: string;
    branch_name: string;
};

type FollowUpRow = {
    id: number;
    type: 'referred' | 'custom';
    member_name: string;
    phone: string | null;
    village_or_samity: string | null;
    previous_treatment: string | null;
    outcome: 'went' | 'did_not_go' | null;
    medicines: string | null;
    treatment: string | null;
    follow_up_date: string;
    notes: string | null;
    user?: { id: number; name: string; employee_code: string | null } | null;
    branch?: { id: number; name: string } | null;
};

type EmployeeOption = {
    id: number;
    name: string;
    employee_code: string | null;
    designation: string | null;
    branch_name: string | null;
};

type Props = {
    pendingReferrals: PendingReferral[];
    followUps: Paginated<FollowUpRow>;
    filters: { type: string; search: string };
    focusReferralId: number | null;
    canChooseEmployee: boolean;
    employees: EmployeeOption[];
    today: string;
};

const TYPE_LABELS: Record<string, string> = {
    referred: 'Referred Follow Up',
    custom: 'Custom Follow Up',
};

const OUTCOME_LABELS: Record<string, string> = {
    went: 'গিয়েছে',
    did_not_go: 'যায়নি',
};

export default function FollowUpsIndex({
    pendingReferrals,
    followUps,
    filters,
    focusReferralId,
    canChooseEmployee,
    employees,
    today,
}: Props) {
    const focused = pendingReferrals.find((row) => row.id === focusReferralId) ?? null;
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');
    const [target, setTarget] = useState<PendingReferral | null>(focused);
    const [customOpen, setCustomOpen] = useState(false);

    const referredForm = useForm({
        referral_id: focused ? String(focused.id) : '',
        outcome: 'went',
        medicines: '',
        treatment: '',
        follow_up_date: today,
        notes: '',
    });

    const customForm = useForm({
        user_id: '',
        member_name: '',
        member_code: '',
        phone: '',
        village_or_samity: '',
        previous_treatment: '',
        medicines: '',
        treatment: '',
        follow_up_date: today,
        notes: '',
    });

    const applyFilters = () => {
        router.get('/follow-ups', { search, type }, { preserveState: true, preserveScroll: true });
    };

    const openReferred = (row: PendingReferral) => {
        setTarget(row);
        referredForm.setData({
            referral_id: String(row.id),
            outcome: 'went',
            medicines: '',
            treatment: '',
            follow_up_date: today,
            notes: '',
        });
        referredForm.clearErrors();
    };

    const submitReferred = (event: FormEvent) => {
        event.preventDefault();
        referredForm.post('/follow-ups/referred', {
            preserveScroll: true,
            onSuccess: () => setTarget(null),
        });
    };

    const submitCustom = (event: FormEvent) => {
        event.preventDefault();
        customForm.post('/follow-ups', {
            preserveScroll: true,
            onSuccess: () => {
                customForm.reset();
                customForm.setData('follow_up_date', today);
                setCustomOpen(false);
            },
        });
    };

    return (
        <>
            <Head title="Follow Up — M Care" />
            <div className="space-y-4 p-3 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Follow Up</h1>
                        <p className="text-xs text-muted-foreground">
                            অপেক্ষমাণ রেফার এখানে থাকে। Follow Up চাপলে তখনই রেকর্ড হয়। আগের চিকিৎসার ফলোআপ আলাদা Custom Follow Up।
                        </p>
                    </div>
                    <Button type="button" onClick={() => setCustomOpen(true)} className="rounded-xl">
                        <Plus className="size-4" />
                        Custom Follow Up
                    </Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="border-b px-3 py-2 text-xs font-bold text-foreground">অপেক্ষমাণ রেফার</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2">তারিখ</th>
                                    <th className="px-3 py-2">সদস্য</th>
                                    <th className="px-3 py-2">কারণ</th>
                                    <th className="px-3 py-2">রেফার করেছেন</th>
                                    <th className="px-3 py-2 text-right">ফলোআপ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {pendingReferrals.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            অপেক্ষমাণ রেফার নেই।
                                        </td>
                                    </tr>
                                ) : (
                                    pendingReferrals.map((row) => (
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
                                                <div className="font-semibold">{row.employee_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{row.branch_name}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Button type="button" size="sm" className="h-7 rounded-lg text-[11px]" onClick={() => openReferred(row)}>
                                                    Follow Up
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-xl border bg-card p-3 sm:grid-cols-4">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="নাম, ফোন, গ্রাম" className="h-9 rounded-xl pl-8 text-xs" />
                    </div>
                    <select value={type} onChange={(event) => setType(event.target.value)} className="h-9 rounded-xl border bg-background px-2 text-xs">
                        <option value="all">সব টাইপ</option>
                        <option value="referred">Referred Follow Up</option>
                        <option value="custom">Custom Follow Up</option>
                    </select>
                    <Button type="button" onClick={applyFilters} className="h-9 rounded-xl">খুঁজুন</Button>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="border-b px-3 py-2 text-xs font-bold text-foreground">ফলোআপ রেকর্ড</div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-2">তারিখ</th>
                                    <th className="px-3 py-2">টাইপ</th>
                                    <th className="px-3 py-2">সদস্য</th>
                                    <th className="px-3 py-2">ফলাফল</th>
                                    <th className="px-3 py-2">ওষুধ / চিকিৎসা</th>
                                    <th className="px-3 py-2">কর্মী</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {followUps.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            এই ফিল্টারে কোনো ফলোআপ নেই।
                                        </td>
                                    </tr>
                                ) : (
                                    followUps.data.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.follow_up_date)}</td>
                                            <td className="px-3 py-2 font-semibold">{TYPE_LABELS[row.type] || row.type}</td>
                                            <td className="px-3 py-2">
                                                <div className="font-bold text-foreground">{row.member_name}</div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {[row.phone, row.village_or_samity].filter(Boolean).join(' · ') || '—'}
                                                </div>
                                                {row.previous_treatment ? (
                                                    <div className="text-[10px] text-muted-foreground">আগের চিকিৎসা: {row.previous_treatment}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2">{row.outcome ? OUTCOME_LABELS[row.outcome] || row.outcome : '—'}</td>
                                            <td className="max-w-xs px-3 py-2">
                                                <div>{row.medicines || '—'}</div>
                                                <div className="text-[10px] text-muted-foreground">{row.treatment || ''}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="font-semibold">{row.user?.name || '—'}</div>
                                                <div className="text-[10px] text-muted-foreground">{row.branch?.name || '—'}</div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {followUps.last_page > 1 ? (
                        <div className="flex flex-wrap gap-1 border-t p-3">
                            {followUps.links.map((link, index) => (
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
                    ) : null}
                </div>
            </div>

            <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-3xl p-4 sm:max-w-lg sm:p-5">
                    <DialogHeader className="text-left">
                        <DialogTitle>Referred Follow Up</DialogTitle>
                        <DialogDescription>
                            {target?.member_name} — {target?.reason}. রেফার করেছেন {target?.employee_name}।
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitReferred} className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => referredForm.setData('outcome', 'went')}
                                className={`rounded-xl border px-3 py-2 text-xs font-bold ${referredForm.data.outcome === 'went' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800' : 'bg-background text-muted-foreground'}`}
                            >
                                গিয়েছে
                            </button>
                            <button
                                type="button"
                                onClick={() => referredForm.setData('outcome', 'did_not_go')}
                                className={`rounded-xl border px-3 py-2 text-xs font-bold ${referredForm.data.outcome === 'did_not_go' ? 'border-rose-500 bg-rose-500/10 text-rose-800' : 'bg-background text-muted-foreground'}`}
                            >
                                যায়নি
                            </button>
                        </div>
                        {referredForm.data.outcome === 'went' ? (
                            <>
                                <div className="space-y-1.5">
                                    <Label>কোন ওষুধ দেওয়া হয়েছে</Label>
                                    <Textarea value={referredForm.data.medicines} onChange={(event) => referredForm.setData('medicines', event.target.value)} required />
                                    {referredForm.errors.medicines ? <p className="text-xs text-destructive">{referredForm.errors.medicines}</p> : null}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>কী চিকিৎসা দেওয়া হয়েছে</Label>
                                    <Textarea value={referredForm.data.treatment} onChange={(event) => referredForm.setData('treatment', event.target.value)} required />
                                    {referredForm.errors.treatment ? <p className="text-xs text-destructive">{referredForm.errors.treatment}</p> : null}
                                </div>
                            </>
                        ) : null}
                        <div className="space-y-1.5">
                            <Label>ফলোআপের তারিখ</Label>
                            <Input type="date" value={referredForm.data.follow_up_date} onChange={(event) => referredForm.setData('follow_up_date', event.target.value)} className="h-9 rounded-xl" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label>নোট</Label>
                            <Textarea value={referredForm.data.notes} onChange={(event) => referredForm.setData('notes', event.target.value)} />
                        </div>
                        <Button type="submit" disabled={referredForm.processing} className="rounded-xl">সংরক্ষণ করুন</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={customOpen} onOpenChange={setCustomOpen}>
                <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-3xl p-4 sm:max-w-lg sm:p-5">
                    <DialogHeader className="text-left">
                        <DialogTitle>Custom Follow Up</DialogTitle>
                        <DialogDescription>আগে যাদের চিকিৎসা দেওয়া হয়েছে, তাদের ফলোআপ এখানে লিখুন।</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitCustom} className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                        {canChooseEmployee ? (
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>কর্মীর নাম</Label>
                                <select value={customForm.data.user_id} onChange={(event) => customForm.setData('user_id', event.target.value)} className="h-9 w-full rounded-xl border bg-background px-2 text-xs">
                                    <option value="">নিজের নামে</option>
                                    {employees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name} · {employee.employee_code || '—'} · {employee.branch_name || '—'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}
                        <div className="space-y-1.5">
                            <Label>সদস্যের নাম</Label>
                            <Input value={customForm.data.member_name} onChange={(event) => customForm.setData('member_name', event.target.value)} className="h-9 rounded-xl" required />
                            {customForm.errors.member_name ? <p className="text-xs text-destructive">{customForm.errors.member_name}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                            <Label>ফোন</Label>
                            <Input value={customForm.data.phone} onChange={(event) => customForm.setData('phone', event.target.value)} className="h-9 rounded-xl" />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>গ্রাম / সমিতি</Label>
                            <Input value={customForm.data.village_or_samity} onChange={(event) => customForm.setData('village_or_samity', event.target.value)} className="h-9 rounded-xl" />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>আগের চিকিৎসা</Label>
                            <Textarea value={customForm.data.previous_treatment} onChange={(event) => customForm.setData('previous_treatment', event.target.value)} required />
                            {customForm.errors.previous_treatment ? <p className="text-xs text-destructive">{customForm.errors.previous_treatment}</p> : null}
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>এবার কোন ওষুধ</Label>
                            <Textarea value={customForm.data.medicines} onChange={(event) => customForm.setData('medicines', event.target.value)} />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>এবারের চিকিৎসা / পরামর্শ</Label>
                            <Textarea value={customForm.data.treatment} onChange={(event) => customForm.setData('treatment', event.target.value)} required />
                            {customForm.errors.treatment ? <p className="text-xs text-destructive">{customForm.errors.treatment}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                            <Label>ফলোআপের তারিখ</Label>
                            <Input type="date" value={customForm.data.follow_up_date} onChange={(event) => customForm.setData('follow_up_date', event.target.value)} className="h-9 rounded-xl" required />
                        </div>
                        <div className="sm:col-span-2">
                            <Button type="submit" disabled={customForm.processing} className="rounded-xl">সংরক্ষণ করুন</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
