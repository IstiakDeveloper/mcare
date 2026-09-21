import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    Building2,
    CheckCircle2,
    ClipboardList,
    Coins,
    CreditCard,
    FileText,
    HeartPulse,
    Home,
    LayoutGrid,
    Receipt,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Stethoscope,
    Tent,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { Auth, NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;
    const { setOpenMobile } = useSidebar();
    const [isSyncing, setIsSyncing] = useState(false);

    // Auto hide mobile navigation whenever a page route starts or completes
    useEffect(() => {
        const removeStart = router.on('start', () => {
            setOpenMobile(false);
        });
        const removeSuccess = router.on('success', () => {
            setOpenMobile(false);
        });
        return () => {
            removeStart();
            removeSuccess();
        };
    }, [setOpenMobile]);

    const handleSyncHrm = () => {
        if (!confirm('Do you want to initiate a live reference data sync with the HRM system?')) {
            return;
        }

        setIsSyncing(true);
        router.post(
            '/admin/sync-hrm',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            },
        );
    };

    const isAdmin = Boolean(user?.role === 'admin');

    // 1. ADMIN EXCLUSIVE NAVIGATION
    const adminMainItems: NavItem[] = [
        {
            title: 'Monitoring Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    const adminManagementItems: NavItem[] = [
        {
            title: 'User Management',
            href: '/admin/users',
            icon: Users,
            badge: 'Admin',
            badgeVariant: 'secondary',
        },
        {
            title: 'Health Cards (হেলথ কার্ড)',
            href: '/health-cards',
            icon: CreditCard,
        },
        {
            title: 'Activity Logs (All Staff)',
            href: '/activities',
            icon: ClipboardList,
        },
        {
            title: 'Reports & Analytics',
            href: '/reports',
            icon: FileText,
        },
    ];

    // 2. FIELD WORKER / MANAGER OPERATIONS NAVIGATION
    const workerOperationsItems: NavItem[] = [
        {
            title: "Today's Tasks",
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Field Tasks & Forms',
            icon: HeartPulse,
            badge: '5 Types',
            badgeVariant: 'secondary',
            items: [
                {
                    title: 'Uthan Boithok (Yard Meeting)',
                    href: '/tasks/samity-task/uthan-boithok',
                    icon: Users,
                },
                {
                    title: 'Satellite Clinic',
                    href: '/tasks/samity-task/satellite-clinic',
                    icon: Stethoscope,
                },
                {
                    title: 'Awareness Session',
                    href: '/tasks/samity-task/awareness-session',
                    icon: Sparkles,
                },
                {
                    title: 'Household Visit',
                    href: '/tasks/household-visit',
                    icon: Home,
                },
                {
                    title: 'Static Clinic',
                    href: '/tasks/static-clinic',
                    icon: Building2,
                },
            ],
        },
        {
            title: 'Activity Logs',
            href: '/activities',
            icon: ClipboardList,
        },
        {
            title: 'Health Camps',
            icon: Tent,
            items: [
                {
                    title: 'All Health Camps',
                    href: '/health-camps',
                    icon: Tent,
                },
                {
                    title: 'New Health Camp',
                    href: '/health-camps/create',
                    icon: Activity,
                    badge: 'New',
                    badgeVariant: 'success',
                },
            ],
        },
        {
            title: 'Fee Collections',
            href: '/fee-collections',
            icon: Receipt,
        },
        {
            title: 'Health Cards (হেলথ কার্ড)',
            href: '/health-cards',
            icon: CreditCard,
        },
    ];

    const workerReportsItems: NavItem[] = [
        {
            title: 'Activity Summary',
            href: '/reports?report_type=activities',
            icon: FileText,
        },
        {
            title: 'Household Visits',
            href: '/reports?report_type=households',
            icon: Home,
        },
        {
            title: 'Fee & Diabetes Register',
            href: '/reports?report_type=fee_collections',
            icon: Coins,
        },
        {
            title: 'Patients Register',
            href: '/reports?report_type=patients',
            icon: Stethoscope,
        },
    ];

    // 3. SYSTEM NAVIGATION
    const systemNavItems: NavItem[] = [
        {
            title: 'Profile & Security',
            href: '/settings/profile',
            icon: ShieldCheck,
        },
    ];

    const canSync = Boolean(user?.can_sync_hrm || isAdmin);

    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* Header / Brand */}
            <SidebarHeader className="border-b border-sidebar-border/40 px-3 py-2.5">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
                            <Link
                                href={dashboard()}
                                prefetch
                                onClick={() => setOpenMobile(false)}
                                className="flex items-center gap-3"
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Main Navigation Content */}
            <SidebarContent className="space-y-1 px-1 py-2">
                {isAdmin ? (
                    <>
                        {/* Admin Sections Only */}
                        <NavMain label="Overview" items={adminMainItems} />
                        <NavMain label="Administration" items={adminManagementItems} />
                        <NavMain label="System" items={systemNavItems} />
                    </>
                ) : (
                    <>
                        {/* Worker / Field Staff Sections */}
                        <NavMain label="Operations & Entry" items={workerOperationsItems} />
                        <NavMain label="Reports & Registers" items={workerReportsItems} />
                        <NavMain label="System" items={systemNavItems} />
                    </>
                )}

                {/* Live HRM Sync Action (Admin Only) */}
                {canSync ? (
                    <SidebarGroup className="px-2 py-1">
                        <SidebarGroupLabel className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground/75 uppercase">
                            HRM Integration
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <button
                                        type="button"
                                        disabled={isSyncing}
                                        onClick={handleSyncHrm}
                                        className="group relative flex w-full items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/5 px-2.5 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary/10 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 cursor-pointer"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <RefreshCw
                                                className={`size-3.5 shrink-0 transition-transform ${
                                                    isSyncing ? 'animate-spin text-primary' : 'group-hover:rotate-180'
                                                }`}
                                            />
                                            <span className="truncate">
                                                {isSyncing ? 'Syncing HRM...' : 'HRM Live Sync'}
                                            </span>
                                        </div>
                                        <span className="flex size-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse" />
                                    </button>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : null}
            </SidebarContent>

            {/* Sidebar User Footer */}
            <SidebarFooter className="border-t border-sidebar-border/40 p-2">
                <NavUser />
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
