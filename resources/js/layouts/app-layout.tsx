import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import { Toaster } from "@/components/ui/sonner"

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        <Toaster
            position="top-right"
            expand={false}
            closeButton
        />
        {children}
    </AppLayoutTemplate>
);
