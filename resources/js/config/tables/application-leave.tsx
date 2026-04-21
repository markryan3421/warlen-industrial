// config/tables/application-leave.tsx
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { ActionConfig } from '@/components/custom-table';

export const ApplicationLeaveTableConfig = {
  columns: [
    {
      label: 'Employee',
      key: 'employee_name',
      render: (row: any) => {
        const name = row.employee?.user?.name || row.employee_name || `Employee #${row.employee_id}` || 'N/A';
        return name;
      }
    },
    { label: 'Leave Start Date', key: 'leave_start', isDate: true },
    { label: 'Leave End Date', key: 'leave_end', isDate: true },
    { label: 'Reason to Leave', key: 'reason_to_leave' },
    {
      label: 'Status',
      key: 'app_status',
      render: (row: any) => {
        const status = row.app_status?.toLowerCase() || 'pending';

        const getStatusConfig = () => {
          switch (status) {
            case 'approved':
              return {
                bg: 'bg-green-100',
                text: 'text-green-800',
                icon: CheckCircle,
                label: 'Approved'
              };
            case 'rejected':
              return {
                bg: 'bg-red-100',
                text: 'text-red-800',
                icon: XCircle,
                label: 'Rejected'
              };
            default:
              return {
                bg: 'bg-yellow-100',
                text: 'text-yellow-800',
                icon: Clock,
                label: 'Pending'
              };
          }
        };

        const config = getStatusConfig();
        const Icon = config.icon;

        return (
          <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${config.bg} ${config.text}
          `}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        );
      }
    },
    {
      label: 'Actions',
      key: 'actions',
      isAction: true,
    }
  ],
  actions: [
    { label: 'View', icon: 'Eye', route: '' },
    { label: 'Edit', icon: 'Pencil', route: '' },
    { label: 'Delete', icon: 'Trash', route: '' },
  ] as ActionConfig[],
};