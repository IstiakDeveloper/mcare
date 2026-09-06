import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Building2,
    CheckCircle2,
    Database,
    HeartPulse,
    Home,
    Shield,
    Sparkles,
    Stethoscope,
    Tent,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';
import type { Auth } from '@/types';

export default function Welcome() {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <>
            <Head title="M Care — Health Staff Activity & Reporting Hub" />
            <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
                {/* Modern Navbar */}
                <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                            <HeartPulse className="size-5" />
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight">
                                M Care
                            </span>
                            <span className="ml-2 hidden rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary sm:inline-block">
                                Health Dept
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {auth.user ? (
                            <Button asChild className="rounded-xl font-medium shadow-xs text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4">
                                <Link href={dashboard()}>
                                    Dashboard
                                    <ArrowRight className="size-3.5 sm:size-4 ml-1" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild className="rounded-xl font-medium shadow-xs text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4">
                                <Link href={login()}>
                                    Officer Sign In
                                    <ArrowRight className="size-3.5 sm:size-4 ml-1" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1">
                    <section className="relative overflow-hidden px-4 sm:px-6 py-12 md:py-24 max-w-6xl mx-auto">
                        <div className="absolute -top-40 right-0 -z-10 size-96 rounded-full bg-primary/15 blur-3xl" />
                        <div className="absolute top-20 left-0 -z-10 size-80 rounded-full bg-teal-500/10 blur-3xl" />

                        <div className="flex flex-col items-center text-center space-y-5 sm:space-y-6 max-w-3xl mx-auto">
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-primary">
                                <Sparkles className="size-3.5" />
                                <span>HRM Integrated Health Management System</span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                                Smarter Daily Fieldwork for{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-emerald-600">
                                    Health Officers
                                </span>
                            </h1>

                            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                                Record Uthan Boithok yard meetings, satellite outreach clinics,
                                awareness sessions, household visits, and static branch services
                                seamlessly from an all-in-one mobile-friendly dashboard.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto">
                                {auth.user ? (
                                    <Button
                                        size="lg"
                                        asChild
                                        className="w-full sm:w-auto rounded-xl px-8 h-11 sm:h-12 text-sm font-semibold shadow-md shadow-primary/20"
                                    >
                                        <Link href={dashboard()}>
                                            Open Today's Hub
                                            <ArrowRight className="size-4 ml-2" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        size="lg"
                                        asChild
                                        className="w-full sm:w-auto rounded-xl px-8 h-11 sm:h-12 text-sm font-semibold shadow-md shadow-primary/20"
                                    >
                                        <Link href={login()}>
                                            Get Started
                                            <ArrowRight className="size-4 ml-2" />
                                        </Link>
                                    </Button>
                                )}
                            </div>

                            {/* Trust Pill Bar */}
                            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                    Mobile-Ready Navigation
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                    Single-Screen Quick Entry
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                    Live HRM Branch Sync
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Key Workflow Modules Grid */}
                    <section className="px-6 py-12 max-w-6xl mx-auto">
                        <div className="text-center mb-10 space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                                Built for Paramedics & Field Health Teams
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                                Standardized activity tracking aligned with Health Department protocols
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <FeatureCard
                                icon={Users}
                                title="Samity Tasks"
                                desc="Uthan Boithok yard meetings, satellite clinics, and community awareness sessions."
                                color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            />
                            <FeatureCard
                                icon={Home}
                                title="Household Visits"
                                desc="Direct door-to-door health follow-up, patient counseling, and maternal monitoring."
                                color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            />
                            <FeatureCard
                                icon={Activity}
                                title="Static Clinics"
                                desc="Record patient consultations, vital checks, and services provided at the branch."
                                color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            />
                            <FeatureCard
                                icon={Tent}
                                title="Health Camps"
                                desc="Branch-level outreach camps to capture community service impact and coverage."
                                color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            />
                        </div>
                    </section>

                    {/* HRM Data Flow Architecture */}
                    <section className="px-6 py-12 bg-muted/30 border-y border-border/70">
                        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
                            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                <Database className="size-8" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold tracking-tight">
                                    Connected with Organization HRM
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    M Care seamlessly references employee profiles, branch assignments,
                                    and samity associations directly from the HRM Health Department database.
                                    No duplicate accounts or data drift.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-border/70 py-6 px-6 text-center text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} M Care. Health Employee Management & Reporting System.</p>
                </footer>
            </div>
        </>
    );
}

function FeatureCard({
    icon: Icon,
    title,
    desc,
    color,
}: {
    icon: typeof Users;
    title: string;
    desc: string;
    color: string;
}) {
    return (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm">
            <div
                className={`flex size-12 items-center justify-center rounded-xl ${color} mb-4`}
            >
                <Icon className="size-6" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
    );
}
