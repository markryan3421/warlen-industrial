import { Head, router, useForm } from '@inertiajs/react';
import { Clock, ScrollText } from 'lucide-react';
import { useMemo, useState } from 'react';

import AttendanceController from "@/actions/App/Http/Controllers/HrRole/HRAttendanceController";
import { AttendanceLogTimeline } from '@/components/attendance/attendance-log-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceLogsTableConfig } from '@/config/tables/attendace-logs';
import AppLayout from '@/layouts/app-layout';
import HrLayout from '@/layouts/hr-layout';
import type { BreadcrumbItem } from '@/types';

//import AttendanceController from '../../../actions/App/Http/Controllers/AttendanceController';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Attendance Logs',
    href: '/attendance-logs',
  },
];

interface Logs {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  date: string;   // "YYYY-MM-DD"
  time_in: string | null;   // "HH:MM:SS" or null
  time_out: string | null;  // "HH:MM:SS" or null
  total_hours: number | null;
  is_overtime: boolean;
}

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface LogsPagination {
  data: Logs[];
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
  logs: LogsPagination;
  timelineData: Logs[];
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

export default function AttendanceLogs({ logs, timelineData, filters, totalCount, filteredCount }: IndexProps) {
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
    router.get(AttendanceController.attendanceLogs.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Clears the search bar and resets the list
  const handleReset = () => {
    setData('search', '');
    setData('perPage', '5');

    router.get(AttendanceController.attendanceLogs.url(), {}, {
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

    router.get(AttendanceController.attendanceLogs.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  }

  const [activeTab, setActiveTab] = useState('table');
  const timelineDataFormat = useMemo(() => {
    return timelineData.map(record => ({
      ...record,
      date: record.date.split('T')[0],         // keep only YYYY-MM-DD
      employee_id: record.employee_id,
      employeeName: record.employee_name,
      department: record.department,
      timeIn: record.time_in,
      timeOut: record.time_out,
      totalHours: record.total_hours,
      isOvertime: record.is_overtime,
    }));
  }, [timelineData]);

  console.log('timelineDataFormat', timelineDataFormat);

  return (
    <HrLayout breadcrumbs={breadcrumbs}>
      <Head title="Attendance Logs" />
      {/* <CustomToast /> */}
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Page Header */}
        <div className="flex items-center gap-4 ms-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ScrollText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Serves as the sources of truth for actual attendance events, used to calculate late, overtime, and absence.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            defaultValue="table"
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-muted/50 p-1 rounded-full shadow-sm w-full sm:w-auto">
              <TabsTrigger
                value="table"
                className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Sheet className="h-4 w-4" />
                Table
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Clock className="h-4 w-4" />
                Timeline
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
            {/* Custom Table */}
            <CustomTable
              columns={AttendanceLogsTableConfig.columns}
              actions={AttendanceLogsTableConfig.actions}
              data={logs.data}
              from={logs.from}
              onDelete={() => { }}   // no delete for attendance records
              onView={() => { }}  // wire up a modal here later if needed
              onEdit={() => { }}     // no edit for attendance records
            />

            <CustomPagination
              pagination={logs}
              perPage={data.perPage}
              onPerPageChange={handlePerPageChange}
              totalCount={totalCount}
              filteredCount={filteredCount}
              search={data.search}
              resourceName='logs'
            />
          </>
        ) : activeTab === 'timeline' ? (
          <AttendanceLogTimeline
            logs={timelineData} // Make sure this is always an array
            isLoading={false} // Add loading state if needed
            onEmployeeSelect={(employeeId) => {
              console.log('Selected employee:', employeeId);
            }}
            onDateChange={(date) => {
              console.log('Date changed:', date);
            }}
          />
        ) : null}
      </div>
    </HrLayout>
  );
}