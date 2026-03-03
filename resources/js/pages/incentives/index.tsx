// resources/js/Pages/incentives/index.tsx
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Incentives',
        href: '/incentives',
    },
];

interface PayrollPeriod {
    id: number;
    name: string;
    period?: string;
}

interface Incentive {
    id: number;
    payroll_period_id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period?: PayrollPeriod;
}

interface Props {
    incentives: Incentive[];
}

export default function Index({ incentives }: Props) {
    const deleteIncentive = (id: number) => {
        if (confirm('Are you sure you want to delete this incentive?')) {
            router.delete(`/incentives/${id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incentives" />
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Incentives</h1>
                    <Link href="/incentives/create">
                        <Button size="sm">+ Add Incentives</Button>
                    </Link>
                </div>

                {incentives.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Briefcase className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No incentives yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Get started by creating your first incentive. Define incentives and their corresponding amounts for payroll periods.
                        </p>
                        <Link href="/incentives/create">
                            <Button className="gap-2">
                                Create Your First Incentive
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-left">Incentive Name</TableHead>
                                    <TableHead className="text-left">Incentive Amount</TableHead>
                                    <TableHead className="text-left">Payroll Period</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incentives.map((incentive) => (
                                    <TableRow key={incentive.id}>
                                        <TableCell className="text-left font-medium">{incentive.incentive_name}</TableCell>
                                        <TableCell className="text-left">{incentive.incentive_amount}</TableCell>
                                        <TableCell className="text-left">{incentive.payroll_period?.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/incentives/${incentive.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button 
                                                    variant="destructive" 
                                                    size="sm" 
                                                    onClick={() => deleteIncentive(incentive.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}