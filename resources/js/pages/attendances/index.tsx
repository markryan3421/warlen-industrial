import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';

// Components
import AppLayout from '@/layouts/app-layout';
import BiometricImport from '@/components/biometric-import';
import { CustomTable } from '@/components/custom-table';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Types
import type { BreadcrumbItem } from '@/types';

// Table Configurations
import { AttendanceLogsTableConfig } from '@/config/tables/attendace-logs';
import { AttendanceExceptionStatsTableConfig } from '@/config/tables/attendance-exception-stats';
import { AttendanceSchedulesTableConfig } from '@/config/tables/attendance-schedules-table';
import { AttendancePeriodStatsTableConfig } from '@/config/tables/attendance-period-stats';

// ============================================================================
// BREADCRUMBS CONFIGURATION
// ============================================================================
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendances',
        href: '/attendances',
    },
];

// ============================================================================
// TYPE DEFINITIONS / INTERFACES
// ============================================================================

/** Attendance Logs - Daily attendance records */
interface Logs {
    id: number;
    employee_id: string;
    employee_name: string;
    department: string;
    date: string;
    time_in: string | null;
    time_out: string | null;
    total_hours: number | null;
    is_overtime: boolean;
}

/** Exception Stats - Attendance exceptions and irregularities */
interface ExceptionStats {
    id: number;
    employee_id: string;
    employee_name: string;
    department: string;
    date: string;
    am_time_in: string | null;
    am_time_out: string | null;
    pm_time_in: string | null;
    pm_time_out: string | null;
    late_minutes: number | null;
    leave_early_minutes: number | null;
    absence_minutes: number | null;
    total_exception_minutes: number | null;
}

/** Schedules - Employee work schedules */
interface Schedule {
    id: number;
    employee_id: string;
    employee_name: string;
    department: string;
    date: string;
    shift_code: string;
    shift_label: string;
}

/** Period Stats - Attendance statistics by period */
interface PeriodStat {
    id: number;
    employee_id: string;
    employee_name: string;
    department: string;
    period_start: string;
    period_end: string;
    normal_work_hours: number;
    real_work_hours: number;
    late_times: number;
    late_minutes: number;
    attended_days: number;
    absent_days: number;
    real_pay: number;
}

/** Pagination link properties */
interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

/** Pagination structures for each data type */
interface LogsPagination {
    data: Logs[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface ExceptionPagination {
    data: ExceptionStats[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface SchedulePagination {
    data: Schedule[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface PeriodPagination {
    data: PeriodStat[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

/** Filter properties for search and pagination */
interface FilterProps {
    search: string;
    perPage: string;
}

/** Main component props from Laravel/Inertia */
interface IndexProps {
    logs?: LogsPagination;
    exceptions?: ExceptionPagination;
    schedules?: SchedulePagination;
    periods?: PeriodPagination;
    filters: FilterProps;
    // Count properties for each tab
    totalCount?: number;
    filteredCount?: number;
    exceptionsTotalCount?: number;
    exceptionsFilteredCount?: number;
    schedulesTotalCount?: number;
    schedulesFilteredCount?: number;
    periodsTotalCount?: number;
    periodsFilteredCount?: number;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * TableSkeleton - Loading state placeholder for tables
 * Displays animated skeleton UI while data is being fetched
 * Fixed to prevent overflow and maintain proper table structure
 */
const TableSkeleton = ({ rows = 5, columns = 8 }: { rows?: number; columns?: number }) => {
    return (
        <div className="w-full animate-pulse">
            {/* Table Header Skeleton - Match exact header structure */}
            <div className="flex px-4 py-3 bg-gray-50/50 border-b justify-center">
                {Array.from({ length: columns }).map((_, i) => (
                    <div
                        key={`header-${i}`}
                        className="flex-1 px-2 first:pl-0 last:pr-0"
                    >
                        <div className="h-4 w-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                    </div>
                ))}
            </div>

            {/* Table Rows Skeleton - Match exact row structure */}
            <div className="divide-y">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="flex px-4 py-3"
                    >
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className="flex-1 px-2 my-10 first:pl-0 last:pr-0"
                            >
                                <div className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};
// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Index({
    // Data props with default values
    logs = { data: [], links: [], from: 0, to: 0, total: 0 },
    exceptions = { data: [], links: [], from: 0, to: 0, total: 0 },
    schedules = { data: [], links: [], from: 0, to: 0, total: 0 },
    periods = { data: [], links: [], from: 0, to: 0, total: 0 },
    filters = { search: '', perPage: '5' },
    // Count props with default values
    totalCount = 0,
    filteredCount = 0,
    exceptionsTotalCount = 0,
    exceptionsFilteredCount = 0,
    schedulesTotalCount = 0,
    schedulesFilteredCount = 0,
    periodsTotalCount = 0,
    periodsFilteredCount = 0
}: IndexProps) {

    // ==========================================================================
    // STATE MANAGEMENT
    // ==========================================================================

    /** Currently active tab (logs, exceptions, schedules, periods) */
    const [activeTab, setActiveTab] = useState('logs');

    /** Dialog open state for import modal */
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    /** Loading state for table data */
    const [isTableLoading, setIsTableLoading] = useState(false);

    /** Form state for search and pagination */
    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '5',
    });

    // ==========================================================================
    // EFFECTS
    // ==========================================================================

    /**
     * Effect: Handle table loading state
     * Shows skeleton loader when tab changes or search/pagination updates
     */
    useEffect(() => {
        setIsTableLoading(true);

        const timer = setTimeout(() => {
            setIsTableLoading(false);
        }, 300); // Small delay for smoother UX

        return () => clearTimeout(timer);
    }, [activeTab, data.search, data.perPage]);

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    /**
     * Handle search input change
     * Updates form state and triggers server request with debounce
     */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);
        setIsTableLoading(true);

        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        router.get('/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * Reset all filters to default values
     * Clears search and resets items per page
     */
    const handleResetFilters = () => {
        setData('search', '');
        setData('perPage', '5');
        setIsTableLoading(true);

        router.get('/attendances', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * Handle items per page change
     * Updates pagination and triggers server request
     */
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);
        setIsTableLoading(true);

        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
        };

        router.get('/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * Handle tab change
     * Switches between different attendance data views
     */
    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
    };

    // ==========================================================================
    // CONFIGURATIONS
    // ==========================================================================

    /** Tab configurations with labels, icons, counts and descriptions */
    const tabs = [
        {
            id: 'logs',
            label: 'Attendance Logs',
            icon: '📋',
            count: totalCount,
            description: 'View and manage employee daily attendance records'
        },
        {
            id: 'exceptions',
            label: 'Exception Stats',
            icon: '⚠️',
            count: exceptionsTotalCount,
            description: 'Monitor attendance exceptions and irregularities'
        },
        {
            id: 'schedules',
            label: 'Schedules',
            icon: '📅',
            count: schedulesTotalCount,
            description: 'Manage employee work schedules and shifts'
        },
        {
            id: 'periods',
            label: 'Period Stats',
            icon: '📊',
            count: periodsTotalCount,
            description: 'View attendance statistics by period'
        },
    ];

    // ==========================================================================
    // HELPER FUNCTIONS
    // ==========================================================================

    /**
     * Get current data based on active tab
     * Returns the appropriate data, pagination, and table configuration
     */
    const getCurrentData = () => {
        switch (activeTab) {
            case 'logs':
                return {
                    data: logs.data,
                    pagination: logs,
                    config: AttendanceLogsTableConfig,
                    filteredCount: filteredCount,
                    totalCount: totalCount
                };
            case 'exceptions':
                return {
                    data: exceptions.data,
                    pagination: exceptions,
                    config: AttendanceExceptionStatsTableConfig,
                    filteredCount: exceptionsFilteredCount,
                    totalCount: exceptionsTotalCount
                };
            case 'schedules':
                return {
                    data: schedules.data,
                    pagination: schedules,
                    config: AttendanceSchedulesTableConfig,
                    filteredCount: schedulesFilteredCount,
                    totalCount: schedulesTotalCount
                };
            case 'periods':
                return {
                    data: periods.data,
                    pagination: periods,
                    config: AttendancePeriodStatsTableConfig,
                    filteredCount: periodsFilteredCount,
                    totalCount: periodsTotalCount
                };
            default:
                return {
                    data: [],
                    pagination: { data: [], links: [], from: 0, to: 0, total: 0 },
                    config: AttendanceLogsTableConfig,
                    filteredCount: 0,
                    totalCount: 0
                };
        }
    };

    /**
     * Get current tab object
     * Returns the tab configuration for the active tab
     */
    const getCurrentTab = () => {
        return tabs.find(t => t.id === activeTab) || tabs[0];
    };

    // Get current data and tab
    const current = getCurrentData();
    const currentTab = getCurrentTab();

    // Determine number of skeleton columns based on active tab
    const skeletonColumns = activeTab === 'periods' ? 12 : activeTab === 'exceptions' ? 10 : 8;

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-hidden">

                {/* ========================================
                        HEADER SECTION
                        Title and Import Button
                    ======================================== */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>

                    {/* Import Dialog Modal */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Import Attendance
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Import Attendance Data</DialogTitle>
                                <DialogDescription>
                                    Upload an Excel file (.xls or .xlsx) containing attendance records.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                                <BiometricImport />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* ========================================
            TABS NAVIGATION
            4 Main Tabs for different attendance views
        ======================================== */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                  flex items-center gap-2 py-4 px-1 text-sm font-medium border-b-2 transition-all relative
                  ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                `}
                            >
                                <span className="text-xl">{tab.icon}</span>
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`
                    ml-2 px-2 py-0.5 rounded-full text-xs
                    ${activeTab === tab.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-gray-100 text-gray-600'
                                        }
                  `}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* ========================================
                        SEARCH AND FILTERS SECTION
                        Search input and clear button
                    ======================================== */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <Input
                            type="text"
                            value={data.search}
                            onChange={handleSearchChange}
                            placeholder={`Search in ${currentTab.label}...`}
                            name="search"
                            className='flex-1 h-10'
                        />
                        <Button onClick={handleResetFilters} variant="outline" className="h-10 px-5">
                            Clear
                        </Button>
                    </div>

                    {/* Active Tab Description */}
                    <div className="text-sm text-gray-500">
                        {currentTab.description}
                    </div>
                </div>

                {/* ========================================
                        ACTIVE TAB HEADER
                        Current tab information and total count
                    ======================================== */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <span>{currentTab.icon}</span>
                                {currentTab.label}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {currentTab.description}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Total Records</div>
                            <div className="text-2xl font-bold text-primary">
                                {current.totalCount}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================
                    TABLE SECTION
                    Main data table with loading skeleton
                ======================================== */}

                {/* Table Body with Loading State */}
                <div className="relative min-h-[400px]">
                    {isTableLoading ? (
                        <TableSkeleton rows={parseInt(data.perPage)} columns={skeletonColumns} />
                    ) : (
                        <CustomTable
                            columns={current.config.columns}
                            actions={current.config.actions}
                            data={current.data}
                            from={current.pagination.from}
                            onDelete={() => { }}   // No delete for attendance records
                            onView={() => { }}     // Future: Implement view modal
                            onEdit={() => { }}      // No edit for attendance records
                        />
                    )}
                </div>

                {/* ========================================
            PAGINATION SECTION
            Page navigation and items per page
        ======================================== */}
                <div className="mt-4 border-t pt-4">
                    <Pagination
                        pagination={current.pagination}
                        perPage={data.perPage}
                        onPerPageChange={handlePerPageChange}
                        totalCount={current.totalCount}
                        filteredCount={current.filteredCount}
                        search={data.search}
                        resourceName={activeTab}
                    />
                </div>
            </div>
        </AppLayout>
    );
}