import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import ApplicationLeaveController from "@/actions/App/Http/Controllers/ApplicationLeaveController";
import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, PlusCircle, Filter, X, Bell } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ApplicationLeavesTableConfig } from '@/config/tables/application-leave';
import { CustomTable } from '@/components/custom-table';

// Declare global window interface for Echo
declare global {
    interface Window {
        Echo: any;
    }
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Application Leaves',
        href: '/application-leaves',
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

export default function Index({ applicationLeaves }: ApplicationLeaveProps) {
    const { delete: destroy } = useForm();
    const { applicationLeaveEnum } = usePage<PageProps>().props;

    // Add state for real-time updates
    const [leaves, setLeaves] = useState(applicationLeaves);
    const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);

    // Initialize filter from localStorage or use default
    const [statusFilter, setStatusFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('applicationLeaves-statusFilter');
        return savedFilter || 'all';
    });

    // Listen to application-leave channel (Echo is already initialized globally)
    useEffect(() => {
        if (!window.Echo) return;

        console.log('Listening to application-leave channel...'); // Debug log

        // Listen to application-leave channel
        const channel = window.Echo.private('application-leave');

        channel.listen('.ApplicationLeaveEvent', (event: any) => {
            console.log('Application leave event received:', event);

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
                // Check if this is an update to an existing leave or a new one
                const existingIndex = prevLeaves.findIndex(
                    leave => leave.id === event.id
                );

                if (existingIndex !== -1) {
                    // Update existing leave
                    const updatedLeaves = [...prevLeaves];
                    updatedLeaves[existingIndex] = {
                        ...updatedLeaves[existingIndex],
                        ...event,
                        // Make sure nested relationships are properly structured
                        employee: event.employee || updatedLeaves[existingIndex].employee
                    };
                    return updatedLeaves;
                } else {
                    // Add new leave to the beginning of the list
                    return [event, ...prevLeaves];
                }
            });

            // Optional: Refresh the list from server to ensure consistency
            // router.reload({ only: ['applicationLeaves'] });
        });

        channel.error((error: any) => {
            console.error('Channel error:', error);
        });

        // Cleanup
        return () => {
            channel.stopListening('.ApplicationLeaveEvent');
        };
    }, []);

    // Save filter to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('applicationLeaves-statusFilter', statusFilter);
    }, [statusFilter]);

    // Filter application leaves based on status
    const filteredLeaves = useMemo(() => {
        if (statusFilter === 'all') {
            return leaves; // Use leaves state instead of applicationLeaves prop
        }
        return leaves.filter(leave => {
            const status = leave.app_status || 'pending';
            return status.toLowerCase() === statusFilter.toLowerCase();
        });
    }, [leaves, statusFilter]); // Update dependency to leaves

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

    // Format status text using enum
    const formatStatus = (status: string) => {
        if (!status) return 'Pending';
        const found = applicationLeaveEnum?.find(item => item.value.toLowerCase() === status.toLowerCase());
        return found?.label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    // Define handlers for table actions
    const handleEdit = (row: any) => {
        window.location.href = ApplicationLeaveController.edit(row.slug_app).url;
    };

    const handleDelete = (row: any) => {
        if (confirm("Are you sure you want to delete this application leave?")) {
            destroy(ApplicationLeaveController.destroy(row.slug_app).url, {
                onSuccess: () => {
                    setLeaves(prevLeaves => prevLeaves.filter(leave => leave.id !== row.id));
                }
            });
        }
    };

    const toolbar = (
        <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Filter" />
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
    );

    // Prepare data for the table – ensure each row has an `id` (slug or numeric)
    const tableData = filteredLeaves.map(leave => ({
        ...leave,
        id: leave.slug_app, // use slug as id for consistent routing
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Leaves" />
            <div className="@container/main flex flex-1 flex-col gap-2">
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

                <div className="flex justify-between items-center p-4">
                    <h1 className="text-2xl font-bold">Application Leaves</h1>
                </div>

                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    {leaves.length === 0 ? ( // Use leaves state instead of applicationLeaves prop
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <CalendarDays className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semib text-gray-900 mb-2">No application leaves yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Get started by creating your first leave application. You can manage employee leaves, track approvals, and monitor leave balances.
                            </p>
                        </div>
                    ) : (
                        <div className='mx-4'>
                            <CustomTable
                                columns={ApplicationLeavesTableConfig.columns}
                                actions={ApplicationLeavesTableConfig.actions}
                                data={tableData}
                                from={1} // adjust if paginated
                                onDelete={handleDelete}
                                onEdit={handleEdit}
                                onView={() => { }}
                                title="Application Leaves"
                                toolbar={toolbar}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}