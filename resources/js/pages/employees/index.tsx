import { Head, Link, useForm, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Users, Search, UserPlus, Archive, UsersRound, Trash2 } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { CustomHeader } from '@/components/custom-header';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import type { BranchData } from '@/components/employee/employee-filter-bar';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { EmployeesTableConfig } from '@/config/tables/employees-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: '/employees' },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
    id: number;
    position: { pos_name: string; deleted_at: string | null } | null;
    branch: { branch_name: string; branch_address: string } | null;
    site: { site_name: string; id: number } | null;
    user: { name: string; email: string };
    slug_emp: string;
    emp_code: string | number;
    pay_frequency: string;
    contract_start_date: string;
    contract_end_date: string;
    employee_status: string;
    hire_date?: string;
    created_at?: string;
    deleted_at?: string | null;
}

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface FilterProps {
    search?: string;
    positions?: string;
    branch?: string;
    site?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    perPage?: string;
    show_archived?: string;
}

interface PageProps {
    employees: {
        data: Employee[];
        perPage: number;
        total: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
        links: LinkProps[];
    };
    archivedEmployees: Employee[];
    branchesData: BranchData[];
    allPositions: string[];
    filters?: FilterProps;
    totalCount: number;
    filteredCount: number;
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function Index({
    employees,
    archivedEmployees = [],
    branchesData = [],
    allPositions = [],
    filters = {},
    totalCount,
    filteredCount,
}: PageProps) {
    const { delete: destroy } = useForm();

    // Tab state
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>(
        filters.show_archived === 'true' ? 'archived' : 'active'
    );

    // ── Filter state
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [selectedPositions, setSelectedPositions] = useState<string[]>(
        filters.positions ? filters.positions.split(',').filter(Boolean) : [],
    );
    const [selectedBranch, setSelectedBranch] = useState(filters.branch ?? '');
    const [selectedSite, setSelectedSite] = useState(filters.site ?? '');
    const [status, setStatus] = useState<string>(filters.status ?? '');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined,
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined,
    );

    // ── Bulk selection state ─────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    // ── Archived pagination state (client-side) ──────────────────────────────
    // ── Archived pagination state (client-side) ──────────────────────────────
    const [archivedPage, setArchivedPage] = useState(1);
    const [archivedPerPage, setArchivedPerPage] = useState(10);

    // Paginate archived employees
    const paginatedArchived = useMemo(() => {
        const start = (archivedPage - 1) * archivedPerPage;
        const end = start + archivedPerPage;
        return archivedEmployees.slice(start, end);
    }, [archivedEmployees, archivedPage, archivedPerPage]);

    const archivedTotal = archivedEmployees.length;
    const archivedLastPage = Math.ceil(archivedTotal / archivedPerPage);
    const archivedFrom = archivedTotal === 0 ? 0 : (archivedPage - 1) * archivedPerPage + 1;
    const archivedTo = Math.min(archivedPage * archivedPerPage, archivedTotal);

    // Generate page links (same format as Laravel's paginator)
    const archivedLinks = useMemo(() => {
        const links = [];
        const maxVisible = 5; // show at most 5 page numbers
        let startPage = Math.max(1, archivedPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(archivedLastPage, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // Previous button
        links.push({
            url: archivedPage > 1 ? '#' : null,
            label: '&laquo; Previous',
            active: false,
        });

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            links.push({
                url: '#',
                label: String(i),
                active: i === archivedPage,
            });
        }

        // Next button
        links.push({
            url: archivedPage < archivedLastPage ? '#' : null,
            label: 'Next &raquo;',
            active: false,
        });

        return links;
    }, [archivedPage, archivedLastPage]);

    const archivedPagination = {
        data: paginatedArchived,
        total: archivedTotal,
        perPage: archivedPerPage,
        current_page: archivedPage,
        last_page: archivedLastPage,
        from: archivedFrom,
        to: archivedTo,
        links: archivedLinks,   // ✅ now contains numbered page buttons
    };

    // ── Central navigation function ───────────────────────────────────────────
    function applyFilters(overrides: Partial<{
        search: string;
        positions: string[];
        branch: string;
        site: string;
        status: string;
        from: Date | undefined;
        to: Date | undefined;
        perPage: string;
        showArchived: boolean;
    }> = {}) {
        const s = overrides.search ?? searchTerm;
        const pos = overrides.positions ?? selectedPositions;
        const br = overrides.branch ?? selectedBranch;
        const si = overrides.site ?? selectedSite;
        const st = overrides.status ?? status;
        const from = overrides.from !== undefined ? overrides.from : dateFrom;
        const to = overrides.to !== undefined ? overrides.to : dateTo;
        const pp = overrides.perPage ?? String(employees.perPage ?? 10);
        const showArchived = overrides.showArchived !== undefined ? overrides.showArchived : (activeTab === 'archived');

        const params: Record<string, string> = {};
        if (s.trim()) params.search = s.trim();
        if (pos.length) params.positions = pos.join(',');
        if (br) params.branch = br;
        if (si) params.site = si;
        if (st) params.status = st;
        if (from) params.date_from = format(from, 'yyyy-MM-dd');
        if (to) params.date_to = format(to, 'yyyy-MM-dd');
        if (pp && pp !== '10') params.perPage = pp;
        if (showArchived) params.show_archived = 'true';

        router.get('/employees', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }



    // ── Tab change handler (reset filters, selection, archived pagination) ───
    const handleTabChange = (value: string) => {
        const newTab = value as 'active' | 'archived';
        setActiveTab(newTab);
        setSearchTerm('');
        setSelectedPositions([]);
        setSelectedBranch('');
        setSelectedSite('');
        setStatus('');
        setDateFrom(undefined);
        setDateTo(undefined);
        setSelectedIds([]);
        // Reset archived pagination when switching to archived tab
        if (newTab === 'archived') {
            setArchivedPage(1);
            setArchivedPerPage(10);
        }
        applyFilters({
            showArchived: newTab === 'archived',
            search: '',
            positions: [],
            branch: '',
            site: '',
            status: '',
            from: undefined,
            to: undefined,
        });
    };

    // ── Search debounce ───────────────────────────────────────────────────────
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 300);
    };

    // ── Filter handlers ───────────────────────────────────────────────────────
    const handleBranchChange = (branch: string) => {
        setSelectedBranch(branch);
        setSelectedSite('');
        applyFilters({ branch, site: '' });
    };

    const handlePositionsChange = (positions: string[]) => {
        setSelectedPositions(positions);
        applyFilters({ positions });
    };

    const handleSiteChange = (site: string) => {
        setSelectedSite(site);
        applyFilters({ site });
    };

    const handleStatusChange = (value: string) => {
        setStatus(value);
        applyFilters({ status: value });
    };

    const handleDateFromChange = (from: Date | undefined) => {
        setDateFrom(from);
        applyFilters({ from });
    };

    const handleDateToChange = (to: Date | undefined) => {
        setDateTo(to);
        applyFilters({ to });
    };

    const handlePerPageChange = (value: string) => {
        applyFilters({ perPage: value });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedPositions([]);
        setSelectedBranch('');
        setSelectedSite('');
        setStatus('');
        setDateFrom(undefined);
        setDateTo(undefined);
        router.get('/employees', { show_archived: activeTab === 'archived' ? 'true' : undefined }, {
            preserveState: true,
            replace: true
        });
    };

    // ── Bulk action handlers ─────────────────────────────────────────────────
    const handleBulkArchive = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Move ${selectedIds.length} employee(s) to archive?`)) return;
        setBulkLoading(true);
        try {
            await router.post('/employees/bulk-destroy', {
                ids: selectedIds,
                _method: 'DELETE'
            });
            setSelectedIds([]);
            toast.success(`${selectedIds.length} employee(s) moved to archive.`);
        } catch (error) {
            toast.error('Failed to archive employees.');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkRestore = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Restore ${selectedIds.length} employee(s)?`)) return;
        setBulkLoading(true);
        try {
            await router.post('/employees/bulk-restore', {
                ids: selectedIds,
                _method: 'PUT'
            });
            setSelectedIds([]);
            toast.success(`${selectedIds.length} employee(s) restored.`);
        } catch (error) {
            toast.error('Failed to restore employees.');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleRestore = (employee: Employee) => {
        if (!confirm(`Restore ${employee.user?.name || employee.emp_code}?`)) return;

        router.put(route('employees.restore', employee.slug_emp), {}, {
            onSuccess: () => {
                toast.success('Employee restored');
                setSelectedIds([]);
            },
            onError: () => toast.error('Restore failed'),
        });
    };


    // ── Single delete confirmation ───────────────────────────────────────────
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const archivedActions = [
        { label: 'View', icon: 'Eye', route: 'employees.show' },
        { label: 'Restore', icon: 'RotateCcw', route: null },
    ];


    const handleDeleteClick = (employee: Employee) => {
        setItemToDelete(employee);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        const destroyUrl = EmployeeController.destroy(itemToDelete.slug_emp).url;

        destroy(destroyUrl, {
            onSuccess: (page) => {
                const flash = (page.props as any).flash;
                if (flash?.error) {
                    toast.error(flash.error);
                } else if (flash?.success) {
                    toast.success(flash.success);
                } else {
                    toast.success('Employee deleted successfully');
                }
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                let errorMessage = 'Failed to delete employee';
                if (typeof errors === 'object') {
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') errorMessage = firstError;
                    else if (Array.isArray(firstError) && firstError.length > 0) errorMessage = firstError[0];
                } else if (typeof errors === 'string') errorMessage = errors;
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleView = (employee: Employee) => {
        router.get(EmployeeController.show(employee.slug_emp).url);
    };

    const handleEdit = (employee: Employee) => {
        router.get(EmployeeController.edit(employee.slug_emp).url);
    };

    // ── Helper: current data based on tab ────────────────────────────────────
    const currentData = activeTab === 'active'
        ? employees
        : { ...employees, data: paginatedArchived, total: archivedTotal };
    const currentTotalCount = activeTab === 'active' ? totalCount : archivedTotal;
    const currentFilteredCount = activeTab === 'active' ? filteredCount : archivedTotal;

    const activeFiltersCount = [
        searchTerm.trim(),
        ...selectedPositions,
        selectedBranch,
        selectedSite,
        status !== '',
        dateFrom,
        dateTo,
    ].filter(Boolean).length;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />

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

            {/* Page header */}
            <div className="grid grid-rows-1 justify-center mx-8 md:grid-cols-2 md:mx-8 mt-3 lg:flex lg:justify-between items-center lg:mx-8 lg:mt-4 lg:-mb-2 pp-header">
                <CustomHeader
                    icon={<Users />}
                    title="Employees"
                    description="Manage your workforce: add, edit, and organize employee records with ease."
                />
                <Link href="/employees/create">
                    <Button className="hover:cursor-pointer flex ml-auto">
                        <UserPlus className="h-5 w-5" />
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-sm font-medium">Create Employee</span>
                        </div>
                    </Button>
                </Link>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pp-row">
                <div className="mx-4">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="active" className="flex items-center gap-2">
                                <UsersRound className="h-4 w-4" />
                                Active Employees
                                <Badge variant="secondary" className="ml-2">
                                    {totalCount}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="archived" className="flex items-center gap-2">
                                <Archive className="h-4 w-4" />
                                Archived Employees
                                <Badge variant="secondary" className="ml-2">
                                    {archivedTotal}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        {/* Active Tab Content */}
                        <TabsContent value="active" className="mt-6">
                            {employees.total === 0 && activeFiltersCount === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="rounded-full bg-gray-100 p-6 mb-4">
                                        <Users className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
                                    <p className="text-gray-500 mb-6 max-w-sm">
                                        Get started by creating your first employee.
                                    </p>
                                    <Link href="/employees/create">
                                        <Button>Create Your First Employee</Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <CustomTable
                                        title="Active Employee Lists"
                                        columns={EmployeesTableConfig.columns}
                                        actions={EmployeesTableConfig.actions}
                                        data={employees.data}
                                        from={employees.from ?? 1}
                                        onDelete={handleDeleteClick}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        selectable={true}
                                        selectedIds={selectedIds}
                                        onSelectChange={setSelectedIds}
                                        selectAll={selectedIds.length === employees.data.length && employees.data.length > 0}
                                        toolbar={
                                            <EmployeeFilterBar
                                                filters={{
                                                    search: true,
                                                    position: true,
                                                    branch: true,
                                                    site: true,
                                                    date: true,
                                                    status: true,
                                                }}
                                                allPositions={allPositions}
                                                branchesData={branchesData}
                                                searchTerm={searchTerm}
                                                selectedPositions={selectedPositions}
                                                selectedBranch={selectedBranch}
                                                selectedSite={selectedSite}
                                                status={status}
                                                dateFrom={dateFrom}
                                                dateTo={dateTo}
                                                onSearchChange={handleSearchChange}
                                                onPositionsChange={handlePositionsChange}
                                                onBranchChange={handleBranchChange}
                                                onSiteChange={handleSiteChange}
                                                onStatusChange={handleStatusChange}
                                                onDateFromChange={handleDateFromChange}
                                                onDateToChange={handleDateToChange}
                                                onClearAll={clearFilters}
                                                searchPlaceholder="Search by ID or name..."
                                                dateLabel="Hire Date"
                                            />
                                        }
                                        filterEmptyState={
                                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                                    No results found
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                                    {searchTerm && selectedPositions.length > 0
                                                        ? `No employees matching "${searchTerm}" in selected positions.`
                                                        : searchTerm
                                                            ? `No employees matching "${searchTerm}".`
                                                            : selectedBranch && selectedSite
                                                                ? `No employees in ${selectedBranch} / ${selectedSite}.`
                                                                : selectedBranch
                                                                    ? `No employees in ${selectedBranch}.`
                                                                    : dateFrom || dateTo
                                                                        ? 'No employees in the selected date range.'
                                                                        : 'No employees match your current filters.'}
                                                </p>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear filters
                                                </Button>
                                            </div>
                                        }
                                    />
                                    <CustomPagination
                                        pagination={employees}
                                        perPage={String(employees.perPage ?? 10)}
                                        onPerPageChange={handlePerPageChange}
                                        totalCount={currentTotalCount}
                                        filteredCount={currentFilteredCount}
                                        search={searchTerm}
                                        resourceName="employee"
                                    />
                                </>
                            )}
                        </TabsContent>

                        {/* Archived Tab Content */}
                        <TabsContent value="archived" className="mt-6">
                            {archivedTotal === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="rounded-full bg-gray-100 p-6 mb-4">
                                        <Archive className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No archived employees</h3>
                                    <p className="text-gray-500 mb-2 max-w-sm">
                                        Archived employees will appear here when you delete them.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <CustomTable
                                        title="Archived Employee Lists"
                                        columns={EmployeesTableConfig.columns}
                                        // actions={EmployeesTableConfig.actions}
                                        data={paginatedArchived}
                                        from={archivedFrom}
                                        onDelete={handleDeleteClick}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        actions={archivedActions}                // ← second one (overwrites? Actually duplicate prop)
                                        onRestore={handleRestore}
                                        selectable={true}
                                        selectedIds={selectedIds}
                                        onSelectChange={setSelectedIds}
                                        selectAll={selectedIds.length === paginatedArchived.length && paginatedArchived.length > 0}
                                        toolbar={
                                            <EmployeeFilterBar
                                                filters={{
                                                    search: true,
                                                    position: true,
                                                    branch: true,
                                                    site: true,
                                                    status: false,
                                                    date: false,
                                                }}
                                                allPositions={allPositions}
                                                branchesData={branchesData}
                                                searchTerm={searchTerm}
                                                selectedPositions={selectedPositions}
                                                selectedBranch={selectedBranch}
                                                selectedSite={selectedSite}
                                                status={status}
                                                dateFrom={dateFrom}
                                                dateTo={dateTo}
                                                onSearchChange={handleSearchChange}
                                                onPositionsChange={handlePositionsChange}
                                                onBranchChange={handleBranchChange}
                                                onSiteChange={handleSiteChange}
                                                onStatusChange={handleStatusChange}
                                                onDateFromChange={handleDateFromChange}
                                                onDateToChange={handleDateToChange}
                                                onClearAll={clearFilters}
                                                searchPlaceholder="Search archived employees..."
                                                dateLabel="Deletion Date"
                                            />
                                        }
                                        filterEmptyState={
                                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                                                    No archived employees found
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                                    No archived employees match your current filters.
                                                </p>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear filters
                                                </Button>
                                            </div>
                                        }
                                    />
                                    <CustomPagination
                                        pagination={archivedPagination}
                                        perPage={String(archivedPerPage)}
                                        onPerPageChange={(value) => {
                                            setArchivedPerPage(parseInt(value, 10));
                                            setArchivedPage(1);
                                        }}
                                        onPageChange={(page) => setArchivedPage(page)}
                                        totalCount={archivedTotal}
                                        filteredCount={archivedTotal}
                                        search={searchTerm}
                                        resourceName="archived employee"
                                    />
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Floating Bulk Action Bar */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center gap-3 animate-fadeUp">
                        <span className="text-sm font-medium">{selectedIds.length} selected</span>
                        {activeTab === 'active' ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleBulkArchive}
                                disabled={bulkLoading}
                            >
                                Move to Archive
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkRestore}
                                    disabled={bulkLoading}
                                >
                                    Restore
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                            Cancel
                        </Button>
                    </div>
                )}

                <DeleteConfirmationDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => {
                        setDeleteDialogOpen(false);
                        setItemToDelete(null);
                    }}
                    onConfirm={confirmDelete}
                    title='Delete employee'
                    itemName={itemToDelete?.user?.name || itemToDelete?.emp_code || 'this employee'}
                    isLoading={isDeleting}
                    confirmText='Delete employee'
                />
            </div>
        </AppLayout>
    );
}