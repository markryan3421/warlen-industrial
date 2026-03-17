import { Head, Link, router, useForm } from '@inertiajs/react';
import { Calculator, Percent, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';

import ContributionVersionController from '@/actions/App/Http/Controllers/ContributionVersionController';
import { CustomTable } from '@/components/custom-table';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { ContributionTableConfig } from '@/config/tables/contribution-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CustomModalView } from '@/components/custom-modal-view';
import { ContributionModalConfig } from '@/config/forms/contribution-modal-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomToast, toast } from '@/components/custom-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
    effective_from: string;
    effective_to: string;
    contribution_brackets: ContributionBracket[];
    created_at: string;
    updated_at: string;
}

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface ContributionVersionsPagination {
    data: ContributionVersion[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface FilterProps {
    type: string;
    perPage: string;
    date_from?: string;
    date_to?: string;
}

interface IndexProps {
    contributionVersions: ContributionVersionsPagination;
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const getContributionTypeColor = (type: string) => {
    switch(type) {
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
    switch(type) {
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

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function Index({
    contributionVersions,
    filters,
    totalCount,
    filteredCount,
}: IndexProps) {
    const { delete: destroy } = useForm();
    const [selectedVersion, setSelectedVersion] = useState<ContributionVersion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBracketsModalOpen, setIsBracketsModalOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    // Safely ensure data is an array and remove duplicates based on ID
    const versions = useMemo(() => {
        if (!contributionVersions?.data) return [];
        const data = Array.isArray(contributionVersions.data) ? contributionVersions.data : [];
        // Remove duplicates by ID
        const uniqueMap = new Map();
        data.forEach(item => uniqueMap.set(item.id, item));
        return Array.from(uniqueMap.values());
    }, [contributionVersions]);

    const { data, setData } = useForm({
        type: filters.type || '',
        perPage: filters.perPage || '10',
    });

    // Date range filter state
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined
    );

    // Client-side filtering
    const displayData = useMemo(() => {
        let filtered = versions;

        // Apply type filter
        if (data.type && data.type !== '' && data.type !== 'all') {
            filtered = filtered.filter(version => version.type === data.type);
        }

        // Apply date range filter
        if (dateFrom || dateTo) {
            filtered = filtered.filter(version => {
                const effectiveFrom = new Date(version.effective_from);
                const effectiveTo = new Date(version.effective_to);

                if (dateFrom && dateTo) {
                    return effectiveFrom <= dateTo && effectiveTo >= dateFrom;
                } else if (dateFrom) {
                    return effectiveTo >= dateFrom;
                } else if (dateTo) {
                    return effectiveFrom <= dateTo;
                }
                return true;
            });
        }

        return filtered;
    }, [versions, data.type, dateFrom, dateTo]);

    // Update URL when filters change
    useEffect(() => {
        const params: Record<string, string> = {};

        if (data.type && data.type !== '' && data.type !== 'all') {
            params.type = data.type;
        }
        
        if (data.perPage) {
            params.perPage = data.perPage;
        }

        if (dateFrom) {
            params.date_from = format(dateFrom, 'yyyy-MM-dd');
        }
        
        if (dateTo) {
            params.date_to = format(dateTo, 'yyyy-MM-dd');
        }

        // Only update if there are actual params
        if (Object.keys(params).length > 0) {
            router.get(
                ContributionVersionController.index.url(),
                params,
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }
    }, [data.type, data.perPage, dateFrom, dateTo]);

    // ── Filter handlers ────────────────────────────────────────────────────
    const handleTypeChange = (value: string) => {
        setData('type', value);
        // Close calendar if open
        setIsCalendarOpen(false);
    };

    const handleClearTypeFilter = () => {
        setData('type', '');
    };

    const handleClearDateFilters = () => {
        setDateFrom(undefined);
        setDateTo(undefined);
        setIsCalendarOpen(false);
    };

    const handleClearAllFilters = () => {
        setData('type', '');
        setDateFrom(undefined);
        setDateTo(undefined);
        setIsCalendarOpen(false);
    };

    // ── Per-page ───────────────────────────────────────────────────────────
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);
    };

    // ── Delete ─────────────────────────────────────────────────────────────
    const handleDelete = (id: number | string) => {
        if (confirm('Are you sure you want to delete this contribution version?')) {
            destroy(ContributionVersionController.destroy(id).url, {
                onSuccess: (page) => {
                    const successMessage = page.props.flash?.success || 'Contribution version deleted successfully.';
                    toast.success(successMessage);
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete contribution version.';
                    toast.error(errorMessage);
                }
            });
        }
    };

    // ── View brackets ──────────────────────────────────────────────────────
    const viewBrackets = (version: ContributionVersion) => {
        setSelectedVersion(version);
        setIsBracketsModalOpen(true);
    };

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
        router.get(ContributionVersionController.edit(version.id).url);
    };

    // Check if any filter is active
    const hasActiveFilters = (data.type && data.type !== '' && data.type !== 'all') || dateFrom || dateTo;

    // Check if there are any records at all
    const hasRecords = totalCount > 0;

    // Format date range for display
    const dateRangeText = dateFrom || dateTo 
        ? `${dateFrom ? format(dateFrom, 'MMM d, yyyy') : ''} ${dateFrom && dateTo ? '-' : ''} ${dateTo ? format(dateTo, 'MMM d, yyyy') : ''}`
        : '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contributions" />
            <CustomToast />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Page header */}
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Calculator className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Contribution Versions</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage SSS, PhilHealth, and Pag-IBIG contribution tables
                        </p>
                    </div>
                </div>

                {/* Toolbar - Fixed layout to prevent calendar overlap */}
                {hasRecords && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                            {/* Type Filter */}
                            <div className="flex items-center gap-2 relative min-w-[180px]">
                                <Filter className="h-4 w-4 text-gray-500 absolute left-3 z-10" />
                                <Select
                                    value={data.type || 'all'}
                                    onValueChange={handleTypeChange}
                                >
                                    <SelectTrigger className="w-full h-10 pl-10 pr-8 bg-white">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="sss">SSS</SelectItem>
                                        <SelectItem value="philhealth">PhilHealth</SelectItem>
                                        <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                                    </SelectContent>
                                </Select>
                                {data.type && data.type !== 'all' && (
                                    <button
                                        onClick={handleClearTypeFilter}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Date Range Picker - With controlled open state */}
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full sm:w-[260px] justify-start text-left font-normal h-10 bg-white ${
                                            !dateFrom && !dateTo ? 'text-muted-foreground' : ''
                                        }`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRangeText || <span>Filter by date range</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={5}>
                                    <Calendar
                                        mode="range"
                                        selected={{
                                            from: dateFrom,
                                            to: dateTo,
                                        }}
                                        onSelect={(range) => {
                                            setDateFrom(range?.from);
                                            setDateTo(range?.to);
                                            // Don't close automatically to allow range selection
                                        }}
                                        numberOfMonths={2}
                                        initialFocus
                                    />
                                    <div className="flex items-center justify-end gap-2 p-3 border-t">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                setDateFrom(undefined);
                                                setDateTo(undefined);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                        <Button 
                                            size="sm"
                                            onClick={() => setIsCalendarOpen(false)}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Clear All Filters Button */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearAllFilters}
                                    className="gap-1 h-10 px-2"
                                >
                                    <X className="h-4 w-4" />
                                    Clear All
                                </Button>
                            )}
                        </div>

                        <Link
                            href={ContributionVersionController.create()}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                        >
                            + Create Contribution Version
                        </Link>
                    </div>
                )}

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
                            <Link href={ContributionVersionController.create()}>
                                <Button className="gap-2">
                                    <Calculator className="h-4 w-4" />
                                    Create Your First Version
                                </Button>
                            </Link>
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
                            <Card>
                                <CardContent className="p-0">
                                    <CustomTable
                                        columns={ContributionTableConfig.columns}
                                        actions={ContributionTableConfig.actions}
                                        data={displayData}
                                        from={contributionVersions.from}
                                        onDelete={handleDelete}
                                        onView={viewDetails}
                                        onEdit={handleEdit}
                                        title = "Contribution Tablea"
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Pagination */}
                        {displayData.length > 0 && (
                            <CustomPagination
                                pagination={{
                                    ...contributionVersions,
                                    data: displayData,
                                    total: displayData.length,
                                    from: 1,
                                    to: displayData.length
                                }}
                                perPage={data.perPage}
                                onPerPageChange={handlePerPageChange}
                                totalCount={totalCount}
                                filteredCount={displayData.length}
                                search={data.type && data.type !== '' && data.type !== 'all' 
                                    ? `Type: ${getContributionTypeLabel(data.type)}` 
                                    : dateRangeText ? `Date: ${dateRangeText}` : ''}
                                resourceName="contribution version"
                            />
                        )}
                    </>
                )}
            </div>

            {/* Brackets Modal */}
            <Dialog open={isBracketsModalOpen} onOpenChange={setIsBracketsModalOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Contribution Brackets - {selectedVersion && getContributionTypeLabel(selectedVersion.type)}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedVersion && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">
                                        {formatDate(selectedVersion.effective_from)} - {formatDate(selectedVersion.effective_to)}
                                    </Badge>
                                </div>
                            )}
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
                                            <TableHead className="text-right">Total (%)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedVersion.contribution_brackets
                                            .filter((bracket, index, self) => 
                                                index === self.findIndex(b => b.id === bracket.id)
                                            )
                                            .map((bracket) => {
                                                const total = bracket.employee_share + bracket.employer_share;
                                                return (
                                                    <TableRow key={bracket.id}>
                                                        <TableCell className="font-medium">
                                                            ₱{bracket.salary_from.toLocaleString()} - ₱{bracket.salary_to.toLocaleString()}
                                                            {bracket.salary_to === 999999999 && ' (and above)'}
                                                        </TableCell>
                                                        <TableCell className="text-right">{bracket.employee_share}%</TableCell>
                                                        <TableCell className="text-right">{bracket.employer_share}%</TableCell>
                                                        <TableCell className="text-right font-medium">{total}%</TableCell>
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