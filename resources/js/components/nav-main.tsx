import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import type { NavItem, NavSubItem } from '@/types';

interface NavMainProps {
    label?: string;
    items: NavItem[];
    className?: string;
}

function NavBadge({
    badge,
    variant,
}: {
    badge?: string | number | null;
    variant?: NavSubItem['badgeVariant'];
}) {
    if (!badge) return null;

    const variantStyles = {
        default: 'bg-primary/15 text-primary border-primary/25',
        secondary: 'bg-muted text-muted-foreground border-border/50',
        outline: 'border-border text-foreground',
        destructive: 'bg-destructive/15 text-destructive border-destructive/25',
        success:
            'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        teal: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
        warning:
            'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    };

    const chosenStyle = variantStyles[variant || 'default'];

    return (
        <span
            className={cn(
                'ml-auto inline-flex items-center justify-center rounded-full border px-1.5 py-0.2 text-[10px] font-bold tracking-tight',
                chosenStyle,
            )}
        >
            {badge}
        </span>
    );
}

export function NavMain({ label, items = [], className }: NavMainProps) {
    const { isItemActive, isParentActive } = useCurrentUrl();
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    if (!items.length) return null;

    return (
        <SidebarGroup className={cn('px-2 py-1', className)}>
            {label ? (
                <SidebarGroupLabel className="px-2 text-[10px] font-bold tracking-wider text-muted-foreground/75 uppercase">
                    {label}
                </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                    {items.map((item) => {
                        const hasSubItems = Boolean(
                            item.items && item.items.length > 0,
                        );
                        const isParent = isParentActive(item);
                        const Icon = item.icon;

                        // Case 1: Item has sub-items (Collapsible or Dropdown in icon mode)
                        if (hasSubItems) {
                            if (isCollapsed) {
                                // In collapsed icon mode: DropdownMenu for quick access
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip={item.title}
                                                    isActive={isParent}
                                                    className={cn(
                                                        'rounded-xl transition-all duration-200',
                                                        isParent
                                                            ? 'bg-primary/15 font-semibold text-primary shadow-xs'
                                                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                                                    )}
                                                >
                                                    {Icon && (
                                                        <Icon
                                                            className={cn(
                                                                'size-4 shrink-0 transition-colors',
                                                                isParent
                                                                    ? 'text-primary'
                                                                    : 'text-muted-foreground group-hover:text-foreground',
                                                            )}
                                                        />
                                                    )}
                                                    <span className="truncate">
                                                        {item.title}
                                                    </span>
                                                </SidebarMenuButton>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                side="right"
                                                align="start"
                                                className="w-56 rounded-xl border border-border/80 p-1.5 shadow-xl backdrop-blur-md"
                                            >
                                                <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-foreground">
                                                    {Icon && (
                                                        <Icon className="size-3.5 text-primary" />
                                                    )}
                                                    <span>{item.title}</span>
                                                    {item.badge && (
                                                        <NavBadge
                                                            badge={item.badge}
                                                            variant={
                                                                item.badgeVariant
                                                            }
                                                        />
                                                    )}
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator className="my-1" />
                                                {item.items?.map((subItem) => {
                                                    const subActive =
                                                        isItemActive(subItem);
                                                    const SubIcon =
                                                        subItem.icon;
                                                    return (
                                                        <DropdownMenuItem
                                                            key={subItem.title}
                                                            asChild
                                                            className={cn(
                                                                'cursor-pointer rounded-lg text-xs font-medium transition-colors',
                                                                subActive
                                                                    ? 'bg-primary/15 font-bold text-primary focus:bg-primary/20 focus:text-primary'
                                                                    : 'text-muted-foreground focus:bg-sidebar-accent focus:text-foreground',
                                                            )}
                                                        >
                                                            <Link
                                                                href={
                                                                    subItem.href
                                                                }
                                                                prefetch
                                                                className="flex w-full items-center gap-2 px-2 py-1.5"
                                                            >
                                                                {SubIcon ? (
                                                                    <SubIcon className="size-3.5 shrink-0" />
                                                                ) : (
                                                                    <span
                                                                        className={cn(
                                                                            'size-1.5 shrink-0 rounded-full',
                                                                            subActive
                                                                                ? 'bg-primary'
                                                                                : 'bg-muted-foreground/40',
                                                                        )}
                                                                    />
                                                                )}
                                                                <span className="truncate">
                                                                    {
                                                                        subItem.title
                                                                    }
                                                                </span>
                                                                <NavBadge
                                                                    badge={
                                                                        subItem.badge
                                                                    }
                                                                    variant={
                                                                        subItem.badgeVariant
                                                                    }
                                                                />
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    );
                                                })}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </SidebarMenuItem>
                                );
                            }

                            // Expanded mode: Collapsible Accordion
                            return (
                                <Collapsible
                                    key={item.title}
                                    asChild
                                    defaultOpen={
                                        isParent || item.defaultOpen || false
                                    }
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                isActive={isParent}
                                                className={cn(
                                                    'group relative flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200',
                                                    isParent
                                                        ? 'bg-primary/10 font-bold text-primary shadow-xs dark:bg-primary/15'
                                                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                                                )}
                                            >
                                                <div className="flex min-w-0 items-center gap-2.5 truncate">
                                                    {Icon && (
                                                        <Icon
                                                            className={cn(
                                                                'size-4 shrink-0 transition-colors',
                                                                isParent
                                                                    ? 'text-primary'
                                                                    : 'text-muted-foreground group-hover:text-foreground',
                                                            )}
                                                        />
                                                    )}
                                                    <span className="truncate font-medium">
                                                        {item.title}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                                                    <NavBadge
                                                        badge={item.badge}
                                                        variant={
                                                            item.badgeVariant
                                                        }
                                                    />
                                                    <ChevronRight className="size-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover:text-foreground" />
                                                </div>
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
                                            <SidebarMenuSub className="my-1 mr-0 ml-3.5 border-l border-sidebar-border/60 pl-2.5 space-y-0.5">
                                                {item.items?.map((subItem) => {
                                                    const subActive =
                                                        isItemActive(subItem);
                                                    const SubIcon =
                                                        subItem.icon;
                                                    return (
                                                        <SidebarMenuSubItem
                                                            key={subItem.title}
                                                        >
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                size="sm"
                                                                isActive={
                                                                    subActive
                                                                }
                                                                className={cn(
                                                                    'group/sub relative h-7.5 w-full rounded-lg px-2 text-[11px] font-medium transition-all duration-150',
                                                                    subActive
                                                                        ? 'bg-primary/15 font-bold text-primary shadow-xs dark:bg-primary/20'
                                                                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                                                                )}
                                                            >
                                                                <Link
                                                                    href={
                                                                        subItem.href
                                                                    }
                                                                    prefetch
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    {SubIcon ? (
                                                                        <SubIcon
                                                                            className={cn(
                                                                                'size-3.5 shrink-0 transition-colors',
                                                                                subActive
                                                                                    ? 'text-primary font-bold'
                                                                                    : 'text-muted-foreground/70 group-hover/sub:text-foreground',
                                                                            )}
                                                                        />
                                                                    ) : (
                                                                        <span
                                                                            className={cn(
                                                                                'size-1.5 shrink-0 rounded-full transition-all',
                                                                                subActive
                                                                                    ? 'bg-primary scale-110'
                                                                                    : 'bg-muted-foreground/40 group-hover/sub:bg-foreground',
                                                                            )}
                                                                        />
                                                                    )}
                                                                    <span className="truncate">
                                                                        {
                                                                            subItem.title
                                                                        }
                                                                    </span>
                                                                    <NavBadge
                                                                        badge={
                                                                            subItem.badge
                                                                        }
                                                                        variant={
                                                                            subItem.badgeVariant
                                                                        }
                                                                    />
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    );
                                                })}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            );
                        }

                        // Case 2: Single Link Item (No children)
                        const active = isItemActive(item);
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    tooltip={item.title}
                                    className={cn(
                                        'group rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200',
                                        active
                                            ? 'bg-primary/10 font-bold text-primary shadow-xs dark:bg-primary/15'
                                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
                                    )}
                                >
                                    <Link
                                        href={item.href || '#'}
                                        prefetch
                                        className="flex items-center gap-2.5"
                                    >
                                        {Icon && (
                                            <Icon
                                                className={cn(
                                                    'size-4 shrink-0 transition-colors',
                                                    active
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground group-hover:text-foreground',
                                                )}
                                            />
                                        )}
                                        <span className="truncate font-medium">
                                            {item.title}
                                        </span>
                                        <NavBadge
                                            badge={item.badge}
                                            variant={item.badgeVariant}
                                        />
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
