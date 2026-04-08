import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Sheet, ChartSpline, Clock, ScrollText, Upload, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// Components
import { AttendanceLogTimeline } from '@/components/attendance/attendance-log-view';
import { ExceptionStatsTimeline } from '@/components/attendance/exception-stats-view';
import BiometricImport from '@/components/biometric-import';
import { CustomHeader } from '@/components/custom-header'
import { CustomTable } from '@/components/custom-table';
import { TabPagination } from '@/components/tab-pagination';
import { TableSkeleton } from '@/components/table-skeleton';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types
import { AttendanceLogsTableConfig } from '@/config/tables/attendace-logs';
import { AttendanceExceptionStatsTableConfig } from '@/config/tables/attendance-exception-stats';
import { AttendancePeriodStatsTableConfig } from '@/config/tables/attendance-period-stats';
import { AttendanceSchedulesTableConfig } from '@/config/tables/attendance-schedules-table';
import AppLayout from '@/layouts/hr-layout';
import type { BreadcrumbItem } from '@/types';

// Table Configurations

// ============================================================================
// BREADCRUMBS CONFIGURATION
// ============================================================================
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance Management',
        href: '/hr/attendances',
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

/** Standard pagination structure from Laravel */
interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: LinkProps[];
    path?: string;
    first_page_url?: string;
    last_page_url?: string;
    next_page_url?: string | null;
    prev_page_url?: string | null;
}

/** Pagination structures for each data type */
interface LogsPagination extends PaginationMeta {
    data: Logs[];
}

interface ExceptionPagination extends PaginationMeta {
    data: ExceptionStats[];
}

interface SchedulePagination extends PaginationMeta {
    data: Schedule[];
}

interface PeriodPagination extends PaginationMeta {
    data: PeriodStat[];
}

/** Filter properties for search and pagination */
interface FilterProps {
    search: string;
    perPage: string;
}

/** Main component props from Laravel/Inertia */
interface IndexProps {
    currentTab?: string;
    logs?: LogsPagination;
    timelineData?: Logs[];
    exceptionStats?: ExceptionPagination;
    calendarData?: ExceptionStats[];
    schedules?: SchedulePagination;
    periodStats?: PeriodPagination;
    filters: FilterProps;
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
// SKELETON COMPONENTS
// ============================================================================

// Timeline Skeleton
const TimelineSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// Calendar Skeleton
const CalendarSkeleton = () => (
    <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={i} className="text-center py-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
            </div>
        ))}
        {Array(35).fill(0).map((_, i) => (
            <div key={i} className="border rounded-lg p-2 min-h-[100px] animate-pulse">
                <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="space-y-1">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
            </div>
        ))}
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AttendanceManagement({
    currentTab = 'logs',
    logs = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0, links: [] },
    timelineData = [],
    exceptionStats = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0, links: [] },
    calendarData = [],
    schedules = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0, links: [] },
    periodStats = { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0, links: [] },
    filters = { search: '', perPage: '10' },
    totalCounts = { logs: 0, exceptionStats: 0, periodStats: 0, schedules: 0 },
    filteredCounts = { logs: 0, exceptionStats: 0, periodStats: 0, schedules: 0 },
}: IndexProps) {

    // ==========================================================================
    // STATE MANAGEMENT
    // ==========================================================================

    const [activeMainTab, setActiveMainTab] = useState(currentTab);
    const [activeSubTab, setActiveSubTab] = useState<'table' | 'timeline' | 'calendar'>('table');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [animateHeader, setAnimateHeader] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    // ==========================================================================
    // SYNC STATE WITH PROPS
    // ==========================================================================

    useEffect(() => {
        if (currentTab && currentTab !== activeMainTab) {
            setActiveMainTab(currentTab);
        }
    }, [currentTab]);

    useEffect(() => {
        if (filters.search !== undefined && filters.search !== localSearch) {
            setLocalSearch(filters.search);
        }
    }, [filters.search]);

    useEffect(() => {
        if (filters.perPage && filters.perPage !== data.perPage) {
            setData('perPage', filters.perPage);
        }
    }, [filters.perPage, data.perPage, setData]);

    // ==========================================================================
    // HANDLE LOADING STATE - FIXED
    // ==========================================================================

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let isNavigating = false;
        let isMounted = true;

        const onStart = () => {
            if (!isMounted) return;
            isNavigating = true;
            if (timeoutId) clearTimeout(timeoutId);
            setIsTableLoading(true);
        };

        const onFinish = () => {
            if (!isMounted) return;
            // Clear any existing timeout
            if (timeoutId) clearTimeout(timeoutId);

            // Only set loading false after a short delay to ensure DOM is updated
            timeoutId = setTimeout(() => {
                if (isMounted && isNavigating) {
                    setIsTableLoading(false);
                    isNavigating = false;
                }
            }, 150);
        };

        const removeStartListener = router.on('start', onStart);
        const removeFinishListener = router.on('finish', onFinish);

        return () => {
            isMounted = false;
            removeStartListener();
            removeFinishListener();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    // ==========================================================================
    // TAB CHANGE HANDLER - INSTANT SKELETON WITH HEADER ANIMATION
    // ==========================================================================

    const handleMainTabChange = useCallback((tabId: string) => {
        if (tabId === activeMainTab) return;

        // Trigger header animation
        setAnimateHeader(false);
        setTimeout(() => setAnimateHeader(true), 10);

        // Show skeleton immediately
        setIsTableLoading(true);

        // Build URL with reset to page 1
        const queryString: Record<string, string> = {
            tab: tabId,
            perPage: data.perPage,
            page: '1',
        };

        if (localSearch && localSearch.trim()) {
            queryString.search = localSearch.trim();
        }

        // Navigate
        router.get('/hr/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                // Success is handled by onFinish
            },
            onError: () => {
                // If error occurs, hide loading
                setIsTableLoading(false);
            }
        });

        // Update active tab immediately for UI responsiveness
        setActiveMainTab(tabId);
    }, [activeMainTab, data.perPage, localSearch]);

    const handleSubTabChange = useCallback((value: string) => {
        if (value === activeSubTab) return;
        // Simply change the sub-tab without loading state since no data fetch is needed
        setActiveSubTab(value as typeof activeSubTab);
    }, [activeSubTab]);

    // Cleanup loading state on unmount
    useEffect(() => {
        return () => {
            setIsTableLoading(false);
        };
    }, []);

    // Reset sub-tab when main tab changes
    useEffect(() => {
        setActiveSubTab('table');
    }, [activeMainTab]);

    // Trigger header animation on initial load
    useEffect(() => {
        setTimeout(() => setAnimateHeader(true), 100);
    }, []);

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearch(value);

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => {
            // Only show loading if search actually changed
            if (value !== localSearch) {
                setIsTableLoading(true);
            }

            const queryString: Record<string, string> = {
                tab: activeMainTab,
                perPage: data.perPage,
                page: '1',
            };

            if (value && value.trim()) {
                queryString.search = value.trim();
            }

            router.get('/hr/attendances', queryString, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
    }, [activeMainTab, data.perPage, localSearch]);

    const handlePerPageChange = useCallback((value: string) => {
        setData('perPage', value);
        setIsTableLoading(true);

        const queryString: Record<string, string> = {
            tab: activeMainTab,
            perPage: value,
            page: '1',
        };

        if (localSearch && localSearch.trim()) {
            queryString.search = localSearch.trim();
        }

        router.get('/hr/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [activeMainTab, localSearch]);

    const handleResetFilters = useCallback(() => {
        setLocalSearch('');
        setData('search', '');
        setData('perPage', '10');
        setIsTableLoading(true);

        router.get('/hr/attendances', {
            tab: activeMainTab,
            perPage: '10',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [activeMainTab]);

    // ==========================================================================
    // FORMAT DATA FOR DISPLAY
    // ==========================================================================

    const calendarDataFormatted = useMemo(() => {
        if (!calendarData || !Array.isArray(calendarData)) return [];
        return calendarData.map(record => ({
            id: record.id,
            employee_id: record.employee_id,
            employee_name: record.employee_name,
            department: record.department,
            date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
            am_time_in: record.am_time_in,
            am_time_out: record.am_time_out,
            pm_time_in: record.pm_time_in,
            pm_time_out: record.pm_time_out,
            late_minutes: record.late_minutes ?? 0,
            leave_early_minutes: record.leave_early_minutes ?? 0,
            absence_minutes: record.absence_minutes ?? 0,
            total_exception_minutes: record.total_exception_minutes ?? 0,
        }));
    }, [calendarData]);

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

    const getCurrentData = useCallback(() => {
        switch (activeMainTab) {
            case 'logs': {
                return {
                    data: logs?.data || [],
                    pagination: {
                        current_page: logs?.current_page || 1,
                        last_page: logs?.last_page || 1,
                        per_page: logs?.per_page || parseInt(data.perPage),
                        total: logs?.total || 0,
                        from: logs?.from || 0,
                        to: logs?.to || 0,
                        links: logs?.links || [],
                    },
                    config: AttendanceLogsTableConfig,
                    title: 'Attendance Logs',
                    totalCount: totalCounts?.logs || logs?.total || 0,
                    filteredCount: filteredCounts?.logs || logs?.data?.length || 0,
                };
            }
            case 'exceptions': {
                return {
                    data: exceptionStats?.data || [],
                    pagination: {
                        current_page: exceptionStats?.current_page || 1,
                        last_page: exceptionStats?.last_page || 1,
                        per_page: exceptionStats?.per_page || parseInt(data.perPage),
                        total: exceptionStats?.total || 0,
                        from: exceptionStats?.from || 0,
                        to: exceptionStats?.to || 0,
                        links: exceptionStats?.links || [],
                    },
                    config: AttendanceExceptionStatsTableConfig,
                    title: 'Attendance Exception Stats',
                    totalCount: totalCounts?.exceptionStats || exceptionStats?.total || 0,
                    filteredCount: filteredCounts?.exceptionStats || exceptionStats?.data?.length || 0,
                };
            }
            case 'schedules': {
                return {
                    data: schedules?.data || [],
                    pagination: {
                        current_page: schedules?.current_page || 1,
                        last_page: schedules?.last_page || 1,
                        per_page: schedules?.per_page || parseInt(data.perPage),
                        total: schedules?.total || 0,
                        from: schedules?.from || 0,
                        to: schedules?.to || 0,
                        links: schedules?.links || [],
                    },
                    config: AttendanceSchedulesTableConfig,
                    title: 'Attendance Schedules',
                    totalCount: totalCounts?.schedules || schedules?.total || 0,
                    filteredCount: filteredCounts?.schedules || schedules?.data?.length || 0,
                };
            }
            case 'periods': {
                return {
                    data: periodStats?.data || [],
                    pagination: {
                        current_page: periodStats?.current_page || 1,
                        last_page: periodStats?.last_page || 1,
                        per_page: periodStats?.per_page || parseInt(data.perPage),
                        total: periodStats?.total || 0,
                        from: periodStats?.from || 0,
                        to: periodStats?.to || 0,
                        links: periodStats?.links || [],
                    },
                    config: AttendancePeriodStatsTableConfig,
                    title: 'Period Statistics',
                    totalCount: totalCounts?.periodStats || periodStats?.total || 0,
                    filteredCount: filteredCounts?.periodStats || periodStats?.data?.length || 0,
                };
            }
            default:
                return {
                    data: [],
                    pagination: {
                        current_page: 1,
                        last_page: 1,
                        per_page: parseInt(data.perPage),
                        total: 0,
                        from: 0,
                        to: 0,
                        links: [],
                    },
                    config: AttendanceLogsTableConfig,
                    title: 'Attendance Management',
                    totalCount: 0,
                    filteredCount: 0,
                };
        }
    }, [activeMainTab, data.perPage, logs, exceptionStats, schedules, periodStats, totalCounts, filteredCounts]);

    const getCurrentMainTab = useCallback(() => {
        return mainTabs.find(t => t.id === activeMainTab) || mainTabs[0];
    }, [activeMainTab, mainTabs]);

    const current = getCurrentData();
    const currentMainTab = getCurrentMainTab();

    const getSkeletonColumns = useCallback(() => {
        switch (activeMainTab) {
            case 'logs':
                return [
                    { label: '#', key: 'employee.count', className: '' },
                    { label: 'EMPLOYEE ID', key: 'employee_id', className: '' },
                    { label: 'EMPLOYEE NAME', key: 'employee_name', className: '' },
                    { label: 'PROJECT SITE', key: 'department', className: '' },
                    { label: 'DATE', key: 'date', className: '' },
                    { label: 'TIME IN', key: 'time_in', className: '' },
                    { label: 'TIME OUT', key: 'time_out', className: '' },
                    { label: 'TOTAL HOURS', key: 'total_hours', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            case 'exceptions':
                return [
                    { label: '#', key: 'employee.count', className: '' },
                    { label: 'EMPLOYEE ID', key: 'employee_id', className: '' },
                    { label: 'EMPLOYEE NAME', key: 'employee_name', className: '' },
                    { label: 'PROJECT SITE', key: 'department', className: '' },
                    { label: 'DATE', key: 'date', className: '' },
                    { label: 'ABSENCE MINS', key: 'absence_minutes', className: '' },
                    { label: 'TOTAL EXCEPTION MINUTES', key: 'total_exception_minutes', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            case 'periods':
                return [
                    { label: '#', key: 'employee.count', className: '' },
                    { label: 'EMPLOYEE ID', key: 'employee_id', className: '' },
                    { label: 'EMPLOYEE NAME', key: 'employee_name', className: '' },
                    { label: 'PROJECT SITE', key: 'department', className: '' },
                    { label: 'PERIOD START', key: 'period_start', className: '' },
                    { label: 'PERIOD END', key: 'period_end', className: '' },
                    { label: 'LATE TIMES', key: 'late_times', className: '' },
                    { label: 'LATE MINUTES', key: 'late_minutes', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            case 'schedules':
                return [
                    { label: '#', key: 'employee.count', className: '' },
                    { label: 'EMPLOYEE ID', key: 'employee_id', className: '' },
                    { label: 'EMPLOYEE NAME', key: 'employee_name', className: '' },
                    { label: 'PROJECT SITE', key: 'department', className: '' },
                    { label: 'DATE', key: 'date', className: '' },
                    { label: 'SHIFT CODE', key: 'shift_code', className: '' },
                    { label: 'SHIFT LABEL', key: 'shift_label', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            default:
                return Array(8).fill(null).map((_, i) => ({ label: `Column ${i + 1}`, key: `col${i}`, className: '' }));
        }
    }, [activeMainTab]);

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Management" />

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-row { 
                    animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; 
                }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-header { 
                    animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; 
                }
                /* Header animation trigger class */
                .header-animate {
                    animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both;
                }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-hidden mx-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Header Section with animation */}
                        <div className={animateHeader ? 'header-animate' : 'opacity-0'}>
                            <CustomHeader
                                icon={
                                    activeMainTab === 'logs' ? <ScrollText className="h-6 w-6 text-white" /> :
                                        activeMainTab === 'exceptions' ? <ChartSpline className="h-6 w-6 text-white" /> :
                                            activeMainTab === 'schedules' ? <Clock className="h-6 w-6 text-white" /> :
                                                <Calendar className="h-6 w-6 text-white" />
                                }
                                title={currentMainTab.label}
                                description={currentMainTab.description}
                            />
                        </div>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center lg:gap-2 pp-header">
                                <Upload className="h-4 w-4" />
                                Import Attendance
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] lg:w-fit">
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
                <div className="border-b border-gray-200 pp-row">
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
                    <div className="flex items-center justify-between gap-4 w-full pp-row">
                        <Tabs
                            value={activeSubTab}
                            onValueChange={handleSubTabChange}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="bg-muted/50 p-1 rounded-full shadow-sm">
                                <TabsTrigger value="table" className="rounded-full px-6">
                                    <Sheet className="h-4 w-4 mr-2" />
                                    Table
                                    {activeSubTab === 'table' && !isTableLoading && current.data.length > 0 && (
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
                                            {activeSubTab === 'timeline' && !isTableLoading && timelineDataFormatted.length > 0 && (
                                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                                                    {timelineDataFormatted.length}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Calendar
                                            {activeSubTab === 'calendar' && !isTableLoading && calendarDataFormatted.length > 0 && (
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
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={localSearch}
                                        onChange={handleSearchChange}
                                        placeholder={`Search in ${currentMainTab.label}...`}
                                        className="h-10 w-64 pr-8"
                                        autoComplete="off"
                                    />
                                    {isTableLoading && localSearch && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                    {!isTableLoading && localSearch && (
                                        <button
                                            onClick={handleResetFilters}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <Button
                                    onClick={handleResetFilters}
                                    variant="outline"
                                    className="h-10"
                                    disabled={!localSearch}
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Search for tabs without sub-tabs */}
                {!['logs', 'exceptions'].includes(activeMainTab) && (
                    <div className="flex sm:flex-col lg:flex-row justify-end items-center gap-4">
                        <div className="lg:relative">
                            <Input
                                type="text"
                                value={localSearch}
                                onChange={handleSearchChange}
                                placeholder={`Search in ${currentMainTab.label}...`}
                                className="h-10 w-64 pr-8"
                                autoComplete="off"
                            />
                            {isTableLoading && localSearch && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                </div>
                            )}
                            {!isTableLoading && localSearch && (
                                <button
                                    onClick={handleResetFilters}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <Button
                            onClick={handleResetFilters}
                            variant="outline"
                            className="h-10"
                            disabled={!localSearch}
                        >
                            Clear
                        </Button>
                    </div>
                )}

                {/* Content Area */}
                <div className="relative min-h-[400px]">
                    {activeSubTab === 'table' ? (
                        <>
                            {/* Table with Skeleton Loader */}
                            {isTableLoading ? (
                                <div className='pp-row'>
                                    <TableSkeleton
                                        columns={getSkeletonColumns()}
                                        rows={parseInt(data.perPage)}
                                        title={current.title || currentMainTab.label}
                                        animationDuration={800}
                                    />
                                </div>
                            ) : (
                                <>
                                    {current.data.length > 0 ? (
                                        <div className="pp-row">
                                            <CustomTable
                                                columns={current.config.columns}
                                                actions={current.config.actions}
                                                data={current.data}
                                                from={current.pagination?.from || 0}
                                                to={current.pagination?.to || 0}
                                                total={current.pagination?.total || 0}
                                                filteredCount={current.filteredCount}
                                                totalCount={current.totalCount}
                                                searchTerm={localSearch}
                                                onDelete={() => { }}
                                                onView={() => { }}
                                                onEdit={() => { }}
                                                title={current.title || currentMainTab.label}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                                {activeMainTab === 'logs' && <ScrollText className="h-12 w-12 text-gray-400" />}
                                                {activeMainTab === 'exceptions' && <ChartSpline className="h-12 w-12 text-gray-400" />}
                                                {activeMainTab === 'schedules' && <Clock className="h-12 w-12 text-gray-400" />}
                                                {activeMainTab === 'periods' && <Calendar className="h-12 w-12 text-gray-400" />}
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">No records found</h3>
                                            <p className="text-gray-500 mb-6 max-w-sm">
                                                {localSearch
                                                    ? `No results match "${localSearch}". Try adjusting your search.`
                                                    : `No ${currentMainTab.label.toLowerCase()} available at the moment.`}
                                            </p>
                                            {localSearch && (
                                                <Button onClick={handleResetFilters} variant="outline">
                                                    Clear Search
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Pagination */}
                            {!isTableLoading && current.data.length > 0 && (
                                <div className="mt-4 pp-row">
                                    <TabPagination
                                        pagination={current.pagination}
                                        perPage={data.perPage}
                                        onPerPageChange={handlePerPageChange}
                                        activeTab={activeMainTab}
                                        searchTerm={localSearch}
                                        totalCount={current.totalCount}
                                        filteredCount={current.filteredCount}
                                        resourceName={
                                            activeMainTab === 'logs' ? 'log' :
                                                activeMainTab === 'exceptions' ? 'exception' :
                                                    activeMainTab === 'schedules' ? 'schedule' : 'period stat'
                                        }
                                        className="mt-4"
                                        baseUrl="/hr/attendances"
                                    />
                                </div>
                            )}
                        </>
                    ) : activeMainTab === 'logs' && activeSubTab === 'timeline' ? (
                        isTableLoading ? (
                            <TimelineSkeleton />
                        ) : (
                            <AttendanceLogTimeline
                                logs={timelineDataFormatted}
                                isLoading={false}
                                onEmployeeSelect={(employeeId) => console.log('Selected employee:', employeeId)}
                                onDateChange={(date) => console.log('Date changed:', date)}
                            />
                        )
                    ) : activeMainTab === 'exceptions' && activeSubTab === 'calendar' ? (
                        isTableLoading ? (
                            <CalendarSkeleton />
                        ) : (
                            <ExceptionStatsTimeline
                                exceptions={calendarDataFormatted}
                                onExceptionClick={(record) => console.log('Selected:', record)}
                            />
                        )
                    ) : null}
                </div>
            </div>
        </AppLayout>
    );
}