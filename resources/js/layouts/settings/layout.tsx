import type { PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="w-full px-3 sm:px-6 py-4 md:py-6">
            {children}
        </div>
    );
}
