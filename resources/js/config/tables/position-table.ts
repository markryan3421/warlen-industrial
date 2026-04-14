export const PositionTableConfig = {
    columns: [
        {
            label: 'Position Name',
            key: 'pos_name',
            className: 'border px-4 py-3 tracking-wider',
        },
        {
            label: 'Minimum Salary',
            key: 'basic_salary',
            className: 'border px-4 py-3',
        },
        {
            label: 'Salary Status',
            key: 'is_salary_fixed',
            className: 'border px-4 py-3',
        },
        { label: '', key: 'actions', isAction: true, className: 'border p-4' },

    ],
    actions: [
        {
            label: 'View',
            icon: 'Eye',
            className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer',
        },
        {
            label: 'Edit',
            icon: 'Pencil',
            className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer',
        },
        {
            label: 'Delete',
            icon: 'Trash2',
            className: 'bg-transparent hover:bg-transparent text-gray-600 hover:text-gray-900 cursor-pointer',
        },
    ],
};