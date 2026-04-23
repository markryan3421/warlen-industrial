import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import Echo from 'laravel-echo';
import { CalendarDays, PlusCircle, Clipboard, X, Bell, CheckCircle2, XCircle, ShieldCheck, User, CalendarClock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ApplicationLeaveController from "@/actions/App/Http/Controllers/ApplicationLeaveController";
import { CustomHeader } from '@/components/custom-header';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { ApplicationLeavesTableConfig } from '@/config/tables/application-leave';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';
import { ApplicationLeaveFilterBar } from '@/components/application-leave/application-leave-filter-bar';

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
}

interface PageProps {
    applicationLeaveEnum: Array<{
        value: string;
        label: string;
    }>;
    filters?: {
        search?: string;
        status?: string;
        perPage?: string;
    };
    totalCount?: number;
    filteredCount?: number;
}

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const durationDays = (start: string, end: string) => {
    if (!start || !end) return null;
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
    return diff > 0 ? diff : null;
};

export default function Index({ applicationLeaves }: ApplicationLeaveProps) {
    const { delete: destroy } = useForm();
    const { applicationLeaveEnum = [], filters = {}, totalCount = 0, filteredCount = 0 } = usePage<PageProps>().props;

    // Use data directly from props instead of local state
    const leaves = applicationLeaves?.data || [];

    const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);

    const [statusFilter, setStatusFilter] = useState<string>(filters.status || '');
    const [searchTerm, setSearchTerm] = useState<string>(filters.search || "");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [approveStatus, setApproveStatus] = useState<'approved' | 'rejected'>('approved');
    const [remarks, setRemarks] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout>();

    const pagination = {
        links: applicationLeaves?.links || [],
        from: applicationLeaves?.from || 0,
        to: applicationLeaves?.to || 0,
        total: applicationLeaves?.total || 0,
        current_page: applicationLeaves?.current_page || 1,
        last_page: applicationLeaves?.last_page || 1,
        per_page: applicationLeaves?.per_page || 10,
    };

    useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.private('application-leave');
        channel.listen('.ApplicationLeaveEvent', (event: any) => {
            setNotification({
                message: `New application leave created/updated`,
                timestamp: new Date().toLocaleString()
            });
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
            router.reload({ preserveState: true, preserveScroll: true });
        });
        channel.error((error: any) => console.error('Channel error:', error));
        return () => channel.stopListening('.ApplicationLeaveEvent');
    }, []);

    useEffect(() => {
        if (selectedLeave) {
            setApproveStatus(selectedLeave.app_status === 'rejected' ? 'rejected' : 'approved');
            setRemarks(selectedLeave.remarks || '');
        }
    }, [selectedLeave]);

    const handleView = (leave: any) => {
        setSelectedLeave(leave);
        setIsDialogOpen(true);
    };

    const handleEdit = (row: any) => {
        router.get(ApplicationLeaveController.edit(row.slug_app).url);
    };

    const handleStatusUpdate = () => {
        if (!selectedLeave) return;
        setIsSubmitting(true);
        router.put(ApplicationLeaveController.update(selectedLeave.slug_app).url, {
            app_status: approveStatus,
            remarks: remarks,
        }, {
            onSuccess: () => {
                toast.success(`Leave application ${approveStatus} successfully`);
                setIsDialogOpen(false);
                router.reload({ preserveState: true, preserveScroll: true });
            },
            onError: (errors) => {
                const msg = Object.values(errors).flat()[0] || `Failed to ${approveStatus} leave application.`;
                toast.error(msg);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setIsSearching(true);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get('/application-leave', {
                ...filters,
                search: value,
                status: statusFilter,
                page: '1',
                perPage: String(pagination.per_page),
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsSearching(false)
            });
        }, 300);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        router.get('/application-leave', {
            ...filters,
            search: searchTerm,
            status: value,
            page: '1',
            perPage: String(pagination.per_page),
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handlePerPageChange = (value: string) => {
        router.get('/application-leave', {
            ...filters,
            search: searchTerm,
            status: statusFilter,
            perPage: value,
            page: '1',
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/application-leave', {
            ...filters,
            search: searchTerm,
            status: statusFilter,
            page: String(page),
            perPage: String(pagination.per_page),
        }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleClearAllFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        router.get('/application-leave', {
            perPage: String(pagination.per_page)
        }, { preserveState: true, replace: true });
    };

    const FilterEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gray-100 p-6 mb-4">
                <CalendarDays className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No leaves found</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
                {searchTerm ? `No results match "${searchTerm}". Try adjusting your search.` :
                    statusFilter ? `No ${statusFilter} leaves found.` :
                        'No application leaves available at the moment.'}
            </p>
            {(searchTerm || statusFilter) && (
                <Button variant="outline" onClick={handleClearAllFilters}>
                    Clear Filters
                </Button>
            )}
        </div>
    );

    const StatusBadge = ({ status }: { status: string }) => {
        const statusLower = status?.toLowerCase() || 'pending';
        const styles: Record<string, string> = {
            pending: 'bg-amber-500/10 text-amber-700 border-amber-200',
            submitted: 'bg-blue-500/10 text-blue-700 border-blue-200',
            approved: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
            rejected: 'bg-orange-500/10 text-orange-700 border-orange-200',
        };
        const labels: Record<string, string> = {
            pending: 'Pending',
            submitted: 'Submitted',
            approved: 'Approved',
            rejected: 'Rejected',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[statusLower] || styles.pending}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusLower === 'approved' ? 'bg-emerald-500' : statusLower === 'rejected' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                {labels[statusLower] || 'Pending'}
            </span>
        );
    };

    const isStatusEditable = () => {
        const status = selectedLeave?.app_status?.toLowerCase();
        return status === 'pending' || status === 'submitted';
    };

    const duration = selectedLeave ? durationDays(selectedLeave.leave_start, selectedLeave.leave_end) : null;

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (applicationLeave: any) => {
        setItemToDelete(applicationLeave);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        destroy(ApplicationLeaveController.destroy(itemToDelete.slug_app).url, {
            onSuccess: () => {
                toast.success('Application leave deleted successfully');
                setDeleteDialogOpen(false);
                setItemToDelete(null);
                router.reload({ preserveState: true, preserveScroll: true });
            },
            onError: (errors) => toast.error(Object.values(errors).flat()[0] || 'Failed to delete application leave'),
            onFinish: () => setIsDeleting(false),
        });
    };

    // Convert applicationLeaveEnum to format expected by filter bar
    const statusOptions = [
        { value: '', label: 'All Statuses' },
        ...applicationLeaveEnum.map(item => ({ value: item.value, label: item.label }))
    ];

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

            <div className="flex justify-between items-center p-4 mx-4 mt-2 -mb-6 pp-header">
                <CustomHeader title="Application Leaves" description="List of requested leaves by employees" icon={<CalendarClock className="h-6 w-6" />} />
            </div>
            <div className="@container/main flex flex-1 flex-col gap-2 p-4">
                {showNotification && notification && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
                        <Bell className="h-5 w-5 text-green-600" />
                        <div><p className="font-medium">{notification.message}</p><p className="text-xs text-green-600">{notification.timestamp}</p></div>
                        <Button variant="ghost" size="sm" onClick={() => setShowNotification(false)}><X className="h-4 w-4" /></Button>
                    </div>
                )}
                <div className='mx-4 pp-row'>
                    <div className="mb-4">

                    </div>
                    <CustomTable
                        title="Application Leave Lists"
                        columns={ApplicationLeavesTableConfig.columns}
                        actions={ApplicationLeavesTableConfig.actions}
                        data={leaves}
                        from={pagination.from || 1}
                        onDelete={handleDeleteClick}
                        onView={handleView}
                        onEdit={handleEdit}
                        onRestore={() => { }}
                        toolbar={
                            <ApplicationLeaveFilterBar
                                searchTerm={searchTerm}
                                status={statusFilter}
                                onSearchChange={handleSearch}
                                onStatusChange={handleStatusChange}
                                onClearAll={handleClearAllFilters}
                                statusOptions={statusOptions}
                                searchPlaceholder="Search by employee name or code..."
                                filters={{
                                    search: true,
                                    status: true,
                                }}
                            />
                        }
                        filterEmptyState={<FilterEmptyState />}
                        emptyState={leaves.length === 0 && !searchTerm && !statusFilter ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                    <CalendarDays className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">No application leaves found</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">There are no leave applications available at the moment.</p>
                                <Link href={ApplicationLeaveController.create().url}>
                                    <Button className="gap-2"><PlusCircle className="h-4 w-4" /> Create Leave Application</Button>
                                </Link>
                            </div>
                        ) : null}
                    />
                    {leaves.length > 0 && (
                        <CustomPagination
                            pagination={pagination}
                            perPage={String(pagination.per_page)}
                            onPerPageChange={handlePerPageChange}
                            onPageChange={handlePageChange}
                            totalCount={totalCount}
                            filteredCount={filteredCount}
                            search={searchTerm}
                            resourceName="application leave"
                        />
                    )}
                    <DeleteConfirmationDialog
                        isOpen={deleteDialogOpen}
                        onClose={() => { setDeleteDialogOpen(false); setItemToDelete(null); }}
                        onConfirm={confirmDelete}
                        title='Delete application leave'
                        itemName={itemToDelete?.employee?.user?.name || 'this leave'}
                        isLoading={isDeleting}
                        confirmText='Delete'
                    />
                </div>
            </div>

            {/* Dialog remains the same as before */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="overflow-y-auto rounded-xl shadow-xl border-slate-200 w-[95vw] h-[70vh] max-w-none sm:w-[90vw] md:max-w-xl lg:max-w-2xl xl:max-w-2xl max-h-[85vh] p-0 [&>button]:hidden scrollbar-hide">
                    <DialogHeader className="border-b border-slate-100 py-3 px-4 sm:py-4 sm:px-6 bg-white sticky top-0 z-10">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-left gap-3 pt-2">
                            <CustomHeader icon={<CalendarClock />} title='Leave Application Details' description='Review and update the status of this leave application' />
                            <Button onClick={() => setIsDialogOpen(false)} variant="outline" size="sm" className="w-full sm:w-auto cursor-pointer"><X className="h-4 w-4 mr-2" /> Close</Button>
                        </div>
                    </DialogHeader>
                    {selectedLeave && (
                        <div className="px-4 py-4 sm:px-6 sm:py-6">
                            {/* Same dialog content as before */}
                            <div className="space-y-5 sm:space-y-6">
                                <div className="space-y-2 sm:space-y-3">
                                    <h3 className="text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#1d4791]" />
                                        Employee Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-slate-50 rounded-lg p-2.5 sm:p-3">
                                            <label className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide block mb-0.5 sm:mb-1">Employee Name</label>
                                            <p className="text-sm sm:text-base font-medium text-slate-900 break-words">{selectedLeave.employee?.user?.name || selectedLeave.employee_name || 'N/A'}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2.5 sm:p-3">
                                            <label className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wide block mb-0.5 sm:mb-1">Email</label>
                                            <p className="text-sm sm:text-base text-slate-700 break-words">{selectedLeave.employee?.user?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <h3 className="text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#1d4791]" />
                                        Leave Request Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-100">
                                            <label className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wide block mb-0.5 sm:mb-1">Start Date</label>
                                            <p className="text-sm sm:text-base font-medium text-slate-900 break-words">{formatDate(selectedLeave.leave_start)}</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-2.5 sm:p-3 border border-blue-100">
                                            <label className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wide block mb-0.5 sm:mb-1">End Date</label>
                                            <p className="text-sm sm:text-base font-medium text-slate-900 break-words">{formatDate(selectedLeave.leave_end)}</p>
                                        </div>
                                    </div>
                                    {duration && (
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5 sm:p-3">
                                            <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#1d4791]" />
                                            <span>Duration: <span className="font-medium text-slate-900">{duration} day{duration !== 1 ? 's' : ''}</span></span>
                                        </div>
                                    )}
                                    {isStatusEditable() && (
                                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 sm:px-4 sm:py-3">
                                            <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide">Current Status</label>
                                            <StatusBadge status={selectedLeave.app_status} />
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5 sm:mb-2 block">Reason for Leave</label>
                                        <div className="min-h-[60px] rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 sm:px-4 sm:py-3 text-sm text-slate-700 break-words">
                                            {selectedLeave.reason_to_leave || <span className="italic text-slate-400">No reason provided</span>}
                                        </div>
                                    </div>
                                </div>
                                {isStatusEditable() && (
                                    <div className="space-y-2 sm:space-y-3">
                                        <h3 className="text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
                                            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#1d4791]" />
                                            Update Decision
                                        </h3>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4 sm:space-y-5">
                                            <div className="flex flex-wrap items-center gap-2 p-1 bg-white rounded-lg border border-slate-200 w-fit">
                                                <button onClick={() => setApproveStatus('approved')} className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${approveStatus === 'approved' ? 'bg-[#068305] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" /> Approve
                                                </button>
                                                <button onClick={() => setApproveStatus('rejected')} className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center cursor-pointer gap-1.5 ${approveStatus === 'rejected' ? 'bg-[#c80000] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                                                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4" /> Reject
                                                </button>
                                            </div>
                                            {approveStatus === 'rejected' && (
                                                <div className="space-y-2">
                                                    <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1"><span className="text-[#c80000]">*</span> Rejection Reason</label>
                                                    <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Explain why this leave is being rejected..." className="w-full min-h-[80px] sm:min-h-[100px] p-2.5 sm:p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#c80000]/20 focus:border-[#c80000] resize-y" />
                                                </div>
                                            )}
                                            <div className="flex items-center justify-end gap-2 pt-2">
                                                <Button onClick={handleStatusUpdate} disabled={isSubmitting || (approveStatus === 'rejected' && !remarks.trim())} className={`h-8 sm:h-9 min-w-[100px] sm:min-w-[120px] gap-1.5 sm:gap-2 shadow-sm transition-all cursor-pointer text-sm ${approveStatus === 'rejected' ? 'bg-[#c80000] hover:bg-[#c80000]/90' : 'bg-[#068305] hover:bg-[#068305]/90'}`}>
                                                    {isSubmitting ? <>Saving...</> : <>{approveStatus === 'rejected' ? <XCircle className="h-3 w-3 sm:h-4 sm:w-4" /> : <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />}{approveStatus === 'rejected' ? 'Reject Leave' : 'Approve Leave'}</>}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!isStatusEditable() && selectedLeave.app_status && (
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-3">
                                            <h3 className="text-sm font-semibold text-slate-700 pb-2 flex items-center gap-2">
                                                {selectedLeave.app_status?.toLowerCase() === 'approved' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-orange-500" />}
                                                {selectedLeave.app_status === 'approved' ? 'Application Approved' : 'Application Rejected'}
                                            </h3>
                                            {selectedLeave.remarks && (
                                                <div className="p-2.5 sm:p-3 bg-white rounded-lg border border-slate-100">
                                                    <p className="text-[10px] sm:text-xs text-slate-500 mb-1">Remarks:</p>
                                                    <p className="text-xs sm:text-sm text-slate-700 break-words">{selectedLeave.remarks}</p>
                                                </div>
                                            )}
                                            <p className="text-[10px] sm:text-xs text-slate-500">This application has been {selectedLeave.app_status?.toLowerCase()} and cannot be modified.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}