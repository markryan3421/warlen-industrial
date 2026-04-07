import AppLayout from '@/layouts/emp-layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import ApplicationLeaveController from '@/actions/App/Http/Controllers/EmployeeRole/ApplicationLeaveController';
import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, PlusCircle, Bell, X, Search, Filter, BriefcaseMedical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomTable } from '@/components/custom-table';
import { EmployeeApplicationLeaveTableConfig } from '@/config/tables/employee-application-leave';
import { CustomToast } from '@/components/custom-toast';
import { CustomHeader } from '@/components/custom-header';

// ... (Echo initialization remains same) ...

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Application Leaves', href: '/application-leaves' },
];

interface ApplicationLeave {
    id: number;
    leave_start: string;
    leave_end: string;
    reason_to_leave: string;
    slug_app: string;
    app_status: string;
    approved_by?: string;
    rejected_by?: string;
}
interface ApplicationLeaveData {
    data: ApplicationLeave[];
    length: number;
}

interface ApplicationLeaveProps {
    applicationLeaves: ApplicationLeaveData;
    approvedCount?: number;
}

export default function Index({ applicationLeaves, approvedCount = 0 }: ApplicationLeaveProps) {
    const hasReachedLimit = approvedCount >= 5;
    const [recentlyUpdatedId, setRecentlyUpdatedId] = useState<number | null>(null);
    // Listen to ApplicationLeaveEvent via Echo
    useEffect(() => {
        if (!window.Echo) {
            console.warn('Echo is not initialized');
            return;
        }

        console.log('Setting up Echo listener for application-leave channel...');

        // Subscribe to private application-leave channel
        const applicationLeaveChannel = window.Echo.private('application-leave');

        // Handle ApplicationLeaveEvent
        applicationLeaveChannel.listen('.ApplicationLeaveEvent', (event: any) => {
            console.log('================== APPLICATION LEAVE EVENT RECEIVED ==================');
            console.log('Full event:', event);
            console.log('Leave application details:', {
                id: event.id,
                employee_id: event.employee_id,
                app_status: event.app_status,
                leave_start: event.leave_start,
                leave_end: event.leave_end,
                employee_name: event.employee?.user?.name
            });

            // Highlight the updated row
            setRecentlyUpdatedId(event.id);
            setTimeout(() => {
                setRecentlyUpdatedId(null);
            }, 3000);

            // Reload the page to get updated data
            router.reload({ only: ['applicationLeaves', 'approvedCount'] });
        });

        // Connection success handler
        applicationLeaveChannel.subscribed(() => {
            console.log('✅ Successfully subscribed to private application-leave channel');
        });

        // Error handler
        applicationLeaveChannel.error((error: any) => {
            console.error('❌ Error on application-leave channel:', error);
        });

        return () => {
            console.log('🧹 Cleaning up Echo listener');
            applicationLeaveChannel.stopListening('.ApplicationLeaveEvent');
        };
    }, []); // Empty dependency array to run once

    // Transform data to include row highlighting
    const transformedData = useMemo(() => {
        return {
            ...applicationLeaves,
            data: applicationLeaves.data.map(leave => ({
                ...leave,
                _highlight: recentlyUpdatedId === leave.id
            }))
        };
    }, [applicationLeaves, recentlyUpdatedId]);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Application Leaves" />
            <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
                <CustomToast />

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CustomHeader
                        icon={<BriefcaseMedical />}
                        title={'Application Leaves'}
                        description={'Manage your application leaves here.'}
                    />
                    {!hasReachedLimit && (
                        <Link href={ApplicationLeaveController.create()}>
                            <Button className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Request a Leave
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Limit warning */}
                {hasReachedLimit && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md">
                            <p className="text-sm font-medium">
                                You have reached the maximum limit of 5 approved leaves for this year.
                                You cannot create new leave applications until next year.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div className="flex flex-col gap-4">
                    {applicationLeaves.length === 0 ? (
                        <EmptyState hasReachedLimit={hasReachedLimit} />
                    ) : (
                        <CustomTable
                            columns={EmployeeApplicationLeaveTableConfig.columns}
                            actions={() => { }}
                            data={applicationLeaves}
                            from={1}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function EmptyState({ hasReachedLimit }: { hasReachedLimit: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in duration-500">
            <div className="rounded-full bg-muted p-6 mb-4">
                <CalendarDays className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No application leaves yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
                Get started by creating your first leave application.
            </p>
            {!hasReachedLimit ? (
                <Link href={ApplicationLeaveController.create()}>
                    <Button className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Create Your First Leave Application
                    </Button>
                </Link>
            ) : (
                <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md max-w-md">
                    <p className="text-sm font-medium">Cannot create new leave applications</p>
                    <p className="text-xs mt-1">You have reached the maximum limit of 5 approved leaves for this year.</p>
                </div>
            )}
        </div>
    );
}