import PositionController from '@/actions/App/Http/Controllers/HrRole/HRPositionController';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Briefcase, Search, BriefcaseBusiness } from 'lucide-react';
import { useState, useMemo } from 'react';
import { TableSearchHeader } from '@/components/table-search-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/hr-layout';
import type { BreadcrumbItem } from '@/types';
import { CustomToast } from '@/components/custom-toast';
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table';
import { CustomPagination } from '@/components/custom-pagination';
import { PositionTableConfig } from '@/config/tables/position-table';
import { toast } from '@/components/custom-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Positions',
        href: '/hr/positions',
    },
];

interface Position {
    id: number;
    pos_name: string;
    basic_salary: number;
    pos_slug: string;
    is_salary_fixed: boolean;
}

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface PositionPagination {
    data: Position[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface FilterProps {
    search: string;
    perPage: string;
}

interface IndexProps {
    positions: PositionPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

export default function Index({ positions, filters = { search: '', perPage: '10' }, totalCount, filteredCount }: IndexProps) {
    const { delete: destroy } = useForm();
    const { data, setData } = useForm({
        search: filters?.search || '',
        perPage: filters?.perPage || '10',
    });

    // Transform positions to convert boolean to Yes/No
    const transformedPositions = useMemo(() => {
        return positions.data.map(position => ({
            ...position,
            is_salary_fixed_display: position.is_salary_fixed ? 'Fixed' : 'Not Fixed'
        }));
    }, [positions.data]);

    const filteredPositions = useMemo(() => {
        if (!data.search) {
            return transformedPositions;
        }

        const term = data.search.toLowerCase().trim();
        return transformedPositions.filter(position =>
            position.pos_name.toLowerCase().includes(term)
        );
    }, [transformedPositions, data.search]);

    const handleSearchChange = (value: string) => {
        setData('search', value);

        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        router.get('/hr/positions', queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchReset = () => {
        setData('search', '');
        setData('perPage', '10');

        router.get('/hr/positions', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePerPageChange = (value: string) => {
        setData('perPage', value);

        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
        };

        router.get(PositionController.index.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleEditClick = (position: Position) => {
        router.get(PositionController.edit(position.pos_slug).url);
    }

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (position: Position) => {
        setPositionToDelete(position);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!positionToDelete) return;

        setIsDeleting(true);
        destroy(PositionController.destroy(positionToDelete.pos_slug).url, {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Position deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setPositionToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete position.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    const hasActiveFilters = !!data.search.trim();
    const hasNoPositions = positions.data.length === 0;
    const hasNoFilterResults = hasActiveFilters && filteredPositions.length === 0;

    // Update columns to use the display value for is_salary_fixed
    const updatedColumns = PositionTableConfig.columns.map(col => {
        if (col.key === 'is_salary_fixed') {
            return {
                ...col,
                render: (row: any) => <span>{row.is_salary_fixed_display}</span>
            };
        }
        return col;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />
            <CustomToast />

            <div className="flex flex-col gap-4 p-4">

                {/* Header with title */}
                <div className="flex justify-between items-center">
                    <CustomHeader
                        title="Positions"
                        description="Manage job positions and their corresponding basic salaries."
                        icon={<BriefcaseBusiness />}
                    />
                    <Link href="/hr/positions/create">
                        <Button size="sm">+ Add Position</Button>
                    </Link>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4">
                    {/* Show empty state when no positions exist at all */}
                    {hasNoPositions && !hasActiveFilters ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <Briefcase className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No positions yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Get started by creating your first position. Define job titles and their corresponding basic salaries.
                            </p>
                            <Link href="/hr/positions/create">
                                <Button className="gap-2">
                                    Create Your First Position
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <CustomTable
                                title="Position Lists"
                                columns={updatedColumns}
                                actions={PositionTableConfig.actions}
                                data={filteredPositions}
                                from={positions.from ?? 1}
                                onDelete={handleDeleteClick}
                                onView={() => { }}
                                onEdit={handleEditClick}
                                toolbar={
                                    <TableSearchHeader
                                        searchValue={data.search}
                                        onSearchChange={handleSearchChange}
                                        onSearchReset={handleSearchReset}
                                        searchPlaceholder="Search positions..."
                                    />
                                }
                                emptyState={
                                    hasNoFilterResults ? (
                                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                                <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                                No results found
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                                No positions matching "{data.search}".
                                            </p>
                                            <Button variant="outline" size="sm" onClick={handleSearchReset}>
                                                Clear search
                                            </Button>
                                        </div>
                                    ) : undefined
                                }
                            />

                            <CustomPagination
                                pagination={positions}
                                perPage={data.perPage}
                                onPerPageChange={handlePerPageChange}
                                totalCount={totalCount}
                                filteredCount={filteredCount}
                                search={data.search}
                                resourceName='positions'
                            />

                            {/* Delete Confirmation Dialog */}
                            <DeleteConfirmationDialog
                                isOpen={deleteDialogOpen}
                                onClose={() => {
                                    setDeleteDialogOpen(false);
                                    setPositionToDelete(null);
                                }}
                                onConfirm={confirmDelete}
                                title="Delete Position"
                                itemName={positionToDelete?.pos_name || ''}
                                isLoading={isDeleting}
                                confirmText="Delete Position"
                            />
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}