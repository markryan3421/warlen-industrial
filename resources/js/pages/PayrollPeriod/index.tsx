import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import PayrollPeriodController from "@/actions/App/Http/Controllers/PayrollPeriodController";
import { useState } from 'react';
import { CalendarDays, PlusCircle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Periods',
        href: '/payroll-periods',
    },
];

export default function Index({ payrollPeriods }: PayrollPeriodProps) {
    const { delete: destroy } = useForm();
    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
   
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
        switch(status) {
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
        
        switch(status) {
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

    const viewPeriodDetails = (period: PayrollPeriod) => {
        setSelectedPeriod(period);
        setIsModalOpen(true);
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
                ) : (
                    <Table>
                        <TableCaption>A list of your Payroll Periods.</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Pay Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payrollPeriods.map((period) => (
                                <TableRow key={period.id}>
                                    <TableCell className="font-medium">
                                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                    </TableCell>
                                    <TableCell>{formatDate(period.start_date)}</TableCell>
                                    <TableCell>{formatDate(period.end_date)}</TableCell>
                                    <TableCell>{formatDate(period.pay_date)}</TableCell>
                                    <TableCell>
                                        <span className={getStatusBadge(period.payroll_per_status)}>
                                            {getStatusIcon(period.payroll_per_status)}
                                            {period.payroll_per_status.charAt(0).toUpperCase() + period.payroll_per_status.slice(1)}
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
                                            {selectedPeriod.payroll_per_status.charAt(0).toUpperCase() + selectedPeriod.payroll_per_status.slice(1)}
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