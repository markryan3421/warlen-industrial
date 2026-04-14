import { usePage } from '@inertiajs/react';
import { PageSkeleton } from './page-skeleton';
import { TableSkeleton } from './table-skeleton';
import { FormSkeleton } from './form-skeleton';
import { DashboardSkeleton } from './dashboard-skeleton';
import { BranchesSkeleton } from './branches-skeleton';

type SkeletonType = 'table' | 'form' | 'dashboard' | 'default';

export function SkeletonRouter() {
    const { url } = usePage();
    
    // Determine skeleton type based on URL pattern
    const getSkeletonType = (): SkeletonType => {
        // Form pages (create, edit)
        if (url.includes('/create') || url.includes('/edit') || url.includes('/add')) {
            return 'form';
        }
        
        // Table/index pages (list views)
        if (url.match(/\/(branches|employees|users|payrolls|positions|attendances|contributions|incentives|deductions)/)) {
            return 'table';
        }
        
        // Dashboard
        if (url === '/dashboard') {
            return 'dashboard';
        }

        if (url.includes('/branches')) {
            return <BranchesSkeleton />;
        }
        
        // Default for other pages (show, settings, etc.)
        return 'default';
    };
    
    const skeletonType = getSkeletonType();
    
    // Debug in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[SkeletonRouter] Showing ${skeletonType} skeleton for URL: ${url}`);
    }
    
    switch (skeletonType) {
        case 'table':
            return <TableSkeleton rows={8} columns={5} />;
        case 'form':
            return <FormSkeleton />;
        case 'dashboard':
            return <DashboardSkeleton />;
        default:
            return <PageSkeleton />;
    }
}