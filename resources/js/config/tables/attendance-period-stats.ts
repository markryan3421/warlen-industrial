export const AttendancePeriodStatsTableConfig = {
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
      label: 'Period Start',
      key: 'period_start',
      className: 'border px-4 py-3',
    },
    {
      label: 'Period End',
      key: 'period_end',
      className: 'border px-4 py-3',
    },
    {
      label: 'Late Times',
      key: 'late_times',
      className: 'border px-4 py-3',
    },
    {
      label: 'Late Minutes',
      key: 'late_minutes',
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