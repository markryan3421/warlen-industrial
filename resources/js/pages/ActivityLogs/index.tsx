import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { X, Bell, History, Eye, PlusCircle, Pencil, Trash2, Info, User, Calendar, Database, MapPin, Activity, DollarSign, Mail, Phone } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomPagination } from '@/components/custom-pagination';
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table'; // Import CustomTable
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global { interface Window { Pusher: any; Echo: any; } }

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Activity Logs', href: '/activity-logs' }];

interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    subject_type?: string | null;
    subject_id?: number;
    causer_type?: string | null;
    causer_id?: number;
    causer?: { id: number; name: string; email: string; } | null;
    properties?: {
        attributes?: Record<string, any>;
        old?: Record<string, any>;
    } | null;
    created_at: string;
    updated_at: string;
    event?: string | null;
}

interface PaginationLink {
    active: boolean;
    label: string;
    url: string | null;
}

interface ActivityLogsProps {
    activityLogs: {
        data: ActivityLog[];
        links: PaginationLink[];
        from: number;
        to: number;
        total: number;
    } | ActivityLog[];
    filters?: {
        search: string;
        perPage: string;
    };
    totalCount?: number;
    filteredCount?: number;
}

// Optimized helpers with caching and safe handling
const formatModel = (m?: string | null) => {
    if (!m) return 'Unknown';
    try {
        if (m.includes('\\')) {
            return m.split('\\').pop() || m;
        }
        return m;
    } catch (error) {
        console.error('Error formatting model:', error, m);
        return 'Unknown';
    }
};

const getInitials = (n?: string) => {
    if (!n) return 'SY';
    try {
        return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    } catch (error) {
        return 'SY';
    }
};

const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    try {
        return new Date(d).toLocaleString();
    } catch (error) {
        return 'Invalid date';
    }
};

const getTime = (d?: string) => {
    if (!d) return 'N/A';
    try {
        const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
        return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`;
    } catch (error) {
        return 'N/A';
    }
};

const actionCache = new Map();
const getAction = (a?: string) => {
    if (!a) {
        return { icon: <Info className="h-3 w-3" />, badge: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
    if (actionCache.has(a)) return actionCache.get(a);
    const details = {
        created: { icon: <PlusCircle className="h-3 w-3" />, badge: 'bg-green-100 text-green-800', text: 'Created' },
        updated: { icon: <Pencil className="h-3 w-3" />, badge: 'bg-blue-100 text-blue-800', text: 'Updated' },
        deleted: { icon: <Trash2 className="h-3 w-3" />, badge: 'bg-red-100 text-red-800', text: 'Deleted' }
    }[a] || { icon: <Info className="h-3 w-3" />, badge: 'bg-gray-100 text-gray-800', text: a };
    actionCache.set(a, details);
    return details;
};

// FormatChanges component with safe handling
// FormatChanges component with formal and professional formatting
const FormatChanges = React.memo(({ log }: { log: ActivityLog }) => {
    const p = log.properties;
    if (!p) return <span>No details available</span>;

    const model = formatModel(log.subject_type);

    // Helper function to format field names to formal titles
    const formatFieldName = (field: string): string => {
        // Replace underscores with spaces
        let formatted = field.replace(/_/g, ' ');

        // Common field name mappings for better readability
        const fieldMappings: Record<string, string> = {
            // IDs and keys
            'id': 'ID',
            'uuid': 'UUID',
            'slug': 'Slug',

            // Personal information
            'name': 'Name',
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'middle_name': 'Middle Name',
            'full_name': 'Full Name',
            'email': 'Email Address',
            'phone': 'Phone Number',
            'mobile': 'Mobile Number',
            'address': 'Address',
            'city': 'City',
            'state': 'State/Province',
            'country': 'Country',
            'zip_code': 'ZIP Code',
            'postal_code': 'Postal Code',

            // Dates
            'created_at': 'Created Date',
            'updated_at': 'Updated Date',
            'deleted_at': 'Deleted Date',
            'date': 'Date',
            'time': 'Time',
            'datetime': 'Date & Time',
            'start_date': 'Start Date',
            'end_date': 'End Date',
            'due_date': 'Due Date',

            // Business
            'branch_name': 'Branch Name',
            'branch_address': 'Branch Address',
            'branch_code': 'Branch Code',
            'site_name': 'Site Name',
            'site_address': 'Site Address',
            'site_code': 'Site Code',
            'department': 'Department',
            'position': 'Position',
            'role': 'Role',
            'role_id': 'Role',
            'permission': 'Permission',
            'permissions': 'Permissions',

            // Status and flags
            'status': 'Status',
            'is_active': 'Active Status',
            'is_approved': 'Approval Status',
            'is_verified': 'Verification Status',
            'is_deleted': 'Deleted Status',
            'is_archived': 'Archived Status',

            // Content
            'title': 'Title',
            'description': 'Description',
            'content': 'Content',
            'summary': 'Summary',
            'notes': 'Notes',
            'remarks': 'Remarks',
            'comments': 'Comments',

            // Categories and types
            'type': 'Type',
            'category': 'Category',
            'tags': 'Tags',
            'priority': 'Priority',
            'level': 'Level',

            // Financial
            'price': 'Price',
            'cost': 'Cost',
            'amount': 'Amount',
            'quantity': 'Quantity',
            'total': 'Total Amount',
            'subtotal': 'Subtotal',
            'tax': 'Tax',
            'tax_rate': 'Tax Rate',
            'discount': 'Discount',
            'discount_rate': 'Discount Rate',

            // User related
            'user_id': 'User ID',
            'user_name': 'User Name',
            'username': 'Username',
            'password': 'Password',
            'avatar': 'Avatar',
            'profile_picture': 'Profile Picture',

            // System
            'ip_address': 'IP Address',
            'user_agent': 'User Agent',
            'device': 'Device',
            'browser': 'Browser',
            'os': 'Operating System',
            'session_id': 'Session ID',

            // Default fallback
            'default': 'Field'
        };

        // Check if field has a specific mapping
        if (fieldMappings[field]) {
            return fieldMappings[field];
        }

        // If no mapping, capitalize each word
        return formatted
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // Helper function to format values
    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';

        // Handle dates
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            } catch (e) {
                return value;
            }
        }

        // Handle objects and arrays
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2);
            } catch (e) {
                return String(value);
            }
        }

        return String(value);
    };

    // Helper function to get icon for field type
    const getFieldIcon = (field: string) => {
        const fieldLower = field.toLowerCase();
        if (fieldLower.includes('name')) return <User className="h-3.5 w-3.5 text-blue-500" />;
        if (fieldLower.includes('email')) return <Mail className="h-3.5 w-3.5 text-purple-500" />;
        if (fieldLower.includes('phone')) return <Phone className="h-3.5 w-3.5 text-green-500" />;
        if (fieldLower.includes('address')) return <MapPin className="h-3.5 w-3.5 text-orange-500" />;
        if (fieldLower.includes('date') || fieldLower.includes('time')) return <Calendar className="h-3.5 w-3.5 text-indigo-500" />;
        if (fieldLower.includes('price') || fieldLower.includes('amount') || fieldLower.includes('total')) return <DollarSign className="h-3.5 w-3.5 text-emerald-500" />;
        if (fieldLower.includes('status')) return <Activity className="h-3.5 w-3.5 text-yellow-500" />;
        return <Database className="h-3.5 w-3.5 text-gray-400" />;
    };

    // Created section
    if (log.description === 'created' && p.attributes) {
        const attributes = p.attributes;
        const attributeCount = Object.keys(attributes).length;

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-green-200">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                        <PlusCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-800">New Record Created</h3>
                        <p className="text-xs text-green-600 mt-0.5">
                            {model} · {attributeCount} {attributeCount === 1 ? 'field' : 'fields'} recorded
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                    {Object.keys(attributes).map(f => (
                        <div key={f} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                {getFieldIcon(f)}
                                <span className="font-medium text-gray-700 text-sm">
                                    {formatFieldName(f)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-900 bg-white rounded-md px-3 py-2 border border-gray-100 break-words">
                                {formatValue(attributes[f])}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Updated section
    if (log.description === 'updated' && p.attributes && p.old) {
        const changed = Object.keys(p.attributes).filter(f =>
            JSON.stringify(p.attributes?.[f]) !== JSON.stringify(p.old?.[f])
        );
        if (!changed.length) return (
            <div className="flex items-center justify-center py-8 text-gray-500">
                <Info className="h-8 w-8 mb-2" />
                <p>No changes detected</p>
            </div>
        );

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-blue-200">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Pencil className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-800">Record Updated</h3>
                        <p className="text-xs text-blue-600 mt-0.5">
                            {model} · {changed.length} {changed.length === 1 ? 'field' : 'fields'} changed
                        </p>
                    </div>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {changed.map(f => (
                        <div key={f} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                {getFieldIcon(f)}
                                <span className="font-semibold text-gray-800 text-sm">
                                    {formatFieldName(f)}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">Previous</span>
                                        <span className="text-[10px] text-red-400">(removed)</span>
                                    </div>
                                    <div className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2 border border-red-100 break-words">
                                        {formatValue(p.old?.[f])}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">Current</span>
                                        <span className="text-[10px] text-green-400">(new)</span>
                                    </div>
                                    <div className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 border border-green-100 break-words">
                                        {formatValue(p.attributes?.[f])}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Deleted section
    if (log.description === 'deleted' && p.old) {
        const oldData = p.old;
        const dataCount = Object.keys(oldData).length;

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-red-200">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-800">Record Deleted</h3>
                        <p className="text-xs text-red-600 mt-0.5">
                            {model} · {dataCount} {dataCount === 1 ? 'field' : 'fields'} recorded
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                    {Object.keys(oldData).map(f => (
                        <div key={f} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                {getFieldIcon(f)}
                                <span className="font-medium text-gray-700 text-sm">
                                    {formatFieldName(f)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600 bg-red-50 rounded-md px-3 py-2 border border-red-100 break-words">
                                {formatValue(oldData[f])}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Info className="h-8 w-8 mb-2" />
            <p>No details available for this activity</p>
        </div>
    );
});

// Stats card
const StatsCard = React.memo(({ title, value, color = '', icon: Icon, iconColor = '' }: any) => (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 pt-2 px-0">
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
            {!Icon && (
                <div className="h-8" /> // Placeholder for spacing when no icon
            )}
        </CardContent>
    </Card>
));


export default function Index({ activityLogs, filters = { search: '', perPage: '10' }, totalCount = 0, filteredCount = 0 }: ActivityLogsProps) {
    // Handle different data structures safely
    const getDataArray = useCallback((): ActivityLog[] => {
        if (!activityLogs) return [];

        if (activityLogs && typeof activityLogs === 'object' && 'data' in activityLogs && Array.isArray(activityLogs.data)) {
            return activityLogs.data;
        }

        if (Array.isArray(activityLogs)) {
            return activityLogs;
        }

        return [];
    }, [activityLogs]);

    const getPaginationData = useCallback(() => {
        if (!activityLogs) {
            return {
                links: [],
                from: 0,
                to: 0,
                total: 0,
            };
        }

        if (activityLogs && typeof activityLogs === 'object' && 'links' in activityLogs) {
            return {
                links: activityLogs.links || [],
                from: activityLogs.from || 0,
                to: activityLogs.to || 0,
                total: activityLogs.total || 0,
            };
        }

        if (Array.isArray(activityLogs)) {
            return {
                links: [],
                from: 0,
                to: activityLogs.length,
                total: activityLogs.length,
            };
        }

        return {
            links: [],
            from: 0,
            to: 0,
            total: 0,
        };
    }, [activityLogs]);

    // State for local filters (UI only)
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [modelFilter, setModelFilter] = useState<string>('all');
    const [userFilter, setUserFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState(filters?.perPage || '10');

    const [selected, setSelected] = useState<any>(null);
    const [open, setOpen] = useState(false);
    const [notify, setNotify] = useState<{ msg: string; time: string } | null>(null);
    const echoRef = useRef<any>(null);
    const batchRef = useRef<any[]>([]);
    const timerRef = useRef<NodeJS.Timeout>();
    const searchTimeoutRef = useRef<NodeJS.Timeout>();

    const logs = getDataArray();
    const pagination = getPaginationData();

    // Get unique values for filters
    const uniqueModels = useMemo(() => {
        const models = logs.map(log => formatModel(log.subject_type));
        return ['all', ...new Set(models.filter(m => m !== 'Unknown'))];
    }, [logs]);

    const uniqueActions = useMemo(() => {
        const actions = logs.map(log => log.description).filter(Boolean);
        return ['all', ...new Set(actions)];
    }, [logs]);

    const uniqueUsers = useMemo(() => {
        const users = logs
            .filter(log => log.causer && log.causer.id)
            .map(log => ({
                id: log.causer?.id,
                name: log.causer?.name
            }))
            .filter((user, index, self) =>
                index === self.findIndex(u => u.id === user.id)
            );
        return [{ id: 'all', name: 'All Users' }, ...users];
    }, [logs]);

    // Filter logs locally
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const model = formatModel(log.subject_type);
            const action = log.description;
            const userName = log.causer?.name || 'System';

            const matchesAction = actionFilter === 'all' || action === actionFilter;
            const matchesModel = modelFilter === 'all' || model === modelFilter;
            const matchesUser = userFilter === 'all' || log.causer?.id === Number(userFilter);
            const matchesSearch = searchTerm === '' ||
                `${model} ${action} ${userName}`.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesAction || !matchesModel || !matchesUser || !matchesSearch) return false;

            if (log.description === 'updated') {
                const changed = Object.keys(log.properties?.attributes || {}).filter(
                    f => JSON.stringify(log.properties?.attributes?.[f]) !== JSON.stringify(log.properties?.old?.[f])
                ).length;
                if (changed === 0) return false;
            }

            return true;
        });
    }, [logs, actionFilter, modelFilter, userFilter, searchTerm]);

    // Handle page change
    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }, []);

    // Handle per page change
    const handlePerPageChange = useCallback((value: string) => {
        setPerPage(value);
        router.get('/activity-logs', {
            search: searchTerm,
            perPage: value,
            page: 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [searchTerm]);

    const ActivityLogHeader = React.memo(() => {
        return (
            <CustomHeader
                icon={<History className="text-blue-800 h-6 w-6" />}
                title="Activity Logs"
                description="View and manage activity logs"
            />
        );
    });

    // Handle search with debounce
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            router.get('/activity-logs', {
                search: value,
                perPage: perPage,
                page: 1,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);
    }, [perPage]);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setActionFilter('all');
        setModelFilter('all');
        setUserFilter('all');
        setSearchTerm('');
        handleSearchChange('');
    }, [handleSearchChange]);

    // Batch updates for real-time
    const handleNew = useCallback((e: any) => {
        batchRef.current.push(e);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const currentUrl = new URL(window.location.href);
            const currentPage = currentUrl.searchParams.get('page') || '1';

            if (currentPage === '1') {
                setNotify({
                    msg: `${e.causer?.name || 'Someone'} ${e.description} a ${formatModel(e.subject_type)}`,
                    time: new Date().toLocaleString()
                });
                setTimeout(() => setNotify(null), 3000);
                router.reload({ preserveScroll: true });
            } else {
                setNotify({
                    msg: `New activity: ${e.causer?.name || 'Someone'} ${e.description} a ${formatModel(e.subject_type)}. Go to first page to see it.`,
                    time: new Date().toLocaleString()
                });
                setTimeout(() => setNotify(null), 5000);
            }
            batchRef.current = [];
        }, 100);
    }, []);

    // Echo setup
    useEffect(() => {
        if (echoRef.current) return;
        window.Pusher = Pusher;
        const key = import.meta.env.VITE_REVERB_APP_KEY;
        if (!key) return;
        echoRef.current = new Echo({
            broadcaster: 'reverb',
            key,
            wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
            wsPort: import.meta.env.VITE_REVERB_PORT || '8080',
            forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
            enabledTransports: ['ws'],
            authEndpoint: '/broadcasting/auth',
            auth: { headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') } }
        });
        window.Echo = echoRef.current;
        return () => { if (echoRef.current) echoRef.current.leave('activity-log'); };
    }, []);

    // Listen to channel
    useEffect(() => {
        if (!echoRef.current) return;
        const channel = echoRef.current.private('activity-log');
        channel.listen('.ActivityLogged', handleNew);
        return () => { channel.stopListening('.ActivityLogged'); };
    }, [handleNew]);

    const viewDetails = useCallback((log: any) => { setSelected(log); setOpen(true); }, []);

    // Calculate stats
    const stats = useMemo(() => ({
        total: totalCount || pagination.total || logs.length,
        created: logs.filter(l => l.description === 'created').length,
        updated: logs.filter(l => l.description === 'updated' &&
            l.properties?.attributes && l.properties?.old &&
            Object.keys(l.properties.attributes).some(f =>
                JSON.stringify(l.properties.attributes?.[f]) !== JSON.stringify(l.properties.old?.[f])
            )
        ).length,
        deleted: logs.filter(l => l.description === 'deleted').length,
    }), [logs, totalCount, pagination.total]);

    // Define columns for CustomTable
    const columns = [
        {
            label: 'ACTOR',
            key: 'user',
            render: (row: ActivityLog) => (
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gray-200">
                            {row.causer ? getInitials(row.causer.name) : 'SY'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{row.causer?.name || 'System'}</div>
                </div>
            )
        },
        {
            label: 'ACTION',
            key: 'action',
            isBadge: true,
            render: (row: ActivityLog) => {
                const action = getAction(row.description);
                return (
                    <div className="flex items-center gap-1">
                        {action.icon}
                        {action.text}
                    </div>
                );
            }
        },
        {
            label: 'MODEL',
            key: 'subject_type',
            render: (row: ActivityLog) => (
                <div className="flex items-center gap-1">
                    <Database className="h-5 w-5 text-gray-400" />
                    <span>{formatModel(row.subject_type)}</span>
                </div>
            )
        },
        {
            label: 'CHANGES',
            key: 'changes',
            render: (row: ActivityLog) => {
                const action = getAction(row.description);
                const changed = (() => {
                    if (row.description !== 'updated' || !row.properties?.attributes || !row.properties?.old) return 0;
                    return Object.keys(row.properties.attributes).filter(f =>
                        JSON.stringify(row.properties.attributes?.[f]) !== JSON.stringify(row.properties.old?.[f])
                    ).length;
                })();

                if (row.description === 'created' || row.description === 'deleted' || (row.description === 'updated' && changed > 0)) {
                    return (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="cursor-pointer">
                                        {row.description === 'created' && <span className="text-green-600 text-sm">Created new record</span>}
                                        {row.description === 'updated' && <span className="text-blue-600 text-sm">Updated {changed} {changed === 1 ? 'field' : 'fields'}</span>}
                                        {row.description === 'deleted' && <span className="text-red-600 text-sm">Deleted record</span>}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-md p-4 bg-white border">
                                    <FormatChanges log={row} />
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                }
                return null;
            }
        },
        {
            label: 'TIME',
            key: 'created_at',
            isDate: true,
            render: (row: ActivityLog) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium">{getTime(row.created_at)}</span>
                    <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>
                </div>
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
        {
            label: 'View',
            icon: 'Eye',
            route: '',
            className: ''
        }
    ];

    // Handle view action
    const handleView = (row: ActivityLog) => {
        viewDetails(row);
    };

    // Handle edit (not used but required by CustomTable)
    const handleEdit = (row: ActivityLog) => {
        // Not implemented for activity logs
    };

    // Handle delete (not used but required by CustomTable)
    const handleDelete = (row: ActivityLog) => {
        // Not implemented for activity logs
    };

    // Toolbar component for filters
    const FilterToolbar = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="search">Search</Label>
                <Input
                    id="search"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
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
                            const details = getAction(action);
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
                        {uniqueModels.filter(m => m !== 'all' && m !== 'Unknown').map((model) => (
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

            {/* Clear Filters Button */}
            <div className='flex justify-center items-end'>
                <Button variant="outline" onClick={handleClearFilters} className='flex justify-center items-center'>
                    Clear All Filters
                </Button>
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Logs" />
            <div className="flex flex-1 flex-col gap-2 p-4">
                {notify && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
                        <Bell className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="font-medium text-sm">{notify.msg}</p>
                            <p className="text-xs">{notify.time}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setNotify(null)} className="flex-shrink-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Header Section */}
                <ActivityLogHeader />

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 my-2 mx-4">
                    <StatsCard title="Total Activities" icon = {Activity} iconColor="text-gray-600" value={stats.total} />
                    <StatsCard title="Created" icon = {PlusCircle} iconColor="text-green-600" value={stats.created} color="text-green-600" />
                    <StatsCard title="Updated" icon = {Pencil} iconColor="text-blue-600" value={stats.updated} color="text-blue-600" />
                    <StatsCard title="Deleted" icon = {Trash2} iconColor="text-red-600" value={stats.deleted} color="text-red-600" />
                </div>

                {/* Custom Table with Toolbar */}
                <CustomTable
                    columns={columns}
                    actions={actions}
                    data={filteredLogs}
                    from={pagination.from || 0}
                    title="Activity Logs"
                    toolbar={<FilterToolbar />}
                />

                {/* Custom Pagination */}
                {pagination.total > 0 && (
                    <CustomPagination
                        pagination={{
                            links: pagination.links,
                            from: pagination.from,
                            to: pagination.to,
                            total: pagination.total,
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

            {/* Dialog */}
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