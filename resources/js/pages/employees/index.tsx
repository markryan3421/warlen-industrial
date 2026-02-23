import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useState, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import EmmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { Tab } from '@headlessui/react';

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
    branch: {
        branch_name: string;
        branch_address: string;
    }
    user: {
        name: string;
        email: string;
    }
    sites: {
        site_name: string;
    }
<<<<<<< HEAD
=======
    emp_code: string;
    contract_start_date: string;
    contract_end_date: string;
    pay_frequency: string;
>>>>>>> 7520b3d359a76f941d05328b3b126be743e502e8
    employee_number: string;
    site_name: string;
    emergency_contact_number: string;
    employee_status: string;
}

interface PageProps {
    employees: Employee[],
    positions: string[],
    branches: any[],
    sites: any[]
}

export default function Index({ employees, positions, branches, sites }: PageProps) {
    const { delete: destroy } = useForm();
    const [filters, setFilters] = useState({
        position: '',
        branch: '',
        site: ''
    });

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this employee?")) {
            destroy(EmmployeeController.destroy(id).url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex justify-between items-center p-4">
 
                    <Link href="/employees/create">
                        <Button size="sm">+ Create Employee</Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Pay Frequency</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Start of Contract</TableHead>
                                <TableHead>End of Contract</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>{employee.emp_code}</TableCell>
                                    <TableCell>{employee.user.name}</TableCell>
                                    <TableCell>{employee.position.pos_name}</TableCell>
<<<<<<< HEAD
                                    <TableCell>{employee.department}</TableCell>
                                    <TableCell>{employee.branch.branch_name}</TableCell>
                                    <TableCell>{employee.sites?.site_name || 'N/A'}</TableCell>
                                    <TableCell>{employee.employee_number}</TableCell>
                                    <TableCell>{employee.emergency_contact_number}</TableCell>
=======
                                    <TableCell>{employee.pay_frequency}</TableCell>
                                    <TableCell>{employee.branch.branch_name}</TableCell>
                                    <TableCell>{employee.contract_start_date}</TableCell>
                                    <TableCell>{employee.contract_end_date}</TableCell>
>>>>>>> 7520b3d359a76f941d05328b3b126be743e502e8
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            employee.employee_status === 'Active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {employee.employee_status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-2">
                                            <Link href={EmmployeeController.edit(employee.id)}>
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </Link>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(employee.id)}>
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}