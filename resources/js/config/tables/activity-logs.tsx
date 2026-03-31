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
            const shortName = model.split('\\').pop() || model;
            return formatFormalName(shortName);
        }
        return formatFormalName(model);
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

/**
 * Format a model name to a formal, readable format
 * Examples:
 * - "AttendanceLog" -> "Attendance Log"
 * - "Employee" -> "Employee"
 * - "AttendanceExceptionStat" -> "Attendance Exception Statistics"
 * - "User" -> "User"
 * - "Role" -> "Role"
 * - "Permission" -> "Permission"
 * - "Branch" -> "Branch"
 * - "Site" -> "Site"
 * - "Department" -> "Department"
 * - "Position" -> "Position"
 * - "Schedule" -> "Schedule"
 * - "PeriodStat" -> "Period Statistics"
 */
export const formatFormalName = (name: string): string => {
    if (!name) return 'Unknown';

    // Handle special cases for specific model names
    const specialCases: Record<string, string> = {
        'AttendanceLog': 'Attendance Log',
        'AttendanceLogs': 'Attendance Logs',
        'AttendanceExceptionStat': 'Attendance Exception Statistics',
        'AttendanceExceptionStats': 'Attendance Exception Statistics',
        'AttendancePeriodStat': 'Period Statistics',
        'AttendancePeriodStats': 'Period Statistics',
        'AttendanceSchedule': 'Attendance Schedule',
        'AttendanceSchedules': 'Attendance Schedules',
        'employee': 'Employee',
        'Employees': 'Employees',
        'User': 'User',
        'Users': 'Users',
        'Role': 'Role',
        'Roles': 'Roles',
        'Permission': 'Permission',
        'Permissions': 'Permissions',
        'Branch': 'Branch',
        'Branches': 'Branches',
        'Site': 'Site',
        'Sites': 'Sites',
        'Department': 'Department',
        'Departments': 'Departments',
        'Position': 'Position',
        'Positions': 'Positions',
        'Schedule': 'Schedule',
        'Schedules': 'Schedules',
        'PeriodStat': 'Period Statistics',
        'PeriodStats': 'Period Statistics',
        'ExceptionStat': 'Exception Statistics',
        'ExceptionStats': 'Exception Statistics',
        'ActivityLog': 'Activity Log',
        'ActivityLogs': 'Activity Logs',
    };

    // Check for special case first
    if (specialCases[name]) {
        return specialCases[name];
    }

    // Handle camelCase to words
    // Example: "AttendanceLog" -> "Attendance Log"
    const withSpaces = name.replace(/([A-Z])/g, ' $1').trim();

    // Handle multiple uppercase letters in a row
    // Example: "PDFGenerator" -> "PDF Generator"
    const finalWithSpaces = withSpaces.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

    // Capitalize first letter of each word
    const formatted = finalWithSpaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    // Handle special word replacements
    let result = formatted;
    const wordReplacements: Record<string, string> = {
        'Stat': 'Statistics',
        'Stats': 'Statistics',
        'Log': 'Log',
        'Logs': 'Logs',
        'Info': 'Information',
        'Mgmt': 'Management',
        'Admin': 'Administration',
    };

    for (const [key, value] of Object.entries(wordReplacements)) {
        result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
    }

    return result;
};

/**
 * Format a field name to a formal, readable format
 * Examples:
 * - "created_at" -> "Created Date"
 * - "employee_name" -> "Employee Name"
 * - "total_hours" -> "Total Hours"
 * - "is_overtime" -> "Is Overtime"
 */
export const formatFormalFieldName = (field: string): string => {
    if (!field) return 'Field';

    // Handle special cases
    const specialCases: Record<string, string> = {
        'id': 'ID',
        'created_at': 'Created Date',
        'updated_at': 'Last Modified Date',
        'deleted_at': 'Deleted Date',
        'employee_id': 'Employee ID',
        'employee_name': 'Employee Name',
        'employee_code': 'Employee Code',
        'user_id': 'User ID',
        'user_name': 'User Name',
        'position_id': 'Position ID',
        'position_name': 'Position Name',
        'department_id': 'Department ID',
        'department_name': 'Department Name',
        'branch_id': 'Branch ID',
        'branch_name': 'Branch Name',
        'site_id': 'Site ID',
        'site_name': 'Site Name',
        'time_in': 'Time In',
        'time_out': 'Time Out',
        'total_hours': 'Total Hours',
        'is_overtime': 'Overtime Status',
        'late_minutes': 'Late Minutes',
        'absence_minutes': 'Absence Minutes',
        'total_exception_minutes': 'Total Exception Minutes',
        'am_time_in': 'Morning Time In',
        'am_time_out': 'Morning Time Out',
        'pm_time_in': 'Afternoon Time In',
        'pm_time_out': 'Afternoon Time Out',
        'leave_early_minutes': 'Early Leave Minutes',
        'normal_work_hours': 'Normal Work Hours',
        'real_work_hours': 'Actual Work Hours',
        'attended_days': 'Days Attended',
        'absent_days': 'Days Absent',
        'real_pay': 'Actual Pay',
        'period_start': 'Period Start Date',
        'period_end': 'Period End Date',
        'shift_code': 'Shift Code',
        'shift_label': 'Shift Label',
        'pay_frequency': 'Pay Frequency',
        'contract_start_date': 'Contract Start Date',
        'contract_end_date': 'Contract End Date',
        'employee_status': 'Employment Status',
        'hire_date': 'Hire Date',
        'scheduled_days': 'Scheduled Days',
    };

    // Check for special case
    if (specialCases[field]) {
        return specialCases[field];
    }

    // Convert snake_case to words
    const withSpaces = field.replace(/_/g, ' ');

    // Capitalize first letter of each word
    const formatted = withSpaces
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    // Handle specific word replacements
    let result = formatted;
    const wordReplacements: Record<string, string> = {
        'Id': 'ID',
        'Ip': 'IP',
        'Url': 'URL',
        'Api': 'API',
        'Ssl': 'SSL',
        'Html': 'HTML',
        'Css': 'CSS',
        'Js': 'JavaScript',
        'Pdf': 'PDF',
        'Csv': 'CSV',
        'Xml': 'XML',
        'Json': 'JSON',
        'Am': 'AM',
        'Pm': 'PM',
        'Is': 'Is',
    };

    for (const [key, value] of Object.entries(wordReplacements)) {
        result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
    }

    return result;
};

/**
 * Format a value to a formal, readable format
 */
export const formatFormalValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not Specified';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();

    // Handle dates
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                });
            }
        } catch (e) {
            return value;
        }
    }

    // Handle objects
    if (typeof value === 'object') {
        if (value.name) return value.name;
        if (value.label) return value.label;
        if (value.title) return value.title;
        try {
            return JSON.stringify(value);
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
                <Database className="h-5 w-5 text-blue-700" />
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