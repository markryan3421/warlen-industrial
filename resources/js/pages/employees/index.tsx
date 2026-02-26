import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomPieChart } from '@/components/custom-pie-chart';
import { ChartAreaInteractive } from '@/components/section-chart';
import AppLayout from '@/layouts/app-layout';
import { useState, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import EmmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { Tab } from '@headlessui/react';
import { Users, PlusCircle } from 'lucide-react';

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
        deleted_at: string;
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
    slug_emp: string;   
    emp_code: string;
    employee_number: string;
    site_name: string;
    pay_frequency: string;
    contract_start_date: string;
    contract_end_date: string;
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
    const hasValidPosition = (employee: Employee) => {
        return employee.position && !employee.position.deleted_at;
    }
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this employee?")) {
            destroy(EmmployeeController.destroy(id).url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="@container/main flex flex-1 flex-col gap-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-6 my-4 pb-4">
                                    {/* Chart Area - Full width on mobile, 2/3 on desktop */}
                                    <div className="md:col-span-2 relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                        <ChartAreaInteractive />
                                    </div>
                
                                    {/* Pie Chart - Full width on mobile, 1/3 on desktop */}
                                    <div className="md:col-span-1 relative overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                        <CustomPieChart />
                                    </div>
                                </div>
                            </div>
                <div className="flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Employees</h1>
                    <Link href="/employees/create">
                        <Button size="sm">+ Create Employee</Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    {employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <Users className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semib text-gray-900 mb-2">No employees yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Get started by creating your first employee. You can add their details, assign positions, and set up contracts.
                            </p>
                            <Link href="/employees/create">
                                <Button className="gap-2">
                                    Create Your First Employee
                                </Button>
                            </Link>
                        </div>
                    ) : (
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
                                        <TableCell>
                                            {hasValidPosition(employee) ? (
                                                employee.position.pos_name
                                            ) : (
                                                <span className="text-gray-400 italic">Not assigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize first-letter">
                                            {employee.pay_frequency.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell>{employee.branch.branch_name}</TableCell>
                                        <TableCell>{employee.contract_start_date}</TableCell>
                                        <TableCell>{employee.contract_end_date}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${['active', 'Active', 'ACTIVE'].includes(employee.employee_status)
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {employee.employee_status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Link href={EmmployeeController.edit(employee.slug_emp)}>
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
                    )}
                </div>
            </div>
        </AppLayout>
    );
}