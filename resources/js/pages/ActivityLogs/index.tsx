import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Filter, X, Bell, Activity, User, Database, Clock, Eye, PlusCircle, Pencil, Trash2, Info } from 'lucide-react';

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Import Echo and Pusher for Reverb
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Declare global window interface for Echo
declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Activity Logs',
        href: '/activity-logs',
    },
];

interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    subject_type: string;
    subject_id: number;
    causer_type: string;
    causer_id: number;
    causer?: {
        id: number;
        name: string;
        email: string;
    };
    properties: {
        attributes?: Record<string, any>;
        old?: Record<string, any>;
    };
    created_at: string;
    updated_at: string;
}

interface ActivityLogProps {
    activityLogs: (ActivityLog & {
        causer?: {
            id: number;
            name: string;
            email: string;
        };
    })[];
}

export default function Index({ activityLogs }: ActivityLogProps) {
    // Add state for real-time updates
    const [logs, setLogs] = useState<(ActivityLog & { causer?: any })[]>(activityLogs);
    const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [echoInitialized, setEchoInitialized] = useState(false);
    const [selectedLog, setSelectedLog] = useState<(ActivityLog & { causer?: any }) | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter states
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [modelFilter, setModelFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Get unique values for filters
    const uniqueModels = useMemo(() => {
        const models = logs.map(log => {
            const modelName = log.subject_type.split('\\').pop() || '';
            return modelName;
        });
        return ['all', ...new Set(models)];
    }, [logs]);

    const uniqueActions = useMemo(() => {
        const actions = logs.map(log => log.description);
        return ['all', ...new Set(actions)];
    }, [logs]);

    const uniqueUsers = useMemo(() => {
        const users = logs
            .filter(log => log.causer)
            .map(log => ({
                id: log.causer?.id,
                name: log.causer?.name
            }))
            .filter((user, index, self) => 
                index === self.findIndex(u => u.id === user.id)
            );
        return [{ id: 'all', name: 'All Users' }, ...users];
    }, [logs]);

    // Initialize Echo with Reverb configuration
    useEffect(() => {
        window.Pusher = Pusher;

        const key = import.meta.env.VITE_REVERB_APP_KEY;
        const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
        const port = import.meta.env.VITE_REVERB_PORT || '8080';
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

        if (!key) {
            console.error('VITE_REVERB_APP_KEY is not defined in your .env file');
            return;
        }

        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: key,
            wsHost: host,
            wsPort: port,
            wssPort: port,
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: '/broadcasting/auth',
            auth: {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
            },
        });

        setEchoInitialized(true);

        return () => {
            if (window.Echo) {
                window.Echo.leave('activity-log');
            }
        };
    }, []);

    // Listen to activity-log channel
    useEffect(() => {
        if (!echoInitialized || !window.Echo) return;

        const channel = window.Echo.private('activity-log');

        channel.listen('.ActivityLogged', (event: any) => {
            console.log('Activity log event received:', event);

            setNotification({
                message: `${event.causer?.name || 'Someone'} ${event.description} a ${event.subject_type.split('\\').pop()}`,
                timestamp: new Date().toLocaleString()
            });
            setShowNotification(true);

            setTimeout(() => {
                setShowNotification(false);
            }, 5000);

            setLogs(prevLogs => [event, ...prevLogs]);
        });

        channel.error((error: any) => {
            console.error('Channel error:', error);
        });

        return () => {
            channel.stopListening('.ActivityLogged');
        };
    }, [echoInitialized]);

    // Filter logs
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const model = log.subject_type.split('\\').pop() || '';
            const action = log.description;
            const userName = log.causer?.name || 'System';
            const searchableText = `${model} ${action} ${userName} ${JSON.stringify(log.properties)}`.toLowerCase();
            
            const matchesAction = actionFilter === 'all' || action === actionFilter;
            const matchesModel = modelFilter === 'all' || model === modelFilter;
            const matchesUser = userFilter === 'all' || log.causer?.id === Number(userFilter);
            const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm.toLowerCase());
            
            return matchesAction && matchesModel && matchesUser && matchesSearch;
        });
    }, [logs, actionFilter, modelFilter, userFilter, searchTerm]);

    // Format model name
    const formatModelName = (model: string) => {
        return model.split('\\').pop() || model;
    };

    // Get action icon and color
    const getActionDetails = (action: string) => {
        switch (action.toLowerCase()) {
            case 'created':
                return {
                    icon: <PlusCircle className="h-3 w-3" />,
                    badge: 'bg-green-100 text-green-800',
                    text: 'Created'
                };
            case 'updated':
                return {
                    icon: <Pencil className="h-3 w-3" />,
                    badge: 'bg-blue-100 text-blue-800',
                    text: 'Updated'
                };
            case 'deleted':
                return {
                    icon: <Trash2 className="h-3 w-3" />,
                    badge: 'bg-red-100 text-red-800',
                    text: 'Deleted'
                };
            default:
                return {
                    icon: <Info className="h-3 w-3" />,
                    badge: 'bg-gray-100 text-gray-800',
                    text: action
                };
        }
    };

    // Format changes for display
    const formatChanges = (log: ActivityLog) => {
        const properties = log.properties;
        if (!properties) return 'No details available';

        const modelName = formatModelName(log.subject_type);
        
        if (log.description === 'created' && properties.attributes) {
            const changedFields = Object.keys(properties.attributes);
            return (
                <div className="space-y-1">
                    <div className="font-medium text-green-600">New {modelName} Created:</div>
                    <div className="text-sm">
                        {changedFields.map(field => (
                            <div key={field} className="grid grid-cols-3 gap-2 text-xs">
                                <span className="text-gray-500">{field}:</span>
                                <span className="col-span-2 font-mono">{String(properties.attributes?.[field])}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        
        if (log.description === 'updated' && properties.attributes && properties.old) {
            const changedFields = Object.keys(properties.attributes).filter(
                field => JSON.stringify(properties.attributes?.[field]) !== JSON.stringify(properties.old?.[field])
            );
            
            return (
                <div className="space-y-1">
                    <div className="font-medium text-blue-600">Changes Made:</div>
                    <div className="text-sm">
                        {changedFields.map(field => (
                            <div key={field} className="grid grid-cols-3 gap-2 text-xs border-l-2 border-blue-200 pl-2">
                                <span className="text-gray-500">{field}:</span>
                                <div className="col-span-2">
                                    <span className="text-red-600 line-through mr-2">
                                        {String(properties.old?.[field])}
                                    </span>
                                    <span className="text-green-600">
                                        {String(properties.attributes?.[field])}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        
        if (log.description === 'deleted' && properties.old) {
            const deletedFields = Object.keys(properties.old);
            return (
                <div className="space-y-1">
                    <div className="font-medium text-red-600">Deleted {modelName}:</div>
                    <div className="text-sm">
                        {deletedFields.map(field => (
                            <div key={field} className="grid grid-cols-3 gap-2 text-xs">
                                <span className="text-gray-500">{field}:</span>
                                <span className="col-span-2 font-mono">{String(properties.old?.[field])}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        
        return <span className="text-gray-500">No detailed changes available</span>;
    };

    // Get user initials for avatar
    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    // Format relative time
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
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
                    <h1 className="text-2xl font-bold">Activity Logs</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Activity className="h-4 w-4" />
                        <span>Real-time activity monitoring</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <Activity className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semib text-gray-900 mb-2">No activity logs yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Activity logs will appear here as users interact with the system.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Filter Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="search">Search</Label>
                                    <Input
                                        id="search"
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="action">Action</Label>
                                    <Select value={actionFilter} onValueChange={setActionFilter}>
                                        <SelectTrigger id="action">
                                            <SelectValue placeholder="Filter by action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Actions</SelectItem>
                                            {uniqueActions.filter(a => a !== 'all').map((action) => {
                                                const details = getActionDetails(action);
                                                return (
                                                    <SelectItem key={action} value={action}>
                                                        <div className="flex items-center gap-2">
                                                            {details.icon}
                                                            {details.text}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="model">Model</Label>
                                    <Select value={modelFilter} onValueChange={setModelFilter}>
                                        <SelectTrigger id="model">
                                            <SelectValue placeholder="Filter by model" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Models</SelectItem>
                                            {uniqueModels.filter(m => m !== 'all').map((model) => (
                                                <SelectItem key={model} value={model}>
                                                    {model}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="user">User</Label>
                                    <Select value={userFilter} onValueChange={setUserFilter}>
                                        <SelectTrigger id="user">
                                            <SelectValue placeholder="Filter by user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uniqueUsers.map((user) => (
                                                <SelectItem key={user.id} value={String(user.id)}>
                                                    {user.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Clear Filters Button */}
                            <div className="px-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => {
                                        setActionFilter('all');
                                        setModelFilter('all');
                                        setUserFilter('all');
                                        setSearchTerm('');
                                    }}
                                >
                                    Clear All Filters
                                </Button>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-500">Total Activities</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{logs.length}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-500">Created</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">
                                            {logs.filter(l => l.description === 'created').length}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-500">Updated</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {logs.filter(l => l.description === 'updated').length}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-gray-500">Deleted</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">
                                            {logs.filter(l => l.description === 'deleted').length}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Activity Logs Table */}
                            <div className="px-4">
                                <Table>
                                    <TableCaption>
                                        Showing {filteredLogs.length} of {logs.length} activity logs
                                        {filteredLogs.length !== logs.length && ' (filtered)'}
                                    </TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Model</TableHead>
                                            <TableHead>Changes</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                                    No logs found with the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredLogs.map((log) => {
                                                const actionDetails = getActionDetails(log.description);
                                                return (
                                                    <TableRow key={log.id} className="hover:bg-gray-50">
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback className="bg-gray-200 text-gray-700">
                                                                        {log.causer ? getUserInitials(log.causer.name) : 'SY'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-medium">
                                                                        {log.causer?.name || 'System'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={actionDetails.badge}>
                                                                <div className="flex items-center gap-1">
                                                                    {actionDetails.icon}
                                                                    {actionDetails.text}
                                                                </div>
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Database className="h-3 w-3 text-gray-400" />
                                                                <span className="font-medium">
                                                                    {formatModelName(log.subject_type)}
                                                                </span>
                                                                {/* <Badge variant="outline" className="ml-2 text-xs">
                                                                    #{log.subject_id}
                                                                </Badge> */}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="max-w-[250px] cursor-help">
                                                                            {log.description === 'created' && (
                                                                                <span className="text-green-600 text-sm">
                                                                                    Created new record
                                                                                </span>
                                                                            )}
                                                                            {log.description === 'updated' && log.properties?.attributes && (
                                                                                <span className="text-blue-600 text-sm">
                                                                                    Updated {Object.keys(log.properties.attributes).length} field(s)
                                                                                </span>
                                                                            )}
                                                                            {log.description === 'deleted' && (
                                                                                <span className="text-red-600 text-sm">
                                                                                    Deleted record
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="bottom" className="max-w-md p-4">
                                                                        {formatChanges(log)}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">
                                                                    {getRelativeTime(log.created_at)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {formatDate(log.created_at)}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedLog(log);
                                                                    setIsDialogOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Details
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Activity Log Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this activity
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-6">
                            {/* User Information */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">User Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="bg-gray-200 text-gray-700 text-lg">
                                                {selectedLog.causer ? getUserInitials(selectedLog.causer.name) : 'SY'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid grid-cols-2 gap-4 flex-1">
                                            <div>
                                                <Label className="text-sm text-gray-500">Name</Label>
                                                <p className="font-medium">{selectedLog.causer?.name || 'System'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-500">Email</Label>
                                                <p className="font-medium">{selectedLog.causer?.email || 'N/A'}</p>
                                            </div>
                                            {/* <div>
                                                <Label className="text-sm text-gray-500">User ID</Label>
                                                <p className="font-mono text-sm">#{selectedLog.causer?.id || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-gray-500">User Type</Label>
                                                <p className="font-mono text-sm">{selectedLog.causer_type}</p>
                                            </div> */}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Action Information */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Action Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <Label className="text-sm text-gray-500">Action</Label>
                                            <div className="mt-1">
                                                <Badge className={getActionDetails(selectedLog.description).badge}>
                                                    <div className="flex items-center gap-1">
                                                        {getActionDetails(selectedLog.description).icon}
                                                        {getActionDetails(selectedLog.description).text}
                                                    </div>
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-gray-500">Log Name</Label>
                                            <p className="font-medium">{selectedLog.log_name}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-gray-500">Timestamp</Label>
                                            <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                                        </div>
                                        {/* <div>
                                            <Label className="text-sm text-gray-500">Log ID</Label>
                                            <p className="font-mono text-sm">#{selectedLog.id}</p>
                                        </div> */}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Subject Information */}
                            {/* <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Subject Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm text-gray-500">Model</Label>
                                            <p className="font-medium">{selectedLog.subject_type}</p>
                                        </div>
                                        <div>
                                            <Label className="text-sm text-gray-500">Record ID</Label>
                                            <p className="font-mono text-sm">#{selectedLog.subject_id}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card> */}

                            {/* Changes Made */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Changes Made</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {formatChanges(selectedLog)}
                                </CardContent>
                            </Card>

                            {/* Raw Properties */}
                            {/* <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">Raw Data</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-60">
                                        {JSON.stringify(selectedLog.properties, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card> */}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}