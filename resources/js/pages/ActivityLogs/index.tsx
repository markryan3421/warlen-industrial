import { Head, router } from '@inertiajs/react';
import { X, Bell, History, Eye, PlusCircle, Pencil, Trash2, Activity } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import { ActivityLogsFilterBar } from '@/components/activity-logs/activity-logs-filter-bar';
import { 
    ActivityLogsTableActions, 
    ActivityLogsTableColumns,
    FormatChanges
} from '@/config/tables/activity-logs';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Activity Logs', href: '/activity-logs' }];

interface ActivityLogsProps {
    activityLogs: {
        data: any[];
        links: any[];
        from: number;
        to: number;
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    filters?: { search?: string; action?: string; model?: string; user?: string; perPage?: string };
    totalCount?: number;
    filteredCount?: number;
    allActions?: string[];
    allModels?: string[];
    allUsers?: Array<{ id: string; name: string }>;
}

const StatsCard = React.memo(({ title, value, color = '', icon: Icon, iconColor = '' }: any) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-2 pt-2 px-0">
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[17px] font-bold text-black">{title}</CardTitle>
            {Icon && (
                <div className={`p-2 rounded-lg ${iconColor || color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
            )}
        </CardHeader>
        <CardContent>
            <div className={`text-2xl font-bold mb-2 -mt-2 ${color}`}>{value}</div>
        </CardContent>
    </Card>
));

export default function Index({
    activityLogs,
    filters = {},
    totalCount = 0,
    filteredCount = 0,
    allActions = [],
    allModels = [],
    allUsers = [],
}: ActivityLogsProps) {

    const logs = activityLogs.data || [];
    const pagination = {
        links: activityLogs.links || [],
        from: activityLogs.from || 0,
        to: activityLogs.to || 0,
        total: activityLogs.total || 0,
        current_page: activityLogs.current_page || 1,
        last_page: activityLogs.last_page || 1,
        per_page: activityLogs.per_page || 10,
    };

    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [actionFilter, setActionFilter] = useState<string>(filters.action ?? 'all');
    const [modelFilter, setModelFilter] = useState<string>(filters.model ?? 'all');
    const [userFilter, setUserFilter] = useState<string>(filters.user ?? 'all');
    const [perPage, setPerPage] = useState(filters.perPage ?? String(pagination.per_page ?? '10'));
    const [selected, setSelected] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [notify, setNotify] = useState<{ msg: string; time: string } | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stats = useMemo(() => ({
        total: totalCount || pagination.total,
        created: logs.filter(l => l.description === 'created').length,
        updated: logs.filter(l => l.description === 'updated').length,
        deleted: logs.filter(l => l.description === 'deleted').length,
    }), [logs, totalCount, pagination.total]);

    function applyFilters(overrides: Partial<{
        search: string; action: string; model: string; user: string; perPage: string;
    }> = {}) {
        const s = overrides.search ?? searchTerm;
        const action = overrides.action ?? actionFilter;
        const model = overrides.model ?? modelFilter;
        const user = overrides.user ?? userFilter;
        const pp = overrides.perPage ?? perPage;
        const params: Record<string, string> = {};
        if (s.trim()) params.search = s.trim();
        if (action !== 'all') params.action = action;
        if (model !== 'all') params.model = model;
        if (user !== 'all') params.user = user;
        if (pp && pp !== '10') params.perPage = pp;
        params.page = '1';
        router.get('/activity-logs', params, { preserveState: true, preserveScroll: true, replace: true });
    }

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters({ search: value }), 100);
    };

    const handleActionChange = (value: string) => { setActionFilter(value); applyFilters({ action: value }); };
    const handleModelChange = (value: string) => { setModelFilter(value); applyFilters({ model: value }); };
    const handleUserChange = (value: string) => { setUserFilter(value); applyFilters({ user: value }); };
    const handlePerPageChange = (value: string) => { setPerPage(value); applyFilters({ perPage: value }); };
    const handlePageChange = (url: string | null) => { if (url) router.get(url, {}, { preserveState: true, preserveScroll: true }); };
    const clearFilters = () => {
        setSearchTerm(''); setActionFilter('all'); setModelFilter('all'); setUserFilter('all');
        if (searchTimer.current) clearTimeout(searchTimer.current);
        router.get('/activity-logs', { perPage: perPage, page: 1 }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const activeFiltersCount = [
        searchTerm.trim(), actionFilter !== 'all' ? actionFilter : null,
        modelFilter !== 'all' ? modelFilter : null, userFilter !== 'all' ? userFilter : null
    ].filter(Boolean).length;

    useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

    const viewDetails = (log: any) => { setSelected(log); setOpen(true); };
    const handleView = (row: any) => viewDetails(row);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
            <div className='mx-8 -mb-6 my-4'>
                <CustomHeader icon={<History className="text-white h-6 w-6" />} title="Activity Logs" description="View and manage activity logs" />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                {notify && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
                        <Bell className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1"><p className="font-medium text-sm">{notify.msg}</p><p className="text-xs">{notify.time}</p></div>
                        <Button variant="ghost" size="sm" onClick={() => setNotify(null)}><X className="h-4 w-4" /></Button>
                    </div>
                )}
                <div className="grid grid-cols-4 gap-4 my-5 mx-4">
                    <StatsCard title="Total Activities" icon={Activity} iconColor="text-gray-600" value={stats.total} />
                    <StatsCard title="Created" icon={PlusCircle} iconColor="text-green-600" value={stats.created} color="text-green-600" />
                    <StatsCard title="Updated" icon={Pencil} iconColor="text-blue-600" value={stats.updated} color="text-blue-600" />
                    <StatsCard title="Deleted" icon={Trash2} iconColor="text-red-600" value={stats.deleted} color="text-red-600" />
                </div>
                <div className='mx-4'>
                    <CustomTable
                        columns={ActivityLogsTableColumns}
                        actions={ActivityLogsTableActions}
                        data={logs}
                        from={pagination.from}
                        to={pagination.to}
                        total={pagination.total}
                        filteredCount={filteredCount}
                        totalCount={totalCount}
                        searchTerm={searchTerm}
                        title="Activity Log Lists"
                        toolbar={
                            <ActivityLogsFilterBar
                                searchTerm={searchTerm}
                                actionFilter={actionFilter}
                                modelFilter={modelFilter}
                                userFilter={userFilter}
                                availableActions={allActions}
                                availableModels={allModels}
                                availableUsers={allUsers}
                                onSearchChange={handleSearchChange}
                                onActionChange={handleActionChange}
                                onModelChange={handleModelChange}
                                onUserChange={handleUserChange}
                                onClearAll={clearFilters}
                            />
                        }
                        onView={handleView}
                        onDelete={() => {}}
                        onEdit={() => {}}
                    />
                </div>
                {pagination.total > 0 && (
                    <CustomPagination
                        pagination={{ links: pagination.links, from: pagination.from, to: pagination.to, total: pagination.total }}
                        perPage={perPage}
                        onPerPageChange={handlePerPageChange}
                        onPageChange={handlePageChange}
                        totalCount={totalCount || pagination.total}
                        filteredCount={filteredCount || pagination.total}
                        search={searchTerm}
                        resourceName="log"
                    />
                )}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader><DialogTitle>Activity Details</DialogTitle><DialogDescription>Complete information about this activity</DialogDescription></DialogHeader>
                    {selected && <FormatChanges log={selected} />}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}