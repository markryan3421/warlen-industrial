import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    Users, Search, UserPlus, Archive, UsersRound, RotateCcw,
    Briefcase, Building2
} from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { CustomHeader } from '@/components/custom-header';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';
import { RestoreConfirmationDialog } from '@/components/restore-confirmation-modal';
import HrLayout from '@/layouts/hr-layout';
import type { BreadcrumbItem } from '@/types';
import { EmployeesTableConfig } from '@/config/tables/employees-table';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Employees', href: '/hr/employees' },
];

const toastStyle = (color: string) => ({
    style: {
        backgroundColor: 'white',
        color: color,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
});

interface Employee {
    id: number;
    position: { pos_name: string; deleted_at: string | null } | null;
    branch: { branch_name: string; branch_address: string } | null;
    site: { site_name: string; id: number } | null;
    user: { name: string; email: string };
    slug_emp: string;
    emp_code: string | number;
    avatar: string | null;
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

interface BranchData {
    id: number;
    branch_name: string;
    sites: { id: number; site_name: string }[];
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
    activeBranchesData: BranchData[];
    archivedBranchesData: BranchData[];
    allPositions: string[];
    positionsList: { id: number; pos_name: string }[];
    allBranchesForAssign: { id: number; branch_name: string }[];
    filters?: FilterProps;
    totalCount: number;
    filteredCount: number;
}

export default function Index({
    employees,
    archivedEmployees = [],
    activeBranchesData = [],
    archivedBranchesData = [],
    allPositions = [],
    positionsList = [],
    allBranchesForAssign = [],
    filters = {},
    totalCount,
    filteredCount,
}: PageProps) {
    const { delete: destroy } = useForm();
    const { props } = usePage<{ flash?: { success?: string; error?: string; warning?: string; info?: string } }>();

    // Flash message deduplication
    const lastFlashRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });
    useEffect(() => {
        const flash = props.flash;
        if (!flash) return;
        const flashKey = JSON.stringify(flash);
        const now = Date.now();
        const last = lastFlashRef.current;
        if (last.key === flashKey && now - last.time < 500) return;
        lastFlashRef.current = { key: flashKey, time: now };
        if (flash.success) toast.success(flash.success, toastStyle('#16a34a'));
        if (flash.error) toast.error(flash.error, toastStyle('#dc2626'));
        if (flash.warning) toast.warning(flash.warning, toastStyle('#f97316'));
        if (flash.info) toast.info(flash.info, toastStyle('#3b82f6'));
    }, [props.flash]);

    // Tab state
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>(
        filters.show_archived === 'true' ? 'archived' : 'active'
    );

    // Active tab filter state (server‑side)
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [selectedPositions, setSelectedPositions] = useState<string[]>(
        filters.positions ? filters.positions.split(',').filter(Boolean) : []
    );

    const [isFiltering, setIsFiltering] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [selectedBranch, setSelectedBranch] = useState(filters.branch ?? '');
    const [selectedSite, setSelectedSite] = useState(filters.site ?? '');
    const [status, setStatus] = useState<string>(filters.status ?? '');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined
    );

    // Archived tab filter state (client‑side)
    const [archivedSearchTerm, setArchivedSearchTerm] = useState('');
    const [archivedSelectedPositions, setArchivedSelectedPositions] = useState<string[]>([]);
    const [archivedSelectedBranch, setArchivedSelectedBranch] = useState('');
    const [archivedSelectedSite, setArchivedSelectedSite] = useState('');

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkArchiveConfirmOpen, setBulkArchiveConfirmOpen] = useState(false);

    // Bulk assign modals
    const [assignPositionOpen, setAssignPositionOpen] = useState(false);
    const [assignBranchOpen, setAssignBranchOpen] = useState(false);
    const [selectedPositionId, setSelectedPositionId] = useState<string>('');
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    const [assignLoading, setAssignLoading] = useState(false);

    // Archived pagination (client‑side)
    const [archivedPage, setArchivedPage] = useState(1);
    const [archivedPerPage, setArchivedPerPage] = useState(10);

    // Client-side filtering of archived employees
    const filteredArchivedEmployees = useMemo(() => {
        let filtered = [...archivedEmployees];
        if (archivedSearchTerm.trim()) {
            const term = archivedSearchTerm.trim().toLowerCase();
            filtered = filtered.filter(emp =>
                String(emp.emp_code).toLowerCase().includes(term) ||
                emp.user?.name?.toLowerCase().includes(term)
            );
        }
        if (archivedSelectedPositions.length) {
            filtered = filtered.filter(emp =>
                emp.position && archivedSelectedPositions.includes(emp.position.pos_name)
            );
        }
        if (archivedSelectedBranch) {
            filtered = filtered.filter(emp => emp.branch?.branch_name === archivedSelectedBranch);
        }
        if (archivedSelectedSite) {
            filtered = filtered.filter(emp => emp.site?.site_name === archivedSelectedSite);
        }
        return filtered;
    }, [archivedEmployees, archivedSearchTerm, archivedSelectedPositions, archivedSelectedBranch, archivedSelectedSite]);

    const paginatedArchived = useMemo(() => {
        const start = (archivedPage - 1) * archivedPerPage;
        const end = start + archivedPerPage;
        return filteredArchivedEmployees.slice(start, end);
    }, [filteredArchivedEmployees, archivedPage, archivedPerPage]);

    const archivedTotal = filteredArchivedEmployees.length;
    const archivedLastPage = Math.ceil(archivedTotal / archivedPerPage);
    const archivedFrom = archivedTotal === 0 ? 0 : (archivedPage - 1) * archivedPerPage + 1;
    const archivedTo = Math.min(archivedPage * archivedPerPage, archivedTotal);
    const archivedLinks = useMemo(() => {
        const links = [];
        const maxVisible = 5;
        let startPage = Math.max(1, archivedPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(archivedLastPage, startPage + maxVisible - 1);
        if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
        links.push({ url: archivedPage > 1 ? '#' : null, label: '&laquo; Previous', active: false });
        for (let i = startPage; i <= endPage; i++) {
            links.push({ url: '#', label: String(i), active: i === archivedPage });
        }
        links.push({ url: archivedPage < archivedLastPage ? '#' : null, label: 'Next &raquo;', active: false });
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
        links: archivedLinks,
    };

    // Compute button visibility
    const currentPageEmployees = employees.data;
    const hasAnyMissingPosition = useMemo(() => {
        return selectedIds.some(id => {
            const emp = currentPageEmployees.find(e => e.id === id);
            return emp && !emp.position;
        });
    }, [selectedIds, currentPageEmployees]);

    const hasAnyMissingBranchOrSite = useMemo(() => {
        return selectedIds.some(id => {
            const emp = currentPageEmployees.find(e => e.id === id);
            return emp && (!emp.branch || !emp.site);
        });
    }, [selectedIds, currentPageEmployees]);

    // Central navigation for active tab
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
        const showArchived = overrides.showArchived !== undefined ? overrides.showArchived : activeTab === 'archived';

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

        router.get('/hr/employees', params, { preserveState: true, preserveScroll: true, replace: true });
    }

    const handleTabChange = (value: string) => {
        const newTab = value as 'active' | 'archived';
        setActiveTab(newTab);
        setSelectedIds([]);
        if (newTab === 'active') {
            applyFilters({ showArchived: false });
        } else {
            setArchivedPage(1);
        }
    };

    // Active tab handlers
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters({ search: value }), 300);
    };
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
    const handlePerPageChange = (value: string) => applyFilters({ perPage: value });
    const clearActiveFilters = () => {
        setSearchTerm('');
        setSelectedPositions([]);
        setSelectedBranch('');
        setSelectedSite('');
        setStatus('');
        setDateFrom(undefined);
        setDateTo(undefined);
        router.get('/hr/employees', { show_archived: activeTab === 'archived' ? 'true' : undefined }, { preserveState: true, replace: true });
    };

    // Archived tab handlers
    const archivePositions = useMemo(() => {
        const positions = new Set<string>();
        archivedEmployees.forEach(emp => { if (emp.position?.pos_name) positions.add(emp.position.pos_name); });
        return Array.from(positions).sort();
    }, [archivedEmployees]);
    const handleArchivedSearchChange = (value: string) => { setArchivedSearchTerm(value); setArchivedPage(1); };
    const handleArchivedPositionsChange = (positions: string[]) => { setArchivedSelectedPositions(positions); setArchivedPage(1); };
    const handleArchivedBranchChange = (branch: string) => { setArchivedSelectedBranch(branch); setArchivedSelectedSite(''); setArchivedPage(1); };
    const handleArchivedSiteChange = (site: string) => { setArchivedSelectedSite(site); setArchivedPage(1); };
    const clearArchivedFilters = () => {
        setArchivedSearchTerm('');
        setArchivedSelectedPositions([]);
        setArchivedSelectedBranch('');
        setArchivedSelectedSite('');
        setArchivedPage(1);
    };

    // Bulk archive
    const handleBulkArchive = () => setBulkArchiveConfirmOpen(true);
    const confirmBulkArchive = () => {
        if (!selectedIds.length) return;
        setBulkLoading(true);
        router.post('/hr/employees/bulk-destroy', { ids: selectedIds, _method: 'DELETE' }, {
            onSuccess: () => { setBulkArchiveConfirmOpen(false); setSelectedIds([]); },
            onError: (errors) => toast.error(Object.values(errors).flat()[0] || 'Failed to archive employees.', toastStyle('#dc2626')),
            onFinish: () => setBulkLoading(false),
        });
    };

    // Bulk assign handlers
    const handleAssignPosition = () => { setSelectedPositionId(''); setAssignPositionOpen(true); };
    const confirmAssignPosition = () => {
        if (!selectedPositionId) { toast.error('Please select a position'); return; }
        setAssignLoading(true);
        router.post('/hr/employees/bulk-assign-position', { ids: selectedIds, position_id: selectedPositionId }, {
            onSuccess: () => { setAssignPositionOpen(false); setSelectedIds([]); },
            onError: (errors) => toast.error(Object.values(errors).flat()[0] || 'Failed to assign position.', toastStyle('#dc2626')),
            onFinish: () => setAssignLoading(false),
        });
    };
    const handleAssignBranchSite = () => { setSelectedBranchId(''); setSelectedSiteId(''); setAssignBranchOpen(true); };
    const availableSites = useMemo(() => {
        if (!selectedBranchId) return [];
        const branch = activeBranchesData.find(b => b.id === Number(selectedBranchId));
        return branch?.sites ?? [];
    }, [selectedBranchId, activeBranchesData]);
    const confirmAssignBranchSite = () => {
        if (!selectedBranchId) { toast.error('Please select a branch'); return; }
        setAssignLoading(true);
        router.post('/hr/employees/bulk-assign-branch-site', { ids: selectedIds, branch_id: selectedBranchId, site_id: selectedSiteId || null }, {
            onSuccess: () => { setAssignBranchOpen(false); setSelectedIds([]); },
            onError: (errors) => toast.error(Object.values(errors).flat()[0] || 'Failed to assign branch/site.', toastStyle('#dc2626')),
            onFinish: () => setAssignLoading(false),
        });
    };

    // Restore handlers
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [itemToRestore, setItemToRestore] = useState<Employee | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [bulkRestoreConfirmOpen, setBulkRestoreConfirmOpen] = useState(false);
    const handleRestoreClick = (employee: Employee) => { setItemToRestore(employee); setRestoreDialogOpen(true); };
    const confirmSingleRestore = () => {
        if (!itemToRestore) return;
        setIsRestoring(true);
        router.put(`/hr/employees/${itemToRestore.slug_emp}/restore`, {}, {
            onSuccess: () => { setRestoreDialogOpen(false); setItemToRestore(null); setSelectedIds([]); },
            onError: (errors) => toast.error(Object.values(errors).flat()[0] || 'Restore failed', toastStyle('#dc2626')),
            onFinish: () => setIsRestoring(false),
        });
    };
    const handleBulkRestoreClick = () => setBulkRestoreConfirmOpen(true);
    const confirmBulkRestore = () => {
        if (!selectedIds.length) return;
        setBulkLoading(true);
        router.post('/hr/employees/bulk-restore', { ids: selectedIds, _method: 'PUT' }, {
            onSuccess: () => { setBulkRestoreConfirmOpen(false); setSelectedIds([]); },
            onError: (errors) => toast.error(Object.values(errors).flat()[0] || 'Failed to restore employees.', toastStyle('#dc2626')),
            onFinish: () => setBulkLoading(false),
        });
    };

    // Single delete (archive) confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Employee | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const handleDeleteClick = (employee: Employee) => { setItemToDelete(employee); setDeleteDialogOpen(true); };
    const confirmDelete = () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        destroy(`/hr/employees/${itemToDelete.slug_emp}`, {
            onSuccess: () => { setDeleteDialogOpen(false); setItemToDelete(null); },
            onError: (errors) => toast.error(Object.values(errors).flat()[0] || 'Failed to delete employee', toastStyle('#dc2626')),
            onFinish: () => setIsDeleting(false),
        });
    };

    const handleView = (employee: Employee) => router.get(`/hr/employees/${employee.slug_emp}`);
    const handleEdit = (employee: Employee) => router.get(`/hr/employees/${employee.slug_emp}/edit`);

    const archivedActions = [
        { label: 'View', icon: 'Eye', route: 'hr.employees.show' },
        { label: 'Restore', icon: 'RotateCcw', route: null },
    ];

    const activeFiltersCount = [searchTerm.trim(), ...selectedPositions, selectedBranch, selectedSite, status !== '', dateFrom, dateTo].filter(Boolean).length;

    return (
        <HrLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="grid grid-rows-1 justify-center mx-8 md:mx-8 mt-3 lg:flex lg:justify-between items-center lg:mx-8 lg:mt-4 lg:-mb-2">
                    <CustomHeader icon={<Users />} title="Employees" description="Manage your workforce: add, edit, and organize employee records with ease." />
                    <Link href="/hr/employees/create">
                        <Button className="hover:cursor-pointer flex ml-auto">
                            <UserPlus className="h-5 w-5" />
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-sm font-medium">Create Employee</span>
                            </div>
                        </Button>
                    </Link>
                </div>

                <div className="mx-4">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        {/* Tabs UI (same as admin) */}
                        <div className="block sm:hidden">
                            <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0">
                                <TabsTrigger value="active" className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                                    <UsersRound className="h-5 w-5" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium">Active</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 data-[state=active]:bg-white/20">{totalCount}</Badge>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="archived" className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                                    <Archive className="h-5 w-5" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium">Archived</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 data-[state=active]:bg-white/20">{archivedEmployees.length}</Badge>
                                    </div>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="hidden sm:block lg:hidden">
                            <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0">
                                <TabsTrigger value="active" className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                                    <UsersRound className="h-5 w-5" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium">Active</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 data-[state=active]:bg-white/20">{totalCount}</Badge>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger value="archived" className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                                    <Archive className="h-5 w-5" />
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium">Archived</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 data-[state=active]:bg-white/20">{archivedEmployees.length}</Badge>
                                    </div>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="hidden lg:block">
                            <TabsList className="flex w-full max-w-md grid-cols-2 border-1">
                                <TabsTrigger value="active" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                                    <UsersRound className="h-4 w-4" /> Active Employees
                                    <Badge variant="secondary" className="ml-2 data-[state=active]:bg-white/20">{totalCount}</Badge>
                                </TabsTrigger>
                                <TabsTrigger value="archived" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                                    <Archive className="h-4 w-4" /> Archived Employees
                                    <Badge variant="secondary" className="ml-2 data-[state=active]:bg-white/20">{archivedEmployees.length}</Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Active Tab Content */}
                        <TabsContent value="active" className="mt-6">
                            {employees.total === 0 && activeFiltersCount === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="rounded-full bg-gray-100 p-6 mb-4"><Users className="h-12 w-12 text-gray-400" /></div>
                                    <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
                                    <p className="text-gray-500 mb-6 max-w-sm">Get started by creating your first employee.</p>
                                    <Link href="/hr/employees/create"><Button>Create Your First Employee</Button></Link>
                                </div>
                            ) : (
                                <>
                                    {selectedIds.length > 0 && (
                                        <div className="mb-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                    <Archive className="h-4 w-4 text-red-600" />
                                                </div>
                                                <span className="text-sm font-medium">{selectedIds.length} employee{selectedIds.length !== 1 ? 's' : ''} selected</span>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {hasAnyMissingPosition && (
                                                    <Button variant="outline" size="sm" onClick={handleAssignPosition}>
                                                        <Briefcase className="h-4 w-4 mr-1" /> Assign Position
                                                    </Button>
                                                )}
                                                {hasAnyMissingBranchOrSite && (
                                                    <Button variant="outline" size="sm" onClick={handleAssignBranchSite}>
                                                        <Building2 className="h-4 w-4 mr-1" /> Assign Branch & Site
                                                    </Button>
                                                )}
                                                <Button variant="destructive" size="sm" onClick={handleBulkArchive} disabled={bulkLoading}>
                                                    <Archive className="h-4 w-4 mr-1" /> Move to Archive
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Cancel</Button>
                                            </div>
                                        </div>
                                    )}
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
                                                filters={{ search: true, position: true, branch: true, site: true, date: true, status: true }}
                                                allPositions={allPositions}
                                                branchesData={activeBranchesData}
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
                                                onClearAll={clearActiveFilters}
                                                searchPlaceholder="Search by ID or name..."
                                                dateLabel="Hire Date"
                                            />
                                        }
                                        filterEmptyState={
                                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                                                    <Search className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <h3 className="text-sm font-semibold mb-1">No results found</h3>
                                                <p className="text-xs text-slate-500 mb-4 max-w-xs">
                                                    {searchTerm && selectedPositions.length > 0 ? `No employees matching "${searchTerm}" in selected positions.` :
                                                     searchTerm ? `No employees matching "${searchTerm}".` :
                                                     selectedBranch && selectedSite ? `No employees in ${selectedBranch} / ${selectedSite}.` :
                                                     selectedBranch ? `No employees in ${selectedBranch}.` :
                                                     dateFrom || dateTo ? 'No employees in the selected date range.' :
                                                     'No employees match your current filters.'}
                                                </p>
                                                <Button variant="outline" size="sm" onClick={clearActiveFilters}>Clear filters</Button>
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
                        </TabsContent>

                        {/* Archived Tab Content */}
                        <TabsContent value="archived" className="mt-6">
                            {archivedEmployees.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="rounded-full bg-gray-100 p-6 mb-4"><Archive className="h-12 w-12 text-gray-400" /></div>
                                    <h3 className="text-lg font-semibold mb-2">No archived employees</h3>
                                    <p className="text-gray-500 mb-2">Archived employees will appear here when you delete them.</p>
                                </div>
                            ) : (
                                <>
                                    {selectedIds.length > 0 && (
                                        <div className="mb-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <RotateCcw className="h-4 w-4 text-green-600" />
                                                </div>
                                                <span className="text-sm font-medium">{selectedIds.length} employee{selectedIds.length !== 1 ? 's' : ''} selected</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={handleBulkRestoreClick} disabled={bulkLoading} className="bg-green-600 hover:bg-green-700">
                                                    <RotateCcw className="h-4 w-4 mr-1" /> Restore
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Cancel</Button>
                                            </div>
                                        </div>
                                    )}
                                    <CustomTable
                                        title="Archived Employee Lists"
                                        columns={EmployeesTableConfig.columns}
                                        data={paginatedArchived}
                                        from={archivedFrom}
                                        onDelete={handleDeleteClick}
                                        onView={handleView}
                                        onEdit={handleEdit}
                                        actions={archivedActions}
                                        onRestore={handleRestoreClick}
                                        selectable={true}
                                        selectedIds={selectedIds}
                                        onSelectChange={setSelectedIds}
                                        selectAll={selectedIds.length === paginatedArchived.length && paginatedArchived.length > 0}
                                        toolbar={
                                            <EmployeeFilterBar
                                                filters={{ search: true, position: true, branch: true, site: true, status: false, date: false }}
                                                allPositions={archivePositions}
                                                branchesData={archivedBranchesData}
                                                searchTerm={archivedSearchTerm}
                                                selectedPositions={archivedSelectedPositions}
                                                selectedBranch={archivedSelectedBranch}
                                                selectedSite={archivedSelectedSite}
                                                status=""
                                                onSearchChange={handleArchivedSearchChange}
                                                onPositionsChange={handleArchivedPositionsChange}
                                                onBranchChange={handleArchivedBranchChange}
                                                onSiteChange={handleArchivedSiteChange}
                                                onClearAll={clearArchivedFilters}
                                                searchPlaceholder="Search archived employees..."
                                            />
                                        }
                                        filterEmptyState={
                                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                                                    <Search className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <h3 className="text-sm font-semibold mb-1">No archived employees found</h3>
                                                <p className="text-xs text-slate-500 mb-4 max-w-xs">
                                                    {archivedSearchTerm && archivedSelectedPositions.length > 0 ? `No archived employees matching "${archivedSearchTerm}" in selected positions.` :
                                                     archivedSearchTerm ? `No archived employees matching "${archivedSearchTerm}".` :
                                                     archivedSelectedBranch && archivedSelectedSite ? `No archived employees in ${archivedSelectedBranch} / ${archivedSelectedSite}.` :
                                                     archivedSelectedBranch ? `No archived employees in ${archivedSelectedBranch}.` :
                                                     'No archived employees match your current filters.'}
                                                </p>
                                                <Button variant="outline" size="sm" onClick={clearArchivedFilters}>Clear filters</Button>
                                            </div>
                                        }
                                    />
                                    <CustomPagination
                                        pagination={archivedPagination}
                                        perPage={String(archivedPerPage)}
                                        onPerPageChange={value => { setArchivedPerPage(parseInt(value, 10)); setArchivedPage(1); }}
                                        onPageChange={page => setArchivedPage(page)}
                                        totalCount={archivedTotal}
                                        filteredCount={archivedTotal}
                                        search={archivedSearchTerm}
                                        resourceName="archived employee"
                                    />
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Dialogs */}
                <DeleteConfirmationDialog
                    isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={confirmDelete}
                    title="Archive Employee" itemName={itemToDelete?.user?.name} isLoading={isDeleting} confirmText="Yes, archive"
                />
                <DeleteConfirmationDialog
                    isOpen={bulkArchiveConfirmOpen} onClose={() => setBulkArchiveConfirmOpen(false)} onConfirm={confirmBulkArchive}
                    title="Archive Employees" description={`Move ${selectedIds.length} selected employee(s) to archive? They can be restored later.`}
                    confirmText="Yes, move to archive" isLoading={bulkLoading} icon={<Archive className="h-5 w-5" />} variant="warning"
                />
                <RestoreConfirmationDialog
                    isOpen={restoreDialogOpen} onClose={() => { setRestoreDialogOpen(false); setItemToRestore(null); }}
                    onConfirm={confirmSingleRestore} itemName={itemToRestore?.user?.name || itemToRestore?.emp_code || 'this employee'} isLoading={isRestoring}
                />
                <RestoreConfirmationDialog
                    isOpen={bulkRestoreConfirmOpen} onClose={() => setBulkRestoreConfirmOpen(false)} onConfirm={confirmBulkRestore}
                    title="Restore Employees" description={`Restore ${selectedIds.length} selected employee(s)? They will become active again.`}
                    confirmText="Restore All" isLoading={bulkLoading}
                />
                <Dialog open={assignPositionOpen} onOpenChange={setAssignPositionOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Assign Position</DialogTitle></DialogHeader>
                        <div className="py-4">
                            <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                                <SelectTrigger><SelectValue placeholder="Select a position" /></SelectTrigger>
                                <SelectContent>{positionsList.map(pos => <SelectItem key={pos.id} value={String(pos.id)}>{pos.pos_name}</SelectItem>)}</SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2">This will assign the selected position to all {selectedIds.length} employee(s). Employees with an existing position will be skipped.</p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignPositionOpen(false)}>Cancel</Button>
                            <Button onClick={confirmAssignPosition} disabled={assignLoading}>{assignLoading ? 'Assigning...' : 'Assign'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={assignBranchOpen} onOpenChange={setAssignBranchOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader><DialogTitle>Assign Branch & Site</DialogTitle></DialogHeader>
                        <div className="py-4 space-y-4">
                            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                                <SelectContent>{allBranchesForAssign.map(branch => <SelectItem key={branch.id} value={String(branch.id)}>{branch.branch_name}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={selectedSiteId} onValueChange={(value) => setSelectedSiteId(value === 'none' ? '' : value)} disabled={!selectedBranchId}>
                                <SelectTrigger><SelectValue placeholder="Select site (optional)" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {availableSites.map(site => <SelectItem key={site.id} value={String(site.id)}>{site.site_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">This will assign the selected branch and (optionally) site to all {selectedIds.length} employee(s). Employees already having both will be skipped.</p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignBranchOpen(false)}>Cancel</Button>
                            <Button onClick={confirmAssignBranchSite} disabled={assignLoading}>{assignLoading ? 'Assigning...' : 'Assign'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HrLayout>
    );
}