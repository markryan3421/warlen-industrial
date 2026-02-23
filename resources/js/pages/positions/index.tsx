import { Head, Link, router } from '@inertiajs/react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { StaticTable } from '@/components/static-table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
// Remove this incorrect import: import positions from '@/routes/positions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Positions',
        href: '/positions',
    },
];

interface Position {
    id: number;
    pos_name: string;
    basic_salary: number;
}

interface Props {
    positions: Position[];
}

export default function Index({ positions }: Props) {
    const deletePosition = (id: number) => {
        if (confirm('Are you sure you want to delete this position?')) {
            router.delete(`/positions/${id}`);
        }
    }

    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />
            <div className="p-4">
                <Link href="/positions/create">
                    <Button>Add Position</Button>
                </Link>
            </div>

            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-left">Position Name</TableHead>
                            <TableHead className="text-left">Basic Salary</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {positions.map((position) => (
                            <TableRow key={position.id}>
                                <TableCell className="text-left font-medium">{position.pos_name}</TableCell>
                                <TableCell className="text-left">
                                    ₱ {Number(position.basic_salary).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link href={`/positions/${position.id}/edit`}>
                                            <Button variant="outline" size="sm">
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button variant="destructive"  size="sm"  onClick={() => deletePosition(position.id)}>
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