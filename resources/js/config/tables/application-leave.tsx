import type { ActionConfig } from "@/components/custom-table";
import { formatDate } from "@/lib/utils"; // import your date formatter

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
      isBadge: false,
      render: (row: any) => {
        const status = row.app_status || 'pending';
        const statusLower = status.toLowerCase();
        const badgeClass = statusLower === 'approved' ? 'bg-green-100 text-green-800' :
          statusLower === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800';
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
          {formatStatus(status)}
        </span>;
      }
    },
    {
      label: '',
      key: 'actions',
      isAction: true,
    },
  ],
  actions: [
    { label: 'Edit', icon: 'Pencil' },
    { label: 'Delete', icon: 'Trash' },
  ] as ActionConfig[],
};

function formatStatus(status: string) {
  // use your enum mapping if available
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return statusMap[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}