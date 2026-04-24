// layouts/hr-layout.tsx
import Footer from "@/components/custom-footer";
import { Toaster } from "@/components/ui/sonner"
import HrSidebarLayout from '@/layouts/hr-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import { Head } from "@inertiajs/react";

export default ({ children, breadcrumbs, title, ...props }: AppLayoutProps & { title?: string }) => {
    return (
        <>
            {title && <Head title={title} />}
            <HrSidebarLayout breadcrumbs={breadcrumbs} {...props}>
                <Toaster
                    position="top-right"
                    expand={false}
                    closeButton
                />
                <div className="container mx-auto">
                    {children}
                </div>
                
                <Footer />
            </HrSidebarLayout>
        </>
    );
};