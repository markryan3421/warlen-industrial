import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import PayrollPeriodController from "@/actions/App/Http/Controllers/PayrollPeriodController";
import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, PlusCircle, Clock, CheckCircle2, XCircle, AlertCircle, Filter } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { CustomToast } from '@/components/custom-toast';

// Interface defined inside the component file
interface PayrollPeriod {
    id: number;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: 'open' | 'processing' | 'completed';
    created_at?: string;
    updated_at?: string;
}

interface PayrollPeriodProps {
    payrollPeriods: PayrollPeriod[];
}

interface PageProps {
    payroll_period_enums: Array<{
        value: string;
        label: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Periods',
        href: '/payroll-periods',
    },
];

export default function Index({ payrollPeriods }: PayrollPeriodProps) {
    const { delete: destroy } = useForm();
    const { payroll_period_enums } = usePage<PageProps>().props;
    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Initialize filter from localStorage or use default
    const [statusFilter, setStatusFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('payrollPeriods-statusFilter');
        return savedFilter || 'all';
    });

    // Save filter to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('payrollPeriods-statusFilter', statusFilter);
    }, [statusFilter]);

    // Listen to payroll channel
    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private('payroll');
        
        channel.listen('.payroll.completed', (event: any) => {
            console.log('Payroll event received:', event);
            router.reload({ only: ['payrollPeriods'] });
        });

        return () => {
            channel.stopListening('.payroll.completed');
            window.Echo.leave('payroll');
        };
    }, []);

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this payroll period?")) {
            destroy(PayrollPeriodController.destroy(id).url);
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusIcon = (status: PayrollPeriod['payroll_per_status']) => {
        switch (status) {
            case 'open':
                return <AlertCircle className="h-4 w-4 text-yellow-500" />;
            case 'processing':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'completed':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default:
                return null;
        }
    };

    const getStatusBadge = (status: PayrollPeriod['payroll_per_status']) => {
        const baseClasses = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium";

        switch (status) {
            case 'open':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'processing':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'completed':
                return `${baseClasses} bg-green-100 text-green-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    // Format status text using enum
    const formatStatus = (status: string) => {
        if (!status) return '';
        const found = payroll_period_enums?.find(item => item.value.toLowerCase() === status.toLowerCase());
        return found?.label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    // Filter payroll periods based on selected status
    const filteredPayrollPeriods = useMemo(() => {
        if (statusFilter === 'all') {
            return payrollPeriods;
        }
        return payrollPeriods.filter(period => period.payroll_per_status === statusFilter);
    }, [payrollPeriods, statusFilter]);

    // Get counts for each status
    const statusCounts = useMemo(() => {
        return {
            all: payrollPeriods.length,
            open: payrollPeriods.filter(p => p.payroll_per_status === 'open').length,
            processing: payrollPeriods.filter(p => p.payroll_per_status === 'processing').length,
            completed: payrollPeriods.filter(p => p.payroll_per_status === 'completed').length,
        };
    }, [payrollPeriods]);

    const viewPeriodDetails = (period: PayrollPeriod) => {
        setSelectedPeriod(period);
        setIsModalOpen(true);
    };

    const clearFilter = () => {
        setStatusFilter('all');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Periods" />
            <CustomToast />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Payroll Periods</h1>
                    <Link
                        href={PayrollPeriodController.create()}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        + Create Payroll Period
                    </Link>
                </div>

                {/* Status Filter Section */}
                {payrollPeriods.length > 0 && (
                    <div className="flex justify-end items-center bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {payroll_period_enums?.map(({value, label}) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {payrollPeriods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <CalendarDays className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semib text-gray-900 mb-2">No payroll periods yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Get started by creating your first payroll period. Define the pay period dates and processing status.
                        </p>
                        <Link href={PayrollPeriodController.create()}>
                            <Button className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Create Your First Payroll Period
                            </Button>
                        </Link>
                    </div>
                ) : filteredPayrollPeriods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-gray-50">
                        <Filter className="h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No periods found</h3>
                        <p className="text-gray-500 mb-4">
                            No payroll periods with status "{payroll_period_enums?.find(e => e.value === statusFilter)?.label || statusFilter}" found.
                        </p>
                        <Button variant="outline" onClick={clearFilter}>
                            Clear Filter
                        </Button>
                    </div>
                ) : (
                    <Table>
                        <TableCaption>
                            A list of your Payroll Periods {statusFilter !== 'all' && `- Filtered by: ${payroll_period_enums?.find(e => e.value === statusFilter)?.label || statusFilter}`}
                        </TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Pay Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayrollPeriods.map((period) => (
                                <TableRow key={period.id}>
                                    <TableCell className="font-medium">
                                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                    </TableCell>
                                    <TableCell>{formatDate(period.pay_date)}</TableCell>
                                    <TableCell>
                                        <span className={getStatusBadge(period.payroll_per_status)}>
                                            {getStatusIcon(period.payroll_per_status)}
                                            {formatStatus(period.payroll_per_status)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => viewPeriodDetails(period)}
                                        >
                                            View Details
                                        </Button>
                                        <Link
                                            href={PayrollPeriodController.edit(period.id)}
                                            className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                        >
                                            Edit
                                        </Link>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(period.id)}
                                            disabled={period.payroll_per_status === 'completed' || period.payroll_per_status === 'processing'}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Modal for displaying payroll period details */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                Payroll Period Details
                            </DialogTitle>
                            <DialogDescription>
                                Complete information about this payroll period.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPeriod && (
                            <div className="mt-4 space-y-4">
                                {/* Period Range */}
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-3">Period Range</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Start Date</p>
                                            <p className="font-medium">{formatDate(selectedPeriod.start_date)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">End Date</p>
                                            <p className="font-medium">{formatDate(selectedPeriod.end_date)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Pay Date */}
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Pay Date</h4>
                                    <p className="font-medium">{formatDate(selectedPeriod.pay_date)}</p>
                                </div>

                                {/* Status */}
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={getStatusBadge(selectedPeriod.payroll_per_status)}>
                                            {getStatusIcon(selectedPeriod.payroll_per_status)}
                                            {formatStatus(selectedPeriod.payroll_per_status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Summary Info */}
                                <div className="rounded-lg bg-primary/5 p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Period Summary</h4>
                                    <p className="text-sm text-gray-600">
                                        {selectedPeriod.payroll_per_status === 'completed'
                                            ? 'This payroll period has been completed and processed.'
                                            : selectedPeriod.payroll_per_status === 'processing'
                                                ? 'This payroll period is currently being processed.'
                                                : 'This payroll period is open and pending processing.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}