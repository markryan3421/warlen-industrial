import { Head, router, useForm } from '@inertiajs/react';
import { Clock, ScrollText } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { AttendanceLogTimeline } from '@/components/attendance/attendance-log-view';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceLogsTableConfig } from '@/config/tables/attendace-logs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import AttendanceController from '../../../actions/App/Http/Controllers/AttendanceController';

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

  const [activeTab, setActiveTab] = useState('table');

  // Log logs data whenever it changes
  useEffect(() => {
    console.log('========== ATTENDANCE LOGS DEBUG ==========');
    console.log('Full logs object:', logs);
    console.log('Logs data array:', logs?.data);
    console.log('Number of records in logs:', logs?.data?.length);
    console.log('First log record (if exists):', logs?.data?.[0]);
    console.log('Last log record (if exists):', logs?.data?.[logs?.data?.length - 1]);
    console.log('Pagination info:', {
        from: logs?.from,
        to: logs?.to,
        total: logs?.total,
        currentPage: logs?.current_page,
        lastPage: logs?.last_page,
        perPage: logs?.per_page
    });
    console.log('Logs links:', logs?.links);
    console.log('===========================================');
  }, [logs]);

  // Log timeline data whenever it changes
  useEffect(() => {
    console.log('========== TIMELINE DATA DEBUG ==========');
    console.log('Raw timelineData:', timelineData);
    console.log('Is timelineData array?', Array.isArray(timelineData));
    console.log('Timeline data length:', timelineData?.length);
    if (timelineData && timelineData.length > 0) {
      console.log('First timeline record:', timelineData[0]);
      console.log('Sample date format:', timelineData[0]?.date);
    }
    console.log('=========================================');
  }, [timelineData]);

  // Log filters and form data
  useEffect(() => {
    console.log('========== FILTERS DEBUG ==========');
    console.log('Filters from props:', filters);
    console.log('Form data:', data);
    console.log('Total count:', totalCount);
    console.log('Filtered count:', filteredCount);
    console.log('====================================');
  }, [filters, data, totalCount, filteredCount]);

  // Log component mount
  useEffect(() => {
    console.log('AttendanceLogs component mounted');
    console.log('Initial state - activeTab:', 'table');
    return () => {
      console.log('AttendanceLogs component unmounted');
    };
  }, []);

  // Handle search input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Search input changed to:', value);
    setData('search', value);

    // Update the URL with the search query value
    const queryString = {
      ...(value && { search: value }),
      ...(data.perPage && { perPage: data.perPage }),
    };
    console.log('Search query string:', queryString);

    // Pass the search query to the backend to filter permissions
    router.get(AttendanceController.attendanceLogs.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Clears the search bar and resets the list
  const handleReset = () => {
    console.log('Reset filters clicked');
    setData('search', '');
    setData('perPage', '5');

    router.get(AttendanceController.attendanceLogs.url(), {}, {
      preserveState: true,
      preserveScroll: true,
    });
  }

  // Handle number of permissions to display per page
  const handlePerPageChange = (value: string) => {
    console.log('Per page changed to:', value);
    setData('perPage', value);

    // Update the URL with the per page value
    const queryString = {
      ...(data.search && { search: data.search }),
      ...(value && { perPage: value }),
    };
    console.log('Per page query string:', queryString);

    router.get(AttendanceController.attendanceLogs.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  }

  // Handle tab change
  const handleTabChange = (value: string) => {
    console.log('Tab changed from', activeTab, 'to', value);
    setActiveTab(value);
  };

  // Format timeline data with error handling
  const timelineDataFormat = useMemo(() => {
    console.log('Formatting timeline data...');
    if (!timelineData || !Array.isArray(timelineData)) {
      console.log('No timeline data to format');
      return [];
    }
    
    try {
      const formatted = timelineData.map(record => {
        const formattedRecord = {
          ...record,
          date: record.date ? record.date.split('T')[0] : '', // keep only YYYY-MM-DD
          employee_id: record.employee_id,
          employeeName: record.employee_name,
          department: record.department,
          timeIn: record.time_in,
          timeOut: record.time_out,
          totalHours: record.total_hours,
          isOvertime: record.is_overtime,
        };
        return formattedRecord;
      });
      
      console.log('Formatted timeline data count:', formatted.length);
      if (formatted.length > 0) {
        console.log('Sample formatted record:', formatted[0]);
      }
      
      return formatted;
    } catch (error) {
      console.error('Error formatting timeline data:', error);
      return [];
    }
  }, [timelineData]);

  // Log whenever formatted data changes
  useEffect(() => {
    console.log('timelineDataFormat updated:', timelineDataFormat);
    console.log('Formatted data length:', timelineDataFormat.length);
  }, [timelineDataFormat]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
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

        {/* Debug info - can be removed after testing */}
        <div className="text-xs text-gray-500 ms-4 flex gap-4">
          <span>Logs: {logs?.data?.length || 0} records</span>
          <span>Timeline: {timelineData?.length || 0} records</span>
          <span>Active Tab: {activeTab}</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            defaultValue="table"
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
                value="timeline"
                className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Clock className="h-4 w-4 mr-2" />
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
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Table/Timeline content */}
        {activeTab === 'table' ? (
          <>
            {/* Custom Table */}
            <CustomTable
              columns={AttendanceLogsTableConfig.columns}
              actions={AttendanceLogsTableConfig.actions}
              data={logs?.data || []}
              from={logs?.from || 0}
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
            logs={timelineDataFormat} // Use formatted data
            isLoading={false}
            onEmployeeSelect={(employeeId) => {
              console.log('Selected employee:', employeeId);
            }}
            onDateChange={(date) => {
              console.log('Date changed:', date);
            }}
          />
        ) : null}
      </div>
    </AppLayout>
  );
}