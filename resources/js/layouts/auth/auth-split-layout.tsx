import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid min-h-svh lg:grid-cols-2">
            <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-2 text-lg font-semibold"
                >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
                        <AppLogoIcon className="size-5" />
                    </span>
                    {name}
                </Link>
                <div className="relative z-20 max-w-md space-y-3">
                    <p className="text-sm font-medium text-primary-foreground/80">
                        Health Employee Management
                    </p>
                    <p className="text-2xl font-semibold tracking-tight">
                        Track daily field work for health officers
                    </p>
                    <p className="text-sm text-primary-foreground/80">
                        Samity tasks, household visits, static clinics, and
                        branch health camps — in one place.
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center bg-background p-6 md:p-10">
                <div className="w-full max-w-md space-y-6">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-3 lg:hidden"
                    >
                        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <AppLogoIcon className="size-6" />
                        </span>
                        <span className="font-semibold">{name}</span>
                    </Link>
                    <div className="space-y-1 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
