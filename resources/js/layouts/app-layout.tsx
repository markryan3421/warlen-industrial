// layouts/app/app-layout.tsx (your current file)
import Footer from "@/components/custom-footer";
import { SkeletonRouter } from "@/components/skeletons/skeleton-router"; // Changed import
import { Toaster } from "@/components/ui/sonner"
import { usePageLoading } from "@/hooks/use-page-loading";
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import { usePage } from "@inertiajs/react";

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { showSkeleton } = usePageLoading();

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <Toaster
                position="top-right"
                expand={false}
                closeButton
            />
            {showSkeleton ? <SkeletonRouter /> : children}
            
            <Footer />
        </AppLayoutTemplate>
    );
};