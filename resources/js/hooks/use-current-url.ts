// hooks/use-current-url.ts
import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
    startsWith?: boolean,  // ✅ Add this parameter
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
    isCurrentUrl: IsCurrentUrlFn;
    isCurrentOrParentUrl: IsCurrentOrParentUrlFn;  // ✅ Add this
    isActiveUrl: (path: string, options?: { exact?: boolean; strict?: boolean }) => boolean;
    getActiveSection: (items: Array<{ href: string; pattern?: string }>) => string | null;
    whenCurrentUrl: WhenCurrentUrlFn;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const { url } = usePage();
    
    // Normalize URL (remove trailing slashes for consistent matching)
    const normalizeUrl = (path: string) => {
        return path.replace(/\/$/, '');
    };
    
    const currentUrlNormalized = normalizeUrl(url);
    
    // Enhanced isCurrentUrl with startsWith support
    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
        startsWith: boolean = false,  // ✅ Default to false for exact match
    ) => {
        const urlToCompare = currentUrl ? normalizeUrl(currentUrl) : currentUrlNormalized;
        const urlString = normalizeUrl(toUrl(urlToCheck));
        
        if (startsWith) {
            // For parent/child matching: /branches matches /branches/create
            return urlToCompare === urlString || urlToCompare.startsWith(`${urlString}/`);
        }
        
        // Exact match only
        return urlToCompare === urlString;
    };
    
    // ✅ Add this method - it's what your nav-main needs!
    const isCurrentOrParentUrl: IsCurrentOrParentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) => {
        // This calls isCurrentUrl with startsWith = true
        return isCurrentUrl(urlToCheck, currentUrl, true);
    };
    
    // Your existing isActiveUrl (keeping for compatibility)
    const isActiveUrl = (path: string, options?: { exact?: boolean; strict?: boolean }) => {
        const { exact = false, strict = false } = options || {};
        const normalizedPath = normalizeUrl(path);
        const normalizedUrl = currentUrlNormalized;
        
        if (exact) {
            return normalizedUrl === normalizedPath;
        }
        
        if (strict) {
            return normalizedUrl === normalizedPath || normalizedUrl.startsWith(`${normalizedPath}/`);
        }
        
        return normalizedUrl.startsWith(normalizedPath);
    };
    
    const getActiveSection = (items: Array<{ href: string; pattern?: string }>) => {
        for (const item of items) {
            const pattern = item.pattern || item.href;
            if (isActiveUrl(pattern)) {
                return item.href;
            }
        }
        return null;
    };
    
    const whenCurrentUrl: WhenCurrentUrlFn = <TIfTrue, TIfFalse = null>(
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        ifTrue: TIfTrue,
        ifFalse: TIfFalse = null as TIfFalse,
    ): TIfTrue | TIfFalse => {
        return isCurrentUrl(urlToCheck) ? ifTrue : ifFalse;
    };
    
    return {
        currentUrl: url,
        isCurrentUrl,
        isCurrentOrParentUrl,  // ✅ CRITICAL: Return this!
        isActiveUrl,
        getActiveSection,
        whenCurrentUrl,
    };
}