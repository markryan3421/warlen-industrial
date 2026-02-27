import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PayrollProcessingCards from '@/components/payroll-processing-cards';
import EmployeeTable from '@/components/employee-table'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
];
export default function Index () {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="@container/main flex flex-1 flex-col gap-2">
            
                <div className="my-4 relative flex-1 overflow-hidden rounded-xl border-sidebar-border/70 dark:border-sidebar-border mx-6">
                    <PayrollProcessingCards/>
                    <EmployeeTable/>
                </div>
            </div>
        </AppLayout> 
    );
}