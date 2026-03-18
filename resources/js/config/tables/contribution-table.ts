export const ContributionTableConfig = {
  columns: [
    { label: 'Contribution Type', key: 'type', className: 'border px-4 py-3 tracking-wider' },

    {
      label: 'Salary Range',
      key: 'salary_range',
      className: 'border p-4',
      isBadge: true, 
      render: (row: any) => {
        if (!row.contribution_brackets || row.contribution_brackets.length === 0) {
          return 'No ranges';
        }

        const count = row.contribution_brackets.length;
        return `${count} bracket${count > 1 ? 's' : ''}`;
      }
    },
    { label: 'Actions', key: 'actions', isAction: true, className: 'border p-4' },

  ],
  actions: [
    { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    { label: 'Edit', icon: 'Pencil', route: 'ContributionVersionController.edit(version.id)', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    { label: 'Delete', icon: 'Trash', route: 'contribution-versions/destroy', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
  ],
}