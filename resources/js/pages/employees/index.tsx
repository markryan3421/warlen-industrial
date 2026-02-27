import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
<<<<<<< HEAD
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomPieChart } from '@/components/custom-pie-chart';
import { ChartAreaInteractive } from '@/components/section-chart';
=======
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
>>>>>>> d9c70fa (added design for dashboard, run oayroll and login pages)
import AppLayout from '@/layouts/app-layout';
import { useState, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import EmmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
<<<<<<< HEAD
import { Tab } from '@headlessui/react';
import { Users, PlusCircle } from 'lucide-react';
=======
import { MoreHorizontalIcon, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import PageHeader from '@/components/page-header';
>>>>>>> d9c70fa (added design for dashboard, run oayroll and login pages)

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
            <PageHeader />
            <div className="@container/main flex flex-1 flex-col gap-2">
<<<<<<< HEAD
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
=======
                <div className="flex justify-between items-center p-4 px-10">
                    <div className="flex gap-2 flex-wrap">
                        <Combobox>
                        <ComboboxInput placeholder="All Departments" onChange={(e) => setFilters({...filters, department: e.target.value})}/>
                        <ComboboxContent>
                            <ComboboxList>
                            {departments.length === 0 ? (
                                <ComboboxEmpty>No departments found</ComboboxEmpty>
                            ) : (
                                departments.map(d => <ComboboxItem key={d} value={d}>{d}</ComboboxItem>)
                            )}
                            </ComboboxList>
                        </ComboboxContent>
                        </Combobox> 
                        <select     
                            className="border rounded px-3 py-1"
                            value={filters.department}
                            onChange={(e) => setFilters({...filters, department: e.target.value})}
                        >
                            <option value="">All Departments</option>
                            
                        </select>

                        <select 
                            className="border rounded px-3 py-1"
                            value={filters.position}
                            onChange={(e) => setFilters({...filters, position: e.target.value})}
                        >
                            <option value="">All Positions</option>
                            {positions.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        
                        <select 
                            className="border rounded px-3 py-1"
                            value={filters.branch}
                            onChange={(e) => setFilters({...filters, branch: e.target.value, site: ''})}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>

                        {filters.branch && sites.length > 0 && (
                            <select 
                                className="border rounded px-3 py-1"
                                value={filters.site}
                                onChange={(e) => setFilters({...filters, site: e.target.value})}
                            >
                                <option value="">All Sites</option>
                                {sites.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setFilters({department: '', position: '', branch: '', site: ''})}
                        >
                            Clear
                        </Button>
                    </div>

>>>>>>> d9c70fa (added design for dashboard, run oayroll and login pages)
                    <Link href="/employees/create">
                        <Button size="sm"><Plus/> Create Employee</Button>
                    </Link>
                </div>
<<<<<<< HEAD

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
=======
                
                <div className="flex flex-col gap-4 overflow-hidden rounded-lg border-1 mx-10 border-gray-200">
                    <Table>
                        <TableHeader className='bg-gray-50'>
                            <TableRow>
                                <TableHead>Emp ID</TableHead>
                                <TableHead>Employee Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Employee Number</TableHead>
                                <TableHead>Emergency Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmployees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>EMP-{employee.id}</TableCell>
                                    <TableCell>{employee.user.name}</TableCell>
                                    <TableCell>{employee.position.pos_name}</TableCell>
                                    <TableCell>{employee.department}</TableCell>
                                    <TableCell>
                                        {employee.branch.branch_name}

                                    </TableCell>
                                    
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
                                        <div className="flex justify-center">
                                            <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                <MoreHorizontalIcon />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>                                               
                                                <DropdownMenuItem>
                                                    <Link href={EmmployeeController.edit(employee.id)}>
                                                    Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Link onClick = {() => handleDelete(employee.id)} className="text-red-600">
                                                    Delete
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className='py-3 flex justify-between border-t-1 -mt-4'>
                        <div>
                            <span className='ml-3 text-xs'>Showing {filteredEmployees.length} of {employees.length}</span>
                        </div>
                        <div>
                        <Pagination className='mr-3'>
                            <PaginationContent>
                                <PaginationItem>
                                <PaginationPrevious href="#" />
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationLink href="#">1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationLink href="#" isActive>
                                    2
                                </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationLink href="#">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationEllipsis />
                                </PaginationItem>
                                <PaginationItem>
                                <PaginationNext href="#" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                        </div>
                    </div>
>>>>>>> d9c70fa (added design for dashboard, run oayroll and login pages)
                </div>
            </div>
        </AppLayout>
    );
}