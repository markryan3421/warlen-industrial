export const AttendanceExceptionStatsTableConfig = {
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
      label: 'Department',
      key: 'department',
      className: 'border px-4 py-3',
    },
    {
      label: 'Date',
      key: 'date',
      className: 'border px-4 py-3',
    },
    {
      label: 'Absence Minutes',
      key: 'absence_minutes',
      className: 'border px-4 py-3',
    },
    {
      label: 'Total Exception Minutes',
      key: 'total_exception_minutes',
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