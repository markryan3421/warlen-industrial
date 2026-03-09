import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomPieChart } from '@/components/custom-pie-chart';
import { ChartAreaInteractive } from '@/components/section-chart';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import EmmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { Users } from 'lucide-react';

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
    slug_emp: string;   
    emp_code: string;
    pay_frequency: string;
    contract_start_date: string;
    contract_end_date: string;
    employee_status: string;
}

interface PageProps {
    employees: Employee[],
    positions: string[],
    branches: any[],
    sites: any[]
}

export default function Index({ employees }: PageProps) {
    const { delete: destroy } = useForm();
    
    // Function to determine if employee should be inactive based on contract end date
    const shouldBeInactive = (employee: Employee) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const contractEndDate = new Date(employee.contract_end_date);
        contractEndDate.setHours(0, 0, 0, 0);
        
        // If contract end date is before today, employee should be inactive
        return contractEndDate < today;
    };

    // Function to capitalize first letter of status
    const capitalizeStatus = (status: string) => {
        if (!status) return status;
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const hasValidPosition = (employee: Employee) => {
        return employee.position && !employee.position.deleted_at;
    }
    
    const handleDelete = (slug:string) => {
        if (confirm("Are you sure you want to delete this employee?")) {
            destroy(EmmployeeController.destroy(slug).url);
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    
    // Combine start and end date
    const formatContractPeriod = (employee: Employee) => {
        return `${formatDate(employee.contract_start_date)} - ${formatDate(employee.contract_end_date)}`;
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-2 rounded-xl border">
                        <ChartAreaInteractive />
                    </div>
                    <div className="md:col-span-1 rounded-xl border">
                        <CustomPieChart />
                    </div>
                </div>
                
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Employees</h1>
                    <Link href="/employees/create">
                        <Button size="sm">+ Create Employee</Button>
                    </Link>
                </div>

                <div className="py-4">
                    {employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <Users className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Get started by creating your first employee.
                            </p>
                            <Link href="/employees/create">
                                <Button>Create Your First Employee</Button>
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
                                    <TableHead>Contract Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((employee) => {
                                    // Determine display status
                                    const rawStatus = shouldBeInactive(employee) ? 'inactive' : employee.employee_status;
                                    const displayStatus = capitalizeStatus(rawStatus);
                                    
                                    return (
                                        <TableRow key={employee.id}>
                                            <TableCell>{employee.emp_code}</TableCell>
                                            <TableCell>{employee.user.name}</TableCell>
                                            <TableCell>
                                                {hasValidPosition(employee) ? 
                                                    employee.position.pos_name : 
                                                    <span className="text-gray-400 italic">Not assigned</span>
                                                }
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {employee.pay_frequency.replace('_', ' ')}
                                            </TableCell>
                                            <TableCell>{employee.branch.branch_name}</TableCell>
                                            <TableCell>{formatContractPeriod(employee)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    ['Active', 'active'].includes(rawStatus)
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {displayStatus}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Link href={EmmployeeController.edit(employee.slug_emp)}>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </Link>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(employee.slug_emp)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}