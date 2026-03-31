export const BranchesTableConfig = {
  columns: [
    { label: 'Branch Name', key: 'branch_name', className: 'border px-4 py-3 tracking-wider' },
    { label: 'Branch Address', key: 'branch_address', className: 'capitalize border p-4' },
    {
      label: 'Number of Sites',
      key: 'sites',
      isBadge: true,
      className: 'border p-4',
      render: (row: any) => row.sites?.length || 0
    },
    { label: '', key: 'actions', isAction: true, className: 'border p-4' },
  ],
  actions: [
    { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    { label: 'Edit', icon: 'Pencil', route: 'BranchController.edit(branch.branch_slug)', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    { label: 'Delete', icon: 'Trash', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
  ],
}