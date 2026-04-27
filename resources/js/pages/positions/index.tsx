import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Briefcase, Search, BriefcaseBusiness } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { TableSearchHeader } from '@/components/table-search-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CustomToast } from '@/components/custom-toast';
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table';
import { CustomPagination } from '@/components/custom-pagination';
import { PositionTableConfig } from '@/config/tables/position-table';
import PositionController from '@/actions/App/Http/Controllers/PositionController';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

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

// Custom toast style helper for sonner
const toastStyle = (color: string) => ({
    style: {
        backgroundColor: 'white',
        color: color,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
});

export default function Index({ positions, filters = { search: '', perPage: '10' }, totalCount, filteredCount }: IndexProps) {
    const { delete: destroy } = useForm();
    const { props } = usePage<{ flash?: { success?: string; error?: string; warning?: string; info?: string } }>();
    
    const { data, setData } = useForm({
        search: filters?.search || '',
        perPage: filters?.perPage || '10',
    });

    // Track last shown flash to prevent duplicates within a short time window
    const lastFlashRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

    // Flash message listener – prevents duplicate toasts within 500ms
    useEffect(() => {
        const flash = props.flash;
        if (!flash) return;

        const flashKey = JSON.stringify(flash);
        const now = Date.now();
        const last = lastFlashRef.current;

        // If same flash key appeared within last 500ms, skip (prevents double toast)
        if (last.key === flashKey && (now - last.time) < 500) {
            return;
        }

        // Update ref
        lastFlashRef.current = { key: flashKey, time: now };

        if (flash.success) {
            toast.success(flash.success, toastStyle('#16a34a')); // green text
        }
        if (flash.error) {
            toast.error(flash.error, toastStyle('#dc2626')); // red text
        }
        if (flash.warning) {
            toast.warning(flash.warning, toastStyle('#f97316')); // orange text
        }
        if (flash.info) {
            toast.info(flash.info, toastStyle('#3b82f6')); // blue text
        }
    }, [props.flash]);

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
            onSuccess: () => {
                // Flash message will be shown by global useEffect
                setDeleteDialogOpen(false);
                setPositionToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete position.';
                toast.error(errorMessage, toastStyle('#dc2626'));
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    const hasActiveFilters = !!data.search.trim();
    const hasNoPositions = positions.data.length === 0;
    const hasNoFilterResults = hasActiveFilters && filteredPositions.length === 0;

    // Update the columns configuration to use the display value
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
            {/* <CustomToast /> */}

            <div className="flex flex-col gap-4 p-4 min-h-[calc(85vh-48px)] mx-4">
                
                {/* Header with title */}
                <div className="flex justify-between items-center">
                    <CustomHeader 
                        title="Positions"
                        description="Manage job positions and their corresponding basic salaries."
                        icon={<BriefcaseBusiness />}
                    />
                    <Link href="/positions/create">
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
                            <Link href="/positions/create">
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
                                onView={() => {}}
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