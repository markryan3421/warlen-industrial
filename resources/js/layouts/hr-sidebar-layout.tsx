import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { HrSidebar } from '@/components/hr-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function HrSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <HrSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden rounded-xl">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}