import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-10 pb-safe">
            <div className="w-full max-w-md">
                <div className="mb-5 sm:mb-6 flex flex-col items-center gap-2.5 sm:gap-3 text-center">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-2.5"
                    >
                        <span className="flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                            <AppLogoIcon className="size-6" />
                        </span>
                        <span className="text-lg font-bold tracking-tight">
                            {name}
                        </span>
                    </Link>
                    <p className="text-xs sm:text-sm font-semibold text-primary">
                        Health Employee Management
                    </p>
                    <div className="space-y-1">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
                    {children}
                </div>
            </div>
        </div>
    );
}
