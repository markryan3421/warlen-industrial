import { Head, Link, router, useForm } from '@inertiajs/react';
import { Briefcase, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { TableSearchHeader } from '@/components/table-search-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

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
    is_salary_fixed: boolean;
}

interface Props {
    positions: Position[];
    filters?: {  // Make filters optional with ?
        search: string;
        perPage: string;
    };
}

export default function Index({ positions, filters = { search: '', perPage: '10' } }: Props) {
    const { data, setData } = useForm({
        search: filters?.search || '',
        perPage: filters?.perPage || '10',
    });

    const filteredPositions = useMemo(() => {
        if (!data.search) {
            return positions;
        }

        const term = data.search.toLowerCase().trim();
        return positions.filter(position =>
            position.pos_name.toLowerCase().includes(term)
        );
    }, [positions, data.search]);

    const handleSearchChange = (value: string) => {
        setData('search', value);

        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        router.get('/positions', queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchReset = () => {
        setData('search', '');
        setData('perPage', '10');

        router.get('/positions', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const deletePosition = (slug: string) => {
        if (confirm('Are you sure you want to delete this position?')) {
            router.delete(`/positions/${slug}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />

            <div className="flex flex-col gap-4 p-4">
                {/* Header with title and actions */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Positions</h1>
                </div>

                {/* Search Header */}
                <div className="flex justify-between items-center">
                    <TableSearchHeader
                        searchValue={data.search}
                        onSearchChange={handleSearchChange}
                        onSearchReset={handleSearchReset}
                        searchPlaceholder="Search positions..."
                    />
                    <Link href="/positions/create">
                        <Button size="sm">+ Add Position</Button>
                    </Link>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4">
                    {positions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <Briefcase className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Get started by creating your first position. Define job titles and their corresponding basic salaries.
                            </p>
                            <Link href="/positions/create">
                                <Button className="gap-2">
                                    Create Your First Position
                                </Button>
                            </Link>
                        </div>
                    ) : filteredPositions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-gray-50">
                            <Search className="h-12 w-12 text-gray-400 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
                            <p className="text-gray-500 mb-4">
                                No positions matching "{data.search}" found.
                            </p>
                            <Button variant="outline" onClick={handleSearchReset}>
                                Clear Search
                            </Button>
                        </div>
                    ) : (
                        <>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-left">Position Name</TableHead>
                                        <TableHead className="text-left">Basic Salary</TableHead>
                                        <TableHead className='text-let'>Is salary Fixed?</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPositions.map((position) => (
                                        <TableRow key={position.id}>
                                            <TableCell className="text-left font-medium">
                                                {position.pos_name}
                                            </TableCell>
                                            <TableCell className="text-left">
                                                ₱ {Number(position.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-left">
                                                {position.is_salary_fixed ? 'Yes' : 'No'}
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
                        </>
                    )}
                    <div className="text-sm text-gray-500">
                        Showing {filteredPositions.length} {filteredPositions.length === 1 ? 'entry' : 'entries'}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}