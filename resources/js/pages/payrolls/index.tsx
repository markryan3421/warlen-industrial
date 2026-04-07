import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import { CreditCard, X, Bell, User, Search } from 'lucide-react';
import PayrollProcessingCards from '@/components/payroll-processing-cards';
import { CustomTable } from '@/components/custom-table';
import { CustomPagination } from '@/components/custom-pagination';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/table-skeleton';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { format, parseISO, isValid } from 'date-fns';

declare global { interface Window { Echo: any; } }

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payroll', href: '/payroll' }];

// ─── Types ────────────────────────────────────────────────────────────────────
interface PayrollItem {
    id: number; payroll_id: number; code: string;
    type: 'earning' | 'deduction'; amount: number;
    description: string | null; created_at: string; updated_at: string;
}

interface Payroll {
    id: number; payroll_period_id: number; employee_id: number;
    gross_pay: number; total_deduction: number; net_pay: number;
    payroll_items?: PayrollItem[];
    payroll_period?: { id: number; period_name: string; start_date: string; end_date: string; is_closed: boolean; };
    employee?: { id: number; emp_code: string; user: { name: string; email: string; }; position: { id: number; pos_name: string; deleted_at: string; }; pay_frequency: string; };
    created_at: string; updated_at: string;
}

interface PageProps {
    payrolls: Payroll[];
    pagination?: { links: any[]; from: number; to: number; current_page: number; last_page: number; per_page: number; total: number; };
    filters?: { search?: string; positions?: string; date_from?: string; date_to?: string; perPage?: string; };
    totalCount: number; filteredCount: number;
    totalOvertimePay: number; totalOvertimeHours: number;
    totalDeductions: number; totalNetPay: number; totalGrossPay: number;
    activeEmployee: number;
    allPositions?: Array<{ id: number; pos_name: string }> | string[];
    branchesData?: Array<{ id: number; name: string; sites?: Array<{ id: number; name: string }> }>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Index({
    payrolls = [],
    pagination: serverPagination = { links: [], from: 0, to: 0, current_page: 1, last_page: 1, per_page: 10, total: 0 },
    filters = {},
    totalCount = 0, filteredCount = 0,
    totalOvertimePay: initialOvertimePay = 0,
    totalOvertimeHours: initialOvertimeHours = 0,
    totalDeductions: initialDeductions = 0,
    totalNetPay: initialNetPay = 0,
    totalGrossPay: initialGrossPay = 0,
    activeEmployee: initialActiveEmployee = 0,
    allPositions = [],
    branchesData = [],
}: PageProps) {
    const { delete: destroy } = useForm();

    // ── UI state ──────────────────────────────────────────────────────────────
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string; timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // ── Filter state ──────────────────────────────────────────────────────────
    const parseDate = (d?: string) => { if (!d) return undefined; const p = parseISO(d); return isValid(p) ? p : undefined; };

    const [searchTerm, setSearchTerm]           = useState(filters.search ?? '');
    const [selectedPositions, setSelectedPositions] = useState<string[]>(filters.positions?.split(',').filter(Boolean) ?? []);
    const [dateFrom, setDateFrom]               = useState<Date | undefined>(() => parseDate(filters.date_from));
    const [dateTo, setDateTo]                   = useState<Date | undefined>(() => parseDate(filters.date_to));
    const [perPage, setPerPage]                 = useState(filters.perPage ?? String(serverPagination.per_page ?? 10));

    // ── Ref always holds latest filter values (avoids stale closures) ─────────
    const filtersRef = useRef({ searchTerm, selectedPositions, dateFrom, dateTo, perPage });
    useEffect(() => { filtersRef.current = { searchTerm, selectedPositions, dateFrom, dateTo, perPage }; },
        [searchTerm, selectedPositions, dateFrom, dateTo, perPage]);

    // ── Core navigation ───────────────────────────────────────────────────────
    const applyFilters = useCallback((overrides: Partial<{
        search: string; positions: string[]; from: Date | undefined;
        to: Date | undefined; perPage: string; page: number;
    }> = {}) => {
        const { searchTerm: s, selectedPositions: pos, dateFrom: from, dateTo: to, perPage: pp } = filtersRef.current;

        const params: Record<string, string | number> = {};
        const rs = overrides.search  !== undefined ? overrides.search   : s;
        const rp = overrides.positions !== undefined ? overrides.positions : pos;
        const rf = overrides.from    !== undefined ? overrides.from     : from;
        const rt = overrides.to      !== undefined ? overrides.to       : to;
        const rpp = overrides.perPage !== undefined ? overrides.perPage  : pp;

        if (rs?.trim())          params.search    = rs.trim();
        if (rp?.length)          params.positions = rp.join(',');
        if (rf && isValid(rf))   params.date_from = format(rf, 'yyyy-MM-dd');
        if (rt && isValid(rt))   params.date_to   = format(rt, 'yyyy-MM-dd');
        if (rpp && rpp !== '10') params.perPage   = rpp;
        if (overrides.page)      params.page      = overrides.page;

        setIsFiltering(true);
        router.get('/payrolls', params, {
            preserveState: true, preserveScroll: true, replace: true,
            only: ['payrolls', 'pagination', 'filters', 'totalCount', 'filteredCount',
                   'totalOvertimePay', 'totalOvertimeHours', 'totalDeductions',
                   'totalNetPay', 'totalGrossPay', 'activeEmployee'],
            onFinish: () => setIsFiltering(false),
        });
    }, []);

    // ── Filter handlers ───────────────────────────────────────────────────────
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters({ search: value, page: 1 }), 500);
    }, [applyFilters]);

    const handlePositionsChange = useCallback((positions: string[]) => {
        setSelectedPositions(positions);
        applyFilters({ positions, page: 1 });
    }, [applyFilters]);

    const handleDateFromChange = useCallback((from: Date | undefined) => {
        setDateFrom(from);
        applyFilters({ from: from && isValid(from) ? from : undefined, page: 1 });
    }, [applyFilters]);

    const handleDateToChange = useCallback((to: Date | undefined) => {
        setDateTo(to);
        applyFilters({ to: to && isValid(to) ? to : undefined, page: 1 });
    }, [applyFilters]);

    const handlePerPageChange = useCallback((value: string) => {
        setPerPage(value);
        applyFilters({ perPage: value, page: 1 });
    }, [applyFilters]);

    const handlePageChange = useCallback((url: string | null) => {
        if (!url) return;
        const match = url.match(/[?&]page=(\d+)/);
        applyFilters({ page: match ? parseInt(match[1]) : 1 });
    }, [applyFilters]);

    const clearFilters = useCallback(() => {
        setSearchTerm(''); setSelectedPositions([]); setDateFrom(undefined); setDateTo(undefined); setPerPage('10');
        setIsFiltering(true);
        router.get('/payrolls', {}, {
            preserveState: false, preserveScroll: true, replace: true,
            onFinish: () => setIsFiltering(false),
        });
    }, []);

    // ── Loading state ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (payrolls !== undefined && isInitialLoad) {
            const t = setTimeout(() => { setIsTableLoading(false); setIsInitialLoad(false); }, 300);
            return () => clearTimeout(t);
        }
    }, [payrolls, isInitialLoad]);

    useEffect(() => {
        let tid: NodeJS.Timeout;
        let isFilterUpdate = false;
        const onStart = (e: any) => {
            if (e.detail?.preserveState) { isFilterUpdate = true; return; }
            clearTimeout(tid); setIsTableLoading(true);
        };
        const onFinish = () => {
            tid = setTimeout(() => setIsTableLoading(false), isFilterUpdate ? 100 : 200);
            isFilterUpdate = false;
        };
        const off1 = router.on('start', onStart);
        const off2 = router.on('finish', onFinish);
        return () => { off1(); off2(); clearTimeout(tid); };
    }, [isInitialLoad]);

    useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

    // ── Echo listener ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.private('payroll');
        channel.listen('.payroll.completed', (e: any) => {
            setNotification({ message: e.message, timestamp: new Date(e.timestamp).toLocaleString() });
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
            setIsFiltering(true);
            router.reload({
                only: ['payrolls', 'pagination', 'totalOvertimePay', 'totalOvertimeHours',
                       'totalDeductions', 'totalNetPay', 'totalGrossPay', 'activeEmployee'],
                onFinish: () => setIsFiltering(false),
            });
        });
        return () => channel.stopListening('.payroll.completed');
    }, []);

    // ── Derived data ──────────────────────────────────────────────────────────
    const positionNames = useMemo(() => {
        if (!allPositions?.length) return [];
        return typeof allPositions[0] === 'string'
            ? allPositions as string[]
            : (allPositions as Array<{ id: number; pos_name: string }>).map(p => p.pos_name);
    }, [allPositions]);

    const payrollTableData = useMemo(() => payrolls.map(p => ({
        id: p.id,
        period_name:   p.payroll_period?.period_name  ?? 'N/A',
        period_start:  p.payroll_period?.start_date   ?? '',
        period_end:    p.payroll_period?.end_date      ?? '',
        emp_code:      p.employee?.emp_code            ?? 'N/A',
        employee_name: p.employee?.user.name           ?? 'Unknown Employee',
        position_name: p.employee?.position?.pos_name  ?? 'No Position',
        pay_frequency: p.employee?.pay_frequency       ?? 'N/A',
        gross_pay:     p.gross_pay    ?? 0,
        total_deduction: p.total_deduction ?? 0,
        net_pay:       p.net_pay      ?? 0,
        _original:     p,
    })), [payrolls]);

    const activeFiltersCount = useMemo(() =>
        [searchTerm.trim(), selectedPositions.length, dateFrom, dateTo].filter(Boolean).length,
    [searchTerm, selectedPositions, dateFrom, dateTo]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const formatCurrency = useCallback((n: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n), []);

    const formatNumber = useCallback((n: number) =>
        new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n), []);

    // ── Action handlers ───────────────────────────────────────────────────────
    const handleViewPayroll = useCallback((row: any) => {
        if (row?._original) { setSelectedPayroll(row._original); setIsModalOpen(true); }
    }, []);

    const handleDeletePayroll = useCallback((id: string | number) => {
        if (!confirm('Are you sure you want to delete this payroll record?')) return;
        destroy(`/payrolls/${id}`, {
            onSuccess: () => { toast.success('Payroll record deleted successfully'); applyFilters(); },
            onError:   () => toast.error('Failed to delete payroll record'),
        });
    }, [destroy, applyFilters]);

    // ── Table config ──────────────────────────────────────────────────────────
    const columns = useMemo(() => [
        {
            label: 'EMPLOYEE', key: 'employee_name',
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.employee_name}</span>
                    <span className="text-xs text-gray-500">{row.emp_code}</span>
                </div>
            ),
        },
        {
            label: 'PERIOD', key: 'period_name',
            render: (row: any) => (
                <span className="text-xs text-gray-500">
                    {row.period_start ? new Date(row.period_start).toLocaleDateString() : 'N/A'} –{' '}
                    {row.period_end   ? new Date(row.period_end).toLocaleDateString()   : 'N/A'}
                </span>
            ),
        },
        {
            label: 'POSITION', key: 'position_name',
            render: (row: any) => <div className="flex items-center gap-1"><User className="h-3 w-3 text-gray-400" /><span className="text-sm">{row.position_name}</span></div>,
        },
        { label: 'FREQUENCY',  key: 'pay_frequency',   render: (row: any) => <span>{row.pay_frequency}</span> },
        { label: 'GROSS PAY',  key: 'gross_pay',        render: (row: any) => <span className="font-medium text-green-600">{formatCurrency(row.gross_pay)}</span> },
        { label: 'DEDUCTIONS', key: 'total_deduction',  render: (row: any) => <span className="text-red-600">{formatCurrency(row.total_deduction)}</span> },
        { label: 'NET PAY',    key: 'net_pay',           render: (row: any) => <span className="font-bold text-blue-600">{formatCurrency(row.net_pay)}</span> },
        { label: 'ACTIONS',    key: 'actions',           isAction: true },
    ], [formatCurrency]);

    const actions     = useMemo(() => [{ label: 'View', icon: 'Eye', route: '', className: '' }], []);
    const skeletonColumns = useMemo(() => [
        'EMPLOYEE','PERIOD','POSITION','FREQUENCY','GROSS PAY','DEDUCTIONS','NET PAY','ACTIONS',
    ].map(label => ({ label, key: label.toLowerCase().replace(' ', '_'), className: '' })), []);

    // ── Toolbar ───────────────────────────────────────────────────────────────
    const toolbar = (
        <EmployeeFilterBar
            filters={{ search: true, position: true, branch: false, site: false, date: true, status: false }}
            allPositions={positionNames}
            branchesData={branchesData}
            searchTerm={searchTerm}
            selectedPositions={selectedPositions}
            selectedBranch="" selectedSite="" status=""
            dateFrom={dateFrom} dateTo={dateTo}
            onSearchChange={handleSearchChange}
            onPositionsChange={handlePositionsChange}
            onBranchChange={() => {}} onSiteChange={() => {}} onStatusChange={() => {}}
            onDateFromChange={handleDateFromChange}
            onDateToChange={handleDateToChange}
            onClearAll={clearFilters}
            searchPlaceholder="Search by name or employee code..."
            dateLabel="Payroll Period"
        />
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="flex flex-1 flex-col gap-4 p-4">

                <PayrollProcessingCards
                    payrolls={payrolls}
                    totalOvertimePay={initialOvertimePay}
                    totalOvertimeHours={initialOvertimeHours}
                    totalDeductions={initialDeductions}
                    totalNetPay={initialNetPay}
                    totalGrossPay={initialGrossPay}
                    activeEmployee={initialActiveEmployee}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    totalFilteredPayrolls={filteredCount}
                    totalOriginalPayrolls={totalCount}
                />

                {/* Notification */}
                {showNotification && notification && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                        <Bell className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-xs text-green-600">{notification.timestamp}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowNotification(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Table */}
                <div className="mx-4">
                    {isTableLoading && isInitialLoad ? (
                        <TableSkeleton
                            columns={skeletonColumns}
                            rows={Math.min(parseInt(perPage), 10)}
                            title="Payroll Records"
                        />
                    ) : (
                        <>
                            <CustomTable
                                columns={columns}
                                actions={actions}
                                data={payrollTableData}
                                from={serverPagination?.from || 0}
                                title="Payroll Records"
                                onView={handleViewPayroll}
                                onEdit={() => {}}
                                onDelete={handleDeletePayroll}
                                toolbar={toolbar}
                                filterEmptyState={
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                            <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">No results found</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                            {searchTerm
                                                ? `No payroll records matching "${searchTerm}".`
                                                : dateFrom || dateTo
                                                    ? 'No payroll records in the selected date range.'
                                                    : 'No payroll records match your current filters.'}
                                        </p>
                                        <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                                    </div>
                                }
                                isLoading={isFiltering && !isInitialLoad}
                            />

                            {payrolls.length > 0 && (
                                <CustomPagination
                                    pagination={serverPagination}
                                    perPage={perPage}
                                    onPerPageChange={handlePerPageChange}
                                    onPageChange={handlePageChange}
                                    totalCount={totalCount}
                                    filteredCount={filteredCount}
                                    search={searchTerm}
                                    resourceName="payroll"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Payroll Details Modal */}
            {selectedPayroll && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${isModalOpen ? 'visible' : 'invisible'}`}>
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Payroll Details</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    ['Employee',        selectedPayroll.employee?.user.name],
                                    ['Employee Code',   selectedPayroll.employee?.emp_code],
                                    ['Period',          `${selectedPayroll.payroll_period?.start_date} – ${selectedPayroll.payroll_period?.end_date}`],
                                    ['Pay Frequency',   selectedPayroll.employee?.pay_frequency],
                                ].map(([label, value]) => (
                                    <div key={label as string}>
                                        <label className="text-sm font-medium text-gray-500">{label}</label>
                                        <p>{value}</p>
                                    </div>
                                ))}
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Gross Pay</label>
                                    <p className="text-green-600 font-semibold">{formatCurrency(selectedPayroll.gross_pay)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Total Deductions</label>
                                    <p className="text-red-600 font-semibold">{formatCurrency(selectedPayroll.total_deduction)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Net Pay</label>
                                    <p className="text-blue-600 font-bold text-lg">{formatCurrency(selectedPayroll.net_pay)}</p>
                                </div>
                            </div>

                            {!!selectedPayroll.payroll_items?.length && (
                                <div>
                                    <h3 className="font-semibold mb-2">Payroll Items</h3>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>{['Code','Description','Type','Amount'].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
                                            </thead>
                                            <tbody>
                                                {selectedPayroll.payroll_items.map((item, i) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="px-3 py-2">{item.code}</td>
                                                        <td className="px-3 py-2">{item.description ?? '-'}</td>
                                                        <td className={`px-3 py-2 text-right ${item.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {item.type === 'earning' ? 'Earning' : 'Deduction'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
