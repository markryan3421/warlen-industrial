import { Head, Link, router, useForm } from '@inertiajs/react';
import { format, isToday } from 'date-fns';
import { Calculator, Percent, Plus, Trash2, LoaderCircle, Filter, Handshake } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

import { CustomHeader } from '@/components/custom-header';
import { CustomModalView } from '@/components/custom-modal-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { CustomToast, toast } from '@/components/custom-toast';
import InputError from '@/components/input-error';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ContributionModalConfig } from '@/config/forms/contribution-modal-view';
import { ContributionTableConfig } from '@/config/tables/contribution-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

// Helper function to generate route URLs
const route = (name: string, params?: any) => {
    // If you have ziggy-js installed, use it
    if (window.route) {
        return window.route(name, params);
    }
    // Fallback to hardcoded URLs with correct parameter names
    const urls: Record<string, string> = {
        'contribution-versions.index': '/contributions',
        'contribution-versions.store': '/contributions',
        'contribution-versions.update': `/contributions/${params?.contribution_version || ''}`,
        'contribution-versions.destroy': `/contributions/${params?.contribution_version || ''}`,
    };
    return urls[name] || '/contributions';
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contributions', href: '/contributions' },
];

interface ContributionBracket {
    id: number;
    salary_from: number;
    salary_to: number;
    employee_share: number;
    employer_share: number;
}

interface ContributionVersion {
    id: number;
    type: 'sss' | 'philhealth' | 'pagibig';
    contribution_brackets: ContributionBracket[];
    created_at: string;
    updated_at: string;
}

interface ContributionVersionsPagination {
    data: ContributionVersion[];
    from: number;
    to: number;
    total: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    links?: any[];
}

interface IndexProps {
    contributionVersions: ContributionVersionsPagination;
}

// Form interfaces
interface SalaryRange {
    salary_from: string;
    salary_to: string;
    employee_share: string;
    employer_share: string;
}

interface FormData {
    type: string;
    salary_ranges: SalaryRange[];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getContributionTypeColor = (type: string) => {
    switch (type) {
        case 'sss':
            return 'bg-blue-100 text-blue-800';
        case 'philhealth':
            return 'bg-green-100 text-green-800';
        case 'pagibig':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const getContributionTypeLabel = (type: string) => {
    switch (type) {
        case 'sss':
            return 'SSS';
        case 'philhealth':
            return 'PhilHealth';
        case 'pagibig':
            return 'Pag-IBIG';
        default:
            return type.charAt(0).toUpperCase() + type.slice(1);
    }
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function Index({
    contributionVersions,
}: IndexProps) {
    const { delete: destroy } = useForm();
    const [selectedVersion, setSelectedVersion] = useState<ContributionVersion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBracketsModalOpen, setIsBracketsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingVersion, setEditingVersion] = useState<ContributionVersion | null>(null);

    // Filter states
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [hasActiveFilters, setHasActiveFilters] = useState(false);

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (contributionVersion: ContributionVersion) => {
        setItemToDelete(contributionVersion);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        destroy(route('contribution-versions.destroy', { contribution_version: itemToDelete.id }), {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Contribution version deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete contribution version.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    // // ── Delete ─────────────────────────────────────────────────────────────
    // const handleDelete = (version: ContributionVersion | number | string) => {
    //     // Extract the ID from the version object
    //     let id: number;

    //     if (typeof version === 'object' && version !== null && 'id' in version) {
    //         id = version.id;
    //     } else if (typeof version === 'number') {
    //         id = version;
    //     } else if (typeof version === 'string') {
    //         id = parseInt(version, 10);
    //     } else {
    //         return;
    //     }

    //     if (confirm('Are you sure you want to delete this contribution version?')) {
    //         router.delete(route('contribution-versions.destroy', { contribution_version: id }), {
    //             onSuccess: (page) => {
    //                 const successMessage = (page.props as any).flash?.success || 'Contribution version deleted successfully.';
    //                 toast.success(successMessage);
    //             },
    //             onError: (errors) => {
    //                 const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete contribution version.';
    //                 toast.error(errorMessage);
    //             }
    //         });
    //     }
    // };

    // Safely ensure data is an array and remove duplicates based on ID
    const versions = useMemo(() => {
        if (!contributionVersions?.data) return [];
        const data = Array.isArray(contributionVersions.data) ? contributionVersions.data : [];
        // Remove duplicates by ID
        const uniqueMap = new Map();
        data.forEach(item => uniqueMap.set(item.id, item));
        return Array.from(uniqueMap.values());
    }, [contributionVersions]);

    // Filtered data based on type filter
    const displayData = useMemo(() => {
        if (!typeFilter || typeFilter === 'all') {
            return versions;
        }
        return versions.filter(version => version.type === typeFilter);
    }, [versions, typeFilter]);

    // Update hasActiveFilters when filters change
    useEffect(() => {
        setHasActiveFilters(!!typeFilter && typeFilter !== 'all');
    }, [typeFilter]);

    // Get existing contribution types
    const existingTypes = useMemo(() => {
        return versions.map(version => version.type);
    }, [versions]);

    // Handle filter change
    const handleTypeFilterChange = (value: string) => {
        setTypeFilter(value);
    };

    // Clear all filters
    const handleClearAllFilters = () => {
        setTypeFilter("");
    };
    
    // ── View brackets ──────────────────────────────────────────────────────
   const viewBrackets = (version: ContributionVersion) => {
       setSelectedVersion(version);
       setIsBracketsModalOpen(true);
   }

    // ── View details ───────────────────────────────────────────────────────
    const viewDetails = (version: ContributionVersion) => {
        const firstBracket = version.contribution_brackets?.[0] || {};
        const mergedData = {
            ...version,
            ...firstBracket,
            salary_from: firstBracket.salary_from,
            salary_to: firstBracket.salary_to,
            employee_share: firstBracket.employee_share,
            employer_share: firstBracket.employer_share,
        };
        setSelectedVersion(mergedData);
        setIsModalOpen(true);
    };

    // ── Edit ───────────────────────────────────────────────────────────────
    const handleEdit = (version: ContributionVersion) => {
        setEditingVersion(version);
        setIsEditModalOpen(true);
    };

    // Check if there are any records at all
    const hasRecords = versions.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contributions" />

            {/* style animations */}
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-row { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <CustomToast />
            <div className="flex h-full flex flex-col gap-4 rounded-xl p-4 mx-4 -mt-1">
                
                <div className="flex flex-row justify-between gap-4 mt-2 pp-header">
                    {/* Page header */}
                    <CustomHeader
                        icon={<Handshake className="h-6 w-6" />}
                        title="Contributions"
                        description="Manage contribution versions for SSS, PhilHealth, and Pag-IBIG, including their salary brackets and contribution percentages."
                    />

                    {/* Filters and Create button */}
                    {hasRecords && (
                        <div className="flex justify-end items-center gap-4">
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Create Contribution Version
                            </Button>
                        </div>
                    )}
                </div>

                {/* Empty state */}
                {!hasRecords ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-primary/10 p-6 mb-4">
                                <Calculator className="h-12 w-12 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No contribution versions yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Create your first contribution version to set up SSS, PhilHealth, and Pag-IBIG contribution tables with their corresponding brackets.
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Your First Version
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* No results after filtering */}
                        {displayData.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="rounded-full bg-muted p-6 mb-4">
                                        <Filter className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm">
                                        No contribution versions match your filter criteria.
                                    </p>
                                    {hasActiveFilters && (
                                        <Button variant="outline" onClick={handleClearAllFilters}>
                                            Clear Filters
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (

                            <CardContent className="p-0 pp-row">
                                <CustomTable
                                    columns={ContributionTableConfig.columns}
                                    actions={ContributionTableConfig.actions}
                                    data={displayData}
                                    from={contributionVersions.from}
                                    onDelete={handleDeleteClick}
                                    onView={viewDetails}
                                    onEdit={handleEdit}
                                    title="Contribution Table"
                                />
                            </CardContent>

                        )}

                        {/* Pagination */}
                        {displayData.length > 0 && contributionVersions && (
                            <CustomPagination className = "pp-row"
                                pagination={{
                                    data: displayData,
                                    from: contributionVersions.from,
                                    to: contributionVersions.to,
                                    total: contributionVersions.total,
                                    current_page: contributionVersions.current_page || 1,
                                    last_page: contributionVersions.last_page || 1,
                                    per_page: contributionVersions.per_page || 10,
                                    links: contributionVersions.links || []
                                }}
                                perPage={(contributionVersions.per_page || 10).toString()}
                                onPerPageChange={(value) => {
                                    // Handle per page change
                                    router.get(
                                        route('contribution-versions.index'),
                                        { perPage: value, type: typeFilter !== 'all' ? typeFilter : undefined },
                                        { preserveState: true }
                                    );
                                }}
                                totalCount={contributionVersions.total}
                                filteredCount={displayData.length}
                                search={typeFilter && typeFilter !== 'all' ? `Type: ${getContributionTypeLabel(typeFilter)}` : ''}
                                resourceName="contribution version"
                            />
                        )}

                        <DeleteConfirmationDialog 
                            isOpen={deleteDialogOpen}
                            onClose={() => {
                                setDeleteDialogOpen(false);
                                setItemToDelete(null);
                            }}
                            onConfirm={confirmDelete}
                            title='Delete Contribution Item'
                            itemName={itemToDelete ? getContributionTypeLabel(itemToDelete.type) : ''}
                            isLoading={isDeleting}
                            confirmText='Delete Contribution'
                        />
                    </>
                )}
            </div>

            {/* Create Modal */}
            <CreateContributionModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                existingTypes={existingTypes}
            />

            {/* Edit Modal */}
            {editingVersion && (
                <EditContributionModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingVersion(null);
                    }}
                    contributionVersion={editingVersion}
                    existingTypes={existingTypes.filter(type => type !== editingVersion.type)}
                />
            )}

            {/* Brackets Modal */}
            <Dialog open={isBracketsModalOpen} onOpenChange={setIsBracketsModalOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Contribution Brackets - {selectedVersion && getContributionTypeLabel(selectedVersion.type)}
                        </DialogTitle>
                        <DialogDescription>
                            View salary brackets and contribution percentages for this contribution type.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {selectedVersion?.contribution_brackets && selectedVersion.contribution_brackets.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Salary Range</TableHead>
                                            <TableHead className="text-right">Employee Share (%)</TableHead>
                                            <TableHead className="text-right">Employer Share (%)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedVersion.contribution_brackets
                                            .filter((bracket, index, self) =>
                                                index === self.findIndex(b => b.id === bracket.id)
                                            )
                                            .map((bracket) => {
                                                return (
                                                    <TableRow key={bracket.id}>
                                                        <TableCell className="font-medium">
                                                            ₱{bracket.salary_from.toLocaleString()} - ₱{bracket.salary_to.toLocaleString()}
                                                            {bracket.salary_to === 999999999 && ' (and above)'}
                                                        </TableCell>
                                                        <TableCell className="text-right">{bracket.employee_share}%</TableCell>
                                                        <TableCell className="text-right">{bracket.employer_share}%</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
                                <Percent className="h-8 w-8 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No brackets configured for this version</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <CustomModalView
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                title={ContributionModalConfig.title}
                description={ContributionModalConfig.description}
                fields={ContributionModalConfig.fields}
                data={selectedVersion}
                headerIcon={<Percent className="h-6 w-6 text-primary" />}
            />
        </AppLayout>
    );
}

// =============================================================================
// CREATE MODAL COMPONENT
// =============================================================================

interface CreateContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingTypes: string[];
}

function CreateContributionModal({ isOpen, onClose, existingTypes }: CreateContributionModalProps) {
    const { data, setData, errors, processing, post, reset } = useForm<FormData>({
        type: '',
        salary_ranges: [{
            salary_from: '',
            salary_to: '',
            employee_share: '',
            employer_share: '',
        }],
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    function submitContributionVersion(e: React.FormEvent) {
        e.preventDefault();
        post(route('contribution-versions.store'), {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Contribution version created successfully.';
                toast.success(successMessage);
                handleClose();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to create contribution version.';
                toast.error(errorMessage);
            }
        });
    }

    const addSalaryRange = () => {
        setData('salary_ranges', [
            ...data.salary_ranges,
            {
                salary_from: '',
                salary_to: '',
                employee_share: '',
                employer_share: '',
            }
        ]);
    };

    const removeSalaryRange = (index: number) => {
        if (data.salary_ranges.length > 1) {
            setData('salary_ranges', data.salary_ranges.filter((_, i) => i !== index));
        }
    };

    const updateSalaryRange = (index: number, field: keyof SalaryRange, value: string) => {
        const updatedRanges = data.salary_ranges.map((range, i) => {
            if (i === index) {
                return { ...range, [field]: value };
            }
            return range;
        });
        setData('salary_ranges', updatedRanges);
    };

    const getNestedError = (index: number, field: string) => {
        return errors[`salary_ranges.${index}.${field}`];
    };

    // Check if all contribution types are already taken
    const allTypesTaken = existingTypes.length >= 3;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Create Contribution Version</DialogTitle>
                    <DialogDescription>
                        Create a new contribution version with salary ranges and contribution percentages.
                    </DialogDescription>
                </DialogHeader>

                {allTypesTaken ? (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">
                            All contribution types (SSS, PhilHealth, Pag-IBIG) already have versions.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You can only have one version per contribution type. Please edit or delete existing versions if you need to make changes.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={submitContributionVersion} className="space-y-6">
                        {/* Contribution Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Contribution Type</label>
                            <Select
                                value={data.type}
                                onValueChange={(value) => setData('type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select contribution type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {!existingTypes.includes('sss') && (
                                        <SelectItem value="sss">SSS</SelectItem>
                                    )}
                                    {!existingTypes.includes('philhealth') && (
                                        <SelectItem value="philhealth">PhilHealth</SelectItem>
                                    )}
                                    {!existingTypes.includes('pagibig') && (
                                        <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {existingTypes.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Available types: {['sss', 'philhealth', 'pagibig']
                                        .filter(type => !existingTypes.includes(type))
                                        .map(type => getContributionTypeLabel(type))
                                        .join(', ')}
                                </p>
                            )}
                            <InputError message={errors.type} />
                        </div>

                        {/* Salary Ranges Repeater */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Salary Ranges & Contributions</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSalaryRange}
                                    className='hover:cursor-pointer'
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Range
                                </Button>
                            </div>

                            {errors.salary_ranges && typeof errors.salary_ranges === 'string' && (
                                <div className="text-sm text-red-600">
                                    <InputError message={errors.salary_ranges} />
                                </div>
                            )}

                            {data.salary_ranges.map((range, index) => (
                                <div key={index} className="relative p-4 border rounded-lg bg-muted/5">
                                    {data.salary_ranges.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border shadow-sm"
                                            onClick={() => removeSalaryRange(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Salary From (₱)</label>
                                            <Input
                                                type="number"
                                                value={range.salary_from}
                                                onChange={e => updateSalaryRange(index, 'salary_from', e.target.value)}
                                                placeholder="0.00"
                                            />
                                            <InputError message={getNestedError(index, 'salary_from')} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Salary To (₱)</label>
                                            <Input
                                                type="number"
                                                value={range.salary_to}
                                                onChange={e => updateSalaryRange(index, 'salary_to', e.target.value)}
                                                placeholder="0.00"
                                            />
                                            <InputError message={getNestedError(index, 'salary_to')} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1">
                                                <label className="text-sm font-medium">Employee Share</label>
                                                <Percent className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={range.employee_share}
                                                    onChange={e => updateSalaryRange(index, 'employee_share', e.target.value)}
                                                    placeholder="0.00"
                                                    className="pr-8"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <span className="text-sm text-muted-foreground">%</span>
                                                </div>
                                            </div>
                                            <InputError message={getNestedError(index, 'employee_share')} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1">
                                                <label className="text-sm font-medium">Employer Share</label>
                                                <Percent className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={range.employer_share}
                                                    onChange={e => updateSalaryRange(index, 'employer_share', e.target.value)}
                                                    placeholder="0.00"
                                                    className="pr-8"
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <span className="text-sm text-muted-foreground">%</span>
                                                </div>
                                            </div>
                                            <InputError message={getNestedError(index, 'employer_share')} />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        <p>Enter contribution percentage (e.g., 10 for 10%)</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className='hover:cursor-pointer'
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className='hover:cursor-pointer'
                            >
                                {processing && <LoaderCircle className='h-4 w-4 animate-spin mr-2' />}
                                {processing ? 'Creating...' : 'Create Contribution Version'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

// =============================================================================
// EDIT MODAL COMPONENT
// =============================================================================

interface EditContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    contributionVersion: ContributionVersion;
    existingTypes: string[]; // Types that are already taken (excluding current one)
}

function EditContributionModal({ isOpen, onClose, contributionVersion, existingTypes }: EditContributionModalProps) {
    const initialSalaryRanges = contributionVersion.contribution_brackets.map(bracket => ({
        salary_from: bracket.salary_from.toString(),
        salary_to: bracket.salary_to.toString(),
        employee_share: bracket.employee_share.toString(),
        employer_share: bracket.employer_share.toString(),
    }));

    const { data, setData, errors, processing, put, reset } = useForm<FormData>({
        type: contributionVersion.type || '',
        salary_ranges: initialSalaryRanges.length > 0 ? initialSalaryRanges : [{
            salary_from: '',
            salary_to: '',
            employee_share: '',
            employer_share: '',
        }],
    });

    const handleClose = () => {
        reset();
        onClose();
    };

    function submitContributionVersion(e: React.FormEvent) {
        e.preventDefault();
        put(route('contribution-versions.update', { contribution_version: contributionVersion.id }), {
            onSuccess: (page) => {
                const successMessage = page.props.flash?.success || 'Contribution version updated successfully.';
                toast.success(successMessage);
                handleClose();
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to update contribution version.';
                toast.error(errorMessage);
            }
        });
    }

    const addSalaryRange = () => {
        setData('salary_ranges', [
            ...data.salary_ranges,
            {
                salary_from: '',
                salary_to: '',
                employee_share: '',
                employer_share: '',
            }
        ]);
    };

    const removeSalaryRange = (index: number) => {
        if (data.salary_ranges.length > 1) {
            setData('salary_ranges', data.salary_ranges.filter((_, i) => i !== index));
        }
    };

    const updateSalaryRange = (index: number, field: keyof SalaryRange, value: string) => {
        const updatedRanges = data.salary_ranges.map((range, i) => {
            if (i === index) {
                return { ...range, [field]: value };
            }
            return range;
        });
        setData('salary_ranges', updatedRanges);
    };

    const getNestedError = (index: number, field: string) => {
        return errors[`salary_ranges.${index}.${field}`];
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Edit Contribution Version</DialogTitle>
                    <DialogDescription>
                        Update contribution version details and salary ranges.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submitContributionVersion} className="space-y-6">
                    {/* Contribution Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contribution Type</label>
                        <Select
                            value={data.type}
                            onValueChange={(value) => setData('type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select contribution type" />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Always show current type */}
                                <SelectItem value={contributionVersion.type}>
                                    {getContributionTypeLabel(contributionVersion.type)}
                                </SelectItem>

                                {/* Show other types only if they're not taken */}
                                {!existingTypes.includes('sss') && contributionVersion.type !== 'sss' && (
                                    <SelectItem value="sss">SSS</SelectItem>
                                )}
                                {!existingTypes.includes('philhealth') && contributionVersion.type !== 'philhealth' && (
                                    <SelectItem value="philhealth">PhilHealth</SelectItem>
                                )}
                                {!existingTypes.includes('pagibig') && contributionVersion.type !== 'pagibig' && (
                                    <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.type} />
                    </div>

                    {/* Salary Ranges Repeater */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Salary Ranges & Contributions</label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addSalaryRange}
                                className='hover:cursor-pointer'
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Range
                            </Button>
                        </div>

                        {errors.salary_ranges && typeof errors.salary_ranges === 'string' && (
                            <div className="text-sm text-red-600">
                                <InputError message={errors.salary_ranges} />
                            </div>
                        )}

                        {data.salary_ranges.map((range, index) => (
                            <div key={index} className="relative p-4 border rounded-lg bg-muted/5">
                                {data.salary_ranges.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border shadow-sm"
                                        onClick={() => removeSalaryRange(index)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Salary From (₱)</label>
                                        <Input
                                            type="number"
                                            value={range.salary_from}
                                            onChange={e => updateSalaryRange(index, 'salary_from', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError message={getNestedError(index, 'salary_from')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Salary To (₱)</label>
                                        <Input
                                            type="number"
                                            value={range.salary_to}
                                            onChange={e => updateSalaryRange(index, 'salary_to', e.target.value)}
                                            placeholder="0.00"
                                        />
                                        <InputError message={getNestedError(index, 'salary_to')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                            <label className="text-sm font-medium">Employee Share</label>
                                            <Percent className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={range.employee_share}
                                                onChange={e => updateSalaryRange(index, 'employee_share', e.target.value)}
                                                placeholder="0.00"
                                                className="pr-8"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                        <InputError message={getNestedError(index, 'employee_share')} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                            <label className="text-sm font-medium">Employer Share</label>
                                            <Percent className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={range.employer_share}
                                                onChange={e => updateSalaryRange(index, 'employer_share', e.target.value)}
                                                placeholder="0.00"
                                                className="pr-8"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <span className="text-sm text-muted-foreground">%</span>
                                            </div>
                                        </div>
                                        <InputError message={getNestedError(index, 'employer_share')} />
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground">
                                    <p>Enter contribution percentage (e.g., 10 for 10%)</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className='hover:cursor-pointer'
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className='hover:cursor-pointer'
                        >
                            {processing && <LoaderCircle className='h-4 w-4 animate-spin mr-2' />}
                            {processing ? 'Updating...' : 'Update Contribution Version'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}