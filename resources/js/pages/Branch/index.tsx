import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Building2, MapPin } from 'lucide-react';
import { useState } from 'react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";
import { CustomTable } from '@/components/custom-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BranchesTableConfig } from '@/config/tables/branch-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type BranchWithSites } from '@/types';


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

    const handleDelete = (slugOrId: string | number) => {
        if (confirm("Are you sure you want to delete this branch?")) {
            destroy(BranchController.destroy(String(slugOrId)).url, {
                onSuccess: (page) => {
                    const successMessage = page.props.flash?.success || 'Branch deleted successfully.'
                    toast.success(successMessage, {
                        style: {
                            backgroundColor: 'white',
                            color: '#c10000',
                            border: '1px solid #d5d8d5'
                        }
                    });
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete branch.';
                    toast.error(errorMessage, {
                        style: {
                            backgroundColor: 'white',
                            color: '#ff0000'
                        }
                    });
                }
            });
        }
    }

    const editBranch = (branch: Branches) => {
        router.get(BranchController.edit(branch.branch_slug).url);
    }

    const viewBranchSites = (branch: BranchWithSites) => {
        setSelectedBranch(branch);
        setIsModalOpen(true);
    };

    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
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

        // Pass the search query to the backend to filter permissions
        router.get(BranchController.index.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Clears the search bar and resets the list
    const handleReset = () => {
        setData('search', '');
        setData('perPage', '10');

        router.get(BranchController.index.url(), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    // Handle number of permissions to display per page
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);

        // Update the URL with the per page value
        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
        };

        router.get(BranchController.index.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    console.log('branches:', branches);
    console.log('branches.data:', branches?.data);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Branch" />
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

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Left side with title and search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                        <h1 className="text-2xl font-bold whitespace-nowrap"></h1>

                        {/* Search Bar */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input
                                type="text"
                                value={data.search}
                                onChange={handleChange}
                                placeholder='Search branches...'
                                name="search"
                                className='w-full sm:w-80 h-10'
                            />

                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="h-10 px-4 cursor-pointer whitespace-nowrap"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Right side with Add button */}
                    <Link
                        href={BranchController.create()}
                        className="me-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                    >
                        + Add Branch
                    </Link>
                </div>

                {/* Custom Table */}
                <CustomTable
                    columns={BranchesTableConfig.columns}
                    actions={BranchesTableConfig.actions}
                    data={branches.data}
                    from={branches.from}
                    onDelete={handleDelete}
                    onView={viewBranchSites}
                    onEdit={editBranch}
                    title = "Branch"
                />

                <Pagination
                    pagination={branches}
                    perPage={data.perPage}
                    onPerPageChange={handlePerPageChange}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={data.search}
                    resourceName='branche'
                />

                {/* Modal for displaying branch sites */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                        {/* Header with gradient background */}
                        <DialogHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-semibold">
                                        Sites under <span className="text-primary">{selectedBranch?.branch_name || 'Branch'}</span>
                                    </DialogTitle>
                                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                                        Manage and view all sites associated with this branch
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Content area with proper spacing */}
                        <div className="p-6">
                            {selectedBranch?.sites && selectedBranch.sites.length > 0 ? (
                                <>
                                    {/* Header with count */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-muted-foreground">Total Sites:</span>
                                            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                                                {selectedBranch.sites.length}
                                            </span>
                                        </div>

                                        {/* Optional: Add search or filter here if needed */}
                                    </div>

                                    {/* Sites table with better styling */}
                                    <div className="rounded-lg border bg-card overflow-hidden">
                                        <Table>
                                            <TableHeader className=" bg-blue-900 rounded-lg">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-full py-3 font-semibold text-white/90">Site Name</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedBranch.sites.map((site) => (
                                                    <TableRow
                                                        key={site.id}
                                                        className="group hover:bg-muted/50 transition-colors cursor-default"
                                                    >
                                                        <TableCell className="py-3">
                                                            <div className="flex items-center gap-3">
                                                                {/* Icon with dynamic background */}
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                                                    <MapPin className="h-4 w-4 text-primary" />
                                                                </div>

                                                                {/* Site name with subtle hover effect */}
                                                                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                                    {site.site_name}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </>
                            ) : (
                                /* Empty state with improved design */
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="relative mb-6">
                                        {/* Background glow effect */}
                                        <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl" />

                                        {/* Icon container */}
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                                            <MapPin className="h-8 w-8 text-primary/60" />
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        No sites found
                                    </h3>

                                    <p className="text-sm text-muted-foreground max-w-[250px] mb-6">
                                        This branch doesn't have any sites assigned yet. Sites will appear here once added.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer with close button */}
                        <div className="border-t bg-muted/5 p-4 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="min-w-[100px]"
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}