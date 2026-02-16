import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button"
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, } from '@inertiajs/react';
import PositionController from "@/actions/App/Http/Controllers/PositionController";

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
        title: 'Positions',
        href: '/positions',
    },
];

export default function index({ positions }: any) {
    const { delete: destroy } = useForm();
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this branch?")) {
           // destroy(BranchController.destroy(id));
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Link href={PositionController.create()}>Create Positions</Link>
                <Table>
                    <TableCaption>A list of your Positions.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Position Name</TableHead>
                            <TableHead>Salary Rate</TableHead>
                            <TableHead>Regular OT Rate</TableHead>
                            <TableHead>Special OT Rate</TableHead>
                            <TableHead>SSS Rate</TableHead>
                            <TableHead>PhilHealth Rate</TableHead>
                            <TableHead>Pag-IBIG Rate</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {positions.map((pos) => (
                            <TableRow key={pos.id}>
                                <TableCell>{pos.pos_name}</TableCell>
                                <TableCell>₱{pos.deduction?.salary_rate || '0.00'}</TableCell>
                                <TableCell>{pos.deduction?.reg_overtime_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.special_overtime_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.sss_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.philhealth_rate || '0.00'}%</TableCell>
                                <TableCell>{pos.deduction?.pagibig_rate || '0.00'}%</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Link 
                                            href={PositionController.edit(pos.id)} 
                                            className="text-blue-600 hover:underline"
                                        >
                                            Edit
                                        </Link>
                                        <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => handleDelete(pos.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AppLayout>
    );
}