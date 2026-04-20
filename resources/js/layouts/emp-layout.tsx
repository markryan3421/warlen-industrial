// layouts/emp-layout.tsx
import Footer from '@/components/custom-footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import type { AppLayoutProps } from '@/types';

export default function EmpLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    return (
        <SidebarProvider>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
                <Footer />
            </AppLayoutTemplate>
        </SidebarProvider>
    );
}