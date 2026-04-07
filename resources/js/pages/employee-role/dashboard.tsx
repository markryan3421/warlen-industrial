import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/emp-layout';
import type { BreadcrumbItem } from '@/types';
import EmployeeStats from '@/components/employee-stats';

const breadcrumbs: BreadcrumbItem[] = [];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard employee" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <EmployeeStats />
                </div>
            </div>
        </AppLayout>
    );
}