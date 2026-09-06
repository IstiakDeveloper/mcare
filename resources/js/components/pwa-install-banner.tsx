import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export function PwaInstallBanner() {
    const { canInstall, installed, isIos, dismissed, promptInstall, dismiss } =
        usePwaInstall();

    if (installed || dismissed || (!canInstall && !isIos)) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-3 md:bottom-6 md:justify-end">
            <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/80 bg-background/95 p-3 shadow-lg shadow-primary/10 backdrop-blur-md md:mr-3">
                <div className="flex items-start gap-3">
                    <img
                        src="/icons/icon-96.png"
                        alt=""
                        className="mt-0.5 size-11 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">
                            Install M Care
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {isIos
                                ? 'Tap Share, then Add to Home Screen for faster field access.'
                                : 'Add the app to your home screen for offline-ready field work.'}
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                            {canInstall ? (
                                <Button
                                    size="sm"
                                    className="h-8 rounded-xl px-3 text-xs font-semibold"
                                    onClick={() => {
                                        void promptInstall();
                                    }}
                                >
                                    <Download className="size-3.5" />
                                    Install
                                </Button>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                    <Share className="size-3.5" />
                                    Share → Add to Home Screen
                                </span>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-xl px-2 text-xs"
                                onClick={dismiss}
                            >
                                Not now
                            </Button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label="Dismiss install prompt"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
