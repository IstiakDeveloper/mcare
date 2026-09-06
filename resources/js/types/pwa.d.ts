export type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type PwaInstallState = {
    canInstall: boolean;
    installed: boolean;
    isIos: boolean;
    dismissed: boolean;
    promptInstall: () => Promise<boolean>;
    dismiss: () => void;
};
