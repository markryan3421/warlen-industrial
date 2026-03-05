import { Head } from '@inertiajs/react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
// import { StaticTable } from '@/components/static-table';
import AppLayout from '@/layouts/emp-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    return (
     <h1>This is HR Dashboard</h1>
    );
}
