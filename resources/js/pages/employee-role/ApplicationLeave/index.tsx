import AppLayout from '@/layouts/emp-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLeaveController from '@/actions/App/Http/Controllers/EmployeeRole/ApplicationLeaveController';
import { useState, useEffect } from 'react';
import { CalendarDays, PlusCircle } from 'lucide-react';

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Application Leaves',
        href: '/application-leaves',
    },
];

interface ApplicationLeaveProps {
    applicationLeaves: any[];
    approvedCount?: number;
}

export default function Index({ applicationLeaves, approvedCount = 0 }: ApplicationLeaveProps) {
    const hasReachedLimit = approvedCount >= 5;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Leaves" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Application Leaves</h1>
                    {!hasReachedLimit && (
                        <Link href={ApplicationLeaveController.create()}>
                            <Button size="sm">+ Create Application Leave</Button>
                        </Link>
                    )}
                </div>

                {hasReachedLimit && (
                    <div className="mx-4 mb-2">
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
                            <p className="text-sm">
                                You have reached the maximum limit of 5 approved leaves for this year. 
                                You cannot create new leave applications until next year.
                            </p>
                        </div>
                    </div>
                )}

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
                            {!hasReachedLimit ? (
                                <Link href={ApplicationLeaveController.create()}>
                                    <Button className="gap-2">
                                        Create Your First Leave Application
                                    </Button>
                                </Link>
                            ) : (
                                <div className="text-yellow-600 bg-yellow-50 px-4 py-3 rounded-md max-w-md">
                                    <p className="text-sm font-medium">Cannot create new leave applications</p>
                                    <p className="text-xs mt-1">You have reached the maximum limit of 5 approved leaves for this year.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableCaption>A list of your Application Leaves.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    {/* <TableHead>Employee name</TableHead> */}
                                    <TableHead>Leave Start</TableHead>
                                    <TableHead>Leave End</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Approved or Rejected By</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applicationLeaves.map((applicationLeave) => (
                                    <TableRow key={applicationLeave.id}>
                                        {/* <TableCell className="font-medium">{applicationLeave.employee.user.name}</TableCell> */}
                                        <TableCell>{applicationLeave.leave_start}</TableCell>
                                        <TableCell>{applicationLeave.leave_end}</TableCell>
                                       <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                applicationLeave.app_status === 'approved' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : applicationLeave.app_status === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {applicationLeave.app_status ? 
                                                    applicationLeave.app_status.charAt(0).toUpperCase() + applicationLeave.app_status.slice(1) 
                                                    : 'Pending'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {applicationLeave.app_status === 'approved' && applicationLeave.approved_by ? (
                                                <span className="text-green-600">Approved by {applicationLeave.approved_by}</span>
                                            ) : applicationLeave.app_status === 'rejected' && applicationLeave.rejected_by ? (
                                                <span className="text-red-600">Rejected by {applicationLeave.rejected_by}</span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="space-x-2">
                                            <Link 
                                                href={ApplicationLeaveController.edit(applicationLeave.slug_app)}
                                                className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                            >
                                                Edit
                                            </Link>
                            
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