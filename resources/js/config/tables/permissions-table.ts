export const PermissionsTableConfig = {
    columns: [
        { label: 'Permission Name', key: 'label', className: 'border px-4 py-3 tracking-wider' },
        { label: 'Module Name', key: 'module', className: 'capitalize border p-4' },
        { label: 'Description', key: 'description', className: 'w-90 p-4' },
        { label: 'Actions', key: 'actions', isAction: true, className: 'border p-4' },
    ],
    actions: [
        { label: 'View', icon: 'Eye', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Edit', icon: 'Pencil', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
        { label: 'Delete', icon: 'Trash', route: 'permissions.destroy', className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer' },
    ],
}