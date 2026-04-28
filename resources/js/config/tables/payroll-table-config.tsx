import { Eye } from 'lucide-react';

export interface PayrollTableRow {
    id: number;
    employee_name: string;
    emp_code: string;
    branch_name: string;
    site_name: string;
    period_name: string;
    period_start: string;
    period_end: string;
    position_name: string;
    pay_frequency: string;
    gross_pay: number;
    total_deduction: number;
    net_pay: number;
    _original: any;
}

// Function to format date to short month (e.g., "Jan 15, 2024")
const formatDateToShortMonth = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return 'N/A';
    }
};

// Function to format date to just month and year (e.g., "Jan 2024")
const formatDateToMonthYear = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return 'N/A';
    }
};

// Function to format date range with short months
const formatDateRange = (startDate: string, endDate: string): string => {
    const start = formatDateToShortMonth(startDate);
    const end = formatDateToShortMonth(endDate);
    return `${start} - ${end}`;
};

// Function to format date range with compact view (just months)
const formatDateRangeCompact = (startDate: string, endDate: string): string => {
    if (!startDate || !endDate) return 'N/A';
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

        const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();

        if (startYear === endYear && startMonth === endMonth) {
            return `${startMonth} ${startYear}`;
        } else if (startYear === endYear) {
            return `${startMonth} - ${endMonth} ${startYear}`;
        } else {
            return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
        }
    } catch (error) {
        return 'N/A';
    }
};

export const getPayrollTableColumns = (formatCurrency: (amount: number) => string) => [
    {
        label: 'Profile',
        key: 'avatar',
        className: 'p-4 align-items-center',
        // Use a custom render instead of isImage to control the URL
        render: (row: any) => {
            if (!row.avatar) {
                // Fallback placeholder
                return (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                );
            }
            // If avatar is already a full URL, use it; otherwise prepend storage path
            const avatarUrl = row.avatar.startsWith('http')
                ? row.avatar
                : `/storage/${row.avatar}`;
            return (
                <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
            );
        }
    },
    {
        label: 'EMPLOYEE',
        key: 'employee_name',
        render: (row: PayrollTableRow) => (
            <div className="flex flex-col">
                <span className="font-medium text-sm">{row.employee_name}</span>
                <span className="text-xs text-gray-500">{row.emp_code}</span>
            </div>
        ),
    },
    {
        label: 'BRANCH',
        key: 'branch_name',
        render: (row: PayrollTableRow) => (
            <div className="flex items-center gap-1">
                <span className="text-sm">{row.branch_name || 'N/A'}</span>
            </div>
        ),
    },
    {
        label: 'SITE',
        key: 'site_name',
        render: (row: PayrollTableRow) => (
            <div className="flex items-center gap-1">
                <span className="text-sm">{row.site_name || 'N/A'}</span>
            </div>
        ),
    },
    {
        label: 'POSITION',
        key: 'position_name',
        render: (row: PayrollTableRow) => (
            <div className="flex items-center gap-1">
                <span className="text-sm">{row.position_name}</span>
            </div>
        ),
    },
    {
        label: 'FREQUENCY',
        key: 'pay_frequency',
        render: (row: PayrollTableRow) => <span>{row.pay_frequency}</span>,
    },
    {
        label: 'GROSS PAY',
        key: 'gross_pay',
        render: (row: PayrollTableRow) => (
            <span className="font-medium text-green-600">{formatCurrency(row.gross_pay)}</span>
        ),
    },
    {
        label: 'DEDUCTIONS',
        key: 'total_deduction',
        render: (row: PayrollTableRow) => (
            <span className="text-red-600">{formatCurrency(row.total_deduction)}</span>
        ),
    },
    {
        label: 'NET PAY',
        key: 'net_pay',
        render: (row: PayrollTableRow) => (
            <span className="font-bold text-blue-600">{formatCurrency(row.net_pay)}</span>
        ),
    },
    {
        label: 'ACTIONS',
        key: 'actions',
        isAction: true,
    },
];

export const getPayrollTableActions = (handleViewPayroll: (row: PayrollTableRow) => void) => [
    {
        label: 'View',
        icon: 'Eye',
        onClick: (row: PayrollTableRow) => handleViewPayroll(row),
    },
];

export const getSkeletonColumns = () => [
    'EMPLOYEE',
    'BRANCH',
    'SITE',
    'PERIOD',
    'POSITION',
    'FREQUENCY',
    'GROSS PAY',
    'DEDUCTIONS',
    'NET PAY',
    'ACTIONS',
].map(label => ({
    label,
    key: label.toLowerCase().replace(/\s+/g, '_'),
    className: ''
}));