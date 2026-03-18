import { Head, router, useForm } from '@inertiajs/react';
import { Calendar, Sheet, ChartSpline } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ExceptionStatsHybrid } from '@/components/attendance/exception-stats-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceExceptionStatsTableConfig } from '@/config/tables/attendance-exception-stats';
import HrLayout from '@/layouts/hr-layout';
import type { BreadcrumbItem } from '@/types';

import AttendanceController from  "@/actions/App/Http/Controllers/HrRole/HRAttendanceController";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Attendance Exception Stats',
    href: '/attendance-exception-stats',
  },
];

interface ExceptionStats {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;   // "YYYY-MM-DD"
  am_time_in: string | null;   // "HH:MM:SS" or null
  am_time_out: string | null;  // "HH:MM:SS" or null
  pm_time_in: string | null;
  pm_time_out: string | null;
  late_minutes: number | null;
  leave_early_minutes: number | null;
  absence_minutes: number | null;
  total_exception_minutes: number | null;
}

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface ExceptionPagination {
  data: ExceptionStats[];
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
  stats: ExceptionPagination;
  calendarData: ExceptionStats[];
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

export default function AttendanceExceptionStats({ stats, calendarData, filters, totalCount, filteredCount }: IndexProps) {
  const { data, setData } = useForm({
    search: filters.search || '',
    perPage: filters.perPage || '5',
  });

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
    router.get(AttendanceController.attendanceExceptionStats.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Clears the search bar and resets the list
  const handleReset = () => {
    setData('search', '');
    setData('perPage', '10');

    router.get(AttendanceController.attendanceExceptionStats.url(), {}, {
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

    router.get(AttendanceController.attendanceExceptionStats.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  }

  const [activeTab, setActiveTab] = useState('table');
  const calendarDataFormatted = useMemo(() => {
    return calendarData.map(record => ({
      ...record,
      date: record.date.split('T')[0],         // keep only YYYY-MM-DD
      employeeId: record.employee_id,
      employeeName: record.employee_name,
      department: record.department,               // already camelCase
      am_time_in: record.am_time_in,                // snake_case kept
      pm_time_out: record.pm_time_out,              // snake_case kept
      // also include any other fields the chip might use (absence_minutes, total_exception_minutes)
      absenceMinutes: record.absence_minutes ?? 0,
      totalExceptionMinutes: record.total_exception_minutes ?? 0,
    }));
  }, [calendarData]);

  return (
    <HrLayout breadcrumbs={breadcrumbs}>
      <Head title="Attendance Logs" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Page Header */}
        <div className="flex items-center gap-4 ms-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ChartSpline className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance Exception Stats</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Identify and quantify deviations from the expected work schedule, such as late arrivals, early departures, and absences. <br />
              The daily breakdown of attendance.
            </p>
          </div>
        </div>


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

        {/* Table/Calendar content */}
        {activeTab === 'table' ? (
          <>
            <CustomTable
              columns={AttendanceExceptionStatsTableConfig.columns}
              actions={AttendanceExceptionStatsTableConfig.actions}
              data={stats.data}
              from={stats.from}
              onDelete={() => { }}
              onView={() => { }}
              onEdit={() => { }}
            />

            <CustomPagination
              pagination={stats}
              perPage={data.perPage}
              onPerPageChange={handlePerPageChange}
              totalCount={totalCount}
              filteredCount={filteredCount}
              search={data.search}
              resourceName="stats"
            />
          </>
        ) : (
          <ExceptionStatsHybrid
            calendarData={calendarDataFormatted}
            onDayClick={(dateKey, records) => {
              console.log('Selected:', dateKey, records);
            }}
            maxVisible={3}
            title="Attendance Exception Stats"
          />
        )}
      </div>
    </HrLayout>
  );
}