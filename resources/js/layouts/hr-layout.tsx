// layouts/hr-layout.tsx
import { SidebarProvider } from '@/components/ui/sidebar';
import { HrSidebar } from '@/components/hr-sidebar';
import { Toaster } from '@/components/ui/sonner';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface HrLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    title?: string;
}

export default function HrLayout({ children, breadcrumbs = [], title }: HrLayoutProps) {
    return (
        <>
            {title && <Head title={title} />}
            <SidebarProvider>
                <div className="flex min-h-screen w-full">
                    <HrSidebar />
                    <main className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="container mx-auto p-6">
                            {children}
                        </div>
                    </main>
                </div>
                <Toaster position="top-right" />
            </SidebarProvider>
        </>
    );
}