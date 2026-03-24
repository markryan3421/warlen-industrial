import { useState, useEffect } from 'react';
import { CustomTable } from "@/components/custom-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { AttendanceLogsTableConfig } from "@/config/tables/attendace-logs";
import { router, useForm } from '@inertiajs/react';
import axios from 'axios';

// Attendance Logs Interfaces
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
    current_page?: number;
    last_page?: number;
    per_page?: number;
}

interface AttendanceLogsTableProps {
    className?: string;
}

export default function AttendanceLogsTable({ className = '' }: AttendanceLogsTableProps) {
    const [logs, setLogs] = useState<LogsPagination>({
        data: [],
        links: [],
        from: 0,
        to: 0,
        total: 0
    });
    const [totalCount, setTotalCount] = useState(0);
    const [filteredCount, setFilteredCount] = useState(0);
    const [loading, setLoading] = useState(false);
    
    const { data, setData } = useForm({
        search: '',
        perPage: '5',
    });

    // Fetch data when component mounts or filters change
    useEffect(() => {
        fetchAttendanceLogs();
    }, [data.search, data.perPage]);

    // Fetch attendance logs using Inertia
    const fetchAttendanceLogs = () => {
        setLoading(true);
        
        const queryString = {
            ...(data.search && { search: data.search }),
            perPage: data.perPage,
        };

        router.get('/attendance-logs-table', queryString, {
            preserveState: true,
            preserveScroll: true,
            only: ['logs', 'filters', 'totalCount', 'filteredCount'],
            onSuccess: (page) => {
                const pageData = page.props as any;
                console.log('Received data:', pageData); // Debug log
                
                if (pageData.logs) {
                    setLogs(pageData.logs);
                    setTotalCount(pageData.totalCount || 0);
                    setFilteredCount(pageData.filteredCount || 0);
                }
                setLoading(false);
            },
            onError: (errors) => {
                console.error('Error fetching attendance logs:', errors);
                setLoading(false);
            }
        });
    };

    // Alternative fetch using axios if Inertia doesn't work
    const fetchAttendanceLogsAxios = async () => {
        setLoading(true);
        
        try {
            const params = new URLSearchParams();
            if (data.search) params.append('search', data.search);
            params.append('perPage', data.perPage);
            
            const response = await axios.get(`/attendance-logs-table?${params.toString()}`);
            
            if (response.data) {
                setLogs(response.data.logs);
                setTotalCount(response.data.totalCount || 0);
                setFilteredCount(response.data.filteredCount || 0);
            }
        } catch (error) {
            console.error('Error fetching attendance logs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle search input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setData('search', value);
    };

    // Clears the search bar and resets the list
    const handleReset = () => {
        setData('search', '');
        setData('perPage', '5');
    };

    // Handle number of items per page
    const handlePerPageChange = (value: string) => {
        setData('perPage', value);
    };

    return (
        <div className={`space-y-5 ${className}`}>
            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <Input
                    type="text"
                    value={data.search}
                    onChange={handleChange}
                    placeholder='Search employee...'
                    name="search"
                    className='max-w-sm h-10'
                />
                <Button 
                    onClick={handleReset} 
                    variant="outline"
                    className="h-10 px-5 cursor-pointer"
                >
                    Clear
                </Button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Custom Table */}
                    <CustomTable
                        columns={AttendanceLogsTableConfig.columns}
                        actions={AttendanceLogsTableConfig.actions}
                        data={logs?.data || []}
                        from={logs?.from || 0}
                        onDelete={() => {}}
                        onView={() => {}}
                        onEdit={() => {}}
                    />

                    {/* Attendance Pagination */}
                    {logs?.data?.length > 0 && (
                        <Pagination
                            pagination={logs}
                            perPage={data.perPage}
                            onPerPageChange={handlePerPageChange}
                            totalCount={totalCount}
                            filteredCount={filteredCount}
                            search={data.search}
                            resourceName='logs'
                        />
                    )}

                    {/* Show message if no data */}
                    {logs?.data?.length === 0 && !loading && (
                        <div className="text-center py-8 text-gray-500">
                            No attendance logs found.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}