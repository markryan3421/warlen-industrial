// pages/incentives/index.tsx
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Briefcase, Coins, Eye, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/hr-layout';
import { CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
// import { CustomToast, toast } from '@/components/custom-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';
import { CustomPagination } from '@/components/custom-pagination';
import { IncentivesTableConfig } from '@/config/tables/incentives-table';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateSimple } from '@/utils/formatDateSimple';
import IncentiveController from '@/actions/App/Http/Controllers/HrRole/HRIncentiveController';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Incentives', href: '/hr/incentives' }];

interface Employee {
    id: number;
    user?: { name: string } | null;
    position?: { pos_name: string };
    branch?: { branch_name: string };
}

interface PayrollPeriod {
    id: number;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: string;
}

interface Incentive {
    id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period_id?: number;
    payroll_period?: PayrollPeriod;
    is_daily?: boolean;
    employees?: Employee[];
}

interface PaginatedIncentives {
    data: Incentive[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    incentives: PaginatedIncentives;
    payroll_periods: PayrollPeriod[];
    employees: Employee[];
    filters?: {
        search?: string;
        date_from?: string;
        date_to?: string;
        page?: number;
        per_page?: number;
    };
    totalCount?: number;
    filteredCount?: number;
}

// Custom toast style helper
const toastStyle = (color: string) => ({
    style: {
        backgroundColor: 'white',
        color: color,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
});

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function Index({ incentives, payroll_periods, employees, filters = {}, totalCount = 0, filteredCount = 0 }: Props) {
    const { delete: destroy } = useForm();
    const { props } = usePage<{ flash?: { success?: string; error?: string; warning?: string; info?: string } }>();

    const [selected, setSelected] = useState<Incentive | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Incentive | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Local state for filters
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined
    );
    const [currentPage, setCurrentPage] = useState(incentives.current_page || 1);
    const [itemsPerPage, setItemsPerPage] = useState(incentives.per_page || 10);

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

    // Debounced values for API requests
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const debouncedDateFrom = useDebounce(dateFrom, 500);
    const debouncedDateTo = useDebounce(dateTo, 500);

    const isInitialMount = useRef(true);
    const prevFiltersRef = useRef({ search: '', dateFrom: '', dateTo: '' });

    // Navigate with filters
    const navigateWithFilters = useCallback((updates: {
        search?: string;
        dateFrom?: Date;
        dateTo?: Date;
        page?: number;
        perPage?: number;
    }) => {
        const params = new URLSearchParams();

        const search = updates.search !== undefined ? updates.search : searchTerm;
        const from = updates.dateFrom !== undefined ? updates.dateFrom : dateFrom;
        const to = updates.dateTo !== undefined ? updates.dateTo : dateTo;
        const page = updates.page !== undefined ? updates.page : currentPage;
        const perPage = updates.perPage !== undefined ? updates.perPage : itemsPerPage;

        if (search) params.append('search', search);
        if (from) params.append('date_from', from.toISOString().split('T')[0]);
        if (to) params.append('date_to', to.toISOString().split('T')[0]);
        params.append('page', String(page));
        params.append('per_page', String(perPage));

        const url = `/hr/incentives?${params.toString()}`;

        router.visit(url, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setIsLoading(true),
            onFinish: () => setIsLoading(false),
        });
    }, [searchTerm, dateFrom, dateTo, currentPage, itemsPerPage]);

    // Handle debounced filter changes
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevFiltersRef.current = {
                search: debouncedSearchTerm,
                dateFrom: debouncedDateFrom?.toISOString() || '',
                dateTo: debouncedDateTo?.toISOString() || ''
            };
            return;
        }

        const currentSearch = debouncedSearchTerm || '';
        const currentDateFrom = debouncedDateFrom?.toISOString() || '';
        const currentDateTo = debouncedDateTo?.toISOString() || '';

        const filtersChanged =
            currentSearch !== prevFiltersRef.current.search ||
            currentDateFrom !== prevFiltersRef.current.dateFrom ||
            currentDateTo !== prevFiltersRef.current.dateTo;

        if (filtersChanged) {
            navigateWithFilters({
                search: currentSearch,
                dateFrom: debouncedDateFrom,
                dateTo: debouncedDateTo,
                page: 1
            });

            prevFiltersRef.current = {
                search: currentSearch,
                dateFrom: currentDateFrom,
                dateTo: currentDateTo
            };
        }
    }, [debouncedSearchTerm, debouncedDateFrom, debouncedDateTo, navigateWithFilters]);

    // Update local state when props change
    useEffect(() => {
        setCurrentPage(incentives.current_page);
    }, [incentives.current_page]);

    const handlePageChange = (page: number) => {
        navigateWithFilters({ page });
    };

    const handlePerPageChange = (value: string) => {
        const newPerPage = Number(value);
        setItemsPerPage(newPerPage);
        navigateWithFilters({ perPage: newPerPage, page: 1 });
    };

    const handleSearchChange = (value: string) => {
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
        router.visit('/hr/incentives', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Direct navigation to create page
    const handleCreate = () => {
        router.visit(IncentiveController.create());
    };

    // Direct navigation to edit page
    const handleEdit = (incentive: Incentive) => {
        router.visit(IncentiveController.edit(incentive.id).url);
    };

    // Handle delete
    const handleDeleteClick = (incentive: Incentive) => {
        setItemToDelete(incentive);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        destroy(IncentiveController.destroy(itemToDelete.id).url, {
            onSuccess: () => {
                // Flash message will be shown by global useEffect
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete incentive.';
                toast.error(errorMessage, toastStyle('#dc2626'));
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    // Handle view details
    const handleView = (incentive: Incentive) => setSelected(incentive);

    const hasFilters = !!(searchTerm || dateFrom || dateTo);
    const currentData = incentives.data || [];

    // Generate pagination links
    const paginationLinks = useMemo(() => {
        const links = [];
        const totalPages = Math.ceil(incentives.total / itemsPerPage);

        const buildUrl = (page: number) => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (dateFrom) params.append('date_from', dateFrom.toISOString().split('T')[0]);
            if (dateTo) params.append('date_to', dateTo.toISOString().split('T')[0]);
            params.append('page', String(page));
            params.append('per_page', String(itemsPerPage));
            return `/hr/incentives?${params.toString()}`;
        };

        // Previous button
        links.push({
            active: false,
            label: 'pagination.previous',
            url: currentPage > 1 ? buildUrl(currentPage - 1) : null
        });

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            links.push({ active: false, label: '1', url: buildUrl(1) });
            if (startPage > 2) links.push({ active: false, label: '...', url: null });
        }

        for (let i = startPage; i <= endPage; i++) {
            links.push({
                active: currentPage === i,
                label: String(i),
                url: buildUrl(i)
            });
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) links.push({ active: false, label: '...', url: null });
            links.push({ active: false, label: String(totalPages), url: buildUrl(totalPages) });
        }

        // Next button
        links.push({
            active: false,
            label: 'pagination.next',
            url: currentPage < totalPages ? buildUrl(currentPage + 1) : null
        });

        return links;
    }, [currentPage, incentives.total, itemsPerPage, searchTerm, dateFrom, dateTo]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incentives" />
            {/* <CustomToast /> */}

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
                {/* Header with Create Button */}
                <div className="flex justify-between items-center pp-header">
                    <CustomHeader
                        title="Incentives"
                        icon={<Coins className="h-6 w-6" />}
                        description="Manage employee incentives across payroll periods"
                    />
                    <Button onClick={handleCreate} className="bg-[#1d4791] hover:bg-[#1d4791]/90">
                        <Plus className="h-4 w-4 mr-2" /> Add Incentive
                    </Button>
                </div>

                {/* Table Section */}
                <CardContent className="p-0 pp-row">
                    <CustomTable
                        columns={IncentivesTableConfig.columns}
                        actions={IncentivesTableConfig.actions}
                        data={currentData}
                        from={incentives.from || 0}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        title="Incentive Lists"
                        isLoading={isLoading}
                        toolbar={
                            <EmployeeFilterBar
                                filters={{ search: true, position: false, branch: false, site: false, date: true, status: false }}
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
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
                            incentives.total === 0 && !hasFilters ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-primary/10 p-6 mb-4">
                                        <Briefcase className="h-12 w-12 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No incentives yet</h3>
                                    <p className="text-muted-foreground mb-4">Create your first incentive to get started</p>
                                    <Button onClick={handleCreate} className="bg-[#1d4791] hover:bg-[#1d4791]/90">
                                        Create First Incentive
                                    </Button>
                                </div>
                            ) : currentData.length === 0 && hasFilters ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-muted p-6 mb-4">
                                        <Search className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        No incentives match "{searchTerm}" {dateFrom || dateTo ? 'in the selected date range' : ''}
                                    </p>
                                    <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
                                </div>
                            ) : null
                        }
                    />

                    {/* Pagination */}
                    {incentives.total > 0 && (
                        <div className="px-6 pb-4">
                            <CustomPagination
                                pagination={{
                                    from: incentives.from || 0,
                                    to: incentives.to || 0,
                                    total: incentives.total || 0,
                                    links: paginationLinks,
                                    current_page: currentPage,
                                    onPageChange: handlePageChange
                                }}
                                perPage={String(itemsPerPage)}
                                onPerPageChange={handlePerPageChange}
                                totalCount={totalCount || incentives.total}
                                filteredCount={filteredCount || incentives.total}
                                search={searchTerm}
                                resourceName="incentive"
                            />
                        </div>
                    )}

                    {/* Delete Confirmation Dialog */}
                    <DeleteConfirmationDialog
                        isOpen={deleteDialogOpen}
                        onClose={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}
                        onConfirm={confirmDelete}
                        title="Delete Incentive"
                        itemName={itemToDelete?.incentive_name || 'this incentive'}
                        isLoading={isDeleting}
                        confirmText="Delete incentive"
                    />
                </CardContent>
            </div>

            {/* View Details Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-900 rounded-xl">
                                <Eye className="h-5 w-5 text-white" />
                            </div>
                            <DialogTitle className="text-2xl">
                                Show Incentive: <span className="text-xl text-gray-500 font-medium">{selected?.incentive_name}</span>
                            </DialogTitle>
                        </div>
                        <div className="mt-2">
                            <span className="font-semibold">Incentive Amount: </span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-md px-4 py-1 ml-2">
                                {formatCurrency(selected?.incentive_amount ?? 0)}
                            </Badge>
                        </div>
                        {selected?.is_daily && (
                            <div className="mt-1">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    Daily Incentive
                                </Badge>
                            </div>
                        )}
                    </DialogHeader>
                    <div>
                        <h4 className="font-semibold mb-2">Payroll Period</h4>
                        {selected?.payroll_period ? (
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm">
                                    {formatDateSimple(selected.payroll_period.start_date)} - {formatDateSimple(selected.payroll_period.end_date)}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Payment Date: {formatDateSimple(selected.payroll_period.pay_date)}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg text-gray-500">
                                No payroll period assigned
                            </div>
                        )}

                        <h4 className="font-semibold mb-3">Assigned Employees ({selected?.employees?.length || 0})</h4>
                        {selected?.employees && selected.employees.length > 0 ? (
                            <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                                {selected.employees.map(emp => (
                                    <div key={emp.id} className="p-3 py-2 hover:bg-slate-50">
                                        <div className="font-medium">{emp.user?.name || `Employee #${emp.id}`}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {emp.position?.pos_name && <span>Position: {emp.position.pos_name}</span>}
                                            {emp.position?.pos_name && emp.branch?.branch_name && ' | '}
                                            {emp.branch?.branch_name && <span>Branch: {emp.branch.branch_name}</span>}
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