import { CheckCircle, Clock, XCircle } from "lucide-react";

export const EmployeeApplicationLeaveTableConfig = {
    columns: [
        { label: 'Leave Start Date', key: 'leave_start', className: 'border px-4 py-3 tracking-wider', isDate: true },
        { label: 'Leave End Date', key: 'leave_end', className: 'border px-4 py-3 tracking-wider', isDate: true },
        { label: 'Reason to Leave', key: 'reason_to_leave', className: 'border px-4 py-3 tracking-wider' },
        { 
            label: 'Status', 
            key: 'app_status', 
            className: 'border px-4 py-3 tracking-wider',
            render: (row: any) => {
                const status = row.app_status?.toLowerCase() || 'pending';
                
                // Status badge configurations
                const statusConfig = {
                    approved: {
                        bgColor: 'bg-green-100',
                        textColor: 'text-green-800',
                        borderColor: 'border-green-200',
                        icon: CheckCircle,
                        label: 'Approved'
                    },
                    rejected: {
                        bgColor: 'bg-red-100',
                        textColor: 'text-red-800',
                        borderColor: 'border-red-200',
                        icon: XCircle,
                        label: 'Rejected'
                    },
                    pending: {
                        bgColor: 'bg-yellow-100',
                        textColor: 'text-yellow-800',
                        borderColor: 'border-yellow-200',
                        icon: Clock,
                        label: 'Pending'
                    }
                };
                
                const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
                
                return (
                    <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${config.bgColor} ${config.textColor} border ${config.borderColor}
                    `}>
                        <span className="text-xs">{config.icon}</span>
                        {config.label}
                    </span>
                );
            }
        },
    ],
};