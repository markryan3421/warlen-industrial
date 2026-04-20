import { Head, router } from '@inertiajs/react';
import { X, Bell, History, Eye, PlusCircle, Pencil, Trash2, Activity, Database, Search } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';

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
    stats?: {
        total: number;
        created: number;
        updated: number;
        deleted: number;
    };
}

// Stats Card component
const StatsCard = React.memo(({
    label,
    count,
    active,
    onClick,
    type,
    icon: Icon
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
    type: 'total' | 'created' | 'updated' | 'deleted';
    icon?: React.ElementType;
}) => {
    const getColorScheme = (type: string, isActive: boolean) => {
        if (isActive) {
            switch (type) {
                case 'created':
                    return { bg: 'bg-green-600', text: 'text-white', ring: 'ring-green-600', iconColor: 'text-white', labelColor: 'text-white/70', countColor: 'text-white' };
                case 'updated':
                    return { bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-600', iconColor: 'text-white', labelColor: 'text-white/70', countColor: 'text-white' };
                case 'deleted':
                    return { bg: 'bg-red-600', text: 'text-white', ring: 'ring-red-600', iconColor: 'text-white', labelColor: 'text-white/70', countColor: 'text-white' };
                default:
                    return { bg: 'bg-primary', text: 'text-primary-foreground', ring: 'ring-primary', iconColor: 'text-primary-foreground', labelColor: 'text-primary-foreground/70', countColor: 'text-primary-foreground' };
            }
        }

        switch (type) {
            case 'total':
                return { bg: 'bg-card', text: 'text-foreground', ring: 'ring-border hover:ring-primary/40', iconColor: 'text-muted-foreground', labelColor: 'text-muted-foreground', countColor: 'text-foreground' };
            case 'created':
                return { bg: 'bg-card', text: 'text-foreground', ring: 'ring-border hover:ring-green-500/40', iconColor: 'text-green-600', labelColor: 'text-green-700', countColor: 'text-green-600' };
            case 'updated':
                return { bg: 'bg-card', text: 'text-foreground', ring: 'ring-border hover:ring-blue-500/40', iconColor: 'text-blue-600', labelColor: 'text-blue-700', countColor: 'text-blue-600' };
            case 'deleted':
                return { bg: 'bg-card', text: 'text-foreground', ring: 'ring-border hover:ring-red-500/40', iconColor: 'text-red-600', labelColor: 'text-red-700', countColor: 'text-red-600' };
            default:
                return { bg: 'bg-card', text: 'text-foreground', ring: 'ring-border', iconColor: 'text-muted-foreground', labelColor: 'text-muted-foreground', countColor: 'text-foreground' };
        }
    };

    const scheme = getColorScheme(type, active);

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col gap-1 rounded-2xl p-5 text-left shadow-sm transition-all duration-200 ring-2
                ${active ? `${scheme.bg} ${scheme.text} ${scheme.ring} shadow-md scale-[1.02]` : `${scheme.bg} text-foreground ${scheme.ring} hover:shadow-md`}`}
        >
            <div className="flex items-center justify-between">
                <p className={`text-[10px] font-black uppercase tracking-widest ${scheme.labelColor}`}>
                    {label}
                </p>
                {Icon && <Icon className={`h-4 w-4 ${scheme.iconColor}`} />}
            </div>
            <p className={`text-3xl font-extrabold ${scheme.countColor}`}>
                {count.toLocaleString()}
            </p>
        </button>
    );
});

// Empty State Component
const TableEmptyState = ({ hasFilters, searchTerm, onClearFilters }: { hasFilters: boolean; searchTerm: string; onClearFilters: () => void }) => {
    const Icon = hasFilters ? Search : Database;

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className={cn("rounded-full p-4 mb-4", hasFilters ? "bg-blue-50" : "bg-gray-50")}>
                <Icon className={cn("h-12 w-12", hasFilters ? "text-blue-500" : "text-gray-400")} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {hasFilters ? "No matching activity logs found" : "No activity logs available"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {hasFilters && searchTerm
                    ? `No activity logs matching "${searchTerm}". Try adjusting your search or filters.`
                    : hasFilters
                        ? "No activity logs match your current filters. Try adjusting your search criteria."
                        : "There are no activity logs to display at the moment."}
            </p>
            {hasFilters && (
                <Button variant="outline" className="mt-4" onClick={onClearFilters}>
                    Clear all filters
                </Button>
            )}
        </div>
    );
};

export default function Index({
    activityLogs,
    filters = {},
    totalCount = 0,
    filteredCount = 0,
    allActions = [],
    allModels = [],
    allUsers = [],
    stats: initialStats = { total: 0, created: 0, updated: 0, deleted: 0 },
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
    const [actionFilter, setActionFilter] = useState<string>(filters.action ?? '');
    const [modelFilter, setModelFilter] = useState<string>(filters.model ?? '');
    const [userFilter, setUserFilter] = useState<string>(filters.user ?? '');
    const [perPage, setPerPage] = useState(filters.perPage ?? String(pagination.per_page ?? '10'));
    const [selected, setSelected] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [notify, setNotify] = useState<{ msg: string; time: string } | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstRender = useRef(true);

    // Store initial global stats
    const [globalStats, setGlobalStats] = useState({
        total: 0,
        created: 0,
        updated: 0,
        deleted: 0,
    });

    useEffect(() => {
        if (isFirstRender.current) {
            setGlobalStats({
                total: totalCount,
                created: initialStats.created,
                updated: initialStats.updated,
                deleted: initialStats.deleted,
            });
            isFirstRender.current = false;
        }
    }, []);

    useEffect(() => {
        setSearchTerm(filters.search ?? '');
        setActionFilter(filters.action ?? '');
        setModelFilter(filters.model ?? '');
        setUserFilter(filters.user ?? '');
        setPerPage(filters.perPage ?? String(pagination.per_page ?? '10'));
    }, [filters.search, filters.action, filters.model, filters.user, filters.perPage, pagination.per_page]);

    const applyFilters = useCallback((overrides: Partial<{
        search: string; action: string; model: string; user: string; perPage: string;
    }> = {}) => {
        const s = overrides.search !== undefined ? overrides.search : searchTerm;
        const action = overrides.action !== undefined ? overrides.action : actionFilter;
        const model = overrides.model !== undefined ? overrides.model : modelFilter;
        const user = overrides.user !== undefined ? overrides.user : userFilter;
        const pp = overrides.perPage !== undefined ? overrides.perPage : perPage;

        const params: Record<string, string> = {};
        if (s && s.trim()) params.search = s.trim();
        if (action && action !== '') params.action = action;
        if (model && model !== '') params.model = model;
        if (user && user !== '') params.user = user;
        if (pp && pp !== '10') params.perPage = pp;

        params.page = '1';

        router.get('/activity-logs', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    }, [searchTerm, actionFilter, modelFilter, userFilter, perPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters({ search: value }), 500);
    };

    const handleActionChange = (value: string) => {
        setActionFilter(value);
        applyFilters({ action: value });
    };

    const handleModelChange = (value: string) => {
        setModelFilter(value);
        applyFilters({ model: value });
    };

    const handleUserChange = (value: string) => {
        setUserFilter(value);
        applyFilters({ user: value });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters({ perPage: value });
    };

    // Change this - from accepting URL to accepting page number
    const handlePageChange = useCallback((page: number) => {
        console.log('Page change triggered with page:', page);

        const params: Record<string, string> = {
            page: page.toString(),
            perPage: perPage,
        };

        if (searchTerm && searchTerm.trim()) {
            params.search = searchTerm.trim();
        }
        if (actionFilter && actionFilter !== '') {
            params.action = actionFilter;
        }
        if (modelFilter && modelFilter !== '') {
            params.model = modelFilter;
        }
        if (userFilter && userFilter !== '') {
            params.user = userFilter;
        }

        router.get('/activity-logs', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    }, [searchTerm, actionFilter, modelFilter, userFilter, perPage]);

    const clearFilters = () => {
        setSearchTerm('');
        setActionFilter('');
        setModelFilter('');
        setUserFilter('');
        if (searchTimer.current) clearTimeout(searchTimer.current);

        const params: Record<string, string> = {};
        if (perPage && perPage !== '10') params.perPage = perPage;
        params.page = '1';

        router.get('/activity-logs', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const handleStatsClick = (actionType: string) => {
        if (actionType === 'all') {
            if (actionFilter !== '') handleActionChange('');
        } else {
            if (actionFilter === actionType) handleActionChange('');
            else handleActionChange(actionType);
        }
    };

    const activeFiltersCount = [
        searchTerm?.trim() ? 1 : 0,
        actionFilter ? 1 : 0,
        modelFilter ? 1 : 0,
        userFilter ? 1 : 0
    ].filter(Boolean).length;

    const hasActiveFilters = activeFiltersCount > 0;

    useEffect(() => {
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, []);

    const viewDetails = (log: any) => {
        setSelected(log);
        setOpen(true);
    };

    const handleView = (row: any) => viewDetails(row);

    const statItems = [
        { label: 'All', key: 'all', count: globalStats.total, type: 'total' as const, icon: Activity },
        { label: 'Created', key: 'created', count: globalStats.created, type: 'created' as const, icon: PlusCircle },
        { label: 'Updated', key: 'updated', count: globalStats.updated, type: 'updated' as const, icon: Pencil },
        { label: 'Deleted', key: 'deleted', count: globalStats.deleted, type: 'deleted' as const, icon: Trash2 },
    ];

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
                        <div className="flex-1">
                            <p className="font-medium text-sm">{notify.msg}</p>
                            <p className="text-xs">{notify.time}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setNotify(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 my-5 mx-4">
                    {statItems.map((item) => (
                        <StatsCard
                            key={item.key}
                            label={item.label}
                            count={item.count}
                            active={actionFilter === item.key || (item.key === 'all' && actionFilter === '')}
                            onClick={() => handleStatsClick(item.key)}
                            type={item.type}
                            icon={item.icon}
                        />
                    ))}
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
                                activeFiltersCount={activeFiltersCount}
                            />
                        }
                        onView={handleView}
                        onDelete={() => { }}
                        onEdit={() => { }}
                        filterEmptyState={
                            <TableEmptyState
                                hasFilters={hasActiveFilters}
                                searchTerm={searchTerm}
                                onClearFilters={clearFilters}
                            />
                        }
                    />
                </div>

                {/* Pagination */}
                {logs.length > 0 && pagination.total > 0 && (
                    <div className="mt-4">
                        <CustomPagination
                            pagination={{
                                links: pagination.links,
                                from: pagination.from,
                                to: pagination.to,
                                total: pagination.total
                            }}
                            perPage={perPage}
                            onPerPageChange={handlePerPageChange}
                            onPageChange={handlePageChange}  // Now it expects (page: number) => void
                            totalCount={totalCount || pagination.total}
                            filteredCount={filteredCount || pagination.total}
                            search={searchTerm}
                            resourceName="log"
                        />
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Activity Details</DialogTitle>
                        <DialogDescription>Complete information about this activity</DialogDescription>
                    </DialogHeader>
                    {selected && <FormatChanges log={selected} />}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}