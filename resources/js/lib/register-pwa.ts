import { toast } from 'sonner';

const UPDATE_TOAST_ID = 'mcare-pwa-update';

function listenForWaitingWorker(
    registration: ServiceWorkerRegistration,
    onWaiting: (worker: ServiceWorker) => void,
): void {
    if (registration.waiting) {
        onWaiting(registration.waiting);

        return;
    }

    registration.addEventListener('updatefound', () => {
        const worker = registration.installing;

        if (!worker) {
            return;
        }

        worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                onWaiting(worker);
            }
        });
    });
}

function promptReload(worker: ServiceWorker): void {
    toast.info('A new version of M Care is ready', {
        id: UPDATE_TOAST_ID,
        duration: 20000,
        action: {
            label: 'Reload',
            onClick: () => worker.postMessage('SKIP_WAITING'),
        },
    });
}

function watchConnectivity(): void {
    window.addEventListener('offline', () => {
        toast.warning('You are offline. Some pages may be unavailable.');
    });

    window.addEventListener('online', () => {
        toast.success('Back online');
    });
}

export function registerPwa(): void {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
        return;
    }

    watchConnectivity();

    let reloading = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) {
            return;
        }

        reloading = true;
        window.location.reload();
    });

    window.addEventListener('load', () => {
        void navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                listenForWaitingWorker(registration, promptReload);
            })
            .catch(() => undefined);
    });
}
