import {Clock, CheckCircle, XCircle} from 'lucide-react'
export const ApplicationLeavesTableConfig = {
  columns: [
    {
      label: 'Employee',
      key: 'employee_name',
      render: (row: any) => {
        const name = row.employee?.user?.name || row.employee_name || `Employee #${row.employee_id}` || 'N/A';
        return name;
      }
    },
    {
      label: 'Leave Start',
      key: 'leave_start',
      isDate: true,
    },
    {
      label: 'Leave End',
      key: 'leave_end',
      isDate: true,
    },
    {
      label: 'Status',
      key: 'app_status',
      className: 'px-4 py-3 tracking-wider',
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
        const Icon = config.icon;

        return (
          <span className={`
                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                        ${config.bgColor} ${config.textColor} border ${config.borderColor}
                    `}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        );
      }
    },
    {
      label: '',
      key: 'actions',
      isAction: true,
    },
  ],
  actions: [
    { label: 'View', icon: 'Eye' },
    { label: 'Delete', icon: 'Trash' },
  ],
};