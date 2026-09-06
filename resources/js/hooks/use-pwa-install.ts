import { useCallback, useEffect, useState } from 'react';
import type { BeforeInstallPromptEvent, PwaInstallState } from '@/types/pwa';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

function isStandaloneDisplay(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const media = window.matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = 'standalone' in window.navigator && Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
    );

    return media || iosStandalone;
}

function isIosDevice(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function wasRecentlyDismissed(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    const raw = window.localStorage.getItem(DISMISS_KEY);

    if (!raw) {
        return false;
    }

    const dismissedAt = Number(raw);

    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_MS;
}

export function usePwaInstall(): PwaInstallState {
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(isStandaloneDisplay);
    const [isIos] = useState(() => isIosDevice() && !isStandaloneDisplay());
    const [dismissed, setDismissed] = useState(wasRecentlyDismissed);

    useEffect(() => {
        const onPrompt = (event: Event) => {
            event.preventDefault();
            setDeferred(event as BeforeInstallPromptEvent);
        };

        const onInstalled = () => {
            setInstalled(true);
            setDeferred(null);
        };

        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferred) {
            return false;
        }

        await deferred.prompt();
        const choice = await deferred.userChoice;
        setDeferred(null);

        return choice.outcome === 'accepted';
    }, [deferred]);

    const dismiss = useCallback(() => {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setDismissed(true);
    }, []);

    return {
        canInstall: deferred !== null,
        installed,
        isIos,
        dismissed,
        promptInstall,
        dismiss,
    };
}
