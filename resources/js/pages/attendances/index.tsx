import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Sheet, ChartSpline, Clock, ScrollText, Upload } from 'lucide-react';

// Components
import AppLayout from '@/layouts/app-layout';
import BiometricImport from '@/components/biometric-import';
import { CustomTable } from '@/components/custom-table';
import { CustomPagination } from '@/components/custom-pagination';
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
import { ExceptionStatsTimeline } from '@/components/attendance/exception-stats-view';
import { AttendanceLogTimeline } from '@/components/attendance/attendance-log-view';
import { TableSkeleton } from '@/components/table-skeleton';

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
// MAIN COMPONENT
// ============================================================================

export default function AttendanceManagement({
    // Data props with default values
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

    const [activeMainTab, setActiveMainTab] = useState('logs');
    const [activeSubTab, setActiveSubTab] = useState<'table' | 'timeline' | 'calendar'>('table');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(true); // Start with loading true
    const [localSearch, setLocalSearch] = useState(filters.search || '');

    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    // ==========================================================================
    // DISABLE TOP PROGRESS BAR
    // ==========================================================================

    useEffect(() => {
        const progressBar = document.querySelector('.inertia-progress');
        if (progressBar) {
            (progressBar as HTMLElement).style.display = 'none';
        }

        const style = document.createElement('style');
        style.id = 'hide-inertia-progress';
        style.innerHTML = `
            .inertia-progress {
                display: none !important;
            }
        `;
        document.head.appendChild(style);

        return () => {
            const existingStyle = document.getElementById('hide-inertia-progress');
            if (existingStyle) {
                existingStyle.remove();
            }
        };
    }, []);

    // ==========================================================================
    // HANDLE LOADING STATE
    // ==========================================================================

    // Set loading to false when data is loaded
    useEffect(() => {
        const currentData = getCurrentData().data;
        if (currentData !== undefined) {
            const timer = setTimeout(() => {
                setIsTableLoading(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeMainTab, logs, exceptionStats, schedules, periodStats]);

    // Handle loading for subsequent requests
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const onStart = (event: { visit: { data: any } }) => {
            if (timeoutId) clearTimeout(timeoutId);
            
            const isPaginationRequest = event.visit?.data?.page || event.visit?.data?.perPage;
            if (!isPaginationRequest) {
                setIsTableLoading(true);
            }
        };

        const onFinish = () => {
            timeoutId = setTimeout(() => {
                setIsTableLoading(false);
            }, 150);
        };

        const removeStartListener = router.on('start', onStart);
        const removeFinishListener = router.on('finish', onFinish);

        return () => {
            removeStartListener();
            removeFinishListener();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    // Reset sub-tab when main tab changes
    useEffect(() => {
        setActiveSubTab('table');
    }, [activeMainTab]);

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearch(value);
        setData('search', value);
    };

    const handleResetFilters = () => {
        setLocalSearch('');
        setData('search', '');
        setData('perPage', '10');
    };

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

    const handleMainTabChange = (tabId: string) => {
        setActiveMainTab(tabId);
    };

    const handleSubTabChange = (value: string) => {
        setActiveSubTab(value as typeof activeSubTab);
    };

    // ==========================================================================
    // FORMAT DATA FOR DISPLAY
    // ==========================================================================

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

    const getCurrentData = () => {
        switch (activeMainTab) {
            case 'logs': {
                const total = logs?.total || 0;
                const perPage = parseInt(data.perPage);
                const calculatedLastPage = Math.ceil(total / perPage) || 1;

                const paginationData = {
                    current_page: logs?.current_page || 1,
                    last_page: logs?.last_page || calculatedLastPage,
                    per_page: logs?.per_page || perPage,
                    total: total,
                    from: logs?.from || 0,
                    to: logs?.to || 0,
                    links: logs?.links || [],
                    currentPage: logs?.current_page || 1,
                    lastPage: logs?.last_page || calculatedLastPage,
                    perPage: logs?.per_page || perPage,
                };

                return {
                    data: logs?.data || [],
                    pagination: paginationData,
                    config: AttendanceLogsTableConfig,
                    totalCount: totalCounts?.logs || total,
                    filteredCount: filteredCounts?.logs || logs?.data?.length || 0,
                };
            }

            case 'exceptions': {
                const total = exceptionStats?.total || 0;
                const perPage = parseInt(data.perPage);
                const calculatedLastPage = Math.ceil(total / perPage) || 1;

                return {
                    data: exceptionStats?.data || [],
                    pagination: {
                        current_page: exceptionStats?.current_page || 1,
                        last_page: exceptionStats?.last_page || calculatedLastPage,
                        per_page: exceptionStats?.per_page || perPage,
                        total: total,
                        from: exceptionStats?.from || 0,
                        to: exceptionStats?.to || 0,
                        links: exceptionStats?.links || [],
                        currentPage: exceptionStats?.current_page || 1,
                        lastPage: exceptionStats?.last_page || calculatedLastPage,
                        perPage: exceptionStats?.per_page || perPage,
                    },
                    config: AttendanceExceptionStatsTableConfig,
                    totalCount: totalCounts?.exceptionStats || total,
                    filteredCount: filteredCounts?.exceptionStats || exceptionStats?.data?.length || 0,
                };
            }

            case 'schedules': {
                const total = schedules?.total || 0;
                const perPage = parseInt(data.perPage);
                const calculatedLastPage = Math.ceil(total / perPage) || 1;

                return {
                    data: schedules?.data || [],
                    pagination: {
                        current_page: schedules?.current_page || 1,
                        last_page: schedules?.last_page || calculatedLastPage,
                        per_page: schedules?.per_page || perPage,
                        total: total,
                        from: schedules?.from || 0,
                        to: schedules?.to || 0,
                        links: schedules?.links || [],
                        currentPage: schedules?.current_page || 1,
                        lastPage: schedules?.last_page || calculatedLastPage,
                        perPage: schedules?.per_page || perPage,
                    },
                    config: AttendanceSchedulesTableConfig,
                    totalCount: totalCounts?.schedules || total,
                    filteredCount: filteredCounts?.schedules || schedules?.data?.length || 0,
                };
            }

            case 'periods': {
                const total = periodStats?.total || 0;
                const perPage = parseInt(data.perPage);
                const calculatedLastPage = Math.ceil(total / perPage) || 1;

                return {
                    data: periodStats?.data || [],
                    pagination: {
                        current_page: periodStats?.current_page || 1,
                        last_page: periodStats?.last_page || calculatedLastPage,
                        per_page: periodStats?.per_page || perPage,
                        total: total,
                        from: periodStats?.from || 0,
                        to: periodStats?.to || 0,
                        links: periodStats?.links || [],
                        currentPage: periodStats?.current_page || 1,
                        lastPage: periodStats?.last_page || calculatedLastPage,
                        perPage: periodStats?.per_page || perPage,
                    },
                    config: AttendancePeriodStatsTableConfig,
                    totalCount: totalCounts?.periodStats || total,
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
                        currentPage: 1,
                        lastPage: 1,
                        perPage: parseInt(data.perPage),
                    },
                    config: AttendanceLogsTableConfig,
                    totalCount: 0,
                    filteredCount: 0,
                };
        }
    };

    const getCurrentMainTab = () => {
        return mainTabs.find(t => t.id === activeMainTab) || mainTabs[0];
    };

    // Filter data based on local search term
    const filteredData = useMemo(() => {
        const currentData = getCurrentData().data;

        if (!localSearch.trim()) {
            return currentData;
        }

        const searchTerm = localSearch.toLowerCase().trim();

        return currentData.filter(item => {
            if (item.employee_name?.toLowerCase().includes(searchTerm)) return true;
            if (item.employee_id?.toLowerCase().includes(searchTerm)) return true;
            if (item.department?.toLowerCase().includes(searchTerm)) return true;
            if ('date' in item && item.date?.includes(searchTerm)) return true;
            if ('am_time_in' in item) {
                const exceptionItem = item as ExceptionStats;
                if (exceptionItem.am_time_in?.toLowerCase().includes(searchTerm)) return true;
                if (exceptionItem.pm_time_out?.toLowerCase().includes(searchTerm)) return true;
            }
            return false;
        });
    }, [localSearch, activeMainTab, logs, exceptionStats, schedules, periodStats, data.perPage]);

    const current = getCurrentData();
    const currentMainTab = getCurrentMainTab();

    // Define skeleton columns based on active tab
    const getSkeletonColumns = () => {
        switch (activeMainTab) {
            case 'logs':
                return [
                    { label: 'EMPLOYEE', key: 'employee', className: '' },
                    { label: 'DATE', key: 'date', className: '' },
                    { label: 'TIME IN', key: 'time_in', className: '' },
                    { label: 'TIME OUT', key: 'time_out', className: '' },
                    { label: 'TOTAL HOURS', key: 'total_hours', className: '' },
                    { label: 'OVERTIME', key: 'is_overtime', className: '' },
                    { label: 'DEPARTMENT', key: 'department', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            case 'exceptions':
                return [
                    { label: 'EMPLOYEE', key: 'employee', className: '' },
                    { label: 'DATE', key: 'date', className: '' },
                    { label: 'AM TIME IN', key: 'am_time_in', className: '' },
                    { label: 'AM TIME OUT', key: 'am_time_out', className: '' },
                    { label: 'PM TIME IN', key: 'pm_time_in', className: '' },
                    { label: 'PM TIME OUT', key: 'pm_time_out', className: '' },
                    { label: 'LATE MINS', key: 'late_minutes', className: '' },
                    { label: 'LEAVE EARLY', key: 'leave_early_minutes', className: '' },
                    { label: 'ABSENCE MINS', key: 'absence_minutes', className: '' },
                    { label: 'TOTAL EXC', key: 'total_exception_minutes', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            case 'periods':
                return [
                    { label: 'EMPLOYEE', key: 'employee', className: '' },
                    { label: 'PERIOD', key: 'period', className: '' },
                    { label: 'NORMAL HOURS', key: 'normal_work_hours', className: '' },
                    { label: 'REAL HOURS', key: 'real_work_hours', className: '' },
                    { label: 'LATE TIMES', key: 'late_times', className: '' },
                    { label: 'LATE MINS', key: 'late_minutes', className: '' },
                    { label: 'ATTENDED DAYS', key: 'attended_days', className: '' },
                    { label: 'ABSENT DAYS', key: 'absent_days', className: '' },
                    { label: 'REAL PAY', key: 'real_pay', className: '' },
                    { label: 'DEPARTMENT', key: 'department', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            case 'schedules':
                return [
                    { label: 'EMPLOYEE', key: 'employee', className: '' },
                    { label: 'DATE', key: 'date', className: '' },
                    { label: 'SHIFT CODE', key: 'shift_code', className: '' },
                    { label: 'SHIFT LABEL', key: 'shift_label', className: '' },
                    { label: 'DEPARTMENT', key: 'department', className: '' },
                    { label: 'ACTIONS', key: 'actions', className: 'w-[80px]' },
                ];
            default:
                return Array(8).fill(null).map((_, i) => ({ label: `Column ${i + 1}`, key: `col${i}`, className: '' }));
        }
    };

    // ==========================================================================
    // RENDER
    // ==========================================================================

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Management" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-hidden mx-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-900">
                            {activeMainTab === 'logs' && <ScrollText className="h-6 w-6 text-white" />}
                            {activeMainTab === 'exceptions' && <ChartSpline className="h-6 w-6 text-white" />}
                            {activeMainTab === 'schedules' && <Clock className="h-6 w-6 text-white" />}
                            {activeMainTab === 'periods' && <Calendar className="h-6 w-6 text-white" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{currentMainTab.label}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{currentMainTab.description}</p>
                        </div>
                    </div>

                    {/* Import Dialog Modal */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center lg:gap-2">
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
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={localSearch}
                                        onChange={handleSearchChange}
                                        placeholder={`Search in ${currentMainTab.label}...`}
                                        className="h-10 w-64 pr-8"
                                        autoComplete="off"
                                    />
                                    {localSearch && (
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
                    <div className="flex sm:flex-col items-center gap-4">
                        <div className="lg:relative">
                            <Input
                                type="text"
                                value={localSearch}
                                onChange={handleSearchChange}
                                placeholder={`Search in ${currentMainTab.label}...`}
                                className="h-10 w-64 pr-8"
                                autoComplete="off"
                            />
                            {localSearch && (
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
                                {activeSubTab === 'table' ?
                                    (localSearch ? 'Filtered Records' : 'Total Records') :
                                    'Total Items'}
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {activeSubTab === 'table'
                                    ? localSearch
                                        ? filteredData.length.toLocaleString()
                                        : current.totalCount.toLocaleString()
                                    : activeSubTab === 'timeline'
                                        ? timelineDataFormatted.length.toLocaleString()
                                        : calendarDataFormatted.length.toLocaleString()}
                            </div>
                            {localSearch && activeSubTab === 'table' && (
                                <div className="text-xs text-gray-400">
                                    of {current.totalCount.toLocaleString()} total
                                </div>
                            )}
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
                                    Showing <span className="font-bold text-primary">
                                        {filteredData.length}
                                    </span> of{' '}
                                    <span className="font-bold">
                                        {localSearch ? current.totalCount.toLocaleString() : current.totalCount.toLocaleString()}
                                    </span> records
                                    {localSearch && (
                                        <span className="ml-1">
                                            (filtered)
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
                                    columns={getSkeletonColumns()}
                                    rows={parseInt(data.perPage)}
                                    title={currentMainTab.label}
                                    animationDuration={1500}
                                />
                            ) : (
                                <CustomTable
                                    columns={current.config.columns}
                                    actions={current.config.actions}
                                    data={filteredData}
                                    from={current.pagination?.from || 0}
                                    onDelete={() => {}}
                                    onView={() => {}}
                                    onEdit={() => {}}
                                />
                            )}

                            {/* Pagination */}
                            {filteredData.length > 0 && (
                                <div className="mt-4">
                                    <CustomPagination
                                        pagination={current.pagination}
                                        perPage={data.perPage}
                                        onPerPageChange={handlePerPageChange}
                                        totalCount={localSearch ? filteredData.length : current.totalCount}
                                        filteredCount={localSearch ? filteredData.length : current.filteredCount}
                                        search={localSearch}
                                        resourceName={activeMainTab === 'logs' ? 'logs' :
                                            activeMainTab === 'exceptions' ? 'exceptions' :
                                                activeMainTab === 'schedules' ? 'schedules' : 'periods'}
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
                        <ExceptionStatsTimeline
                            exceptions={calendarDataFormatted}
                            onExceptionClick={(record) => console.log('Selected:', record)}
                        />
                    ) : null}
                </div>

                {/* Empty State */}
                {!isTableLoading && filteredData.length === 0 && activeSubTab === 'table' && (
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
            </div>
        </AppLayout>
    );
}