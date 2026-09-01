import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';
import type { NavItem, NavSubItem } from '@/types';

export type IsCurrentUrlOptions = {
    startsWith?: boolean;
    exact?: boolean;
};

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
    startsWithOrOptions?: boolean | IsCurrentUrlOptions,
) => boolean;

export type IsCurrentOrParentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
) => boolean;

export type WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    ifTrue: TIfTrue,
    ifFalse?: TIfFalse,
) => TIfTrue | TIfFalse;

export type UseCurrentUrlReturn = {
    currentUrl: string;
    currentPath: string;
    isCurrentUrl: IsCurrentUrlFn;
    isCurrentOrParentUrl: IsCurrentOrParentUrlFn;
    isItemActive: (item: NavItem | NavSubItem) => boolean;
    isParentActive: (item: NavItem) => boolean;
    whenCurrentUrl: WhenCurrentUrlFn;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const page = usePage();
    const currentUrlRaw = page.url || '/';

    const parseUrl = (urlString: string) => {
        try {
            return new URL(
                urlString,
                typeof window !== 'undefined'
                    ? window.location.origin
                    : 'http://localhost',
            );
        } catch {
            return new URL('http://localhost');
        }
    };

    const currentUrlObj = parseUrl(currentUrlRaw);
    const currentPath = currentUrlObj.pathname;

    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        customCurrentUrl?: string,
        startsWithOrOptions: boolean | IsCurrentUrlOptions = false,
    ) => {
        const options: IsCurrentUrlOptions =
            typeof startsWithOrOptions === 'boolean'
                ? { startsWith: startsWithOrOptions }
                : startsWithOrOptions;

        const targetString = toUrl(urlToCheck);
        const activeUrlObj = customCurrentUrl
            ? parseUrl(customCurrentUrl)
            : currentUrlObj;
        const activePath = activeUrlObj.pathname;

        const targetUrlObj = parseUrl(targetString);
        const targetPath = targetUrlObj.pathname;

        // Check if target URL specifies query params
        const targetParams = Array.from(targetUrlObj.searchParams.entries());
        const hasTargetParams = targetParams.length > 0;

        if (hasTargetParams) {
            // Path must match
            if (activePath !== targetPath) {
                return false;
            }

            // Every target param must match in active URL
            for (const [key, val] of targetParams) {
                const activeVal = activeUrlObj.searchParams.get(key);
                if (activeVal === val) {
                    continue;
                }
                // Handle default fallback for reports when no query param is present
                if (
                    activePath === '/reports' &&
                    key === 'report_type' &&
                    val === 'activities' &&
                    !activeVal
                ) {
                    continue;
                }
                return false;
            }

            return true;
        }

        // If target has NO query params:
        if (options.exact) {
            return (
                activePath === targetPath &&
                activeUrlObj.searchParams.toString() === ''
            );
        }

        if (options.startsWith) {
            if (targetPath === '/' || targetPath === '') {
                return activePath === '/';
            }
            return (
                activePath === targetPath ||
                activePath.startsWith(`${targetPath}/`)
            );
        }

        // If checking base /reports when target has no query params but user has chosen a specific report
        if (targetPath === '/reports' && activePath === '/reports') {
            return activeUrlObj.searchParams.get('report_type') === null;
        }

        // Default: match exact pathname
        return activePath === targetPath;
    };

    const isCurrentOrParentUrl: IsCurrentOrParentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        customCurrentUrl?: string,
    ) => {
        return isCurrentUrl(urlToCheck, customCurrentUrl, { startsWith: true });
    };

    const isItemActive = (item: NavItem | NavSubItem): boolean => {
        if (item.isActive !== undefined) {
            return item.isActive;
        }
        if (!item.href) {
            return false;
        }
        return isCurrentUrl(item.href);
    };

    const isParentActive = (item: NavItem): boolean => {
        if (item.isActive) return true;

        // Check if any child is active
        if (item.items && item.items.length > 0) {
            const hasActiveChild = item.items.some((child) => isItemActive(child));
            if (hasActiveChild) {
                return true;
            }
        }

        // Check if item's own href is active or parent URL
        if (item.href) {
            if (item.href === '/' || item.href === '/dashboard') {
                return currentPath === '/' || currentPath === '/dashboard';
            }
            return isCurrentOrParentUrl(item.href);
        }

        return false;
    };

    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };

    return {
        currentUrl: currentUrlRaw,
        currentPath,
        isCurrentUrl,
        isCurrentOrParentUrl,
        isItemActive,
        isParentActive,
        whenCurrentUrl,
    };
}
