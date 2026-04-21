
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
			isBadge: true,
		},
		{
			label: 'Reason of Leave',
			key: 'reason_to_leave',
		},
		{
			label: '',
			key: 'actions',
			isAction: true,
		},
	],
	actions: [
		{ label: 'View', icon: 'Eye' },
		{ label: 'Edit', icon: 'Pencil' },
		{ label: 'Delete', icon: 'Trash' },
	],
};