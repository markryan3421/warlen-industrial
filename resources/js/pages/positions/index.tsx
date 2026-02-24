import { Head, Link, router } from '@inertiajs/react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Briefcase, PlusCircle } from 'lucide-react';

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
    pos_slug: string;
}

interface Props {
    positions: Position[];
}

export default function Index({ positions }: Props) {
    const deletePosition = (slug: string) => {
        if (confirm('Are you sure you want to delete this position?')) {
            router.delete(`/positions/${slug}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />
            <div className="flex justify-between items-center p-4">
                <h1 className="text-2xl font-bold">Positions</h1>
                <Link href="/positions/create">
                    <Button size="sm">+ Add Position</Button>
                </Link>
            </div>

            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4">
                {positions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Briefcase className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semib text-gray-900 mb-2">No positions yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Get started by creating your first position. Define job titles and their corresponding basic salaries.
                        </p>
                        <Link href="/positions/create">
                            <Button className="gap-2">
                                Create Your First Position
                            </Button>
                        </Link>
                    </div>
                ) : (
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
                                            <Link href={`/positions/${position.pos_slug}/edit`}>
                                                <Button variant="outline" size="sm">
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Button variant="destructive" size="sm" onClick={() => deletePosition(position.pos_slug)}>
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </AppLayout>
    );
}