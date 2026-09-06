import { Link, usePage } from '@inertiajs/react';
import { Building2, CheckCircle2, Moon, Settings, Sun, TrendingUp } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard } from '@/routes';
import type { Auth, BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const { resolvedAppearance, updateAppearance } = useAppearance();

    const toggleTheme = () => {
        updateAppearance(resolvedAppearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/60 bg-background/80 px-3.5 sm:px-4 md:px-6 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 gap-2">
            {/* Mobile Header: App Logo & Name (Replaces sidebar icon on mobile) */}
            <Link
                href={dashboard()}
                className="flex items-center gap-2.5 md:hidden min-w-0 shrink-0"
            >
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-teal-500 text-white shadow-xs shadow-primary/20 ring-1 ring-white/20">
                    <AppLogoIcon className="size-4.5" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold tracking-tight text-foreground">
                        M Care
                    </span>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                        PRO
                    </span>
                </div>
            </Link>

            {/* Desktop Header: Sidebar Trigger & Breadcrumbs */}
            <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground shrink-0" />
                <div className="min-w-0 truncate text-xs sm:text-sm">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
                {user?.can_view_analytics || user?.role === 'admin' || user?.role === 'branch-manager' ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="hidden md:inline-flex h-8 rounded-full text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 gap-1.5"
                    >
                        <Link href="/reports">
                            <TrendingUp className="size-3.5" />
                            <span>Reports & Analytics</span>
                        </Link>
                    </Button>
                ) : null}

                {user?.branch?.name ? (
                    <div className="hidden items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-primary sm:flex">
                        <Building2 className="size-3.5" />
                        <span className="font-medium truncate max-w-[130px]">
                            {user.branch.name}
                        </span>
                    </div>
                ) : null}

                <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3.5" />
                    <span className="hidden sm:inline">HRM Synced</span>
                    <span className="sm:hidden">HRM</span>
                </div>

                {/* Settings & Password Shortcut */}
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    title="Settings & Password"
                    aria-label="Settings & Password"
                >
                    <Link href="/settings/profile">
                        <Settings className="size-4" />
                    </Link>
                </Button>

                {/* Light / Dark Mode Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    title={
                        resolvedAppearance === 'dark'
                            ? 'Switch to Light Mode'
                            : 'Switch to Dark Mode'
                    }
                    aria-label="Toggle theme"
                >
                    {resolvedAppearance === 'dark' ? (
                        <Sun className="size-4 text-amber-400 transition-transform rotate-0 scale-100" />
                    ) : (
                        <Moon className="size-4 text-slate-700 transition-transform rotate-0 scale-100" />
                    )}
                </Button>
            </div>
        </header>
    );
}
