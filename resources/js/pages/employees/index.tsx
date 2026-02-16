import { Head, Link } from '@inertiajs/react';
import { CustomTable } from '@/components/custom-table';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
// import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];
interface Employee {
    id: number;
    position: {
        pos_name: string;
    }
    branch_or_site: {
        branch_name: string;
        branch_address: string;
    }
    user: {
        name: string;
        email: string;
    }
    employee_number: string;
    emergency_contact_number: string;
    department: string;
    employee_status: string;

}

interface PageProps {
    employees: Employee[],
}

export default function Index({ employees }: PageProps) {

    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div>
                    <Link href="/employees/create">
                        <Button className="btn btn-primary">+ Create Employee</Button>
                    </Link>
                </div>
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Branch or Site</TableHead>
                                <TableHead>Employee Number</TableHead>
                                <TableHead>Emergency Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                    </Table>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.id}>
                                <TableCell>{employee.user.name}</TableCell>
                                <TableCell>{employee.position.pos_name}</TableCell>
                                <TableCell>{employee.department}</TableCell>
                                <TableCell>{employee.branch_or_site.branch_name}</TableCell>
                                <TableCell>{employee.employee_number}</TableCell>
                                <TableCell>{employee.emergency_contact_number}</TableCell>
                                <TableCell>{employee.employee_status}</TableCell>
                                <TableCell>
                                    <Link href={`/employees/${employee.id}/edit`}>Edit</Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </div>

            </div>
        </AppLayout>
    );
}
