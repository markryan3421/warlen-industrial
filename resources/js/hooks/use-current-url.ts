// hooks/use-current-url.ts
import type { InertiaLinkProps } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toUrl } from '@/lib/utils';

export type IsCurrentUrlFn = (
    urlToCheck: NonNullable<InertiaLinkProps['href']>,
    currentUrl?: string,
    startsWith?: boolean,
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
    currentPath: string; // Add this - path without query params
    isCurrentUrl: IsCurrentUrlFn;
    isCurrentOrParentUrl: IsCurrentOrParentUrlFn;
    isActiveUrl: (path: string, options?: { exact?: boolean; strict?: boolean }) => boolean;
    getActiveSection: (items: Array<{ href: string; pattern?: string }>) => string | null;
    whenCurrentUrl: WhenCurrentUrlFn;
};

export function useCurrentUrl(): UseCurrentUrlReturn {
    const { url } = usePage();
    
    // Get the path without query parameters and hash
    const getPathWithoutParams = (fullUrl: string) => {
        return fullUrl.split('?')[0].split('#')[0];
    };
    
    // Normalize URL (remove trailing slashes for consistent matching)
    const normalizeUrl = (path: string) => {
        return path.replace(/\/$/, '');
    };
    
    const fullUrl = url;
    const currentPath = getPathWithoutParams(fullUrl);
    const currentUrlNormalized = normalizeUrl(currentPath);
    
    // Enhanced isCurrentUrl with startsWith support
    const isCurrentUrl: IsCurrentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
        startsWith: boolean = false,
    ) => {
        const urlToCompare = currentUrl ? normalizeUrl(getPathWithoutParams(currentUrl)) : currentUrlNormalized;
        const urlString = normalizeUrl(toUrl(urlToCheck));
        
        if (startsWith) {
            return urlToCompare === urlString || urlToCompare.startsWith(`${urlString}/`);
        }
        
        return urlToCompare === urlString;
    };
    
    // This is the key function for parent/child matching
    const isCurrentOrParentUrl: IsCurrentOrParentUrlFn = (
        urlToCheck: NonNullable<InertiaLinkProps['href']>,
        currentUrl?: string,
    ) => {
        // Remove query parameters and hash from the URL to check
        const urlToCheckPath = getPathWithoutParams(toUrl(urlToCheck));
        const currentPathToUse = currentUrl ? getPathWithoutParams(currentUrl) : currentPath;
        
        // Normalize both paths
        const normalizedCheckPath = normalizeUrl(urlToCheckPath);
        const normalizedCurrentPath = normalizeUrl(currentPathToUse);
        
        // Check if current path matches or is a child of the check path
        return normalizedCurrentPath === normalizedCheckPath || 
               normalizedCurrentPath.startsWith(`${normalizedCheckPath}/`);
    };
    
    // Your existing isActiveUrl
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
        currentUrl: fullUrl,
        currentPath, // Add this
        isCurrentUrl,
        isCurrentOrParentUrl,
        isActiveUrl,
        getActiveSection,
        whenCurrentUrl,
    };
}