import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    KeyRound,
    Lock,
    Moon,
    Palette,
    Shield,
    ShieldCheck,
    Sun,
    User as UserIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import AppearanceTabs from '@/components/appearance-tabs';
import InputError from '@/components/input-error';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
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
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type Props = {
    mustVerifyEmail: boolean;
    status?: string;
    passwordRules?: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Profile({
    mustVerifyEmail,
    status,
    passwordRules = '',
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
    canManagePasskeys = false,
    passkeys = [],
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;

    const [activeTab, setActiveTab] = useState<'password' | 'profile' | 'appearance' | 'security'>('password');

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            if (['password', 'profile', 'appearance', 'security'].includes(hash)) {
                setActiveTab(hash as 'password' | 'profile' | 'appearance' | 'security');
            }
        }
    }, []);

    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="সেটিংস ও পাসওয়ার্ড" />

            <div className="space-y-5 max-w-4xl mx-auto pb-12">
                {/* Header Summary Card */}
                <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-teal-500 text-white font-bold text-lg shadow-xs ring-2 ring-primary/20 shrink-0">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                                        {user?.name || 'User Profile'}
                                    </h1>
                                    <Badge variant="secondary" className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
                                        {user?.role_name || user?.designation || 'Health Officer'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    HRM ID: <strong className="text-foreground">{user?.username || user?.employee_code || user?.email}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {user?.branch?.name ? (
                                <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    <Building2 className="size-3.5" />
                                    <span>{user.branch.name}</span>
                                </div>
                            ) : null}
                            <div className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                <span>HRM Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Clean Navigation Tabs */}
                <div className="flex rounded-2xl border border-border/80 bg-muted/40 p-1.5 gap-1.5 shadow-2xs overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('password');
                            window.location.hash = 'password';
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'password'
                                ? 'bg-background text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        <Lock className="size-4 shrink-0" />
                        <span>পাসওয়ার্ড পরিবর্তন (Password)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('profile');
                            window.location.hash = 'profile';
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'profile'
                                ? 'bg-background text-primary shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        <UserIcon className="size-4 shrink-0" />
                        <span>প্রোফাইল তথ্য (Profile)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('appearance');
                            window.location.hash = 'appearance';
                        }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            activeTab === 'appearance'
                                ? 'bg-background text-teal-600 dark:text-teal-400 shadow-xs font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                        }`}
                    >
                        <Palette className="size-4 shrink-0" />
                        <span>থিম ও ইন্টারফেস (Theme)</span>
                    </button>

                    {canManageTwoFactor || canManagePasskeys ? (
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('security');
                                window.location.hash = 'security';
                            }}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                                activeTab === 'security'
                                    ? 'bg-background text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                        >
                            <Shield className="size-4 shrink-0" />
                            <span>নিরাপত্তা (2FA)</span>
                        </button>
                    ) : null}
                </div>

                {/* TAB 1: PASSWORD CHANGE */}
                {activeTab === 'password' && (
                    <Card className="rounded-3xl border-border/80 shadow-xs animate-in fade-in duration-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                                <Lock className="size-5 text-rose-600 dark:text-rose-400" />
                                পাসওয়ার্ড পরিবর্তন (Change Password)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                আপনার একাউন্টের জন্য কমপক্ষে ৪ অক্ষরের একটি নতুন পাসওয়ার্ড নির্ধারণ করুন।
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...SecurityController.update.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                resetOnError={[
                                    'password',
                                    'password_confirmation',
                                    'current_password',
                                ]}
                                resetOnSuccess
                                onError={(errors) => {
                                    if (errors.password) {
                                        passwordInput.current?.focus();
                                    }
                                    if (errors.current_password) {
                                        currentPasswordInput.current?.focus();
                                    }
                                }}
                                className="space-y-4 max-w-xl"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="current_password" className="text-xs font-semibold">
                                                বর্তমান পাসওয়ার্ড (Current Password)
                                            </Label>
                                            <PasswordInput
                                                id="current_password"
                                                ref={currentPasswordInput}
                                                name="current_password"
                                                className="rounded-xl"
                                                autoComplete="current-password"
                                                placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                                                required
                                            />
                                            <InputError message={errors.current_password} />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="password" className="text-xs font-semibold">
                                                    নতুন পাসওয়ার্ড (New Password - Min 4)
                                                </Label>
                                                <PasswordInput
                                                    id="password"
                                                    ref={passwordInput}
                                                    name="password"
                                                    className="rounded-xl"
                                                    autoComplete="new-password"
                                                    placeholder="কমপক্ষে ৪ অক্ষর"
                                                    required
                                                />
                                                <InputError message={errors.password} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="password_confirmation" className="text-xs font-semibold">
                                                    পাসওয়ার্ড নিশ্চিতকরণ (Confirm)
                                                </Label>
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    className="rounded-xl"
                                                    autoComplete="new-password"
                                                    placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                                                    required
                                                />
                                                <InputError message={errors.password_confirmation} />
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-xl font-bold text-xs h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                                            >
                                                {processing ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড সংরক্ষণ করুন (Save Password)'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 2: PROFILE DETAILS */}
                {activeTab === 'profile' && (
                    <Card className="rounded-3xl border-border/80 shadow-xs animate-in fade-in duration-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                                <UserIcon className="size-5 text-primary" />
                                প্রোফাইল তথ্য (Profile Information)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                HRM সিস্টেম থেকে আইডি ও শাখা লক করা থাকে। আপনি নাম ও ইমেইল আপডেট করতে পারবেন।
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...ProfileController.update.form()}
                                options={{
                                    preserveScroll: true,
                                }}
                                className="space-y-4 max-w-xl"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="name" className="text-xs font-semibold">
                                                    পুরো নাম (Full Name)
                                                </Label>
                                                <Input
                                                    id="name"
                                                    className="rounded-xl"
                                                    defaultValue={user?.name}
                                                    name="name"
                                                    required
                                                    autoComplete="name"
                                                    placeholder="Full name"
                                                />
                                                <InputError message={errors.name} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="username" className="text-xs font-semibold">
                                                    HRM ইউজারনেম / কোড (Locked)
                                                </Label>
                                                <Input
                                                    id="username"
                                                    className="rounded-xl bg-muted/60 text-muted-foreground font-mono text-xs cursor-not-allowed"
                                                    defaultValue={user?.username || user?.employee_code || ''}
                                                    name="username"
                                                    disabled
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-xs font-semibold">
                                                ইমেইল ঠিকানা (Email Address)
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                className="rounded-xl"
                                                defaultValue={user?.email}
                                                name="email"
                                                required
                                                autoComplete="email"
                                                placeholder="Email address"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        {mustVerifyEmail && user?.email_verified_at === null && (
                                            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                                                <p>
                                                    আপনার ইমেইল ঠিকানা এখনো যাচাই করা হয়নি।{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="font-bold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
                                                    >
                                                        যাচাইকরণ লিংক পুনরায় পাঠাতে এখানে ক্লিক করুন
                                                    </Link>
                                                </p>
                                                {status === 'verification-link-sent' && (
                                                    <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                                        একটি নতুন যাচাইকরণ লিংক আপনার ইমেইলে পাঠানো হয়েছে।
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-xl font-bold text-xs h-9 px-5 shadow-xs cursor-pointer"
                                            >
                                                {processing ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল আপডেট করুন (Save Profile)'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                {/* TAB 3: THEME / APPEARANCE */}
                {activeTab === 'appearance' && (
                    <Card className="rounded-3xl border-border/80 shadow-xs animate-in fade-in duration-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                                <Palette className="size-5 text-teal-600 dark:text-teal-400" />
                                ইন্টারফেস ও থিম (Appearance & Theme)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                আপনার পছন্দ অনুযায়ী লাইট, ডার্ক অথবা সিস্টেম অটোমেটিক মোড নির্বাচন করুন।
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AppearanceTabs />
                        </CardContent>
                    </Card>
                )}

                {/* TAB 4: ADVANCED SECURITY */}
                {activeTab === 'security' && (canManageTwoFactor || canManagePasskeys) && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        {canManageTwoFactor && (
                            <Card className="rounded-3xl border-border/80 shadow-xs">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                                        <Shield className="size-5 text-indigo-600 dark:text-indigo-400" />
                                        দ্বি-স্তর বিশিষ্ট নিরাপত্তা (Two-Factor Authentication)
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        একাউন্টের অতিরিক্ত সুরক্ষার জন্য টু-ফ্যাক্টর অথেনটিকেশন সক্রিয় করুন।
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ManageTwoFactor
                                        canManageTwoFactor={canManageTwoFactor}
                                        requiresConfirmation={requiresConfirmation}
                                        twoFactorEnabled={twoFactorEnabled}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {canManagePasskeys && (
                            <Card className="rounded-3xl border-border/80 shadow-xs">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                                        <KeyRound className="size-5 text-emerald-600 dark:text-emerald-400" />
                                        পাসকি ব্যবস্থাপনা (Passkeys)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ManagePasskeys
                                        canManagePasskeys={canManagePasskeys}
                                        passkeys={passkeys}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Settings',
            href: edit(),
        },
    ],
};
