import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import Echo from 'laravel-echo';
import { CalendarDays, PlusCircle, Clipboard, X, Bell, Eye, Pencil, Trash2, CalendarClock, CheckCircle, XCircle, Clock } from 'lucide-react';
import Pusher from 'pusher-js';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ApplicationLeaveController from "@/actions/App/Http/Controllers/ApplicationLeaveController";
import { CustomHeader } from '@/components/custom-header';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ApplicationLeaveTableConfig } from '@/config/tables/application-leave';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

declare global {
    interface Window {
        Echo: any;
    }
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Application Leave',
        href: '/application-leave',
    },
];

interface ApplicationLeaveProps {
    applicationLeaves: {
        data: any[];
        links: any[];
        from: number;
        to: number;
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    filters?: { search?: string; status?: string; perPage?: string };
    totalCount?: number;
    filteredCount?: number;
    applicationLeaveEnum?: Array<{ value: string; label: string }>;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function Index({
    applicationLeaves,
    filters = {},
    totalCount = 0,
    filteredCount = 0,
    applicationLeaveEnum = []
}: ApplicationLeaveProps) {

    const { delete: destroy } = useForm();
    const leaves = applicationLeaves.data || [];
    const pagination = {
        links: applicationLeaves.links || [],
        from: applicationLeaves.from || 0,
        to: applicationLeaves.to || 0,
        total: applicationLeaves.total || 0,
        current_page: applicationLeaves.current_page || 1,
        last_page: applicationLeaves.last_page || 1,
        per_page: applicationLeaves.per_page || 10,
    };

    // State for real-time updates
    const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status ?? 'all');
    const [perPage, setPerPage] = useState(filters.perPage ?? String(pagination.per_page ?? '10'));

    // Dialog state for viewing details
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Apply filters function
    const applyFilters = useCallback((overrides: Partial<{
        search: string; status: string; perPage: string; page: number;
    }> = {}) => {
        const params: Record<string, string> = {};

        const finalSearch = overrides.search !== undefined ? overrides.search : searchTerm;
        const finalStatus = overrides.status !== undefined ? overrides.status : statusFilter;
        const finalPerPage = overrides.perPage !== undefined ? overrides.perPage : perPage;
        const page = overrides.page !== undefined ? overrides.page : 1;

        if (finalSearch?.trim()) params.search = finalSearch.trim();
        if (finalStatus && finalStatus !== 'all') params.status = finalStatus;
        if (finalPerPage && finalPerPage !== '10') params.perPage = finalPerPage;
        if (page > 1) params.page = page.toString();

        setIsTableLoading(true);
        router.get('/application-leave', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setIsTableLoading(false),
        });
    }, [searchTerm, statusFilter, perPage]);

    // Debounced search
    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters({ search: value, page: 1 }), 500);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        applyFilters({ status: value, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters({ perPage: value, page: 1 });
    };

    const handlePageChange = (page: number) => {
        applyFilters({ page: page });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setIsTableLoading(true);
        router.get('/application-leave', { perPage: perPage }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onFinish: () => setIsTableLoading(false),
        });
    };

    // Listen to application-leave channel
    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private('application-leave');

        channel.listen('.ApplicationLeaveEvent', (event: any) => {
            setNotification({
                message: `New application leave created/updated`,
                timestamp: new Date().toLocaleString()
            });
            setShowNotification(true);

            setTimeout(() => {
                setShowNotification(false);
            }, 5000);

            // Reload the page to get updated data
            router.reload({ only: ['applicationLeaves'] });
        });

        channel.error((error: any) => {
            console.error('Channel error:', error);
        });

        return () => {
            channel.stopListening('.ApplicationLeaveEvent');
        };
    }, []);

    // Handle delete
    const handleDelete = (slug_app: string) => {
        if (confirm("Are you sure you want to delete this application leave?")) {
            destroy(ApplicationLeaveController.destroy(slug_app).url, {
                onSuccess: () => {
                    router.reload();
                }
            });
        }
    };

    // Handle view details
    const handleView = (leave: any) => {
        setSelectedLeave(leave);
        setIsDialogOpen(true);
    };

    // Handle edit
    const handleEdit = (row: any) => {
        router.get(ApplicationLeaveController.edit(row.slug_app).url);
    };

    const getStatusBadgeClass = (status: string) => {
        const statusLower = status?.toLowerCase() || 'pending';
        switch (statusLower) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusColor = (status: string) => {
        const statusLower = status?.toLowerCase() || 'pending';
        switch (statusLower) {
            case 'approved':
                return 'bg-green-600';
            case 'rejected':
                return 'bg-red-600';
            default:
                return 'bg-yellow-600';
        }
    };

    const getStatusIcon = (status: string) => {
        const statusLower = status?.toLowerCase() || 'pending';
        switch (statusLower) {
            case 'approved':
                return <CheckCircle className="h-6 w-6 text-white" />;
            case 'rejected':
                return <XCircle className="h-6 w-6 text-white" />;
            default:
                return <Clock className="h-6 w-6 text-white" />;
        }
    };

    const calculateDuration = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Format status text
    const formatStatus = (status: string) => {
        if (!status) return 'Pending';
        const found = applicationLeaveEnum?.find(item => item.value.toLowerCase() === status.toLowerCase());
        return found?.label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    // Filter toolbar component
    const FilterToolbar = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="search">Search</Label>
                <Input
                    id="search"
                    placeholder="Search by employee name or code..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full h-10"
                />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger id="status-filter" className="h-10">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {applicationLeaveEnum?.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    // Empty state for filtered results
    const FilterEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
                <CalendarDays className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No leaves found</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
                {searchTerm
                    ? `No results match "${searchTerm}". Try adjusting your search.`
                    : statusFilter !== "all"
                        ? `No ${statusFilter} leaves found.`
                        : 'No application leaves available at the moment.'}
            </p>
            {(searchTerm || statusFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                </Button>
            )}
        </div>
    );

    const hasActiveFilters = !!(searchTerm || (statusFilter && statusFilter !== 'all'));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Leaves" />

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-row { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            {/* Page Header */}
            <div className="flex justify-between items-center p-4 mx-4 mt-2 -mb-6 pp-header">
                <CustomHeader
                    title="Application Leaves"
                    description="List of all application leaves"
                    icon={<CalendarClock className="h-6 w-6" />}
                />
            </div>

            <div className="@container/main flex flex-1 flex-col gap-2 p-4">
                {/* Notification Toast */}
                {showNotification && notification && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
                        <Bell className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-xs text-green-600">{notification.timestamp}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-4"
                            onClick={() => setShowNotification(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Main content */}
                <div className='mx-4 pp-row'>
                    {isTableLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            <CustomTable
                                title="Application Leave Lists"
                                columns={ApplicationLeaveTableConfig.columns}
                                actions={ApplicationLeaveTableConfig.actions}
                                data={leaves}
                                from={pagination.from}
                                to={pagination.to}
                                total={pagination.total}
                                filteredCount={filteredCount}
                                totalCount={totalCount}
                                searchTerm={searchTerm}
                                onDelete={(id) => handleDelete(id as string)}
                                onView={handleView}
                                onEdit={handleEdit}
                                toolbar={<FilterToolbar />}
                                filterEmptyState={<FilterEmptyState />}
                                emptyState={
                                    !hasActiveFilters && (
                                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                                <CalendarDays className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                                No application leaves found
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                                                There are no leave applications available at the moment.
                                            </p>
                                            <Link href={ApplicationLeaveController.create().url}>
                                                <Button className="gap-2">
                                                    <PlusCircle className="h-4 w-4" />
                                                    Create Leave Application
                                                </Button>
                                            </Link>
                                        </div>
                                    )
                                }
                            />

                            {/* Pagination */}
                            {leaves.length > 0 && pagination.total > 0 && (
                                <div className="mt-4">
                                    <CustomPagination
                                        pagination={pagination}
                                        perPage={perPage}
                                        onPerPageChange={handlePerPageChange}
                                        onPageChange={handlePageChange}
                                        totalCount={totalCount || pagination.total}
                                        filteredCount={filteredCount || pagination.total}
                                        search={searchTerm}
                                        resourceName="application leave"
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Leave Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden">
                    {/* Header with Status Banner */}
                    <div className="px-6 py-4 border-b border-gray-100">
                        <CustomHeader
                            icon={<CalendarClock className="h-6 w-6" />}
                            title="Leave Application Details"
                            description="Complete information about this leave application"
                            className=''
                        />
                    </div>

                    {selectedLeave && (
                        <div className="px-6 py-4 space-y-5">
                            {/* Employee Information Section */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Employee Information
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <label className="text-xs text-gray-500 block mb-0.5">Employee Name</label>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {selectedLeave.employee?.user?.name || selectedLeave.employee_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2.5">
                                        <label className="text-xs text-gray-500 block mb-0.5">Employee Code</label>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {selectedLeave.employee?.emp_code || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Leave Details Section */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Leave Details
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                                        <label className="text-xs text-blue-600 font-medium block mb-0.5">Leave Start</label>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {formatDate(selectedLeave.leave_start)}
                                        </p>
                                    </div>
                                    <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                                        <label className="text-xs text-blue-600 font-medium block mb-0.5">Leave End</label>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {formatDate(selectedLeave.leave_end)}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="bg-gray-50 rounded-lg p-2.5">
                                            <label className="text-xs text-gray-500 block mb-0.5">Duration</label>
                                            <p className="text-sm text-gray-700 font-medium">
                                                {calculateDuration(selectedLeave.leave_start, selectedLeave.leave_end)} days
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason Section */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Reason for Leave
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                                        {selectedLeave.reason_to_leave || 'No reason provided'}
                                    </p>
                                </div>
                            </div>

                            {/* Remarks Section - Only show if exists */}
                            {selectedLeave.remarks && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Remarks / Additional Notes
                                    </h3>
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                        <div className="flex gap-2">
                                            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                            </svg>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed flex-1">
                                                {selectedLeave.remarks}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm" className='cursor-pointer'>
                                    Close
                                </Button>
                                <Link href={ApplicationLeaveController.edit(selectedLeave.slug_app).url}>
                                    <Button className="bg-blue-800 hover:bg-blue-900 cursor-pointer" size="sm">
                                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                        Edit Application
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}