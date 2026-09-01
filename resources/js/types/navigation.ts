import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavSubItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    badge?: string | number | null;
    badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'teal';
    description?: string;
    isActive?: boolean;
    isExternal?: boolean;
};

export type NavItem = {
    title: string;
    href?: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: string | number | null;
    badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'teal';
    items?: NavSubItem[];
    defaultOpen?: boolean;
};

export type NavGroup = {
    label?: string;
    items: NavItem[];
};
