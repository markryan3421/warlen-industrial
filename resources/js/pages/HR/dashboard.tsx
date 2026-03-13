// pages/hr/dashboard.tsx
import { Head } from '@inertiajs/react';
import HrLayout from '@/layouts/hr-layout';

interface Props {
    stats: {
        totalEmployees: number;
        onLeave: number;
        pendingRequests: number;
    };
}

export default function Dashboard() {
    return (
        <HrLayout title="HR Dashboard">
            <Head title="HR Dashboard" />
            
            <div className="space-y-6">
                {/* HR-specific dashboard content */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                        {/* <h3 className="text-sm font-medium">Total Employees</h3>
                        <p className="text-2xl font-bold">{stats.totalEmployees}</p> */}
                    </div>
                    <div className="rounded-lg border p-4">
                        {/* <h3 className="text-sm font-medium">On Leave Today</h3>
                        <p className="text-2xl font-bold">{stats.onLeave}</p> */}
                    </div>
                    <div className="rounded-lg border p-4">
                        {/* <h3 className="text-sm font-medium">Pending Requests</h3>
                        <p className="text-2xl font-bold">{stats.pendingRequests}</p> */}
                    </div>
                </div>

                {/* Rest of your component */}
            </div>
        </HrLayout>
    );
}