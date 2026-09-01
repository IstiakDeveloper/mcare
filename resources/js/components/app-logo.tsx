import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { Auth } from '@/types';

export default function AppLogo() {
    const { name, auth } = usePage<{ name?: string; auth?: Auth }>().props;
    const user = auth?.user;
    const subtitle =
        user?.designation ||
        user?.role_name ||
        (user?.role === 'admin'
            ? 'Administrator'
            : user?.role === 'branch-manager'
              ? 'Branch Manager'
              : 'Field Operations');

    return (
        <div className="flex items-center gap-2.5 w-full">
            <div className="flex aspect-square size-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-teal-500 text-white shadow-xs shadow-primary/20 ring-1 ring-white/20">
                <AppLogoIcon className="size-4.5" />
            </div>
            <div className="grid flex-1 text-left">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold tracking-tight text-foreground">
                        {name || 'M Care'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                        PRO
                    </span>
                </div>
                <span className="truncate text-[10.5px] font-medium text-muted-foreground">
                    {subtitle}
                </span>
            </div>
        </div>
    );
}
