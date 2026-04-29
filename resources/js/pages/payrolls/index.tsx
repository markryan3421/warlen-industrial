import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import { X, Bell, Search, Printer } from 'lucide-react';
import PayrollProcessingCards from '@/components/payroll-processing-cards';
import { CustomTable } from '@/components/custom-table';
import { CustomPagination } from '@/components/custom-pagination';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/table-skeleton';
import PayrollPrintLayout from '@/components/payroll-print-layout';
import { generateSummaryHTML, printPayrollSummary } from '@/components/payroll-summary-print';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { format, parseISO, isValid } from 'date-fns';
import {
    getPayrollTableColumns,
    getPayrollTableActions,
    getSkeletonColumns
} from '@/config/tables/payroll-table-config';
import axios from 'axios';

declare global { interface Window { Echo: any; } }

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payroll', href: '/payrolls' }];

// ─── Types ────────────────────────────────────────────────────────────────────
interface PayrollItem {
    id: number; payroll_id: number; code: string;
    type: 'earning' | 'deduction'; amount: number;
    description: string | null; created_at: string; updated_at: string;
}

interface Payroll {
    id: number;
    payroll_period_id: number;
    employee_id: number;
    gross_pay: number;
    total_deduction: number;
    net_pay: number;
    payroll_items?: PayrollItem[];
    payroll_period?: {
        id: number;
        period_name: string;
        start_date: string;
        end_date: string;
        is_closed: boolean;
    };
    employee?: {
        id: number;
        emp_code: string;
        avatar: string | null;
        user: { name: string; email: string; };
        position: { id: number; pos_name: string; deleted_at: string; };
        branch?: {
            id: number;
            branch_name: string;
            sites?: Array<{ id: number; site_name: string }>;
        };
        site?: { id: number; site_name: string; };
        pay_frequency: string;
    };
    created_at: string;
    updated_at: string;
}

interface BranchData {
    id: number;
    branch_name: string;
    branch_address: string;
    sites: Array<{ id: number; site_name: string }>;
}

interface PageProps {
    payrolls: Payroll[];
    pagination?: { links: any[]; from: number; to: number; current_page: number; last_page: number; per_page: number; total: number; };
    filters?: { search?: string; positions?: string; branches?: string; sites?: string; date_from?: string; date_to?: string; perPage?: string; };
    totalCount: number;
    filteredCount: number;
    totalOvertimePay: number;
    totalOvertimeHours: number;
    totalDeductions: number;
    totalNetPay: number;
    totalGrossPay: number;
    activeEmployee: number;
    allPositions?: Array<{ id: number; pos_name: string }> | string[];
    allBranches?: string[];
    allSites?: string[];
    branchesData?: BranchData[];
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
    allBranches = [],
    allSites = [],
    branchesData = [],
}: PageProps) {
    const { delete: destroy } = useForm();
    console.log("payrolls", payrolls);

    const { auth } = usePage().props;
    const currentUser = auth?.user as { id: number; name: string; email: string; role?: string };
    const authorizedByName = currentUser?.name || 'System Administrator';

    // ── UI state ──────────────────────────────────────────────────────────────
    const [notification, setNotification] = useState<{ message: string; timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [selectedPrintPayrollId, setSelectedPrintPayrollId] = useState<number | null>(null);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // ── Bulk selection state ─────────────────────────────────────────────────
    const [selectedPayrollIds, setSelectedPayrollIds] = useState<(string | number)[]>([]);

    // ── Filter state ──────────────────────────────────────────────────────────
    const parseDate = (d?: string) => {
        if (!d) return undefined;
        const p = parseISO(d);
        return isValid(p) ? p : undefined;
    };

    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [selectedPositions, setSelectedPositions] = useState<string[]>(
        filters.positions?.split(',').filter(Boolean) ?? []
    );
    const [selectedBranches, setSelectedBranches] = useState<string[]>(
        filters.branches?.split(',').filter(Boolean) ?? []
    );
    const [selectedSites, setSelectedSites] = useState<string[]>(
        filters.sites?.split(',').filter(Boolean) ?? []
    );
    const [dateFrom, setDateFrom] = useState<Date | undefined>(() => parseDate(filters.date_from));
    const [dateTo, setDateTo] = useState<Date | undefined>(() => parseDate(filters.date_to));
    const [perPage, setPerPage] = useState(() => {
        if (filters.perPage) return filters.perPage;
        if (serverPagination.per_page) return String(serverPagination.per_page);
        return '10';
    });

    // Sync perPage with server pagination
    useEffect(() => {
        if (serverPagination.per_page && String(serverPagination.per_page) !== perPage) {
            setPerPage(String(serverPagination.per_page));
        }
    }, [serverPagination.per_page]);

    // ── Ref always holds latest filter values ─────────────────────────────────
    const filtersRef = useRef({
        searchTerm,
        selectedPositions,
        selectedBranches,
        selectedSites,
        dateFrom,
        dateTo,
        perPage
    });

    useEffect(() => {
        filtersRef.current = {
            searchTerm,
            selectedPositions,
            selectedBranches,
            selectedSites,
            dateFrom,
            dateTo,
            perPage
        };
    }, [searchTerm, selectedPositions, selectedBranches, selectedSites, dateFrom, dateTo, perPage]);

    // ── Core navigation ───────────────────────────────────────────────────────
    const buildParams = useCallback((overrides: {
        search?: string;
        positions?: string[];
        branches?: string[];
        sites?: string[];
        from?: Date | undefined;
        to?: Date | undefined;
        perPage?: string;
        page?: number;
    } = {}) => {
        const {
            searchTerm: s,
            selectedPositions: pos,
            selectedBranches: br,
            selectedSites: st,
            dateFrom: from,
            dateTo: to,
            perPage: pp
        } = filtersRef.current;

        const params: Record<string, string | number> = {};
        const rs = overrides.search !== undefined ? overrides.search : s;
        const rp = overrides.positions !== undefined ? overrides.positions : pos;
        const rb = overrides.branches !== undefined ? overrides.branches : br;
        const rst = overrides.sites !== undefined ? overrides.sites : st;
        const rf = overrides.from !== undefined ? overrides.from : from;
        const rt = overrides.to !== undefined ? overrides.to : to;
        const rpp = overrides.perPage !== undefined ? overrides.perPage : pp;

        if (rs?.trim()) params.search = rs.trim();
        if (rp?.length) params.positions = rp.join(',');
        if (rb?.length) params.branches = rb.join(',');
        if (rst?.length) params.sites = rst.join(',');
        if (rf && isValid(rf)) params.date_from = format(rf, 'yyyy-MM-dd');
        if (rt && isValid(rt)) params.date_to = format(rt, 'yyyy-MM-dd');

        const perPageValue = rpp ? parseInt(rpp) : 10;
        params.perPage = perPageValue;

        if (overrides.page) params.page = overrides.page;

        return params;
    }, []);

    const applyFilters = useCallback((overrides: {
        search?: string;
        positions?: string[];
        branches?: string[];
        sites?: string[];
        from?: Date | undefined;
        to?: Date | undefined;
        perPage?: string;
        page?: number;
    } = {}) => {
        const params = buildParams(overrides);

        setIsFiltering(true);
        router.get('/payrolls', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['payrolls', 'pagination', 'filters', 'totalCount', 'filteredCount',
                'totalOvertimePay', 'totalOvertimeHours', 'totalDeductions',
                'totalNetPay', 'totalGrossPay', 'activeEmployee'],
            onFinish: () => setIsFiltering(false),
        });
    }, [buildParams]);

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

    const handleBranchChange = useCallback((branch: string) => {
        const newBranches = branch ? [branch] : [];
        setSelectedBranches(newBranches);
        if (selectedSites.length) {
            setSelectedSites([]);
            applyFilters({ branches: newBranches, sites: [], page: 1 });
        } else {
            applyFilters({ branches: newBranches, page: 1 });
        }
    }, [applyFilters, selectedSites.length]);

    const handleSiteChange = useCallback((site: string) => {
        const newSites = site ? [site] : [];
        setSelectedSites(newSites);
        applyFilters({ sites: newSites, page: 1 });
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

    const handlePageChange = useCallback((page: number) => {
        applyFilters({ page });
    }, [applyFilters]);

    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedPositions([]);
        setSelectedBranches([]);
        setSelectedSites([]);
        setDateFrom(undefined);
        setDateTo(undefined);
        setPerPage('10');

        router.get('/payrolls', { perPage: 10 }, {
            preserveState: false,
            preserveScroll: true,
            replace: true,
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
            router.reload({
                only: ['payrolls', 'pagination', 'totalOvertimePay', 'totalOvertimeHours',
                    'totalDeductions', 'totalNetPay', 'totalGrossPay', 'activeEmployee'],
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

    const branchNames = useMemo(() => {
        if (!allBranches?.length) return [];
        return allBranches;
    }, [allBranches]);

    const siteNames = useMemo(() => {
        if (!selectedBranches.length || !selectedBranches[0]) {
            return [];
        }
        const selectedBranch = selectedBranches[0];
        const branchData = branchesData.find(b => b.branch_name === selectedBranch);
        if (branchData && branchData.sites && branchData.sites.length > 0) {
            return branchData.sites.map(site => site.site_name);
        }
        return [];
    }, [selectedBranches, branchesData]);

    const payrollTableData = useMemo(() => payrolls.map(p => ({
        id: p.id,
        period_name: p.payroll_period?.period_name ?? 'N/A',
        period_start: p.payroll_period?.start_date ?? '',
        period_end: p.payroll_period?.end_date ?? '',
        emp_code: p.employee?.emp_code ?? 'N/A',
        employee_name: p.employee?.user.name ?? 'Unknown Employee',
        position_name: p.employee?.position?.pos_name ?? 'No Position',
        branch_name: p.employee?.branch?.branch_name ?? 'No Branch',
        employee_avatar: p.employee?.avatar ?? null,
        site_name: p.employee?.site?.site_name ?? p.employee?.branch?.sites?.[0]?.site_name ?? 'No Site',
        pay_frequency: p.employee?.pay_frequency ?? 'N/A',
        gross_pay: p.gross_pay ?? 0,
        total_deduction: p.total_deduction ?? 0,
        net_pay: p.net_pay ?? 0,
        avatar: p.employee?.avatar,
        _original: p,
    })), [payrolls]);

    const filteredPayrollTableData = useMemo(() => {
        let data = payrollTableData;
        if (selectedSites.length && selectedSites[0]) {
            data = data.filter(row => row.site_name === selectedSites[0]);
        }
        return data;
    }, [payrollTableData, selectedSites]);

    // ── Pagination with filters ───────────────────────────────────────────────
    const paginationWithFilters = useMemo(() => {
        if (!serverPagination?.links?.length) return serverPagination;

        const baseParams = new URLSearchParams();
        if (searchTerm.trim()) baseParams.set('search', searchTerm.trim());
        if (selectedPositions.length) baseParams.set('positions', selectedPositions.join(','));
        if (selectedBranches.length) baseParams.set('branches', selectedBranches.join(','));
        if (selectedSites.length) baseParams.set('sites', selectedSites.join(','));
        if (dateFrom && isValid(dateFrom)) baseParams.set('date_from', format(dateFrom, 'yyyy-MM-dd'));
        if (dateTo && isValid(dateTo)) baseParams.set('date_to', format(dateTo, 'yyyy-MM-dd'));
        baseParams.set('perPage', String(serverPagination.per_page || 10));

        const links = serverPagination.links.map((link: any) => {
            if (!link.url) return link;
            const url = new URL(link.url, window.location.origin);
            const page = url.searchParams.get('page');
            const merged = new URLSearchParams(baseParams.toString());
            if (page) merged.set('page', page);
            url.search = merged.toString();
            return { ...link, url: url.toString() };
        });

        return { ...serverPagination, links };
    }, [serverPagination, searchTerm, selectedPositions, selectedBranches, selectedSites, dateFrom, dateTo]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const formatCurrency = useCallback((n: number) =>
        new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(n), []);

    const formatNumber = useCallback((n: number) =>
        new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n), []);

    // ── Action handlers ───────────────────────────────────────────────────────
    const handleViewPayroll = useCallback((row: any) => {
        if (row?._original) {
            setSelectedPrintPayrollId(row._original.id);
            setIsPrintModalOpen(true);
        }
    }, []);

    const handleDeletePayroll = useCallback((id: string | number) => {
        if (!confirm('Are you sure you want to delete this payroll record?')) return;
        destroy(`/payrolls/${id}`, {
            onSuccess: () => { toast.success('Payroll record deleted successfully'); applyFilters(); },
            onError: () => toast.error('Failed to delete payroll record'),
        });
    }, [destroy, applyFilters]);

    // ── Email handlers (using axios to avoid Inertia response issues) ─────────
    const handleEmailPayroll = useCallback((row: any) => {
        const payrollId = row._original?.id;
        if (!payrollId) return;

        toast.loading('Sending email...', { id: `email-${payrollId}` });

        axios.post(`/payrolls/${payrollId}/email`)
            .then(() => {
                toast.success('Payroll summary sent to employee\'s email.', { id: `email-${payrollId}` });
            })
            .catch((error) => {
                console.error(error);
                const message = error.response?.data?.message || 'Failed to send email. Please try again.';
                toast.error(message, { id: `email-${payrollId}` });
            });
    }, []);

    const handleBulkEmail = useCallback((selectedRows: any[]) => {
        const ids = selectedRows.map(row => row._original?.id).filter(Boolean);
        if (ids.length === 0) return;

        toast.loading(`Sending ${ids.length} email(s)...`, { id: 'bulk-email' });

        axios.post('/payrolls/bulk-email', { ids })
            .then((response) => {
                const { success, failures } = response.data;
                if (success > 0 && failures === 0) {
                    toast.success(`Successfully sent ${success} email(s).`, { id: 'bulk-email' });
                } else if (success > 0 && failures > 0) {
                    toast.warning(`Sent ${success} email(s), failed: ${failures}.`, { id: 'bulk-email' });
                } else {
                    toast.error('Failed to send any emails.', { id: 'bulk-email' });
                }
                setSelectedPayrollIds([]); // clear selection after sending
            })
            .catch((error) => {
                console.error(error);
                const message = error.response?.data?.message || 'Failed to send emails.';
                toast.error(message, { id: 'bulk-email' });
            });
    }, []);

    const handlePrintSummary = useCallback(() => {
        // Prepare full payroll data with earnings and deductions from payroll_items
        const summaryPayrolls = filteredPayrollTableData.map(p => {
            const originalPayroll = payrolls.find(pr => pr.id === p.id);
            const earnings = originalPayroll?.payroll_items
                ?.filter(item => item.type === 'earning')
                .map(item => ({
                    description: item.description || item.code,
                    amount: Number(item.amount) || 0
                })) || [];

            const deductions = originalPayroll?.payroll_items
                ?.filter(item => item.type === 'deduction')
                .map(item => ({
                    description: item.description || item.code,
                    amount: Number(item.amount) || 0
                })) || [];

            return {
                id: p.id,
                employee_name: p.employee_name,
                emp_code: p.emp_code,
                employee_avatar: p.employee_avatar,
                position_name: p.position_name,
                branch_name: p.branch_name,
                site_name: p.site_name,
                period_name: p.period_name,
                period_start: p.period_start,
                period_end: p.period_end,
                pay_frequency: p.pay_frequency,
                gross_pay: Number(p.gross_pay) || 0,
                total_deduction: Number(p.total_deduction) || 0,
                net_pay: Number(p.net_pay) || 0,
                earnings: earnings,
                deductions: deductions,
            };
        });

        let totalGrossPay = 0, totalDeductions = 0, totalNetPay = 0;
        let totalOvertimePay = 0, totalOvertimeHours = 0, totalHolidayOvertimePay = 0;
        let totalIncentives = 0, totalContributions = 0, totalOtherDeductions = 0, totalLateDeduction = 0;

        summaryPayrolls.forEach(p => {
            totalGrossPay += Number(p.gross_pay) || 0;
            totalDeductions += Number(p.total_deduction) || 0;
            totalNetPay += Number(p.net_pay) || 0;

            if (p.earnings && Array.isArray(p.earnings)) {
                p.earnings.forEach((e: any) => {
                    const desc = String(e.description || '').toLowerCase();
                    const amount = Number(e.amount) || 0;
                    if (desc.includes('overtime')) {
                        if (desc.includes('holiday')) totalHolidayOvertimePay += amount;
                        else totalOvertimePay += amount;
                    } else if (desc.includes('incentive')) totalIncentives += amount;
                });
            }

            if (p.deductions && Array.isArray(p.deductions)) {
                p.deductions.forEach((d: any) => {
                    const desc = String(d.description || '').toLowerCase();
                    const amount = Number(d.amount) || 0;
                    if (desc.includes('sss') || desc.includes('philhealth') || desc.includes('pag-ibig') || desc.includes('pagibig') || desc.includes('contribution')) {
                        totalContributions += amount;
                    } else if (desc.includes('late')) totalLateDeduction += amount;
                    else totalOtherDeductions += amount;
                });
            }
        });

        const dateRange = dateFrom && dateTo
            ? `${format(dateFrom, 'MMMM d, yyyy')} – ${format(dateTo, 'MMMM d, yyyy')}`
            : 'All Periods';

        const filterText = [];
        if (searchTerm) filterText.push(`Search: ${searchTerm}`);
        if (selectedPositions.length) filterText.push(`Positions: ${selectedPositions.join(', ')}`);
        if (selectedBranches.length) filterText.push(`Branches: ${selectedBranches.join(', ')}`);
        if (selectedSites.length) filterText.push(`Sites: ${selectedSites.join(', ')}`);

        const locationFilter = selectedBranches[0] || selectedSites[0]
            ? `Branch: ${selectedBranches[0] || 'All'} | Site: ${selectedSites[0] || 'All'}`
            : '';

        const htmlContent = generateSummaryHTML({
            summaryPayrolls,
            totalGrossPay,
            totalDeductions,
            totalNetPay,
            totalOvertimePay,
            totalOvertimeHours,
            totalHolidayOvertimePay,
            totalIncentives,
            totalContributions,
            totalOtherDeductions,
            totalLateDeduction,
            dateRange,
            filterText,
            locationFilter,
            formatCurrency,
            authorizedByName
        });

        printPayrollSummary(htmlContent);
    }, [filteredPayrollTableData, payrolls, searchTerm, selectedPositions, selectedBranches, selectedSites, dateFrom, dateTo, formatCurrency, authorizedByName]);

    // ── Table config ──────────────────────────────────────────────────────────
    const columns = useMemo(() => getPayrollTableColumns(formatCurrency), [formatCurrency]);
    // Note: getPayrollTableActions now expects two arguments (view and email)
    const baseActions = getPayrollTableActions(handleViewPayroll, handleEmailPayroll);
    const actions = useMemo(() => baseActions, [baseActions]);
    const skeletonColumns = useMemo(() => getSkeletonColumns(), []);

    // ── Toolbar ───────────────────────────────────────────────────────────────
    const toolbar = (
        <div className="flex justify-between items-center">
            <EmployeeFilterBar
                filters={{
                    search: true,
                    position: true,
                    branch: true,
                    site: true,
                    date: true,
                    status: false
                }}
                allPositions={positionNames}
                allBranches={branchNames}
                allSites={siteNames}
                branchesData={branchesData}
                searchTerm={searchTerm}
                selectedPositions={selectedPositions}
                selectedBranch={selectedBranches[0] || ""}
                selectedSite={selectedSites[0] || ""}
                status=""
                dateFrom={dateFrom}
                dateTo={dateTo}
                onSearchChange={handleSearchChange}
                onPositionsChange={handlePositionsChange}
                onBranchChange={handleBranchChange}
                onSiteChange={handleSiteChange}
                onStatusChange={() => { }}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
                onClearAll={clearFilters}
                searchPlaceholder="Search by name or employee code..."
                dateLabel="Payroll Period"
            />
            <Button onClick={handlePrintSummary} variant="outline" className="ml-4 cursor-pointer text-slate-600 hover:border-blue-700 hover:border-0.2  hover:text-blue-800">
                <Printer className="h-4 w-4 mr-2" />
                Print Summary Report
            </Button>
        </div>
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
                        <CustomTable
                            columns={columns}
                            actions={actions}
                            data={filteredPayrollTableData}
                            from={serverPagination?.from || 0}
                            title="Payroll Records"
                            onView={handleViewPayroll}
                            onDelete={handleDeletePayroll}
                            onEmail={handleEmailPayroll}
                            toolbar={toolbar}
                            selectable={true}
                            selectedIds={selectedPayrollIds}
                            onSelectChange={setSelectedPayrollIds}
                            bulkActions={[
                                { label: 'Email Selected', icon: 'Mail', onClick: handleBulkEmail }
                            ]}
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
                    )}

                    {/* Always render pagination */}
                    <CustomPagination
                        pagination={paginationWithFilters}
                        perPage={perPage}
                        onPerPageChange={handlePerPageChange}
                        onPageChange={handlePageChange}
                        totalCount={totalCount}
                        filteredCount={filteredCount}
                        search={searchTerm}
                        resourceName="payroll"
                    />
                </div>
            </div>

            <PayrollPrintLayout
                isOpen={isPrintModalOpen}
                onClose={() => {
                    setIsPrintModalOpen(false);
                    setSelectedPrintPayrollId(null);
                }}
                payrollId={selectedPrintPayrollId}
            />
        </AppLayout>
    );
}