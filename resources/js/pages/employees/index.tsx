/**
 * employees/index.tsx
 *
 * Architecture: ALL filtering is server-side via query params.
 *
 * Why this matters:
 *   The controller paginates the full employee list before sending it to the
 *   browser. `employees.data` only contains the current page (e.g. 10 rows).
 *   Client-side filtering against that slice is meaningless — searching for
 *   "John" would only find Johns on page 1, not across all 500 employees.
 *
 * How it works now:
 *   Every filter change calls applyFilters(), which builds a single query-string
 *   object containing ALL active params (search, positions, branch, site, status,
 *   date_from, date_to, perPage) and fires ONE router.get(). The controller
 *   receives these params, filters + paginates the full dataset, and returns
 *   the correct page. Inertia re-renders with the fresh data.
 *
 * Pagination fix:
 *   Previously a useEffect on dateFrom/dateTo was calling router.get() with
 *   ONLY the date params, which silently dropped the `page` param from any
 *   URL set by clicking a pagination link. Every navigation was immediately
 *   overwritten back to page 1. That useEffect is gone. Every navigation —
 *   including date picker changes — goes through applyFilters(), which always
 *   resets to page 1 (correct: filters should restart from the beginning).
 *
 * Local state that stays client-side:
 *   - searchTerm (debounced via the 300ms timer below — avoids a server round
 *     trip on every keystroke)
 *   - UI state only (no derived filteredEmployees memo)
 *
 * FilterProps now includes all filter keys so they survive perPage changes.
 */

import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useState, useRef } from 'react';
import type { BreadcrumbItem } from '@/types';
import EmmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { Users, Search, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

import { CustomTable } from '@/components/custom-table';
import { BranchData, EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { EmployeesTableConfig } from '@/config/tables/employees-table';
import { CustomPagination } from '@/components/custom-pagination';
import { toast } from 'sonner';
import { CustomHeader } from '@/components/custom-header';

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
}

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

/**
 * All filter keys the controller understands.
 * Keeping them in one interface ensures nothing is silently dropped when
 * building the query string.
 */
interface FilterProps {
    search?: string;
    positions?: string;    // comma-separated list
    branch?: string;
    site?: string;
    status?: string;    // '' (all) | 'active' | 'inactive'
    date_from?: string;
    date_to?: string;
    perPage?: string;
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
    branchesData: BranchData[];
    /** All distinct position names from the full (unfiltered) employee list.
     *  Sent by the controller so the Position popover works across all pages. */
    allPositions: string[];
    filters?: FilterProps;
    totalCount: number;
    filteredCount: number;
}

// ─── Page component ───────────────────────────────────────────────────────────
export default function Index({
    employees,
    branchesData = [],
    allPositions = [],
    filters = {},
    totalCount,
    filteredCount,
}: PageProps) {
    const { delete: destroy } = useForm();
    console.log(EmployeesTableConfig.actions);

    // ── Filter state — initialised from URL params so the UI reflects the
    //    current server-side filter on first render / browser back-forward.
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [selectedPositions, setSelectedPositions] = useState<string[]>(
        filters.positions ? filters.positions.split(',').filter(Boolean) : [],
    );
    const [selectedBranch, setSelectedBranch] = useState(filters.branch ?? '');
    const [selectedSite, setSelectedSite] = useState(filters.site ?? '');
    // '' = All (default, renders everyone)
    // 'active' = Active only
    // 'inactive' = Inactive only
    const [status, setStatus] = useState<string>(filters.status ?? '');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined,
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined,
    );

    // ── Central navigation function ───────────────────────────────────────────
    /**
     * Builds the complete query-string from ALL active filters and fires a
     * single router.get(). Always resets to page 1 (any filter change
     * invalidates the current page position).
     *
     * This is the ONLY place that calls router.get() for filters.
     * Keeping it central avoids the race condition where two separate effects
     * were each calling router.get() and overwriting each other.
     */
    function applyFilters(overrides: Partial<{
        search: string;
        positions: string[];
        branch: string;
        site: string;
        status: string;
        from: Date | undefined;
        to: Date | undefined;
        perPage: string;
    }> = {}) {
        const s = overrides.search ?? searchTerm;
        const pos = overrides.positions ?? selectedPositions;
        const br = overrides.branch ?? selectedBranch;
        const si = overrides.site ?? selectedSite;
        const st = overrides.status ?? status;
        const from = overrides.from !== undefined ? overrides.from : dateFrom;
        const to = overrides.to !== undefined ? overrides.to : dateTo;
        const pp = overrides.perPage ?? String(employees.perPage ?? 10);

        const params: Record<string, string> = {};
        if (s.trim()) params.search = s.trim();
        if (pos.length) params.positions = pos.join(',');
        if (br) params.branch = br;
        if (si) params.site = si;
        if (st) params.status = st;      // omit when '' (all — server default)
        if (from) params.date_from = format(from, 'yyyy-MM-dd');
        if (to) params.date_to = format(to, 'yyyy-MM-dd');
        if (pp && pp !== '10') params.perPage = pp;     // omit when default

        router.get('/employees', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    // ── Search debounce — 100 ms so we don't hit the server on every keystroke
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: value });
        }, 100);
    };

    // ── Branch change resets site ────────────────────────────────────────────
    const handleBranchChange = (branch: string) => {
        setSelectedBranch(branch);
        setSelectedSite('');
        applyFilters({ branch, site: '' });
    };

    // ── Individual filter handlers ────────────────────────────────────────────
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

    // ── Per-page change ───────────────────────────────────────────────────────
    const handlePerPageChange = (value: string) => {
        applyFilters({ perPage: value });
    };

    // ── Clear all ─────────────────────────────────────────────────────────────
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedPositions([]);
        setSelectedBranch('');
        setSelectedSite('');
        setStatus('');
        setDateFrom(undefined);
        setDateTo(undefined);
        // Navigate to a clean URL — no filter params at all
        router.get('/employees', {}, { preserveState: true, replace: true });
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = (employee: Employee) => {
        if (confirm("Are you sure you want to delete this employee?")) {
            destroy(EmmployeeController.destroy(employee.slug_emp).url, {
                onSuccess: (page) => {
                    const successMessage = (page.props as any).flash?.success || 'Employee deleted successfully.';
                    toast.success(successMessage);
                },
                onError: (errors) => {
                    const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete employee, please try again.';
                    toast.error(errorMessage);
                }
            });
        }
    };

    // ── Active filter count (for the Clear button badge) ─────────────────────
    const activeFiltersCount = [
        searchTerm.trim(),
        ...selectedPositions,
        selectedBranch,
        selectedSite,
        status !== '',   // any non-default status selection counts as a filter
        dateFrom,
        dateTo,
    ].filter(Boolean).length;

    const handleView = (employee: Employee) => {
        // Use your existing helper or router
        router.get(EmmployeeController.show(employee.slug_emp).url);
    };

    const handleEdit = (employee: Employee) => {
        router.get(EmmployeeController.edit(employee.slug_emp).url);
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex flex-1 flex-col gap-4 p-4">

                {/* Page header */}
                <div className="flex justify-between items-center">
                    <CustomHeader
                        icon={<Users className="h-6 w-6 text-primary" />}
                        title="Employees"
                        description="Manage your workforce: add, edit, and organize employee records with ease."
                    />
                    <Link href="/employees/create">
                        <Button className="h-14">
                            <UserPlus className="h-5 w-5" />
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-sm font-medium">Create</span>
                                <span className="text-xs font-normal">Employee</span>
                            </div>
                        </Button>
                    </Link>
                </div>

                {/* Empty dataset (no employees exist at all) */}
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
                        {/*
                         * data={employees.data}  — the current page from the server.
                         *   No filteredEmployees memo. The server already filtered + paginated.
                         *
                         * from={employees.from}  — correct 1-based row counter per page
                         *   (e.g. page 2 of 10 starts at row 11, not 1).
                         */}
                        <CustomTable
                            title="Employees"
                            columns={EmployeesTableConfig.columns}
                            actions={EmployeesTableConfig.actions}
                            data={employees.data}
                            from={employees.from ?? 1}
                            onDelete={handleDelete}
                            onView={handleView}
                            onEdit={handleEdit}

                            toolbar={
                                <EmployeeFilterBar
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
                            totalCount={totalCount}
                            filteredCount={filteredCount}
                            search={searchTerm}
                            resourceName="employee"
                        />
                    </>
                )}
            </div>
        </AppLayout>
    );
}