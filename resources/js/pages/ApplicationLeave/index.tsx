import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import Echo from 'laravel-echo';
import { CalendarDays, PlusCircle, Clipboard, X, Bell, Eye, Pencil, Trash2 } from 'lucide-react';
import Pusher from 'pusher-js';
import { useState, useMemo, useEffect } from 'react';
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

// Import Echo and Pusher for Reverb
import { ApplicationLeavesTableConfig } from '@/config/tables/application-leave';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type BranchWithSites } from '@/types';

// Declare global window interface for Echo
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
    applicationLeaves: any[];
}

interface PageProps {
    applicationLeaveEnum: Array<{
        value: string;
        label: string;
    }>;
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

export default function Index({ applicationLeaves }: ApplicationLeaveProps) {
    const { delete: destroy } = useForm();
    const { applicationLeaveEnum } = usePage<PageProps>().props;

    // State for real-time updates
    const [leaves, setLeaves] = useState(applicationLeaves);
    const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);

    // Filter state
    const [statusFilter, setStatusFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('applicationLeaves-statusFilter');
        return savedFilter || 'all';
    });

      // Search state
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Dialog state for viewing details
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Listen to application-leave channel (Echo is already initialized globally)
    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private('application-leave');

        channel.listen('.ApplicationLeaveEvent', (event: any) => {
            setNotification({
                message: `New application leave created/updated`,
                timestamp: new Date().toLocaleString()
            });
            setShowNotification(true);

            // Show notification
            setNotification({
                message: `New application leave created`,
                timestamp: new Date().toLocaleString()
            });
            setShowNotification(true);

            // Auto-hide notification after 5 seconds
            setTimeout(() => {
                setShowNotification(false);
            }, 5000);

            // Update the leaves state with the new data
            setLeaves(prevLeaves => {
                const existingIndex = prevLeaves.findIndex(
                    leave => leave.id === event.id
                );

                if (existingIndex !== -1) {
                    const updatedLeaves = [...prevLeaves];
                    updatedLeaves[existingIndex] = {
                        ...updatedLeaves[existingIndex],
                        ...event,
                        employee: event.employee || updatedLeaves[existingIndex].employee
                    };
                    return updatedLeaves;
                } else {
                    return [event, ...prevLeaves];
                }
            });
        });

        channel.error((error: any) => {
            console.error('Channel error:', error);
        });

        return () => {
            channel.stopListening('.ApplicationLeaveEvent');
        };
    }, []);

    // Save filter to localStorage
    useEffect(() => {
        localStorage.setItem('applicationLeaves-statusFilter', statusFilter);
    }, [statusFilter]);

    // Handle delete
    const handleDelete = (slug_app: string) => {
        if (confirm("Are you sure you want to delete this application leave?")) {
            destroy(ApplicationLeaveController.destroy(slug_app).url, {
                onSuccess: () => {
                    setLeaves(prevLeaves =>
                        prevLeaves.filter(leave => leave.slug_app !== slug_app)
                    );
                }
            });
        }
    };

    // Handle view details
    const handleView = (leave: any) => {
        setSelectedLeave(leave);
        setIsDialogOpen(true);
    };

    // Filter and search leaves
    const filteredLeaves = useMemo(() => {
        let result = leaves;

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(leave => {
                const status = leave.app_status || 'pending';
                return status.toLowerCase() === statusFilter.toLowerCase();
            });
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            result = result.filter(leave => {
                const employeeName = leave.employee?.user?.name || leave.employee_name || '';
                const employeeCode = leave.employee?.emp_code || '';
                return employeeName.toLowerCase().includes(searchLower) ||
                    employeeCode.toLowerCase().includes(searchLower);
            });
        }

        return result;
    }, [leaves, statusFilter, searchTerm]);

    // Get status badge color
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

    // Format status text
    const formatStatus = (status: string) => {
        if (!status) return 'Pending';
        const found = applicationLeaveEnum?.find(item => item.value.toLowerCase() === status.toLowerCase());
        return found?.label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    // Define columns for CustomTable
    const columns = [
        {
            label: 'EMPLOYEE',
            key: 'employee_name',
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.employee?.user?.name || row.employee_name || 'N/A'}</span>
                    <span className="text-xs text-gray-500">ID: {row.employee?.emp_code || 'N/A'}</span>
                </div>
            )
        },
        {
            label: 'LEAVE START',
            key: 'leave_start',
            render: (row: any) => (
                <span className="text-sm">{formatDate(row.leave_start)}</span>
            )
        },
        {
            label: 'LEAVE END',
            key: 'leave_end',
            render: (row: any) => (
                <span className="text-sm">{formatDate(row.leave_end)}</span>
            )
        },
        {
            label: 'STATUS',
            key: 'app_status',
            isBadge: true,
            render: (row: any) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(row.app_status)}`}>
                    {formatStatus(row.app_status)}
                </span>
            )
        },
        {
            label: 'ACTIONS',
            key: 'actions',
            isAction: true,
        }
    ];

    // Define actions for CustomTable
    const actions = [
        { label: 'View', icon: 'Eye', route: '', className: '' },
        { label: 'Edit', icon: 'Pencil', route: '', className: '' },
        { label: 'Delete', icon: 'Trash2', route: '', className: 'text-red-600' }
    ];

    // Handle edit
    const handleEdit = (row: any) => {
        router.get(ApplicationLeaveController.edit(row.slug_app).url);
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10"
                />
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
                <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                }}>
                    Clear Filters
                </Button>
            )}
        </div>
    );

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
                    icon={<Clipboard className="h-6 w-6" />}
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

                {/* Empty state for no leaves at all */}
                    <div className='mx-4 pp-row'>
                        <CustomTable
                            title="Application Leave Lists"
                            columns={columns}
                            actions={actions}
                            data={filteredLeaves}
                            from={1}
                            onDelete={(id) => handleDelete(id as string)}
                            onView={handleView}
                            onEdit={handleEdit}
                            toolbar={<FilterToolbar />}
                            filterEmptyState={<FilterEmptyState />}
                            emptyState={
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
                            }
                        />
                    </div>
            </div>

            {/* Leave Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Leave Application Details</DialogTitle>
                        <DialogDescription>Complete information about this leave application</DialogDescription>
                    </DialogHeader>
                    {selectedLeave && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Employee Name</label>
                                    <p className="font-semibold">{selectedLeave.employee?.user?.name || selectedLeave.employee_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Employee Code</label>
                                    <p>{selectedLeave.employee?.emp_code || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Leave Start</label>
                                    <p>{formatDate(selectedLeave.leave_start)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Leave End</label>
                                    <p>{formatDate(selectedLeave.leave_end)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedLeave.app_status)}`}>
                                            {formatStatus(selectedLeave.app_status)}
                                        </span>
                                    </p>
                                </div>
                                {selectedLeave.leave_reason && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Reason</label>
                                        <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLeave.leave_reason}</p>
                                    </div>
                                )}
                                {selectedLeave.remarks && (
                                    <div className="col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Remarks</label>
                                        <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLeave.remarks}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Close
                                </Button>
                                <Link href={ApplicationLeaveController.edit(selectedLeave.slug_app).url}>
                                    <Button>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
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