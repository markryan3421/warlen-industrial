import { Head } from '@inertiajs/react';
import BiometricImport from '@/components/biometric-import';
import HrLayout from '@/layouts/hr-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendances',
        href: '/attendances',
    },
];

export default function Dashboard() {
    return (
        <HrLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendances" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <BiometricImport />
            </div>

            
        </HrLayout>
    );
}
