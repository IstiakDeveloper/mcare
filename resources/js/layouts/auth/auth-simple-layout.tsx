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
        <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
            <div className="w-full max-w-md">
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    <Link
                        href={home()}
                        className="flex flex-col items-center gap-3"
                    >
                        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <AppLogoIcon className="size-6" />
                        </span>
                        <span className="text-lg font-semibold tracking-tight">
                            {name}
                        </span>
                    </Link>
                    <p className="text-sm font-medium text-primary">
                        Health Employee Management
                    </p>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}
