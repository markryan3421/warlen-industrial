import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import ApplicationLeaveController from "@/actions/App/Http/Controllers/ApplicationLeaveController";
import { useState } from 'react';

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
}

export default function Index({ applicationLeaves }: ApplicationLeaveProps) {
    const { delete: destroy } = useForm();
   

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this application leave?")) {
            destroy(ApplicationLeaveController.destroy(id).url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex justify-end">
                    <Link 
                        href={ApplicationLeaveController.create()} 
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-fit"
                    >
                        Create Application Leave
                    </Link>
                </div>
                
                <Table>
                    <TableCaption>A list of your Application Leaves.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee name</TableHead>
                            <TableHead>Leave Start</TableHead>
                            <TableHead>Leave End</TableHead>
                            <TableHead>Is approved</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applicationLeaves.map((applicationLeave) => (
                            <TableRow key={applicationLeave.id}>
                                <TableCell className="font-medium">{applicationLeave.employee.user.name}</TableCell>
                                <TableCell>{applicationLeave.leave_start}</TableCell>
                                <TableCell>{applicationLeave.leave_end}</TableCell>
                                   <TableCell>{applicationLeave.is_approved ? 'Approved' : 'Not Approved'}</TableCell>
                                <TableCell className="space-x-2">
                                    <Link 
                                        href={ApplicationLeaveController.edit(applicationLeave.id)}
                                        className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                    >
                                        Edit
                                    </Link>
                                    <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => handleDelete(applicationLeave.id)}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

            </div>
        </AppLayout>
    );
}