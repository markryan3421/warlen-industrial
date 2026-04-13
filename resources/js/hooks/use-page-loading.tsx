import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export function usePageLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingPage, setLoadingPage] = useState<string | null>(null);
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        
        const startLoading = (event: any) => {
            setIsLoading(true);
            setLoadingPage(event.detail.visit.url);
            
            // Only show skeleton if loading takes more than 150ms
            // This prevents flashing for fast loads
            timeoutId = setTimeout(() => {
                if (isLoading) {
                    setShowSkeleton(true);
                }
            }, 150);
        };

        const finishLoading = () => {
            setIsLoading(false);
            setShowSkeleton(false);
            setLoadingPage(null);
            clearTimeout(timeoutId);
        };

        document.addEventListener('inertia:start', startLoading);
        document.addEventListener('inertia:finish', finishLoading);
        document.addEventListener('inertia:cancel', finishLoading);

        return () => {
            document.removeEventListener('inertia:start', startLoading);
            document.removeEventListener('inertia:finish', finishLoading);
            document.removeEventListener('inertia:cancel', finishLoading);
            clearTimeout(timeoutId);
        };
    }, [isLoading]);

    return { isLoading, showSkeleton, loadingPage };
}