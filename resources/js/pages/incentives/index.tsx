import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Briefcase, Eye, Plus, Coins, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { CustomTable } from '@/components/custom-table';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { CustomPagination } from '@/components/custom-pagination';
import type { BreadcrumbItem } from '@/types';
import { CustomHeader } from '@/components/custom-header';
import IncentiveController from '@/actions/App/Http/Controllers/IncentiveController';
import { toast } from '@/components/custom-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Incentives', href: '/incentives' }];

interface Incentive {
    id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period?: {
        start_date: string;
        end_date: string;
        pay_date: string;
    };
    employees?: Array<{
        id: number;
        user?: { name: string };
        position?: { pos_name: string };
        branch?: { branch_name: string };
    }>;
}

interface Props {
    incentives: {
        data: Incentive[];
        perPage: number;
        total: number;
        from: number;
        current_page: number;
        last_page: number;
        links: any[];
    } | Incentive[];
    filters?: { date_from?: string; date_to?: string; search?: string };
    totalCount: number;
    filteredCount: number;
}

export default function Index({ incentives, filters = {}, totalCount, filteredCount }: Props) {
    const { delete: destroy } = useForm();
    const [selected, setSelected] = useState<Incentive | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Process all data from props
    let allData: Incentive[] = [];
    let originalPaginationData: any = {
        data: [],
        perPage: 10,
        total: 0,
        from: 1,
        current_page: 1,
        last_page: 1,
        links: []
    };

    if (Array.isArray(incentives)) {
        allData = incentives;
        originalPaginationData = {
            data: incentives,
            perPage: 10,
            total: incentives.length,
            from: 1,
            current_page: 1,
            last_page: 1,
            links: []
        };
    } else if (incentives && incentives.data && Array.isArray(incentives.data)) {
        allData = incentives.data;
        originalPaginationData = incentives;
    }

    // Frontend filtering logic
    const filteredData = useMemo(() => {
        let filtered = [...allData];

        // Filter by search term (incentive name)
        if (searchTerm.trim()) {
            filtered = filtered.filter(incentive =>
                incentive.incentive_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            filtered = filtered.filter(incentive => {
                if (!incentive.payroll_period) return false;

                const startDate = parseISO(incentive.payroll_period.start_date);
                const endDate = parseISO(incentive.payroll_period.end_date);

                if (dateFrom && dateTo) {
                    // Both dates selected - check if period overlaps with range
                    return startDate >= dateFrom && endDate <= dateTo;
                } else if (dateFrom) {
                    // Only from date - check if period starts after or on from date
                    return startDate >= dateFrom;
                } else if (dateTo) {
                    // Only to date - check if period ends before or on to date
                    return endDate <= dateTo;
                }
                return true;
            });
        }

        return filtered;
    }, [allData, searchTerm, dateFrom, dateTo]);

    // Pagination logic
    const totalFilteredCount = filteredData.length;
    const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (incentive: Incentive) => {
        setItemToDelete(incentive);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        
        setIsDeleting(true);
        destroy(IncentiveController.destroy(itemToDelete.id).url, {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Incentive deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete incentive.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    // Update pagination data for CustomPagination component
    const paginationData = {
        ...originalPaginationData,
        data: currentData,
        total: totalFilteredCount,
        from: startIndex + 1,
        current_page: currentPage,
        last_page: totalPages,
        perPage: itemsPerPage
    };

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFrom, dateTo]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
    };

    const handleDateFromChange = (date: Date | undefined) => {
        setDateFrom(date);
    };

    const handleDateToChange = (date: Date | undefined) => {
        setDateTo(date);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setDateFrom(undefined);
        setDateTo(undefined);
        setCurrentPage(1);
    };

    const handlePerPageChange = (value: string | number) => {
        const newPerPage = Number(value);
        setItemsPerPage(newPerPage);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    // const handleDelete = (id: string | number) => {
    //     if (confirm('Are you sure you want to delete this incentive?')) {
    //         router.delete(`/incentives/${id}`);
    //     }
    // };

    const handleView = (incentive: Incentive) => {
        setSelected(incentive);
    };

    const handleEdit = (incentive: Incentive) => {
        router.get(`/incentives/${incentive.id}/edit`);
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(amount));
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const hasFilters = !!(searchTerm || dateFrom || dateTo);
    const hasNoDataAtAll = allData.length === 0;

    const columns = [
        {
            key: 'incentive_name',
            label: 'Incentive Name',
            render: (row: Incentive) => <span className="font-medium">{row.incentive_name}</span>
        },
        {
            key: 'incentive_amount',
            label: 'Amount',
            render: (row: Incentive) => formatCurrency(row.incentive_amount)
        },
        {
            key: 'payroll_period',
            label: 'Payroll Period',
            render: (row: Incentive) => row.payroll_period ? (
                <div>
                    <div>{formatDate(row.payroll_period.start_date)} - {formatDate(row.payroll_period.end_date)}</div>
                    <div className="text-xs text-muted-foreground">Pay: {formatDate(row.payroll_period.pay_date)}</div>
                </div>
            ) : <span className="text-muted-foreground">N/A</span>
        },
        {
            key: 'employees',
            label: 'Employees',
            render: (row: Incentive) => {
                const count = row.employees?.length || 0;
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {count} {count === 1 ? 'Employee' : 'Employees'}
                    </Badge>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            isAction: true,
        }
    ];

    const actions = [
        {
            label: 'View',
            icon: 'Eye' as const,
            route: '',
        },
        {
            label: 'Edit',
            icon: 'Pencil' as const,
            route: '',
        },
        {
            label: 'Delete',
            icon: 'Trash2' as const,
            route: '',
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incentives" />

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

            <div className="flex flex-1 flex-col gap-4 p-4 mx-4">
                {/* Header */}
                <div className="flex justify-between items-center pp-header">
                    <CustomHeader
                        title="Incentives"
                        icon={<Coins className="h-6 w-6" />}
                        description='Manage employee incentives across payroll periods'
                    />
                    <Link href="/incentives/create">
                        <Button className="bg-[#1d4791] hover:bg-[#1d4791]/90">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Incentive
                        </Button>
                    </Link>
                </div>


                <CardContent className="p-0 pp-row">
                    <CustomTable
                        columns={columns}
                        actions={actions}
                        data={currentData}
                        from={startIndex + 1}
                        onDelete={handleDeleteClick}
                        onView={handleView}
                        onEdit={handleEdit}
                        title="Incentive Lists"
                        toolbar={
                            <EmployeeFilterBar
                                filters={{
                                    search: true,
                                    position: false,
                                    branch: false,
                                    site: false,
                                    date: true,
                                    status: false,
                                }}
                                searchTerm={searchTerm}
                                onSearchChange={handleSearch}
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                onDateFromChange={handleDateFromChange}
                                onDateToChange={handleDateToChange}
                                onClearAll={clearFilters}
                                searchPlaceholder="Search by incentive name..."
                                dateLabel="Payroll Period Date Range"
                                allPositions={[]}
                                branchesData={[]}
                                selectedPositions={[]}
                                selectedBranch={undefined}
                                selectedSite={undefined}
                                status=""
                                onPositionsChange={() => { }}
                                onBranchChange={() => { }}
                                onSiteChange={() => { }}
                                onStatusChange={() => { }}
                            />
                        }
                        emptyState={
                            hasNoDataAtAll && !hasFilters ? (
                                // Empty state when no data exists at all
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-primary/10 p-6 mb-4">
                                        <Briefcase className="h-12 w-12 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No incentives yet</h3>
                                    <p className="text-muted-foreground mb-4">Create your first incentive to get started</p>
                                    <Link href="/incentives/create">
                                        <Button className="bg-[#1d4791] hover:bg-[#1d4791]/90">Create First Incentive</Button>
                                    </Link>
                                </div>
                            ) : filteredData.length === 0 && hasFilters ? (
                                // No results state when filters are applied but no matches
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-muted p-6 mb-4">
                                        <Search className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        No incentives match "{searchTerm}" {dateFrom || dateTo ? 'in the selected date range' : ''}
                                    </p>
                                    <Button variant="outline" onClick={clearFilters}>
                                        Clear all filters
                                    </Button>
                                </div>
                            ) : null
                        }
                    />
                    {allData.length > 0 && (
                        <div className="px-6 pb-4 pp-row">
                            <CustomPagination
                                pagination={paginationData}
                                perPage={String(itemsPerPage)}
                                onPerPageChange={handlePerPageChange}
                                totalCount={allData.length}
                                filteredCount={filteredData.length}
                                search={searchTerm}
                                resourceName="incentive"
                            />
                        </div>
                    )}
                    <DeleteConfirmationDialog 
                        isOpen={deleteDialogOpen}
                        onClose={() => {
                            setDeleteDialogOpen(false);
                            setItemToDelete(null);
                        }}
                        onConfirm={confirmDelete}
                        title="Delete Incentive"
                        itemName={itemToDelete?.incentive_name || 'this incentive'}
                        isLoading={isDeleting}
                        confirmText='Delete incentive'
                    />
                </CardContent>
            </div>

            {/* View Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selected?.incentive_name}</DialogTitle>
                        <div className="mt-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-lg px-4 py-1">
                                {formatCurrency(selected?.incentive_amount ?? 0)}
                            </Badge>
                        </div>
                    </DialogHeader>
                    <div className="mt-4">
                        {selected?.payroll_period && (
                            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <h4 className="font-semibold mb-2">Payroll Period</h4>
                                <p className="text-sm">
                                    {formatDate(selected.payroll_period.start_date)} - {formatDate(selected.payroll_period.end_date)}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Payment Date: {formatDate(selected.payroll_period.pay_date)}
                                </p>
                            </div>
                        )}

                        <h4 className="font-semibold mb-3">Assigned Employees ({selected?.employees?.length || 0})</h4>
                        {selected?.employees && selected.employees.length > 0 ? (
                            <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                                {selected.employees.map(emp => (
                                    <div key={emp.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <div className="font-medium">{emp.user?.name || `Employee #${emp.id}`}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {emp.position?.pos_name && <span>{emp.position.pos_name}</span>}
                                            {emp.position?.pos_name && emp.branch?.branch_name && <span> • </span>}
                                            {emp.branch?.branch_name && <span>{emp.branch.branch_name}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground border rounded-md">
                                No employees assigned to this incentive
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}