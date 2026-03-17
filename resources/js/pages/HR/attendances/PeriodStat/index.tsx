import { Head, router, useForm } from "@inertiajs/react";
import { CustomTable } from "@/components/custom-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AttendancePeriodStatsTableConfig } from "@/config/tables/attendance-period-stats";
import HrLayout from '@/layouts/hr-layout';
import { type BreadcrumbItem } from '@/types';
import AttendanceController from  "@/actions/App/Http/Controllers/HrRole/HRAttendanceController";
import { CustomPagination } from "@/components/custom-pagination";
import { AttendancePeriodStatView, AttendanceStatsVisualTable } from "@/components/attendance/attendance-period-stat-view";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, ScrollText, Sheet } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Attendance Exception Stats',
    href: '/attendance-exception-stats',
  },
];

interface PeriodStat {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  period_start: string;   // "YYYY-MM-DD"
  period_end: string;     // "YYYY-MM-DD"
  normal_work_hours: number | null;
  real_work_hours: number | null;
  late_times: number | null;
  late_minutes: number | null;
  leave_early_times: number | null;
  leave_early_minutes: number | null;
  overtime_work_days: number | null;
  overtime_holidays: number | null;
  overtime_label: string | null;
  scheduled_days: number | null;
  attended_days: number | null;
  out_days: number | null;
  absent_days: number | null;
  afl_days: number | null;
  overtime_pay: number | null;
  subsidy_pay: number | null;
  late_leave_deduction: number | null;
  afl_deduction: number | null;
  cut_payment: number | null;
  real_pay: number | null;
  note: string | null;
}

interface LinkProps {
  active: boolean;
  label: string;
  url: string | null;
}

interface PeriodStatPagination {
  data: PeriodStat[];
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
  stats: PeriodStatPagination;
  visualData: PeriodStat[];
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

export default function AttendancePeriodStat({ stats, visualData, filters, totalCount, filteredCount }: IndexProps) {
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
    router.get(AttendanceController.attendancePeriodStats.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  // Clears the search bar and resets the list
  const handleReset = () => {
    setData('search', '');
    setData('perPage', '10');

    router.get(AttendanceController.attendancePeriodStats.url(), {}, {
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

    router.get(AttendanceController.attendancePeriodStats.url(), queryString, {
      preserveState: true,
      preserveScroll: true,
    });
  }

  const [activeTab, setActiveTab] = useState('table');
  console.log('Stats data:', stats.data);

  return (
    <HrLayout breadcrumbs={breadcrumbs}>
      <Head title="Attendance Period Stats" />
      {/* <CustomToast /> */}
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Page Header */}
        <div className="flex items-center gap-4 ms-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ScrollText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance Period Stats</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Provides a high level overview of each employee's attendance performance, including late, absent, and overtime.
              <br /> The attendance metric of employee.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-muted/50 p-1 rounded-full shadow-sm">
              <TabsTrigger value="table" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Sheet className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger value="visual" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart className="h-4 w-4 mr-2" />
                Visual Stats
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
              columns={AttendancePeriodStatsTableConfig.columns}
              actions={AttendancePeriodStatsTableConfig.actions}
              data={stats.data}
              from={stats.from}
              onDelete={() => { }}   // no delete for attendance records
              onView={() => { }}  // wire up a modal here later if needed
              onEdit={() => { }}     // no edit for attendance records
            />

            <CustomPagination
              pagination={stats}
              perPage={data.perPage}
              onPerPageChange={handlePerPageChange}
              totalCount={totalCount}
              filteredCount={filteredCount}
              search={data.search}
              resourceName='stats'
            />
          </>
        ) : (
          <AttendancePeriodStatView stats={visualData} />
        )}
      </div>
    </HrLayout>
  );
}