export const EmployeesTableConfig = {
  columns: [
    {
      label: 'Code',
      key: 'emp_code',
      className: ' px-4 py-3 tracking-wider'
    },
    {
      label: 'Name',
      key: 'user.name',  // if your table supports dot notation; otherwise use render
      className: ' p-4',
      render: (row: any) => row.user?.name || 'N/A'  // fallback if dot notation not supported
    },
    {
      label: 'Position',
      key: 'position.pos_name',
      className: ' p-4',
      render: (row: any) => row.position?.pos_name && !row.position.deleted_at
        ? row.position.pos_name
        : <span className="text-gray-500 italic">Not assigned</span>
    },
    {
      label: 'Pay Frequency',
      key: 'pay_frequency',
      className: ' p-4 capitalize',
      render: (row: any) => row.pay_frequency?.replace('_', ' ') || 'N/A'
    },
    {
      label: 'Branch',
      key: 'branch.branch_name',
      className: ' p-4',
      render: (row: any) => row.branch?.branch_name || 'N/A'
    },
    {
      label: 'Site',
      key: 'site.site_name',
      className: ' p-4',
      render: (row: any) => row.site?.site_name || 'N/A'
    },
    {
      label: 'Contract Period',
      key: 'contract_period',
      className: ' p-4',
      render: (row: any) => {
        if (row.contract_start_date && row.contract_end_date) {
          return `${formatDate(row.contract_start_date)} - ${formatDate(row.contract_end_date)}`;
        }
        return 'No contract period';
      }
    },
    {
      label: 'Status',
      key: 'employee_status',
      className: ' p-4',
      render: (row: any) => {
        const isActive = ['active', 'Active', 'ACTIVE'].includes(row.employee_status);
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
            {row.employee_status || 'Unknown'}
          </span>
        );
      }
    },
    {
      label: '',
      key: 'actions',
      isAction: true,
      className: 'p-4 text-center'
    },
  ],
  actions: [
    {
      label: 'View',
      icon: 'Eye',
      onClick: 'onView', // will call the onView prop with the row
      className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer'
    },
    {
      label: 'Edit',
      icon: 'Pencil',
      onClick: 'onEdit',
      className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer'
    },
    {
      label: 'Delete',
      icon: 'Trash',
      onClick: 'onDelete',
      className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer'
    },
  ],
};

// Helper function (you can import from a shared utils file)
function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}