import { useCallback } from 'react';

export type CleanupFn = () => void;

export function useMobileNavigation(): CleanupFn {
    return useCallback(() => {
        // Remove pointer-events style from body that could linger after sheet/dropdown close
        document.body.style.removeProperty('pointer-events');
    }, []);
}

