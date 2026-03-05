// resources/js/Pages/incentives/index.tsx
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Briefcase, Eye, Pencil, Trash2, Filter, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Incentives',
        href: '/incentives',
    },
];

interface PayrollPeriod {
    id: number;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: string;
}

interface Employee {
    id: number;
    user?: {
        name: string;
        email: string;
    };
    position?: {
        pos_name: string;
    }
    branch?: {
        branch_name: string;
    }
    employee_status?: string;
    hire_date?: string;
}

interface Incentive {
    id: number;
    payroll_period_id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period?: PayrollPeriod;
    employees?: Employee[];
}

interface Props {
    incentives: Incentive[];
    filters?: {
        payroll_period_id?: string;
    };
}

export default function Index({ incentives, filters = {} }: Props) {
    const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<string>(filters.payroll_period_id || 'all');

    // Get unique payroll periods for filter dropdown
    const payrollPeriods = incentives
        .map(incentive => incentive.payroll_period)
        .filter((period, index, self) =>
            period && self.findIndex(p => p?.id === period.id) === index
        )
        .sort((a, b) => new Date(b?.start_date || '').getTime() - new Date(a?.start_date || '').getTime());

    // Filter incentives based on selected payroll period
    const filteredIncentives = selectedPeriod === 'all'
        ? incentives
        : incentives.filter(incentive => incentive.payroll_period_id === parseInt(selectedPeriod));

    const deleteIncentive = (id: number) => {
        if (confirm('Are you sure you want to delete this incentive?')) {
            router.delete(`/incentives/${id}`);
        }
    }

    const handleFilterChange = (value: string) => {
        setSelectedPeriod(value);

        // Update URL with filter parameter
        router.get(
            '/incentives',
            { payroll_period_id: value === 'all' ? undefined : value },
            { preserveState: true, replace: true }
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(numAmount);
    };

    const viewIncentiveDetails = (incentive: Incentive) => {
        setSelectedIncentive(incentive);
        setIsModalOpen(true);
    };

    // Get the selected period display tex

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incentives" />
            <div className="flex flex-col gap-6 py-6 px-4 md:px-6 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Incentives</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and track employee incentives across different payroll periods
                        </p>
                    </div>
                    <Link href="/incentives/create">
                        <Button size="default" className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            Add Incentive
                        </Button>
                    </Link>
                </div>

                {incentives.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-primary/10 p-6 mb-4">
                                <Briefcase className="h-12 w-12 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No incentives yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Get started by creating your first incentive. Define incentives and their corresponding amounts for payroll periods.
                            </p>
                            <Link href="/incentives/create">
                                <Button className="gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Create Your First Incentive
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <CardTitle>Incentive List</CardTitle>

                                {/* Filter inside the card header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-full sm:w-auto">
                                        <Select value={selectedPeriod} onValueChange={handleFilterChange}>
                                            <SelectTrigger className="w-full bg-background h-9">
                                                <div className="flex items-center gap-2 truncate">
                                                    <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <SelectValue placeholder="Filter by period" className="truncate" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="min-w-[300px] max-w-[500px]">
                                                <SelectItem value="all">All Payroll Periods</SelectItem>
                                                {payrollPeriods.map((period) => period && (
                                                    <SelectItem key={period.id} value={period.id.toString()} className="truncate">
                                                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>


                        </CardHeader>

                        <CardContent className="p-0">
                            {filteredIncentives.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="rounded-full bg-muted p-6 mb-4">
                                        <Filter className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No incentives found</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm">
                                        No incentives match the selected payroll period filter.
                                    </p>

                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead className="w-[250px]">Incentive Name</TableHead>
                                                <TableHead className="w-[150px]">Amount</TableHead>
                                                <TableHead className="min-w-[300px]">Payroll Period</TableHead>
                                                <TableHead className="w-[100px] text-center">Employees</TableHead>
                                                <TableHead className="w-[200px] text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredIncentives.map((incentive) => (
                                                <TableRow key={incentive.id} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium">
                                                        {incentive.incentive_name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-mono">
                                                            {formatCurrency(incentive.incentive_amount)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {incentive.payroll_period ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm">
                                                                    {formatDate(incentive.payroll_period.start_date)} - {formatDate(incentive.payroll_period.end_date)}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    Pay date: {formatDate(incentive.payroll_period.pay_date)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">
                                                            {incentive.employees?.length || 0}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => viewIncentiveDetails(incentive)}
                                                                className="hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                <span className="sr-only">View</span>
                                                            </Button>
                                                            <Link href={`/incentives/${incentive.id}/edit`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                    <span className="sr-only">Edit</span>
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => deleteIncentive(incentive.id)}
                                                                className="hover:bg-destructive/10 hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                <span className="sr-only">Delete</span>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{selectedIncentive?.incentive_name}</DialogTitle>
                            <DialogDescription>
                                {selectedIncentive && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="font-mono text-base">
                                            {formatCurrency(selectedIncentive.incentive_amount)}
                                        </Badge>
                                        {selectedIncentive.payroll_period && (
                                            <span className="text-sm text-muted-foreground">
                                                • {formatDate(selectedIncentive.payroll_period.start_date)} - {formatDate(selectedIncentive.payroll_period.end_date)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedIncentive && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium mb-3">Assigned Employees</h3>

                                {selectedIncentive.employees && selectedIncentive.employees.length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>Employee Name</TableHead>
                                                    <TableHead>Position</TableHead>
                                                    <TableHead>Branch</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedIncentive.employees.map((employee) => (
                                                    <TableRow key={employee.id}>
                                                        <TableCell className="font-medium">
                                                            {employee.user?.name || `Employee #${employee.id}`}
                                                        </TableCell>
                                                        <TableCell>{employee.position?.pos_name || '—'}</TableCell>
                                                        <TableCell>{employee.branch?.branch_name || '—'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground border rounded-md">
                                        No employees assigned to this incentive
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}