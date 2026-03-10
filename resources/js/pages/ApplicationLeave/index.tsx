import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLeaveController from "@/actions/App/Http/Controllers/ApplicationLeaveController";
import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, PlusCircle, Filter, X } from 'lucide-react';

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Application Leaves',
        href: '/application-leaves',
    },
];

interface ApplicationLeaveProps {
    applicationLeaves: any[];
}

export default function Index({ applicationLeaves }: ApplicationLeaveProps) {
    const { delete: destroy } = useForm();
    
    // Initialize filter from localStorage or use default
    const [statusFilter, setStatusFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('applicationLeaves-statusFilter');
        return savedFilter || 'all';
    });
   
    // Save filter to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('applicationLeaves-statusFilter', statusFilter);
    }, [statusFilter]);

    const handleDelete = (slug_app: string) => {
        if (confirm("Are you sure you want to delete this application leave?")) {
            destroy(ApplicationLeaveController.destroy(slug_app).url);
        }
    }

    // Filter application leaves based on status
    const filteredLeaves = useMemo(() => {
        if (statusFilter === 'all') {
            return applicationLeaves;
        }
        return applicationLeaves.filter(leave => {
            const status = leave.app_status || 'pending';
            return status.toLowerCase() === statusFilter.toLowerCase();
        });
    }, [applicationLeaves, statusFilter]);

    // Get status badge color
    const getStatusBadgeClass = (status: string) => {
        const statusLower = status?.toLowerCase() || 'pending';
        switch (statusLower) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    // Format status text
    const formatStatus = (status: string) => {
        if (!status) return 'Pending';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Leaves" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Application Leaves</h1>
                    <Link href={ApplicationLeaveController.create()}>
                        <Button size="sm">+ Create Application Leave</Button>
                    </Link>
                </div>

                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    {applicationLeaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <CalendarDays className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semib text-gray-900 mb-2">No application leaves yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Get started by creating your first leave application. You can manage employee leaves, track approvals, and monitor leave balances.
                            </p>
                            <Link href={ApplicationLeaveController.create()}>
                                <Button className="gap-2">
                                    Create Your First Leave Application
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Filter Section - Right aligned */}
                            <div className="flex justify-end px-4">
                                <div className="flex items-center gap-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Filter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Table>
                                <TableCaption>A list of your Application Leaves.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employee name</TableHead>
                                        <TableHead>Leave Start</TableHead>
                                        <TableHead>Leave End</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeaves.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                                No leaves found with the selected filter.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredLeaves.map((applicationLeave) => (
                                            <TableRow key={applicationLeave.id}>
                                                <TableCell className="font-medium">{applicationLeave.employee?.user?.name || 'N/A'}</TableCell>
                                                <TableCell>{applicationLeave.leave_start}</TableCell>
                                                <TableCell>{applicationLeave.leave_end}</TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(applicationLeave.app_status)}`}>
                                                        {formatStatus(applicationLeave.app_status)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="space-x-2">
                                                    <Link 
                                                        href={ApplicationLeaveController.edit(applicationLeave.slug_app)}
                                                        className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="sm"
                                                        onClick={() => handleDelete(applicationLeave.slug_app)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}