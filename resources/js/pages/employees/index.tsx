import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useState, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import EmmployeeController from '@/actions/App/Http/Controllers/EmployeeController';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];

interface Employee {
    id: number;
<<<<<<< HEAD
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
=======
    position: { pos_name: string; }
    branch: { branch_name: string; branch_address: string; sites?: string; }
    user: { name: string; email: string; }
>>>>>>> 7ef705fb18a446cb8121ddbc25d8b9bdfd7ca1ab
    employee_number: string;
    emergency_contact_number: string;
    department: string;
    employee_status: string;
}

interface PageProps {
    employees: Employee[],
}

export default function Index({ employees }: PageProps) {
    const { delete: destroy } = useForm();
    const [filters, setFilters] = useState({
        department: '',
        position: '',
        branch: '',
        site: ''
    });

    // Get unique values for filters
    const departments = [...new Set(employees.map(e => e.department))];
    const positions = [...new Set(employees.map(e => e.position.pos_name))];
    const branches = [...new Set(employees.map(e => e.branch.branch_name))];
    const sites = [...new Set(employees.map(e => e.branch.sites).filter(Boolean))];

    // Filter employees
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            return (
                (!filters.department || emp.department === filters.department) &&
                (!filters.position || emp.position.pos_name === filters.position) &&
                (!filters.branch || emp.branch.branch_name === filters.branch) &&
                (!filters.site || emp.branch.sites === filters.site || emp.branch.sites?.includes(filters.site))
            );
        });
    }, [employees, filters]);

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
                    <div className="flex gap-2 flex-wrap">
                        <select className="border rounded px-3 py-1" value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})}>
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select className="border rounded px-3 py-1" value={filters.position} onChange={(e) => setFilters({...filters, position: e.target.value})}>
                            <option value="">All Positions</option>
                            {positions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>

                        <select className="border rounded px-3 py-1" value={filters.branch} onChange={(e) => setFilters({...filters, branch: e.target.value, site: ''})}>
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>

                        {filters.branch && sites.length > 0 && (
                            <select className="border rounded px-3 py-1" value={filters.site} onChange={(e) => setFilters({...filters, site: e.target.value})}>
                                <option value="">All Sites</option>
                                {sites.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}

                        <Button  variant="ghost"  size="sm"  onClick={() => setFilters({department: '', position: '', branch: '', site: ''})} >
                            Clear
                        </Button>
                    </div>

                    <Link href="/employees/create">
                        <Button size="sm">+ Create Employee</Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Employee Number</TableHead>
                                <TableHead>Emergency Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>{employee.user.name}</TableCell>
                                    <TableCell>{employee.position.pos_name}</TableCell>
                                    <TableCell>{employee.department}</TableCell>
<<<<<<< HEAD
                                    <TableCell>{employee.branch.branch_name}</TableCell>
                                    <TableCell>{employee.sites?.site_name || 'N/A'}</TableCell>
=======
                                    <TableCell>
                                        {employee.branch.branch_name}

                                    </TableCell>
                                    
>>>>>>> 7ef705fb18a446cb8121ddbc25d8b9bdfd7ca1ab
                                    <TableCell>{employee.employee_number}</TableCell>
                                    <TableCell>{employee.emergency_contact_number}</TableCell>
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