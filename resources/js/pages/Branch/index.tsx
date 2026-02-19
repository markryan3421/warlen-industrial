
import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button"
import { type BreadcrumbItem, type Branch} from '@/types';
import { Head, Link, useForm, } from '@inertiajs/react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: '/branches',
    },
];

interface BranchProps {
    branches: Branch[];
}

export default function index({ branches }: BranchProps) {
    const { delete: destroy } = useForm();
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this branch?")) {
            destroy(BranchController.destroy(id).url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link href={BranchController.create()}>Create Branch </Link>
                <Table>
                    <TableCaption>A list of your Branch.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Branch Name</TableHead>
                            <TableHead>Branch Address</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell>{branch.branch_name}</TableCell>
                                <TableCell>{branch.branch_address}</TableCell>
                                <TableCell>
                                    <Link href={BranchController.edit(branch.id)}>Edit Branch</Link>
                                    <Button variant="destructive" onClick={() => handleDelete(branch.id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}
