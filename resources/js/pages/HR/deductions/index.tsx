import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/hr-layout';
import { Button } from '@/components/ui/button';
import { Briefcase, HandCoins, Plus, Search } from 'lucide-react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CustomTable } from '@/components/custom-table';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { CustomPagination } from '@/components/custom-pagination';
import type { BreadcrumbItem } from '@/types';
import { CustomHeader } from '@/components/custom-header';
// import { CustomToast, toast } from '@/components/custom-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';
import { DeductionFormModal } from '@/components/deductions/deduction-form-modal';
import { EmployeeSelectionModal } from '@/components/employee-selection-modal';
import DeductionController from '@/actions/App/Http/Controllers/HrRole/HRDeductionController';
import { toast } from 'sonner';
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Deductions', href: '/hr/deductions' }];

interface Employee {
    id: number;
    user?: { name: string };
    position?: { pos_name: string };
    branch?: { branch_name: string };
}

interface Deduction {
    id: number;
    deduction_name: string;
    deduction_amount: string | number;
    payroll_period?: { start_date: string; end_date: string; pay_date: string };
    employees?: Employee[];
}

interface PaginatedDeductions {
    data: Deduction[];
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    deductions: PaginatedDeductions;
    payroll_periods?: Array<{ id: number; start_date?: string; end_date?: string }>;
    employees?: Array<{ id: number; emp_code: string | number | null; user?: { name: string } | null }>;
    editingDeduction?: Deduction;
    isEditing?: boolean;
    filters?: {
        search?: string;
        date_from?: string;
        date_to?: string;
        page?: number;
        per_page?: number;
    };
}

const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(amount));

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

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

export default function Index({
    deductions,
    payroll_periods = [],
    employees = [],
    editingDeduction,
    isEditing = false,
    filters = {}
}: Props) {
    const { delete: destroy } = useForm();
    const { props } = usePage<{ flash?: { success?: string; error?: string; warning?: string; info?: string } }>();
    const [selected, setSelected] = useState<Deduction | null>(null);

    // Local state for filters
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined
    );

    const [currentPage, setCurrentPage] = useState(deductions.current_page || 1);
    const [itemsPerPage, setItemsPerPage] = useState(deductions.per_page || 10);
    const [isLoading, setIsLoading] = useState(false);

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

        const url = `/deductions?${params.toString()}`;

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
    }, [debouncedSearchTerm, debouncedDateFrom, debouncedDateTo]);

    // Update local state when props change
    useEffect(() => {
        setCurrentPage(deductions.current_page);
    }, [deductions.current_page]);

    const handlePageChange = (page: number) => {
        navigateWithFilters({ page });
    };

    const handlePerPageChange = (value: string) => {
        const newPerPage = Number(value);
        setItemsPerPage(newPerPage);
        navigateWithFilters({ perPage: newPerPage, page: 1 });
    };

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
        router.visit('/hr/deductions', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDeleteClick = (deduction: Deduction) => {
        setItemToDelete(deduction);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        destroy(DeductionController.destroy(itemToDelete.id).url, {
            onSuccess: () => {
                // Flash message will be shown by global useEffect
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete deduction.';
                toast.error(errorMessage, toastStyle('#dc2626'));
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleView = (deduction: Deduction) => setSelected(deduction);

    const hasFilters = !!(searchTerm || dateFrom || dateTo);
    const currentData = deductions.data || [];
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const getEmployeeName = useCallback((emp: any) =>
        emp.user?.name || 'Unnamed Employee', []);

    const columns = [
        {
            key: 'deduction_name',
            label: 'Deduction Name',
            render: (row: Deduction) => <span className="font-medium">{row.deduction_name}</span>,
        },
        {
            key: 'deduction_amount',
            label: 'Amount',
            render: (row: Deduction) => formatCurrency(row.deduction_amount),
        },
        {
            key: 'payroll_period',
            label: 'Payroll Period',
            render: (row: Deduction) => row.payroll_period ? (
                <div>
                    <div>{formatDate(row.payroll_period.start_date)} - {formatDate(row.payroll_period.end_date)}</div>
                    <div className="text-xs text-muted-foreground">Pay: {formatDate(row.payroll_period.pay_date)}</div>
                </div>
            ) : <span className="text-muted-foreground">N/A</span>,
        },
        {
            key: 'employees',
            label: 'Employees',
            render: (row: Deduction) => {
                const count = row.employees?.length ?? 0;
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {count} {count === 1 ? 'Employee' : 'Employees'}
                    </Badge>
                );
            },
        },
        { key: 'actions', label: 'Actions', isAction: true },
    ];

    const actions = [
        { label: 'View', icon: 'Eye' as const, route: '' },
        { label: 'Edit', icon: 'Pencil' as const, route: '' },
        { label: 'Delete', icon: 'Trash2' as const, route: '' },
    ];

    const paginationLinks = useMemo(() => {
        const links = [];
        const totalPages = Math.ceil(deductions.total / itemsPerPage);

        const buildUrl = (page: number) => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (dateFrom) params.append('date_from', dateFrom.toISOString().split('T')[0]);
            if (dateTo) params.append('date_to', dateTo.toISOString().split('T')[0]);
            params.append('page', String(page));
            params.append('per_page', String(itemsPerPage));
            return `/hr/deductions?${params.toString()}`;
        };

        links.push({
            active: false,
            label: 'pagination.previous',
            url: currentPage > 1 ? buildUrl(currentPage - 1) : null
        });

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

        links.push({
            active: false,
            label: 'pagination.next',
            url: currentPage < totalPages ? buildUrl(currentPage + 1) : null
        });

        return links;
    }, [currentPage, deductions.total, itemsPerPage, searchTerm, dateFrom, dateTo]);

    const handleEdit = (deduction: Deduction) => {
        router.get(DeductionController.edit(deduction.id).url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deductions" />
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
                <div className="flex justify-between items-center pp-header">
                    <CustomHeader title="Deductions" icon={<HandCoins className="h-6 w-6" />} description='Manage and track employee deductions' />
                    <Link href={DeductionController.create()} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
                        <Plus className="h-4 w-4 mr-2" /> Add Deduction
                    </Link>
                </div>

                <CardContent className="p-0 pp-row">
                    <CustomTable
                        columns={columns}
                        actions={actions}
                        data={currentData}
                        from={deductions.from || 0}
                        onDelete={handleDeleteClick}
                        onView={handleView}
                        onEdit={handleEdit}
                        title="Deductions List"
                        isLoading={isLoading}
                        toolbar={
                            <EmployeeFilterBar
                                filters={{ search: true, position: false, branch: false, site: false, date: true, status: false }}
                                searchTerm={searchTerm}
                                onSearchChange={handleSearch}
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                onDateFromChange={handleDateFromChange}
                                onDateToChange={handleDateToChange}
                                onClearAll={clearFilters}
                                searchPlaceholder="Search by deduction name..."
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
                            deductions.total === 0 && !hasFilters ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-primary/10 p-6 mb-4"><HandCoins className="h-12 w-12 text-primary" /></div>
                                    <h3 className="text-xl font-semibold mb-2">No deductions yet</h3>
                                    <p className="text-muted-foreground mb-4">Create your first deduction to get started</p>
                                    <Link href={DeductionController.create()} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap">Create First Deduction</Link>
                                </div>
                            ) : currentData.length === 0 && hasFilters ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-muted p-6 mb-4"><Search className="h-12 w-12 text-muted-foreground" /></div>
                                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        No deductions match "{searchTerm}" {dateFrom || dateTo ? 'in the selected date range' : ''}
                                    </p>
                                    <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
                                </div>
                            ) : null
                        }
                    />

                    {deductions.total > 0 && (
                        <div className="px-6 pb-4">
                            <CustomPagination
                                pagination={{
                                    from: deductions.from || 0,
                                    to: deductions.to || 0,
                                    total: deductions.total || 0,
                                    links: paginationLinks,
                                    current_page: currentPage
                                }}
                                perPage={String(itemsPerPage)}
                                onPerPageChange={handlePerPageChange}
                                totalCount={deductions.total}
                                filteredCount={deductions.total}
                                search={searchTerm}
                                resourceName="deduction"
                            />
                        </div>
                    )}

                    <DeleteConfirmationDialog
                        isOpen={deleteDialogOpen}
                        onClose={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}
                        onConfirm={confirmDelete}
                        title="Delete Deduction"
                        itemName={itemToDelete?.deduction_name || 'this deduction'}
                        isLoading={isDeleting}
                        confirmText='Delete deduction'
                    />
                </CardContent>
            </div>

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selected?.deduction_name}</DialogTitle>
                        <Badge variant="secondary" className="w-fit bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-lg px-4 py-1 mt-2">
                            {formatCurrency(selected?.deduction_amount ?? 0)}
                        </Badge>
                    </DialogHeader>

                    {selected?.payroll_period && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <h4 className="font-semibold mb-2">Payroll Period</h4>
                            <p className="text-sm">{formatDate(selected.payroll_period.start_date)} - {formatDate(selected.payroll_period.end_date)}</p>
                            <p className="text-sm text-muted-foreground mt-1">Payment Date: {formatDate(selected.payroll_period.pay_date)}</p>
                        </div>
                    )}

                    <h4 className="font-semibold">Assigned Employees ({selected?.employees?.length ?? 0})</h4>
                    {selected?.employees?.length ? (
                        <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                            {selected.employees.map(emp => (
                                <div key={emp.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="font-medium">{emp.user?.name ?? `Employee #${emp.id}`}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {[emp.position?.pos_name, emp.branch?.branch_name].filter(Boolean).join(' • ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border rounded-md">
                            No employees assigned to this deduction
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}