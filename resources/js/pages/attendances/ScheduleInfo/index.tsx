import { Head, router, useForm } from "@inertiajs/react";
import { CustomTable } from "@/components/custom-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AttendanceSchedulesTableConfig } from "@/config/tables/attendance-schedules-table";
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from '@/types';
import AttendanceController from '../../../actions/App/Http/Controllers/AttendanceController';

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
    filters: FilterProps;
    totalCount: number;
    filteredCount: number;
}

export default function AttendanceSchedules({ schedules, filters, totalCount, filteredCount }: IndexProps) {
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


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Schedules" />
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
                    columns={AttendanceSchedulesTableConfig.columns}
                    actions={AttendanceSchedulesTableConfig.actions}
                    data={schedules.data}
                    from={schedules.from}
                    onDelete={() => { }}   // no delete for attendance records
                    onView={() => { }}  // wire up a modal here later if needed
                    onEdit={() => { }}     // no edit for attendance records
                />

                <Pagination
                    pagination={schedules}
                    perPage={data.perPage}
                    onPerPageChange={handlePerPageChange}
                    totalCount={totalCount}
                    filteredCount={filteredCount}
                    search={data.search}
                    resourceName='schedules'
                />
            </div>
        </AppLayout>
    );
}