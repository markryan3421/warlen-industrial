import { Database, Eye, PlusCircle, Pencil, Trash2, Info, User, Mail, Phone, MapPin, Calendar, DollarSign, Activity } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import React from 'react';

export interface ActivityLog {
    id: number;
    log_name: string;
    description: 'created' | 'updated' | 'deleted' | string;
    subject_type?: string | null;
    subject_id?: number;
    causer_type?: string | null;
    causer_id?: number;
    causer?: {
        id: number;
        name: string;
        email: string;
    } | null;
    properties?: {
        attributes?: Record<string, any>;
        old?: Record<string, any>;
    } | null;
    created_at: string;
    updated_at: string;
    event?: string | null;
}

export interface ActionInfo {
    icon: React.ReactNode;
    badge: string;
    text: string;
}

export interface TableColumn {
    label: string;
    key: string;
    isBadge?: boolean;
    render?: (row: ActivityLog) => React.ReactNode;
    isImage?: boolean;
    isAction?: boolean;
    className?: string;
    isDate?: boolean;
}

export interface ActionConfig {
    label: string;
    icon: keyof typeof import('lucide-react');
    route: string;
    className?: string;
    onClick?: (row: ActivityLog) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatModel = (model?: string | null): string => {
    if (!model) return 'Unknown';
    try {
        if (model.includes('\\')) {
            return model.split('\\').pop() || model;
        }
        return model;
    } catch (error) {
        return 'Unknown';
    }
};

export const getInitials = (name?: string): string => {
    if (!name) return 'SY';
    try {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    } catch (error) {
        return 'SY';
    }
};

export const formatDate = (date?: string): string => {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleString();
    } catch (error) {
        return 'Invalid date';
    }
};

export const getRelativeTime = (date?: string): string => {
    if (!date) return 'N/A';
    try {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    } catch (error) {
        return 'N/A';
    }
};

const actionCache = new Map<string, ActionInfo>();

export const getAction = (action?: string): ActionInfo => {
    if (!action) {
        return { icon: <Info className="h-3 w-3" />, badge: 'bg-gray-100 text-gray-800', text: 'Unknown' };
    }
    if (actionCache.has(action)) return actionCache.get(action)!;
    
    const details: Record<string, ActionInfo> = {
        created: { icon: <PlusCircle className="h-3 w-3" />, badge: 'bg-green-100 text-green-800', text: 'Created' },
        updated: { icon: <Pencil className="h-3 w-3" />, badge: 'bg-blue-100 text-blue-800', text: 'Updated' },
        deleted: { icon: <Trash2 className="h-3 w-3" />, badge: 'bg-red-100 text-red-800', text: 'Deleted' }
    };
    
    const result = details[action] || {
        icon: <Info className="h-3 w-3" />,
        badge: 'bg-gray-100 text-gray-800',
        text: action.charAt(0).toUpperCase() + action.slice(1)
    };
    actionCache.set(action, result);
    return result;
};

export const getFieldIcon = (field: string): React.ReactNode => {
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

export const formatFieldName = (field: string): string => {
    const formatted = field.replace(/_/g, ' ');
    const fieldMappings: Record<string, string> = {
        'user.name': 'Name',
        'first_name': 'First Name',
        'last_name': 'Last Name',
        'email': 'Email Address',
        'phone': 'Phone Number',
        'created_at': 'Created Date',
        'updated_at': 'Updated Date',
        'deleted_at': 'Deleted Date',
        'date': 'Date',
        'time': 'Time',
        'department': 'Department',
        'position': 'Position',
        'role': 'Role',
        'branch_name': 'Branch Name',
        'site_name': 'Site Name',
        'employee.user.name': 'Employee Name',
        'employee_id': 'Employee ID',
    };
    if (fieldMappings[field]) return fieldMappings[field];
    return formatted.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
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
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch (e) {
            return String(value);
        }
    }
    return String(value);
};

export const getChangedFieldsCount = (log: ActivityLog): number => {
    if (log.description !== 'updated' || !log.properties?.attributes || !log.properties?.old) return 0;
    return Object.keys(log.properties.attributes).filter(f =>
        JSON.stringify(log.properties.attributes?.[f]) !== JSON.stringify(log.properties.old?.[f])
    ).length;
};

// ============================================================================
// FORMAT CHANGES COMPONENT
// ============================================================================

interface FormatChangesProps {
    log: ActivityLog;
}

export const FormatChanges = React.memo(({ log }: FormatChangesProps) => {
    const properties = log.properties;
    if (!properties) return <span>No details available</span>;
    const model = formatModel(log.subject_type);

    // Created section
    if (log.description === 'created' && properties.attributes) {
        const attributes = properties.attributes;
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                    {Object.keys(attributes).map(field => (
                        <div key={field} className="bg-gray-50 rounded-lg p-3 border hover:border-green-200 transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                {getFieldIcon(field)}
                                <span className="font-medium text-gray-700 text-sm">{formatFieldName(field)}</span>
                            </div>
                            <div className="text-sm text-gray-900 bg-white rounded-md px-3 py-2 border border-gray-100">
                                {formatValue(attributes[field])}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Updated section
    if (log.description === 'updated' && properties.attributes && properties.old) {
        const changed = Object.keys(properties.attributes).filter(field =>
            JSON.stringify(properties.attributes?.[field]) !== JSON.stringify(properties.old?.[field])
        );
        if (!changed.length) return (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
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
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {changed.map(field => (
                        <div key={field} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                {getFieldIcon(field)}
                                <span className="font-semibold text-gray-800 text-sm">{formatFieldName(field)}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">Previous</span>
                                        <span className="text-[10px] text-red-400">(removed)</span>
                                    </div>
                                    <div className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2 border border-red-100">
                                        {formatValue(properties.old?.[field])}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-medium text-gray-500">Current</span>
                                        <span className="text-[10px] text-green-400">(new)</span>
                                    </div>
                                    <div className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 border border-green-100">
                                        {formatValue(properties.attributes?.[field])}
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
    if (log.description === 'deleted' && properties.old) {
        const oldData = properties.old;
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                    {Object.keys(oldData).map(field => (
                        <div key={field} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                {getFieldIcon(field)}
                                <span className="font-medium text-gray-700 text-sm">{formatFieldName(field)}</span>
                            </div>
                            <div className="text-sm text-gray-600 bg-red-50 rounded-md px-3 py-2 border border-red-100">
                                {formatValue(oldData[field])}
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

FormatChanges.displayName = 'FormatChanges';

// ============================================================================
// TABLE COLUMNS CONFIGURATION
// ============================================================================

export const ActivityLogsTableColumns: TableColumn[] = [
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
                <Badge className={action.badge}>
                    <div className="flex items-center gap-1">
                        {action.icon}
                        {action.text}
                    </div>
                </Badge>
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
            const changed = getChangedFieldsCount(row);
            if (row.description === 'created' || row.description === 'deleted' || (row.description === 'updated' && changed > 0)) {
                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                                    {row.description === 'created' && <span className="text-green-600 text-sm font-medium">Created new record</span>}
                                    {row.description === 'updated' && <span className="text-blue-600 text-sm font-medium">Updated {changed} {changed === 1 ? 'field' : 'fields'}</span>}
                                    {row.description === 'deleted' && <span className="text-red-600 text-sm font-medium">Deleted record</span>}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-2xl p-0 bg-white border shadow-xl rounded-lg overflow-hidden">
                                <FormatChanges log={row} />
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
            return <span className="text-gray-400 text-sm">—</span>;
        }
    },
    {
        label: 'TIME',
        key: 'created_at',
        isDate: true,
        render: (row: ActivityLog) => (
            <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">{getRelativeTime(row.created_at)}</span>
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

export const ActivityLogsTableActions: ActionConfig[] = [
    {
        label: 'View',
        icon: 'Eye',
        route: (row: ActivityLog) => `/activity-logs/${row.id}`,
        className: 'text-blue-600 hover:text-blue-800'
    }
];

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    columns: ActivityLogsTableColumns,
    actions: ActivityLogsTableActions,
    helpers: {
        formatModel,
        getInitials,
        formatDate,
        getRelativeTime,
        getAction,
        formatFieldName,
        formatValue,
        getFieldIcon,
        getChangedFieldsCount,
    },
    components: { FormatChanges }
};