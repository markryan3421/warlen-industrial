export const ContributionTableConfig = {
  columns: [
    { label: 'Contribution Type', key: 'type', className: 'border px-4 py-3 tracking-wider' },
    { label: 'Effective From', key: 'effective_from', className: 'capitalize border p-4', isDate: true },
    { label: 'Effective To', key: 'effective_to', className: 'capitalize border p-4', isDate: true },
    { label: '', key: 'actions', isAction: true, className: 'border p-4' },
  ],
  actions: [
    { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    { label: 'Edit', icon: 'Pencil', route: 'ContributionVersionController.edit(version.id)', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    { label: 'Delete', icon: 'Trash', route: 'contribution-versions/destroy', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
  ],
}