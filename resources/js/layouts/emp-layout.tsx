// emp-layout.tsx
import { SidebarProvider } from '@/components/ui/sidebar';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import type { AppLayoutProps } from '@/types';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <SidebarProvider>
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppLayoutTemplate>
    </SidebarProvider>
);