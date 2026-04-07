export const EmployeeApplicationLeaveTableConfig = {
    columns: [
        { label: 'Leave Start Date', key: 'leave_start', className: 'border px-4 py-3 tracking-wider', isDate: true },
        { label: 'Leave End Date', key: 'leave_end', className: 'border px-4 py-3 tracking-wider', isDate: true },
        { label: 'Reason to Leave', key: 'reason_to_leave', className: 'border px-4 py-3 tracking-wider' },
        { label: 'Status', key: 'app_status', className: 'border px-4 py-3 tracking-wider', isBadge: true },
    ],
}