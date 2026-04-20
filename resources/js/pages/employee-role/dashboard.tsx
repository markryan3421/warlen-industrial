import EmployeeStats from '@/components/employee-stats';
import EmpLayout from '@/layouts/emp-layout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <EmpLayout breadcrumbs={[{ title: 'Dashboard', href: '/employee/dashboard' }]}>
            <Head title="Dashboard" />
            <div className="p-6">
                <EmployeeStats />
            </div>
        </EmpLayout>
    );
}