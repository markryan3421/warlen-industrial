// pages/branches/index.tsx
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Building2, Search } from 'lucide-react';
import { useState } from 'react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";
import { CustomTable } from '@/components/custom-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Pagination } from '@/components/ui/pagination';
import { BranchesTableConfig } from '@/config/tables/branch-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { SitesModal } from '@/components/sites-modal';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: '/branches',
    },
];

interface Branches {
    id: number;
    branch_name: string;
    branch_slug: string;
    branch_address: string;
    sites?: {
        id: number;
        site_name: string;
    }[];
}

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface BranchesPagination {
    data: Branches[];
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
    branches: BranchesPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

export default function Index({ branches, filters, totalCount, filteredCount }: IndexProps) {
    const { delete: destroy } = useForm();
    const [selectedBranch, setSelectedBranch] = useState<BranchWithSites | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    const handleSearchChange = (value: string) => {
        setData('search', value);

        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        router.get(BranchController.index.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleClearAll = () => {
        setData('search', '');
        setData('perPage', '10');

        router.get(BranchController.index.url(), {}, {
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

        router.get(BranchController.index.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (slugOrId: string | number) => {
        if (confirm("Are you sure you want to delete this branch?")) {
            destroy(BranchController.destroy(String(slugOrId)).url, {
                onSuccess: (page) => {
                    const successMessage = (page.props as any).flash?.success || 'Branch deleted successfully.';
                    toast.success(successMessage);
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete branch.';
                    toast.error(errorMessage);
                }
            });
        }
    };

    const editBranch = (branch: Branches) => {
        router.get(BranchController.edit(branch.branch_slug).url);
    };

    const viewBranchSites = (branch: BranchWithSites) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    const hasActiveFilters = !!data.search.trim();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branches" />
            <CustomToast />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Page Header */}
                <div className="flex items-center gap-4 ms-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Branch Module</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and organize your branches effectively
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Link
                        href={BranchController.create()}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                    >
                        + Add Branch
                    </Link>
                </div>

                <CustomTable
                    columns={BranchesTableConfig.columns}
                    actions={BranchesTableConfig.actions}
                    data={branches.data}
                    from={branches.from}
                    onDelete={handleDelete}
                    onView={viewBranchSites}
                    onEdit={editBranch}
                    title="Branches"
                    toolbar={
                        <EmployeeFilterBar
                            filters={{
                                search: true,
                                position: false,
                                branch: false,
                                site: false,
                                date: false,
                                status: false,
                            }}
                            searchTerm={data.search}
                            onSearchChange={handleSearchChange}
                            onClearAll={hasActiveFilters ? handleClearAll : undefined}
                            searchPlaceholder="Search by branch name or address..."
                        />
                    }
                    filterEmptyState={
                        hasActiveFilters && branches.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                    No results found
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                    No branches matching "{data.search}".
                                </p>
                                <Button variant="outline" size="sm" onClick={handleClearAll}>
                                    Clear search
                                </Button>
                            </div>
                        ) : undefined
                    }
                />

                {/* Pagination */}
                <Pagination
                    pagination={branches}
                    perPage={data.perPage}
                    onPerPageChange={handlePerPageChange}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={data.search}
                    resourceName='branches'
                />

                {/* Sites Modal */}
                <SitesModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    branch={selectedBranch}
                />
            </div>
        </AppLayout>
    );
}