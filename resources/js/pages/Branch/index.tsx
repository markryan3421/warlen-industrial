import { Head, Link, router, useForm } from '@inertiajs/react';
import { Building2, MapPin, Pencil, PlusCircle, X } from 'lucide-react';
import { useState } from 'react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";
import { CustomTable } from '@/components/custom-table';
import { CustomToast, toast } from '@/components/custom-toast';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CustomPagination } from '@/components/custom-pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import SiteRepeater from '@/components/site-repeater';
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

// Create Form Interface
interface CreateFormData {
    branch_name: string;
    branch_address: string;
    sites: Array<{ site_name: string }>;
}

// Edit Form Interface
interface EditFormData {
    branch_name: string;
    branch_address: string;
    sites: Array<{ id?: number; site_name: string }>;
}

export default function Index({ branches, filters, totalCount, filteredCount }: IndexProps) {
    const { delete: destroy } = useForm();
    const [selectedBranch, setSelectedBranch] = useState<BranchWithSites | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branches | null>(null);

    // Create branch form state
    const {
        data: createData,
        setData: setCreateData,
        errors: createErrors,
        processing: createProcessing,
        post: createPost,
        reset: resetCreate
    } = useForm<CreateFormData>({
        branch_name: '',
        branch_address: '',
        sites: [],
    });

    // Edit branch form state
    const {
        data: editData,
        setData: setEditData,
        errors: editErrors,
        processing: editProcessing,
        put: editPut,
        reset: resetEdit
    } = useForm<EditFormData>({
        branch_name: '',
        branch_address: '',
        sites: [],
    });

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

    const handleEditClick = (branch: Branches) => {
        setEditingBranch(branch);
        setEditData({
            branch_name: branch.branch_name,
            branch_address: branch.branch_address,
            sites: branch.sites?.map(site => ({
                id: site.id,
                site_name: site.site_name
            })) || [],
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBranch) return;

        editPut(`/branches/${editingBranch.branch_slug}`, {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Branch updated successfully.'
                toast.success(successMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: '#002dce',
                        border: '1px solid #d5d8d5'
                    }
                });
                setIsEditModalOpen(false);
                setEditingBranch(null);
                resetEdit();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to update branch.';
                toast.error(errorMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: 'red',
                        border: '1px solid #d5d8d5'
                    }
                });
            }
        });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPost(BranchController.store().url, {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Branch created successfully.'
                toast.success(successMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: '#00ca00',
                        border: '1px solid #d5d8d5'
                    }
                });
                setIsCreateModalOpen(false);
                resetCreate();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to create branch.';
                toast.error(errorMessage, {
                    style: {
                        backgroundColor: 'white',
                        color: '#ff0000',
                        border: '1px solid #d5d8d5'
                    }
                });
            }
        });
    };

    const viewBranchSites = (branch: BranchWithSites) => {
        setSelectedBranch(branch);
        setIsViewModalOpen(true);
    };

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

    const handleSearchReset = () => {
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

    const setCreateSites = (sites: Array<{ site_name: string }>) => {
        setCreateData('sites', sites);
    };

    const setEditSites = (sites: Array<{ id?: number; site_name: string }>) => {
        setEditData('sites', sites);
    };

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

                <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* Left side with search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                        {/* Search Bar */}
                        <div className="flex items-center gap-2 lg:w-full sm:w-auto">
                            <Input
                                type="text"
                                value={data.search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder='Search branches...'
                                name="search"
                                className='w-30 sm:w-50 lg:full h-10'
                            />

                            <Button
                                onClick={handleSearchReset} 
                                variant="outline"
                                className="h-10 px-4 mr-4 sm:mr-2 cursor-pointer whitespace-nowrap"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Add Branch Button - Opens Modal */}
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="me-4 inline-flex justify-end lg:items-center lg:justify-center gap-2 cursor-pointer"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add Branch
                    </Button>
                </div>

                <CustomTable
                    columns={BranchesTableConfig.columns}
                    actions={BranchesTableConfig.actions}
                    data={branches.data}
                    from={branches.from}
                    onDelete={handleDelete}
                    onView={viewBranchSites}
                    onEdit={handleEditClick}
                    title="Branch"
                />

                <CustomPagination
                    pagination={branches}
                    perPage={data.perPage}
                    onPerPageChange={handlePerPageChange}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={data.search}
                    resourceName='branch'
                />

                {/* View Sites Modal */}
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
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
                                        View all sites associated with this branch
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-6">
                            {selectedBranch?.sites && selectedBranch.sites.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-muted-foreground">Total Sites:</span>
                                            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                                                {selectedBranch.sites.length}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border bg-card overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-blue-900 rounded-lg">
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
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                                                                    <MapPin className="h-4 w-4 text-primary" />
                                                                </div>
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
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl" />
                                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                                            <MapPin className="h-8 w-8 text-primary/60" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">No sites found</h3>
                                    <p className="text-sm text-muted-foreground max-w-[250px] mb-6">
                                        This branch doesn't have any sites assigned yet.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="border-t bg-muted/5 p-4 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsViewModalOpen(false)}
                                className="min-w-[100px]"
                            >
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Create Branch Modal */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent className="sm:max-w-[800px] w-[95vw] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 border-b sticky top-0 bg-background z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg sm:text-xl font-semibold">
                                            Create New Branch
                                        </DialogTitle>
                                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            Add a new branch and configure its associated sites
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        resetCreate();
                                    }}
                                >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* Branch Information Card */}
                                <Card className="border shadow-sm overflow-hidden h-fit">
                                    <CardHeader className="border-b bg-muted/5 p-3 sm:p-4">
                                        <div className="flex items-center gap-2 sm:gap-3 -mb-5">
                                            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10">
                                                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm sm:text-base">Branch Information</CardTitle>
                                                <CardDescription className="text-xs">
                                                    Enter the basic details of the branch
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-3 sm:p-4">
                                        <div className="space-y-3 sm:space-y-4 -mt-5 pb-3">
                                            <div className="space-y-1 sm:space-y-1.5">
                                                <label className="text-xs font-medium flex items-center gap-1">
                                                    <span className="text-destructive">*</span>
                                                    Branch Name
                                                </label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        type="text"
                                                        value={createData.branch_name}
                                                        onChange={e => setCreateData('branch_name', e.target.value)}
                                                        placeholder="e.g., Main Branch, North Branch"
                                                        className="pl-8 sm:pl-9 h-8 sm:h-9 text-xs sm:text-sm"
                                                    />
                                                </div>
                                                <InputError message={createErrors.branch_name} />
                                            </div>

                                            <div className="space-y-1 sm:space-y-1.5">
                                                <label className="text-xs font-medium flex items-center gap-1">
                                                    <span className="text-destructive">*</span>
                                                    Branch Address
                                                </label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        type="text"
                                                        value={createData.branch_address}
                                                        onChange={e => setCreateData('branch_address', e.target.value)}
                                                        placeholder="Enter complete branch address"
                                                        className="pl-8 sm:pl-9 h-8 sm:h-9 text-xs sm:text-sm"
                                                    />
                                                </div>
                                                <InputError message={createErrors.branch_address} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Branch Sites Card */}
                                <Card className="border shadow-sm overflow-hidden h-full">
                                    <CardHeader className="border-b bg-muted/5 p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 sm:gap-3 -mb-5">
                                                <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm sm:text-base">Branch Sites</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        Add sites under this branch
                                                    </CardDescription>
                                                </div>
                                            </div>

                                            {createData.sites.length > 0 && (
                                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 -mb-4 text-xs font-medium text-primary sm:mt-0 mt-1">
                                                    {createData.sites.length} {createData.sites.length === 1 ? 'Site' : 'Sites'}
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-3 sm:p-4 -mt-6">
                                        <SiteRepeater
                                            sites={createData.sites}
                                            setSites={setCreateSites}
                                            errors={createErrors}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            <DialogFooter className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 border-t pt-3 sm:pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        resetCreate();
                                    }}
                                    className="w-full sm:w-auto min-w-[100px] gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createProcessing}
                                    className="w-full sm:w-auto min-w-[140px] gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                                >
                                    {createProcessing ? (
                                        <>
                                            <span className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Create Branch
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Branch Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-[800px] w-[95vw] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 border-b sticky top-0 bg-background z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
                                        <Pencil className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg sm:text-xl font-semibold">
                                            Edit Branch: <span className="text-primary block sm:inline text-sm sm:text-xl mt-1 sm:mt-0">{editingBranch?.branch_name}</span>
                                        </DialogTitle>
                                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                            Update branch information and manage associated sites
                                        </DialogDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:cursor-pointer"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingBranch(null);
                                        resetEdit();
                                    }}
                                >
                                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="p-4 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* Branch Information Card */}
                                <Card className="border shadow-sm overflow-hidden h-fit">
                                    <CardHeader className="border-b bg-muted/5 p-3 sm:p-4">
                                        <div className="flex items-center gap-2 sm:gap-3 -mb-5">
                                            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10">
                                                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm sm:text-base">Branch Information</CardTitle>
                                                <CardDescription className="text-xs">
                                                    Update the basic details of the branch
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-3 sm:p-4">
                                        <div className="space-y-3 sm:space-y-4 -mt-5 pb-3">
                                            <div className="space-y-1 sm:space-y-1.5">
                                                <label className="text-xs font-medium flex items-center gap-1">
                                                    <span className="text-destructive">*</span>
                                                    Branch Name
                                                </label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        type="text"
                                                        value={editData.branch_name}
                                                        onChange={e => setEditData('branch_name', e.target.value)}
                                                        placeholder="e.g., Main Branch, North Branch"
                                                        className="pl-8 sm:pl-9 h-8 sm:h-9 text-xs sm:text-sm"
                                                    />
                                                </div>
                                                <InputError message={editErrors.branch_name} />
                                            </div>

                                            <div className="space-y-1 sm:space-y-1.5">
                                                <label className="text-xs font-medium flex items-center gap-1">
                                                    <span className="text-destructive">*</span>
                                                    Branch Address
                                                </label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        type="text"
                                                        value={editData.branch_address}
                                                        onChange={e => setEditData('branch_address', e.target.value)}
                                                        placeholder="Enter complete branch address"
                                                        className="pl-8 sm:pl-9 h-8 sm:h-9 text-xs sm:text-sm"
                                                    />
                                                </div>
                                                <InputError message={editErrors.branch_address} />
                                            </div>

                                            {editingBranch && (
                                                <div className="pt-1 text-xs text-muted-foreground border-t -mb-6">
                                                    <span className="font-medium">Branch ID: </span>
                                                    <span className="font-mono">{editingBranch.id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Branch Sites Card */}
                                <Card className="border shadow-sm overflow-hidden h-full">
                                    <CardHeader className="border-b bg-muted/5 p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 sm:gap-3 -mb-5">
                                                <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10">
                                                    <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-sm sm:text-base">Branch Sites</CardTitle>
                                                    <CardDescription className="text-xs">
                                                        Manage sites under this branch
                                                    </CardDescription>
                                                </div>
                                            </div>

                                            {editData.sites.length > 0 && (
                                                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 -mb-4 text-xs font-medium text-primary sm:mt-0 mt-1">
                                                    {editData.sites.length} {editData.sites.length === 1 ? 'Site' : 'Sites'}
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-3 sm:p-4 -mt-6">
                                        <SiteRepeater
                                            sites={editData.sites}
                                            setSites={setEditSites}
                                            errors={editErrors}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            <DialogFooter className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 border-t pt-3 sm:pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingBranch(null);
                                        resetEdit();
                                    }}
                                    className="w-full sm:w-auto min-w-[100px] gap-2 h-8 sm:h-9 text-xs sm:text-sm hover:cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={editProcessing}
                                    className="w-full sm:w-auto min-w-[140px] gap-2 h-8 sm:h-9 text-xs sm:text-sm hover:cursor-pointer"
                                >
                                    {editProcessing ? (
                                        <>
                                            <span className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                            Update Branch
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}