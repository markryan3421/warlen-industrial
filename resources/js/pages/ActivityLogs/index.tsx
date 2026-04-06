import { Head, router } from '@inertiajs/react';
import { X, Bell, History, Eye, PlusCircle, Pencil, Trash2, Activity, Database, Search } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
}

const StatsCard = React.memo(({ 
    title, 
    value, 
    color = '', 
    icon: Icon, 
    iconColor = '', 
    isActive = false,
    onClick 
}: any) => (
    <Card 
        onClick={onClick}
        className={cn(
            "overflow-hidden border-stone-300 hover:shadow-md hover:cursor-pointer transition-all duration-200 border-2 py-3",
            isActive 
                ? "border-blue-500 bg-blue-50 shadow-md scale-[1.02]" 
                : "hover:border-blue-600 hover:bg-blue-50 hover:shadow-md/50"
        )}
    >
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className={cn(
                "text-sm lg:text-[16px] font-sm uppercase",
                isActive ? "text-blue-700" : "text-stone-700"
            )}>
                {title}
            </CardTitle>
            {Icon && (
                <div className={cn(
                    "p-1 rounded-lg",
                    isActive ? "bg-blue-100" : iconColor || color.replace('text-', 'bg-').replace('-600', '-100')
                )}>
                    <Icon className={cn(
                        "h-4 h-4 lg:h-6 lg:w-6",
                        isActive ? "text-blue-600" : color
                    )} />
                </div>
            )}
        </CardHeader>
        <CardContent>
            <div className={cn(
                "text-2xl font-bold mb-2 -mt-2",
                isActive ? "text-blue-600" : color
            )}>
                {value}
            </div>
        </CardContent>
    </Card>
));

// Custom Empty State Component
const EmptyState = ({ message, description, icon: Icon, hasFilters }: any) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className={cn(
            "rounded-full p-4 mb-4",
            hasFilters ? "bg-blue-50" : "bg-gray-50"
        )}>
            {Icon ? (
                <Icon className={cn(
                    "h-12 w-12",
                    hasFilters ? "text-blue-500" : "text-gray-400"
                )} />
            ) : (
                <Database className={cn(
                    "h-12 w-12",
                    hasFilters ? "text-blue-500" : "text-gray-400"
                )} />
            )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {message}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {description}
        </p>
        {hasFilters && (
            <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                    // Clear all filters
                    const params: Record<string, string> = { page: '1' };
                    router.get('/activity-logs', params, { 
                        preserveState: true, 
                        preserveScroll: true, 
                        replace: true 
                    });
                }}
            >
                Clear all filters
            </Button>
        )}
    </div>
);

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

    // Initialize state from filters prop (URL parameters)
    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [actionFilter, setActionFilter] = useState<string>(filters.action ?? '');
    const [modelFilter, setModelFilter] = useState<string>(filters.model ?? '');
    const [userFilter, setUserFilter] = useState<string>(filters.user ?? '');
    const [perPage, setPerPage] = useState(filters.perPage ?? String(pagination.per_page ?? '10'));
    const [selected, setSelected] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [notify, setNotify] = useState<{ msg: string; time: string } | null>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update local state when filters prop changes (URL navigation)
    useEffect(() => {
        setSearchTerm(filters.search ?? '');
        setActionFilter(filters.action ?? 'all');
        setModelFilter(filters.model ?? 'all');
        setUserFilter(filters.user ?? 'all');
        setPerPage(filters.perPage ?? String(pagination.per_page ?? '10'));
    }, [filters.search, filters.action, filters.model, filters.user, filters.perPage, pagination.per_page]);

    const stats = useMemo(() => ({
        total: totalCount || pagination.total,
        created: logs.filter(l => l.description === 'created').length,
        updated: logs.filter(l => l.description === 'updated').length,
        deleted: logs.filter(l => l.description === 'deleted').length,
    }), [logs, totalCount, pagination.total]);

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
        if (action && action !== 'all') params.action = action;
        if (model && model !== 'all') params.model = model;
        if (user && user !== 'all') params.user = user;
        if (pp && pp !== '10') params.perPage = pp;
        
        // Reset to page 1 when filters change
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
    
    const handlePageChange = (url: string | null) => { 
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };
    
    const clearFilters = () => {
        setSearchTerm(''); 
        setActionFilter('all'); 
        setModelFilter('all'); 
        setUserFilter('all');
        if (searchTimer.current) clearTimeout(searchTimer.current);
        
        // Only keep perPage parameter
        const params: Record<string, string> = {};
        if (perPage && perPage !== '10') params.perPage = perPage;
        params.page = '1';
        
        router.get('/activity-logs', params, { 
            preserveState: true, 
            preserveScroll: true, 
            replace: true 
        });
    };

    // Handle stats card click to filter by that action
    const handleStatsClick = (actionType: string) => {
        if (actionType === 'all') {
            // If clicking Total Activities, clear all action filters
            if (actionFilter !== 'all') {
                handleActionChange('all');
            }
        } else {
            if (actionFilter === actionType) {
                // If already filtering by this action, clear the filter
                handleActionChange('all');
            } else {
                // Otherwise, filter by this action
                handleActionChange(actionType);
            }
        }
    };

    // Determine if Total Activities should be active (when no action filter is applied)
    const isTotalActive = actionFilter === 'all';

    const activeFiltersCount = [
        searchTerm && searchTerm.trim() ? 1 : 0,
        actionFilter !== 'all' ? 1 : 0,
        modelFilter !== 'all' ? 1 : 0,
        userFilter !== 'all' ? 1 : 0
    ].filter(Boolean).length;

    // Check if there are any active filters
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

    // Determine empty state message based on filters
    const getEmptyStateMessage = () => {
        if (hasActiveFilters) {
            return "No matching activity logs found";
        }
        return "No activity logs available";
    };

    const getEmptyStateDescription = () => {
        if (hasActiveFilters) {
            return "Try adjusting your filters or search criteria to see more results.";
        }
        return "There are no activity logs to display at the moment.";
    };

    const getEmptyStateIcon = () => {
        if (hasActiveFilters) {
            return Search;
        }
        return Database;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />

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

            <div className='mx-8 -mb-6 my-4 pp-header'>
                <CustomHeader icon={<History className="text-white h-6 w-6" />} title="Activity Logs" description="View and manage activity logs" />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4 pp-row">
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
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-5 mx-4">
                    <StatsCard 
                        title="Total Activities" 
                        icon={Activity} 
                        iconColor="text-gray-600" 
                        value={stats.total}
                        isActive={isTotalActive}
                        onClick={() => handleStatsClick('all')}
                    />
                    <StatsCard 
                        title="Created" 
                        icon={PlusCircle} 
                        iconColor="text-green-600" 
                        value={stats.created} 
                        color="text-green-600"
                        isActive={actionFilter === 'created'}
                        onClick={() => handleStatsClick('created')}
                    />
                    <StatsCard 
                        title="Updated" 
                        icon={Pencil} 
                        iconColor="text-blue-600" 
                        value={stats.updated} 
                        color="text-blue-600"
                        isActive={actionFilter === 'updated'}
                        onClick={() => handleStatsClick('updated')}
                    />
                    <StatsCard 
                        title="Deleted" 
                        icon={Trash2} 
                        iconColor="text-red-600" 
                        value={stats.deleted} 
                        color="text-red-600"
                        isActive={actionFilter === 'deleted'}
                        onClick={() => handleStatsClick('deleted')}
                    />
                </div>
                
                <div className='mx-4'>
                    {logs.length === 0 ? (
                        // Show empty state when no data
                        <div className="border rounded-lg bg-white dark:bg-gray-900">
                            <div className="p-4 border-b">
                                <h2 className="text-lg font-semibold">Activity Log Lists</h2>
                            </div>
                            <EmptyState 
                                message={getEmptyStateMessage()}
                                description={getEmptyStateDescription()}
                                icon={getEmptyStateIcon()}
                                hasFilters={hasActiveFilters}
                            />
                        </div>
                    ) : (
                        // Show table when data exists
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
                            onDelete={() => {}}
                            onEdit={() => {}}
                        />
                    )}
                </div>
                
                {logs.length > 0 && pagination.total > 0 && (
                    <CustomPagination
                        pagination={{ 
                            links: pagination.links, 
                            from: pagination.from, 
                            to: pagination.to, 
                            total: pagination.total 
                        }}
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