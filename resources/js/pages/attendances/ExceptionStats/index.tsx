import { Head, router, useForm } from "@inertiajs/react";
import { CustomTable } from "@/components/custom-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AttendanceExceptionStatsTableConfig } from "@/config/tables/attendance-exception-stats";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from '@/types';
import AttendanceController from '../../../actions/App/Http/Controllers/AttendanceController';

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
  filters: FilterProps;
  totalCount: number;
  filteredCount: number;
}

export default function AttendanceExceptionStats({ stats, filters, totalCount, filteredCount }: IndexProps) {
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
    setData('perPage', '5');

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


  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Attendance Logs" />
      {/* <CustomToast /> */}
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

        {/* Search Bar */}
        <div className="flex items-center justify-items-start gap-4 w-full ms-4">
          <Input
            type="text"
            value={data.search}
            onChange={handleChange}
            placeholder='Search employee...'
            name="search"
            className='max-w-sm h-10 w-1/3'
          />

          <Button onClick={handleReset} className="bg-primary ml-2 h-10 px-5 cursor-pointer">
            clear
          </Button>
        </div>

        {/* Custom Table */}
        <CustomTable
          columns={AttendanceExceptionStatsTableConfig.columns}
          actions={AttendanceExceptionStatsTableConfig.actions}
          data={stats.data}
          from={stats.from}
          onDelete={() => { }}   // no delete for attendance records
          onView={() => { }}  // wire up a modal here later if needed
          onEdit={() => { }}     // no edit for attendance records
        />

        <Pagination
          pagination={stats}
          perPage={data.perPage}
          onPerPageChange={handlePerPageChange}
          totalCount={totalCount}
          filteredCount={filteredCount}
          search={data.search}
          resourceName='stats'
        />
      </div>
    </AppLayout>
  );
}