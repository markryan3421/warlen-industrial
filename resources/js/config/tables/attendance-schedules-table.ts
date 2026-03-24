export const AttendanceSchedulesTableConfig = {
    columns: [
        {
            label: 'Employee ID',
            key: 'employee_id',
            className: 'border px-4 py-3 tracking-wider',
        },
        {
            label: 'Employee Name',
            key: 'employee_name',
            className: 'border px-4 py-3',
        },
        {
            label: 'Project Site',
            key: 'department',
            className: 'border px-4 py-3',
        },
        {
            label: 'Date',
            key: 'date',
            className: 'border px-4 py-3',
        },
        {
            label: 'Shift Code',
            key: 'shift_code',
            className: 'border px-4 py-3',
        },
        {
            label: 'Shift Label',
            key: 'shift_label',
            className: 'border px-4 py-3',
        },
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
            className: 'border px-4 py-3',
        },
    ],
    actions: [
        {
            label: 'View',
            icon: 'Eye',
            className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer',
        },
    ],
};