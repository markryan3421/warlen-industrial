import { Head, useForm, router } from '@inertiajs/react';
import { Calendar, Sheet, ChartSpline, Clock, ScrollText, Upload, Loader2, Search } from 'lucide-react';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// Table Configurations

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
    const [isTableLoading, setIsTableLoading] = useState(true); // CHANGED: Start with true to show skeleton immediately
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [animateHeader, setAnimateHeader] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialLoadRef = useRef(true); // Track initial load

    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    // Check if any filters are active
    const hasFilters = !!localSearch;

    // Refresh data function
    const refreshData = useCallback(() => {
        setIsTableLoading(true);
        setRefreshKey(prev => prev + 1);

        router.reload({
            preserveState: false,
            preserveScroll: true,
            only: ['logs', 'exceptionStats', 'schedules', 'periodStats', 'totalCounts', 'filteredCounts'],
            onFinish: () => {
                setTimeout(() => {
                    setIsTableLoading(false);
                }, 300);
            }
        });
    }, []);

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
    // HANDLE LOADING STATE - FIXED FOR SIDEBAR NAVIGATION AND INITIAL LOAD
    // ==========================================================================

    // Helper function to get current data (needs to be defined before useEffect)
    const getCurrentData = useCallback(() => {
        switch (activeMainTab) {
            case 'logs':
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
            case 'exceptions':
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
            case 'schedules':
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
            case 'periods':
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
                    title: 'Attendance Period Stats',
                    totalCount: totalCounts?.periodStats || periodStats?.total || 0,
                    filteredCount: filteredCounts?.periodStats || periodStats?.data?.length || 0,
                };
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

    // Effect for handling initial load and navigation loading states
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let isMounted = true;

        // Handler for navigation start
        const onStart = () => {
            if (!isMounted) return;
            if (timeoutId) clearTimeout(timeoutId);
            setIsTableLoading(true);
        };

        // Handler for navigation finish
        const onFinish = () => {
            if (!isMounted) return;
            if (timeoutId) clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                if (isMounted) {
                    setIsTableLoading(false);
                    initialLoadRef.current = false;
                }
            }, 150);
        };

        // Register event listeners
        const removeStartListener = router.on('start', onStart);
        const removeFinishListener = router.on('finish', onFinish);

        // Handle initial load - turn off loading after data is available
        const currentData = getCurrentData();
        if (currentData.data.length > 0 || currentData.totalCount > 0) {
            // If data is already available, turn off loading after a short delay
            timeoutId = setTimeout(() => {
                if (isMounted) {
                    setIsTableLoading(false);
                    initialLoadRef.current = false;
                }
            }, 300);
        } else if (currentData.data.length === 0 && initialLoadRef.current) {
            // Keep loading true until data arrives or timeout
            timeoutId = setTimeout(() => {
                if (isMounted && initialLoadRef.current) {
                    setIsTableLoading(false);
                    initialLoadRef.current = false;
                }
            }, 1000); // Fallback timeout
        }

        return () => {
            isMounted = false;
            removeStartListener();
            removeFinishListener();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []); // Run once on mount

    // Effect to watch for data changes and turn off loading
    useEffect(() => {
        // If we're loading and data arrives, turn off loading
        if (isTableLoading && initialLoadRef.current) {
            const currentData = getCurrentData();
            if (currentData.data.length > 0 || currentData.totalCount > 0) {
                const timer = setTimeout(() => {
                    setIsTableLoading(false);
                    initialLoadRef.current = false;
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [logs, exceptionStats, schedules, periodStats]); // Watch for data changes

    // ==========================================================================
    // TAB CHANGE HANDLER
    // ==========================================================================

    const handleMainTabChange = useCallback((tabId: string) => {
        if (tabId === activeMainTab) return;

        setAnimateHeader(false);
        setTimeout(() => setAnimateHeader(true), 10);
        setIsTableLoading(true);

        const queryString: Record<string, string> = {
            tab: tabId,
            perPage: data.perPage,
            page: '1',
        };

        if (localSearch && localSearch.trim()) {
            queryString.search = localSearch.trim();
        }

        router.get('/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setTimeout(() => {
                    setIsTableLoading(false);
                }, 150);
            }
        });

        setActiveMainTab(tabId);
    }, [activeMainTab, data.perPage, localSearch]);

    const handleSubTabChange = useCallback((value: string) => {
        if (value === activeSubTab) return;
        setIsTableLoading(true);
        setActiveSubTab(value as typeof activeSubTab);
        setTimeout(() => {
            setIsTableLoading(false);
        }, 300);
    }, [activeSubTab]);

    useEffect(() => {
        return () => setIsTableLoading(false);
    }, []);

    useEffect(() => {
        setActiveSubTab('table');
    }, [activeMainTab]);

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

            router.get('/attendances', queryString, {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => {
                    setTimeout(() => {
                        setIsTableLoading(false);
                    }, 150);
                }
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

        router.get('/attendances', queryString, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setTimeout(() => {
                    setIsTableLoading(false);
                }, 150);
            }
        });
    }, [activeMainTab, localSearch]);

    const handleResetFilters = useCallback(() => {
        setLocalSearch('');
        setData('search', '');
        setData('perPage', '10');
        setIsTableLoading(true);

        router.get('/attendances', {
            tab: activeMainTab,
            perPage: '10',
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setTimeout(() => {
                    setIsTableLoading(false);
                }, 150);
            }
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
            label: 'Attendance Exception Stats',
            icon: ChartSpline,
            count: totalCounts?.exceptionStats || exceptionStats?.total || 0,
            data: exceptionStats,
            description: 'Monitor attendance exceptions and irregularities',
            hasSubTabs: true,
        },
        {
            id: 'schedules',
            label: 'Attendance Schedules',
            icon: Clock,
            count: totalCounts?.schedules || schedules?.total || 0,
            data: schedules,
            description: 'Manage employee work schedules and shifts',
            hasSubTabs: false,
        },
        {
            id: 'periods',
            label: 'Attendance Period Stats',
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

    const current = getCurrentData();
    const currentMainTab = mainTabs.find(t => t.id === activeMainTab) || mainTabs[0];

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
                .header-animate {
                    animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both;
                }
            `}</style>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-hidden mx-4">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-xl">
                    <div className={`${animateHeader ? 'header-animate' : 'opacity-0'} w-full lg:w-auto`}>
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

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center ml-auto -mt-3 lg:w-auto justify-center lg:ml-auto pp-header">
                                <Upload className="h-4 w-4 mr-2" />
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
                                <BiometricImport
                                    onSuccess={() => {
                                        setIsDialogOpen(false);
                                        setIsTableLoading(true);
                                        setTimeout(() => {
                                            refreshData();
                                        }, 100);
                                    }}
                                />
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
                                        className="px-3 md:px-5 py-3 mr-0.5 border-b-2 data-[state=active]:border-b-4 data-[state=active]:rounded-t-xl data-[state=active]:border-primary data-[state=inactive]:border-gray-300 data-[state=inactive]:border-b-2 rounded-t-xl rounded-b-none bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=inactive]:text-gray-600 hover:data-[state=inactive]:border-gray-500 transition-all duration-200"
                                    >
                                        <Icon className="h-4 w-4 lg:mr-2" />
                                        <span className="hidden lg:inline">{tab.label}</span>
                                        {tab.count > 0 && (
                                            <span className={`
                                ml-1 lg:ml-2 px-1.5 lg:px-2 py-0.5 rounded-full text-xs
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
                    <div className="flex flex-col justify-center lg:flex-row items-center lg:justify-between xl:justify-between gap-4 w-full pp-row">
                        <Tabs
                            value={activeSubTab}
                            onValueChange={handleSubTabChange}
                            className="w-full sm:w-full"
                        >
                            <TabsList className="bg-muted/50 p-1 rounded-full shadow-sm flex mr-auto">
                                <TabsTrigger value="table" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:cursor-default data-[state=active]:text-primary-foreground rounded-lg transition-all cursor-pointer">
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
                                    className="rounded-full flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:cursor-default data-[state=active]:text-primary-foreground rounded-lg transition-all cursor-pointer"
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
                            <div className="flex items-center gap-4 mr-auto lg:ml-0">
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={localSearch}
                                        onChange={handleSearchChange}
                                        placeholder={`Search employee name...`}
                                        className="h-9 w-60 placeholder:text-[14px] lg:placeholder:text-[15px] lg:h-10 lg:w-64 pr-8"
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
                    <div className="flex flex-row mr-auto lg:mr-0 lg:ml-auto lg:flex-row xl:flex-row items-center gap-4">
                        <div className="lg:relative">
                            <Input
                                type="text"
                                value={localSearch}
                                onChange={handleSearchChange}
                                placeholder={`Search employee name...`}
                                className="placeholder:text-[14px] lg:placeholder:text-[15px] lg:h-10 lg:w-64 lg:pr-8"
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
                            {/* Table with Skeleton Loader - ALWAYS show skeleton when loading */}
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
                                <div className="pp-row">
                                    <CustomTable
                                        key={refreshKey}
                                        columns={current.config.columns}
                                        actions={current.config.actions}
                                        data={current.data}
                                        from={current.pagination?.from || 0}
                                        to={current.pagination?.to || 0}
                                        totalCount={current.totalCount}
                                        filteredCount={current.filteredCount}
                                        searchTerm={localSearch}
                                        onDelete={() => { }}
                                        onView={() => { }}
                                        onEdit={() => { }}
                                        title={current.title || currentMainTab.label}
                                        filterEmptyState={
                                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
                                                    {activeMainTab === 'logs' && <ScrollText className="h-5 w-5 text-slate-400 dark:text-slate-500" />}
                                                    {activeMainTab === 'exceptions' && <ChartSpline className="h-5 w-5 text-slate-400 dark:text-slate-500" />}
                                                    {activeMainTab === 'schedules' && <Clock className="h-5 w-5 text-slate-400 dark:text-slate-500" />}
                                                    {activeMainTab === 'periods' && <Calendar className="h-5 w-5 text-slate-400 dark:text-slate-500" />}
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">No results found</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
                                                    {localSearch
                                                        ? `No ${(current.title || currentMainTab.label).toLowerCase()} matching "${localSearch}".`
                                                        : `No ${(current.title || currentMainTab.label).toLowerCase()} available at the moment.`}
                                                </p>
                                                {localSearch && (
                                                    <Button variant="outline" size="sm" onClick={handleResetFilters}>
                                                        Clear filters
                                                    </Button>
                                                )}
                                            </div>
                                        }
                                    />
                                </div>
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