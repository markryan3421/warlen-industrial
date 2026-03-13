import { Head, useForm, router } from '@inertiajs/react';
import BiometricImport from '@/components/biometric-import';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { AttendanceLogsTableConfig } from '@/config/tables/attendace-logs';
import AttendanceController from '@/actions/App/Http/Controllers/AttendanceController';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { CustomTable    } from '@/components/custom-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendances',
        href: '/attendances',
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
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
  }

export default function Index({ 
  logs = { data: [], links: [], from: 0, to: 0, total: 0 }, 
  filters = { search: '', perPage: '5' }, 
  totalCount = 0, 
  filteredCount = 0 
}: IndexProps) {
  
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
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Attendances" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <BiometricImport />
      </div>

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 overflow-hidden">

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

        <div>
        </div>

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

        {/* Fixed Pagination props - wrap in an object or check Pagination component props */}
        <Pagination 
          pagination={logs}
          perPage={data.perPage}
          onPerPageChange={handlePerPageChange}
          totalCount={totalCount}
          filteredCount={filteredCount}
          search={data.search}
          resourceName="logs"
        />
      </div>
    </AppLayout>
  );
}