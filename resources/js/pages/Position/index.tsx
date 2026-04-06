import { Head, Link, router, useForm, } from '@inertiajs/react';
import { DropdownMenuContent, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { CirclePlusIcon, Eye, MoreHorizontalIcon, Pencil, Trash } from 'lucide-react';
// import { useRoute } from 'ziggy-js';
import PositionController from "@/actions/App/Http/Controllers/PositionController";
// import { Button } from "@/components/ui/button"
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Position } from '@/types';
import { CustomTable } from '@/components/custom-table';
import { PositionTableConfig } from '@/config/tables/position-table';
import BranchController from '@/actions/App/Http/Controllers/BranchController';
import { useState } from 'react';
import { toast } from '@/components/custom-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Positions',
        href: '/positions',
    },
];

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface PositionPagination {
    data: Position[];
    links: LinkProps[]; // Array of pagination link objects
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

export default function Index({ positions, filters, totalCount, filteredCount }: IndexProps) {
    const { delete: destroy } = useForm();

    // Search form state management using Inertia's useForm hook
    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '20',
    });

    // Handle search input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);

        // Update the URL with the search query value
        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        // Pass the search query to the backend to filter products
        router.get(PositionController.index().url, queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Clears the search bar and resets the position list
    const handleReset = () => {
        setData('search', '');
        setData('perPage', '20');

        router.get(PositionController.index().url), {}, {
            preserveState: true,
            preserveScroll: true,
        };
    }

    // Handle number of products to display per page
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);

        // Update the URL with the per page value
        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
        };

        router.get(PositionController.index().url, queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    const handleEditClick = (position: Position) => {
        router.get(PositionController.edit(position.id.toString()).url);
    }

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Updated delete handler to open confirmation dialog
    const handleDeleteClick = (position: Position) => {
        setPositionToDelete(position);
        setDeleteDialogOpen(true);
    };

    // Actual delete execution
    const confirmDelete = () => {
        if (!positionToDelete) return;
        
        setIsDeleting(true);
        destroy(PositionController.destroy(positionToDelete.id.toString()).url, {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Position deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setPositionToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete branch.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Positions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className='mx-2'>
                    <div className="flex items-center justify-between gap-4 w-full mb-3">
                        {/* Search Bar */}
                        <Input
                            type="text"
                            value={data.search}
                            onChange={handleChange}
                            placeholder='Search position...'
                            name="search"
                            className='max-w-sm h-10 w-1/3'
                        />

                        <Button onClick={handleReset} className="h-5 w-5 p-5 text-sm cursor-pointer bg-gray-500 hover:bg-gray-400">
                            clear
                        </Button>

                        <div className='ml-auto'>
                            <Link
                                as='button'
                                className='bg-primary hover:bg-primary/90 text-white flex cursor-pointer py-3 px-4 inline-flex align-items-end gap-x-2 text-sm font-medium rounded-lg border border-transparent'
                                href={PositionController.create()}
                            >
                                <CirclePlusIcon />
                                Create Positions
                            </Link>
                        </div>
                    </div>
                    <CustomTable 
                        title="Position Lists"
                        columns={PositionTableConfig.columns}
                        actions={PositionTableConfig.actions}
                        data={positions.data}
                        from={positions.from ?? 1}
                        onDelete={handleDeleteClick}
                        onView={() => {}}
                        onEdit={handleEditClick}
                    />
                </div>
                <Pagination
                    pagination={positions}
                    perPage={data.perPage}
                    onPerPageChange={handlePerPageChange}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={data.search}
                    resourceName='position'
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
                    itemName={positionToDelete?.id.toString() || ''}
                    isLoading={isDeleting}
                    confirmText="Delete Position"
                />
            </div>
        </AppLayout>
    );
}