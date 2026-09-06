import { CheckCircle2, Download, MonitorSmartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export function PwaInstallCard() {
    const { canInstall, installed, isIos, promptInstall } = usePwaInstall();

    return (
        <div className="mt-5 rounded-2xl border border-primary/20 bg-linear-to-br from-primary/8 to-transparent p-4">
            <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
                    <MonitorSmartphone className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-foreground">
                        Progressive Web App
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Install M Care on this device for a full-screen app
                        experience, home-screen launch, and an offline fallback.
                    </p>

                    {installed ? (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            Installed on this device
                        </div>
                    ) : canInstall ? (
                        <Button
                            size="sm"
                            className="mt-3 h-8 rounded-xl px-3 text-xs font-semibold"
                            onClick={() => {
                                void promptInstall();
                            }}
                        >
                            <Download className="size-3.5" />
                            Install app
                        </Button>
                    ) : isIos ? (
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                            <Share className="size-3.5" />
                            Safari → Share → Add to Home Screen
                        </p>
                    ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Open this site in Chrome or Edge on HTTPS to install.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
