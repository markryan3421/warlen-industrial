import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Sheet, ChartSpline, Clock, ScrollText, Upload } from 'lucide-react';

// Components
import AppLayout from '@/layouts/app-layout';
import BiometricImport from '@/components/biometric-import';
import { CustomTable } from '@/components/custom-table';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ExceptionStatsHybrid } from '@/components/attendance/exception-stats-view';
import { AttendanceLogTimeline } from '@/components/attendance/attendance-log-view';

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
        title: 'Attendance Management',
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
    current_page?: number;
    last_page?: number;
    per_page?: number;
}

interface ExceptionPagination {
    data: ExceptionStats[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
}

interface SchedulePagination {
    data: Schedule[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
}

interface PeriodPagination {
    data: PeriodStat[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
}

/** Filter properties for search and pagination */
interface FilterProps {
    search: string;
    perPage: string;
}

/** Main component props from Laravel/Inertia */
interface IndexProps {
    logs?: LogsPagination;
    timelineData?: Logs[];
    exceptionStats?: ExceptionPagination;
    calendarData?: ExceptionStats[];
    schedules?: SchedulePagination;
    periodStats?: PeriodPagination;
    filters: FilterProps;
    // Count properties for each tab
    totalCounts?: {
        logs: number;
        exceptionStats: number;
        periodStats: number;
        schedules: number;
    };
    filteredCounts?: {
        logs: number;
        exceptionStats: number;
        periodStats: number;
        schedules: number;
    };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * TableSkeleton - Loading state placeholder for tables
 */
const TableSkeleton = ({ rows = 5, columns = 8 }: { rows?: number; columns?: number }) => {
    return (
        <div className="w-full animate-pulse">
            {/* Table Header Skeleton */}
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

            {/* Table Rows Skeleton */}
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

export default function AttendanceManagement({
    // Data props with default values - MATCHING THE EXACT PROP NAMES FROM CONTROLLER
    logs = { data: [], links: [], from: 0, to: 0, total: 0 },
    timelineData = [],
    exceptionStats = { data: [], links: [], from: 0, to: 0, total: 0 },
    calendarData = [],
    schedules = { data: [], links: [], from: 0, to: 0, total: 0 },
    periodStats = { data: [], links: [], from: 0, to: 0, total: 0 },
    filters = { search: '', perPage: '10' },
    // Count props with default values
    totalCounts = { logs: 0, exceptionStats: 0, periodStats: 0, schedules: 0 },
    filteredCounts = { logs: 0, exceptionStats: 0, periodStats: 0, schedules: 0 },
}: IndexProps) {

    // Debug: Log all props to see what's coming from the backend
    useEffect(() => {
        console.log('========== PROPS RECEIVED ==========');
        console.log('logs:', logs);
        console.log('exceptionStats:', exceptionStats);
        console.log('periodStats:', periodStats);
        console.log('schedules:', schedules);
        console.log('timelineData:', timelineData);
        console.log('calendarData:', calendarData);
        console.log('totalCounts:', totalCounts);
        console.log('filteredCounts:', filteredCounts);
        console.log('====================================');
    }, [logs, exceptionStats, periodStats, schedules, timelineData, calendarData, totalCounts, filteredCounts]);

    // ==========================================================================
    // STATE MANAGEMENT
    // ==========================================================================

    /** Currently active main tab */
    const [activeMainTab, setActiveMainTab] = useState('logs');

    /** Currently active sub tab (for logs and exceptions) */
    const [activeSubTab, setActiveSubTab] = useState<'table' | 'timeline' | 'calendar'>('table');

    /** Dialog open state for import modal */
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    /** Loading state for table data */
    const [isTableLoading, setIsTableLoading] = useState(false);

    /** Form state for search and pagination */
    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    // ==========================================================================
    // DISABLE TOP PROGRESS BAR FOR THIS PAGE
    // ==========================================================================

    useEffect(() => {
        // Find and hide the Inertia progress bar
        const progressBar = document.querySelector('.inertia-progress');
        if (progressBar) {
            (progressBar as HTMLElement).style.display = 'none';
        }

        // Create a style element to hide the progress bar
        const style = document.createElement('style');
        style.id = 'hide-inertia-progress';
        style.innerHTML = `
            .inertia-progress {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        // Cleanup: remove style and show progress bar again when leaving page
        return () => {
            const existingStyle = document.getElementById('hide-inertia-progress');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);

    // ==========================================================================
    // EFFECTS
    // ==========================================================================

    /**
     * Handle loading state for table skeleton
     */
    useEffect(() => {
        const onStart = () => {
            setIsTableLoading(true);
        };

        const onFinish = () => {
            setIsTableLoading(false);
        };

        const removeStartListener = router.on('start', onStart);
        const removeFinishListener = router.on('finish', onFinish);

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    /**
     * Reset sub-tab when main tab changes
     */
    useEffect(() => {
        setActiveSubTab('table');
    }, [activeMainTab]);

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    /**
     * Handle search input change
     */
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);

        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
            tab: activeMainTab,
        };

        router.get('/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * Reset all filters to default values
     */
    const handleResetFilters = () => {
        setData('search', '');
        setData('perPage', '10');

        router.get('/attendances', { tab: activeMainTab }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * Handle items per page change
     */
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);

        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
            tab: activeMainTab,
        };

        router.get('/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    /**
     * Handle main tab change - NO SERVER REQUEST, just local state change
     */
    const handleMainTabChange = (tabId: string) => {
        setActiveMainTab(tabId);
    };

    /**
     * Handle sub tab change
     */
    const handleSubTabChange = (value: string) => {
        setActiveSubTab(value as typeof activeSubTab);
    };

    // ==========================================================================
    // FORMAT DATA FOR DISPLAY
    // ==========================================================================

    /**
     * Format calendar data for exception stats
     */
    const calendarDataFormatted = useMemo(() => {
        if (!calendarData || !Array.isArray(calendarData)) return [];
        return calendarData.map(record => ({
            ...record,
            date: record.date ? record.date.split('T')[0] : '',
            employeeId: record.employee_id,
            employeeName: record.employee_name,
            department: record.department,
            am_time_in: record.am_time_in,
            pm_time_out: record.pm_time_out,
            absenceMinutes: record.absence_minutes ?? 0,
            totalExceptionMinutes: record.total_exception_minutes ?? 0,
        }));
    }, [calendarData]);

    /**
     * Format timeline data for logs
     */
    const timelineDataFormatted = useMemo(() => {
        if (!timelineData || !Array.isArray(timelineData)) return [];
        return timelineData.map(record => ({
            ...record,
            date: record.date ? record.date.split('T')[0] : '',
            employee_id: record.employee_id,
            employeeName: record.employee_name,
            department: record.department,
            timeIn: record.time_in,
            timeOut: record.time_out,
            totalHours: record.total_hours,
            isOvertime: record.is_overtime,
        }));
    }, [timelineData]);

    // ==========================================================================
    // CONFIGURATIONS
    // ==========================================================================

    /** Main tab configurations - USING CORRECT COUNT NAMES */
    const mainTabs = [
        {
            id: 'logs',
            label: 'Attendance Logs',
            icon: ScrollText,
            count: totalCounts?.logs || logs?.total || 0,
            data: logs,
            description: 'View and manage employee daily attendance records',
            hasSubTabs: true,
        },
        {
            id: 'exceptions',
            label: 'Exception Stats',
            icon: ChartSpline,
            count: totalCounts?.exceptionStats || exceptionStats?.total || 0,
            data: exceptionStats,
            description: 'Monitor attendance exceptions and irregularities',
            hasSubTabs: true,
        },
        {
            id: 'schedules',
            label: 'Schedules',
            icon: Clock,
            count: totalCounts?.schedules || schedules?.total || 0,
            data: schedules,
            description: 'Manage employee work schedules and shifts',
            hasSubTabs: false,
        },
        {
            id: 'periods',
            label: 'Period Stats',
            icon: Calendar,
            count: totalCounts?.periodStats || periodStats?.total || 0,
            data: periodStats,
            description: 'View attendance statistics by period',
            hasSubTabs: false,
        },
    ];

    // ==========================================================================
    // HELPER FUNCTIONS
    // ==========================================================================

    /**
     * Get current data based on active main tab
     */
    const getCurrentData = () => {
        switch (activeMainTab) {
            case 'logs':
                return {
                    data: logs?.data || [],
                    pagination: logs,
                    config: AttendanceLogsTableConfig,
                    totalCount: totalCounts?.logs || logs?.total || 0,
                    filteredCount: filteredCounts?.logs || logs?.data?.length || 0,
                };
            case 'exceptions':
                return {
                    data: exceptionStats?.data || [],
                    pagination: exceptionStats,
                    config: AttendanceExceptionStatsTableConfig,
                    totalCount: totalCounts?.exceptionStats || exceptionStats?.total || 0,
                    filteredCount: filteredCounts?.exceptionStats || exceptionStats?.data?.length || 0,
                };
            case 'schedules':
                return {
                    data: schedules?.data || [],
                    pagination: schedules,
                    config: AttendanceSchedulesTableConfig,
                    totalCount: totalCounts?.schedules || schedules?.total || 0,
                    filteredCount: filteredCounts?.schedules || schedules?.data?.length || 0,
                };
            case 'periods':
                return {
                    data: periodStats?.data || [],
                    pagination: periodStats,
                    config: AttendancePeriodStatsTableConfig,
                    totalCount: totalCounts?.periodStats || periodStats?.total || 0,
                    filteredCount: filteredCounts?.periodStats || periodStats?.data?.length || 0,
                };
            default:
                return {
                    data: [],
                    pagination: { data: [], links: [], from: 0, to: 0, total: 0 },
                    config: AttendanceLogsTableConfig,
                    totalCount: 0,
                    filteredCount: 0,
                };
        }
    };

    /**
     * Get current main tab object
     */
    const getCurrentMainTab = () => {
        return mainTabs.find(t => t.id === activeMainTab) || mainTabs[0];
    };

    // Get current data and tab
    const current = getCurrentData();
    const currentMainTab = getCurrentMainTab();

    // Determine number of skeleton columns based on active tab
    const getSkeletonColumns = () => {
        switch (activeMainTab) {
            case 'logs':
                return 8;
            case 'exceptions':
                return 11;
            case 'periods':
                return 12;
            case 'schedules':
                return 6;
            default:
                return 8;
        }
    };

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-hidden">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            {activeMainTab === 'logs' && <ScrollText className="h-6 w-6 text-primary" />}
                            {activeMainTab === 'exceptions' && <ChartSpline className="h-6 w-6 text-primary" />}
                            {activeMainTab === 'schedules' && <Clock className="h-6 w-6 text-primary" />}
                            {activeMainTab === 'periods' && <Calendar className="h-6 w-6 text-primary" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{currentMainTab.label}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{currentMainTab.description}</p>
                        </div>
                    </div>

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

                {/* Main Tabs Navigation */}
                <div className="border-b border-gray-200">
                    <Tabs value={activeMainTab} onValueChange={handleMainTabChange} className="w-full">
                        <TabsList className="bg-transparent h-auto p-0">
                            {mainTabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <TabsTrigger
                                        key={tab.id}
                                        value={tab.id}
                                        className="px-5 py-3 data-[state=active]:border-b-4 data-[state=active]:rounded-t-lg data-[state=active]:border-primary rounded-none bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=inactive]:text-gray-500"
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span className={`
                                                ml-2 px-2 py-0.5 rounded-full text-xs
                                                ${activeMainTab === tab.id
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-gray-100 text-gray-600'
                                                }
                                            `}>
                                                {tab.count.toLocaleString()}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Sub Tabs for Logs and Exceptions */}
                {(activeMainTab === 'logs' || activeMainTab === 'exceptions') && (
                    <div className="flex items-center justify-between gap-4 w-full">
                        <Tabs
                            value={activeSubTab}
                            onValueChange={handleSubTabChange}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="bg-muted/50 p-1 rounded-full shadow-sm">
                                <TabsTrigger value="table" className="rounded-full px-6">
                                    <Sheet className="h-4 w-4 mr-2" />
                                    Table
                                    {activeSubTab === 'table' && current.data.length > 0 && (
                                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                                            {current.data.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value={activeMainTab === 'logs' ? 'timeline' : 'calendar'}
                                    className="rounded-full px-6"
                                >
                                    {activeMainTab === 'logs' ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2" />
                                            Timeline
                                            {activeSubTab === 'timeline' && timelineDataFormatted.length > 0 && (
                                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                                                    {timelineDataFormatted.length}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Calendar
                                            {activeSubTab === 'calendar' && calendarDataFormatted.length > 0 && (
                                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                                                    {calendarDataFormatted.length}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Search - only show in table view */}
                        {activeSubTab === 'table' && (
                            <div className="flex items-center gap-4">
                                <Input
                                    type="text"
                                    value={data.search}
                                    onChange={handleSearchChange}
                                    placeholder={`Search in ${currentMainTab.label}...`}
                                    className="h-10 w-64"
                                />
                                <Button onClick={handleResetFilters} variant="outline" className="h-10">
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Search for tabs without sub-tabs */}
                {!['logs', 'exceptions'].includes(activeMainTab) && (
                    <div className="flex items-center gap-4">
                        <Input
                            type="text"
                            value={data.search}
                            onChange={handleSearchChange}
                            placeholder={`Search in ${currentMainTab.label}...`}
                            className="h-10 w-64"
                        />
                        <Button onClick={handleResetFilters} variant="outline" className="h-10">
                            Clear
                        </Button>
                    </div>
                )}

                {/* Active Tab Info */}
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                {activeMainTab === 'logs' && <ScrollText className="h-5 w-5" />}
                                {activeMainTab === 'exceptions' && <ChartSpline className="h-5 w-5" />}
                                {activeMainTab === 'schedules' && <Clock className="h-5 w-5" />}
                                {activeMainTab === 'periods' && <Calendar className="h-5 w-5" />}
                                {activeSubTab === 'table' ? currentMainTab.label :
                                    activeSubTab === 'timeline' ? 'Timeline View' : 'Calendar View'}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {activeSubTab === 'table'
                                    ? currentMainTab.description
                                    : activeSubTab === 'timeline'
                                        ? 'View attendance logs in timeline format'
                                        : 'View exception stats in calendar format'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">
                                {activeSubTab === 'table' ? 'Total Records' : 'Total Items'}
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {activeSubTab === 'table'
                                    ? current.totalCount.toLocaleString()
                                    : activeSubTab === 'timeline'
                                        ? timelineDataFormatted.length.toLocaleString()
                                        : calendarDataFormatted.length.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative min-h-[400px]">
                    {activeSubTab === 'table' ? (
                        <>
                            {/* Table Info */}
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing <span className="font-bold text-primary">{current.data.length}</span> of{' '}
                                    <span className="font-bold">{current.totalCount.toLocaleString()}</span> records
                                    {data.search && (
                                        <span className="ml-1">
                                            (filtered from <span className="font-bold">{current.totalCount.toLocaleString()}</span>)
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Page {current.pagination?.current_page || 1} of {current.pagination?.last_page || 1}
                                </div>
                            </div>

                            {/* Table with Skeleton Loader */}
                            {isTableLoading ? (
                                <TableSkeleton
                                    rows={parseInt(data.perPage)}
                                    columns={getSkeletonColumns()}
                                />
                            ) : (
                                <CustomTable
                                    columns={current.config.columns}
                                    actions={current.config.actions}
                                    data={current.data}
                                    from={current.pagination?.from || 0}
                                    onDelete={() => { }}
                                    onView={() => { }}
                                    onEdit={() => { }}
                                />
                            )}

                            {/* Pagination */}
                            {!isTableLoading && current.data.length > 0 && (
                                <div className="mt-4">
                                    <Pagination
                                        pagination={current.pagination}
                                        perPage={data.perPage}
                                        onPerPageChange={handlePerPageChange}
                                        totalCount={current.totalCount}
                                        filteredCount={current.filteredCount}
                                        search={data.search}
                                        resourceName={activeMainTab}
                                    />
                                </div>
                            )}
                        </>
                    ) : activeMainTab === 'logs' && activeSubTab === 'timeline' ? (
                        <AttendanceLogTimeline
                            logs={timelineDataFormatted}
                            isLoading={false}
                            onEmployeeSelect={(employeeId) => console.log('Selected employee:', employeeId)}
                            onDateChange={(date) => console.log('Date changed:', date)}
                        />
                    ) : activeMainTab === 'exceptions' && activeSubTab === 'calendar' ? (
                        <ExceptionStatsHybrid
                            calendarData={calendarDataFormatted}
                            onDayClick={(dateKey, records) => console.log('Selected:', dateKey, records)}
                            maxVisible={3}
                            title="Attendance Exception Stats"
                        />
                    ) : null}
                </div>

                {/* Empty State */}
                {!isTableLoading && current.data.length === 0 && activeSubTab === 'table' && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            {activeMainTab === 'logs' && <ScrollText className="h-12 w-12 text-gray-400" />}
                            {activeMainTab === 'exceptions' && <ChartSpline className="h-12 w-12 text-gray-400" />}
                            {activeMainTab === 'schedules' && <Clock className="h-12 w-12 text-gray-400" />}
                            {activeMainTab === 'periods' && <Calendar className="h-12 w-12 text-gray-400" />}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No records found</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            {data.search
                                ? "No records match your search criteria. Try adjusting your filters."
                                : `No ${currentMainTab.label.toLowerCase()} available at the moment.`}
                        </p>
                        {data.search && (
                            <Button onClick={handleResetFilters} variant="outline">
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}