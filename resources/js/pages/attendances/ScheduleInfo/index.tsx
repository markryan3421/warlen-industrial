import { Head, router, useForm } from "@inertiajs/react";
import { useEffect } from "react";
import { CustomTable } from "@/components/custom-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AttendanceSchedulesTableConfig } from "@/config/tables/attendance-schedules-table";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from '@/types';
import AttendanceController from '../../../actions/App/Http/Controllers/AttendanceController';
import AttendanceCalendar, { ScheduleCalendar } from "@/components/custom-calendar";
import { useMemo, useState } from "react";
import { Calendar, ChartSpline, Sheet } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomPagination } from "@/components/custom-pagination";
import { CustomHeader } from "@/components/custom-header";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance Schedules',
        href: '/attendance-schedules',
    },
];

interface Schedules {
    id: number;
    employee_id: string;
    employee_name: string;
    department: string;
    date: string;   // "YYYY-MM-DD"
    shift_code: string;
    shift_label: string;
}

interface LinkProps {
    active: boolean;
    label: string;
    url: string | null;
}

interface SchedulesPagination {
    data: Schedules[];
    links: LinkProps[];
    from: number;
    to: number;
    total: number;
}

interface FilterProps {
    search: string;
    perPage: string;
}

interface IndexProps {
    schedules: SchedulesPagination;
    calendarData: Schedules[];
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

export default function AttendanceSchedules({ schedules, calendarData, filters, totalCount, filteredCount }: IndexProps) {
    const { data, setData } = useForm({
        search: filters.search || '',
        perPage: filters.perPage || '10',
    });

    // Log schedules data whenever it changes
    useEffect(() => {
        console.log('========== ATTENDANCE SCHEDULES DEBUG ==========');
        console.log('Full schedules object:', schedules);
        console.log('Schedules data array:', schedules?.data);
        console.log('Number of records:', schedules?.data?.length);
        console.log('First record (if exists):', schedules?.data?.[0]);
        console.log('Pagination info:', {
            from: schedules?.from,
            to: schedules?.to,
            total: schedules?.total,
            currentPage: schedules?.current_page,
            lastPage: schedules?.last_page
        });
        console.log('===============================================');
    }, [schedules]);

    // Handle search input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);

        // Update the URL with the search query value
        const queryString = {
            ...(value && { search: value }),
            ...(data.perPage && { perPage: data.perPage }),
        };

        // Pass the search query to the backend to filter permissions
        router.get(AttendanceController.attendanceSchedules.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Clears the search bar and resets the list
    const handleReset = () => {
        setData('search', '');
        setData('perPage', '5');

        router.get(AttendanceController.attendanceSchedules.url(), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    // Handle number of permissions to display per page
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);

        // Update the URL with the per page value
        const queryString = {
            ...(data.search && { search: data.search }),
            ...(value && { perPage: value }),
        };

        router.get(AttendanceController.attendanceSchedules.url(), queryString, {
            preserveState: true,
            preserveScroll: true,
        });
    }

    const [activeTab, setActiveTab] = useState('table');
    const calendarDataFormat = useMemo(() => {
        return calendarData.map(record => ({
            ...record,
            date: record.date.split('T')[0],         // keep only YYYY-MM-DD
            employee_id: record.employee_id,
            employee_name: record.employee_name,
            department: record.department,
            shift_code: record.shift_code,
            shift_label: record.shift_label,
        }));
    }, [calendarData]);

    console.log('calendar data', calendarData);

    // Define the shift color config (place this outside your component or in a constants file)
    const SHIFT_CONFIG = {
        1: { label: 'Regular', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
        2: { label: 'Weekender', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
        25: { label: 'Leave', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
        26: { label: 'Out', bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
        // For null/undefined (holiday or no shift)
        null: { label: 'Holiday', bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-300' },
    };

    // The render function itself (place it inside your component)
    const renderScheduleChip = (record: any, compact: boolean) => {
        // Get shift code (could be 1,2,25,26 or null)
        const shift = record.shift_code;
        const config = SHIFT_CONFIG[shift as keyof typeof SHIFT_CONFIG] || SHIFT_CONFIG[null];
        const name = record.employee_name || 'Unknown';

        if (compact) {
            // Compact version for day cells: show colored dot + initials
            return (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${config.bg} ${config.text} truncate max-w-full`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                    <span className="truncate">{name.substring(0, 2).toUpperCase()}</span>
                </span>
            );
        }

        // Full version for popover: show dot, name, department, and shift label
        return (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-400">{record.department}</p>
                </div>
                <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
                    {config.label}
                </span>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Schedules" />
            {/* <CustomToast /> */}
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <CustomHeader
                    icon={<ChartSpline className="h-6 w-6 text-primary" />}
                    title="Attendance Schedule"
                    description="Identify and quantify deviations from the expected work schedule, such as late arrivals, early departures, and absences. The daily breakdown of attendance."
                />

                {/* Combined header row - tabs on left, search on right */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                    {/* Left: Tabs */}
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        defaultValue="calendar"
                        className="w-full sm:w-auto"
                    >
                        <TabsList className="bg-muted/50 p-1 rounded-full shadow-sm w-full sm:w-auto">
                            <TabsTrigger
                                value="table"
                                className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                            >
                                <Sheet className="h-4 w-4 mr-2" />
                                Table
                            </TabsTrigger>
                            <TabsTrigger
                                value="calendar"
                                className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Calendar
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Right: Search + Clear - only show in table view */}
                    {activeTab === 'table' && (
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <Input
                                type="text"
                                value={data.search}
                                onChange={handleChange}
                                placeholder="Search employee..."
                                name="search"
                                className="h-10 w-full sm:w-64"
                            />
                            <Button
                                onClick={handleReset}
                                className="bg-primary h-10 px-5 cursor-pointer whitespace-nowrap"
                            >
                                clear
                            </Button>
                        </div>
                    )}
                </div>

                {activeTab === 'table' ? (
                    <>
                        {/* Custom Table */}
                        <CustomTable
                            columns={AttendanceSchedulesTableConfig.columns}
                            actions={AttendanceSchedulesTableConfig.actions}
                            data={schedules.data}
                            from={schedules.from}
                            onDelete={() => { }}   // no delete for attendance records
                            onView={() => { }}  // wire up a modal here later if needed
                            onEdit={() => { }}     // no edit for attendance records
                        />

                        <CustomPagination
                            pagination={schedules}
                            perPage={data.perPage}
                            onPerPageChange={handlePerPageChange}
                            totalCount={totalCount}
                            filteredCount={filteredCount}
                            search={data.search}
                            resourceName='schedules'
                        />
                    </>
                ) : (
                    <ScheduleCalendar
                        schedules={calendarData}
                        maxVisible={4}
                        title="Schedule Calendar"
                        onDayClick={(date, records) => console.log(date, records)}
                    />
                )}
            </div>
        </AppLayout>
    );
}