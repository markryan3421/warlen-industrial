import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { BreadcrumbItem } from '@/types';
import { CreditCard, X, Bell, Eye, User, Calendar, DollarSign, FileText, Pencil, Trash2 } from 'lucide-react';
import PayrollProcessingCards from '@/components/payroll-processing-cards';
import { CustomTable } from '@/components/custom-table';
import { CustomPagination } from '@/components/custom-pagination';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/table-skeleton';

declare global {
    interface Window {
        Echo: any;
    }
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll',
        href: '/payroll',
    },
];

interface PayrollItem {
    id: number;
    payroll_id: number;
    code: string;
    type: 'earning' | 'deduction';
    amount: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface Payroll {
    id: number;
    payroll_period_id: number;
    employee_id: number;
    gross_pay: number;
    total_deduction: number;
    net_pay: number;
    payroll_items?: PayrollItem[];
    payroll_period?: {
        id: number;
        period_name: string;
        start_date: string;
        end_date: string;
        is_closed: boolean;
    };
    employee?: {
        id: number;
        emp_code: string;
        user: {
            name: string;
            email: string;
        };
        position: {
            pos_name: string;
            deleted_at: string;
        };
        pay_frequency: string;
    };
    created_at: string;
    updated_at: string;
}

interface PageProps {
    payrolls: Payroll[];
    pagination?: {
        links: any[];
        from: number;
        to: number;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters?: {
        search: string;
        perPage: string;
        date_from?: string;
        date_to?: string;
        frequency?: string;
        position?: string;
    };
    totalCount: number;
    filteredCount: number;
    totalOvertimePay: number;
    totalOvertimeHours: number;
    totalDeductions: number;
    totalNetPay: number;
    totalGrossPay: number;
    activeEmployee: number;
}

export default function Index({
    payrolls = [],
    pagination: serverPagination = {
        links: [],
        from: 0,
        to: 0,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    },
    filters: serverFilters = { search: '', perPage: '10' },
    totalCount = 0,
    filteredCount = 0,
    totalOvertimePay: initialOvertimePay = 0,
    totalOvertimeHours: initialOvertimeHours = 0,
    totalDeductions: initialDeductions = 0,
    totalNetPay: initialNetPay = 0,
    totalGrossPay: initialGrossPay = 0,
    activeEmployee: initialActiveEmployee = 0
}: PageProps) {
    const { delete: destroy } = useForm();
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(true);

    // Filter states - initialize from server filters
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        serverFilters?.date_from ? new Date(serverFilters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        serverFilters?.date_to ? new Date(serverFilters.date_to) : undefined
    );
    const [selectedFrequency, setSelectedFrequency] = useState<string>(serverFilters?.frequency || "all");
    const [selectedPosition, setSelectedPosition] = useState<string>(serverFilters?.position || "all");
    const [searchTerm, setSearchTerm] = useState<string>(serverFilters?.search || "");
    const [perPage, setPerPage] = useState<string>(serverFilters?.perPage || "10");

    // Debounce timer refs
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Set initial loading to false after data is loaded
    useEffect(() => {
        if (payrolls !== undefined) {
            const timer = setTimeout(() => {
                setIsTableLoading(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [payrolls]);

    // Handle loading state for table skeleton
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const onStart = () => {
            if (timeoutId) clearTimeout(timeoutId);
            setIsTableLoading(true);
        };

        const onFinish = () => {
            timeoutId = setTimeout(() => {
                setIsTableLoading(false);
            }, 200);
        };

        const removeStartListener = router.on('start', onStart);
        const removeFinishListener = router.on('finish', onFinish);

        return () => {
            removeStartListener();
            removeFinishListener();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    // Function to apply filters - sends request to server with all parameters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};

        // Only add parameters if they have values
        if (searchTerm && searchTerm.trim()) {
            params.search = searchTerm.trim();
        }

        if (dateFrom) {
            params.date_from = dateFrom.toISOString().split('T')[0];
        }
        if (dateTo) {
            params.date_to = dateTo.toISOString().split('T')[0];
        }

        if (selectedFrequency && selectedFrequency !== "all") {
            params.frequency = selectedFrequency;
        }

        if (selectedPosition && selectedPosition !== "all") {
            params.position = selectedPosition;
        }

        // Handle per page
        let perPageValue = perPage;
        if (perPageValue === 'all') {
            perPageValue = '10000';
        }
        if (perPageValue && perPageValue !== "10") {
            params.perPage = perPageValue;
        }

        console.log('Applying filters:', params);

        router.get('/payroll', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['payrolls', 'pagination', 'filters', 'totalCount', 'filteredCount',
                'totalOvertimePay', 'totalOvertimeHours', 'totalDeductions',
                'totalNetPay', 'totalGrossPay', 'activeEmployee'],
        });
    }, [searchTerm, dateFrom, dateTo, selectedFrequency, selectedPosition, perPage]);

    // Debounced search handler
    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value);

        if (searchTimer.current) {
            clearTimeout(searchTimer.current);
        }

        searchTimer.current = setTimeout(() => {
            applyFilters();
        }, 500);
    }, [applyFilters]);

    // Filter handlers - each triggers applyFilters immediately
    const handleDateFromChange = useCallback((date: Date | undefined) => {
        setDateFrom(date);
        applyFilters();
    }, [applyFilters]);

    const handleDateToChange = useCallback((date: Date | undefined) => {
        setDateTo(date);
        applyFilters();
    }, [applyFilters]);

    const handleFrequencyChange = useCallback((frequency: string) => {
        setSelectedFrequency(frequency);
        applyFilters();
    }, [applyFilters]);

    const handlePositionChange = useCallback((position: string) => {
        setSelectedPosition(position);
        applyFilters();
    }, [applyFilters]);

    // Handle per page change
    const handlePerPageChange = useCallback((value: string) => {
        setPerPage(value);
        applyFilters();
    }, [applyFilters]);

    // Handle page change
    const handlePageChange = useCallback((url: string | null) => {
        if (url) {
            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    }, []);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
            if (filterTimer.current) clearTimeout(filterTimer.current);
        };
    }, []);

    // Listen to payroll channel (Echo is already initialized globally)
    useEffect(() => {
        if (!window.Echo) return;

        const channel = window.Echo.private('payroll');

        channel.listen('.payroll.completed', (e: any) => {
            setNotification({
                message: e.message,
                timestamp: new Date(e.timestamp).toLocaleString()
            });
            setShowNotification(true);

            setTimeout(() => {
                setShowNotification(false);
            }, 5000);

            router.reload({ only: ['payrolls', 'pagination', 'totalOvertimePay', 'totalOvertimeHours', 'totalDeductions', 'totalNetPay', 'totalGrossPay', 'activeEmployee'] });
        });

        return () => {
            channel.stopListening('.payroll.completed');
        };
    }, []);

    // Check if any filter is applied
    const hasActiveFilters = useMemo(() => {
        return dateFrom !== undefined || dateTo !== undefined ||
            selectedFrequency !== "all" || selectedPosition !== "all" || searchTerm !== "";
    }, [dateFrom, dateTo, selectedFrequency, selectedPosition, searchTerm]);

    // Get unique values for filters from the current payrolls
    const uniqueFrequencies = useMemo(() => {
        if (!payrolls || payrolls.length === 0) return [];
        const freqs = payrolls
            .map(p => p.employee?.pay_frequency)
            .filter((freq): freq is string => freq !== undefined);
        return [...Array.from(new Set(freqs))];
    }, [payrolls]);

    const uniquePositions = useMemo(() => {
        if (!payrolls || payrolls.length === 0) return [];
        const positions = payrolls
            .map(p => p.employee?.position?.pos_name)
            .filter((pos): pos is string => pos !== undefined);
        return [...Array.from(new Set(positions))];
    }, [payrolls]);

    // Skeleton columns
    const skeletonColumns = [
        { label: 'EMPLOYEE', key: 'employee', className: '' },
        { label: 'PERIOD', key: 'period', className: '' },
        { label: 'POSITION', key: 'position', className: '' },
        { label: 'FREQUENCY', key: 'frequency', className: '' },
        { label: 'GROSS PAY', key: 'gross_pay', className: '' },
        { label: 'DEDUCTIONS', key: 'deductions', className: '' },
        { label: 'NET PAY', key: 'net_pay', className: '' },
        { label: 'ACTIONS', key: 'actions', className: '' },
    ];

    // Transform payrolls for CustomTable
    const payrollTableData = useMemo(() => {
        if (!payrolls || payrolls.length === 0) return [];
        return payrolls.map((payroll) => ({
            id: payroll.id,
            period_name: payroll.payroll_period?.period_name || 'N/A',
            period_start: payroll.payroll_period?.start_date || '',
            period_end: payroll.payroll_period?.end_date || '',
            emp_code: payroll.employee?.emp_code || 'N/A',
            employee_name: payroll.employee?.user.name || 'Unknown Employee',
            position_name: payroll.employee?.position?.pos_name || 'No Position',
            pay_frequency: payroll.employee?.pay_frequency || 'N/A',
            gross_pay: payroll.gross_pay || 0,
            total_deduction: payroll.total_deduction || 0,
            net_pay: payroll.net_pay || 0,
            _original: payroll,
        }));
    }, [payrolls]);

    // Handle refresh
    const handleRefresh = () => {
        setDateFrom(undefined);
        setDateTo(undefined);
        setSelectedFrequency("all");
        setSelectedPosition("all");
        setSearchTerm("");

        router.get('/payroll', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Format number
    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Handle view
    const handleViewPayroll = (row: any) => {
        if (row?._original) {
            setSelectedPayroll(row._original);
            setIsModalOpen(true);
        }
    };

    const handleEditPayroll = (row: any) => {
        console.log('Edit payroll:', row);
    };

    const handleDeletePayroll = (id: string | number) => {
        if (confirm("Are you sure you want to delete this payroll record?")) {
            destroy(`/payroll/${id}`, {
                onSuccess: () => {
                    toast.success('Payroll record deleted successfully');
                    applyFilters();
                },
                onError: () => {
                    toast.error('Failed to delete payroll record');
                }
            });
        }
    };

    // Columns
    const columns = [
        {
            label: 'EMPLOYEE',
            key: 'employee_name',
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{row.employee_name}</span>
                    <span className="text-xs text-gray-500">{row.emp_code}</span>
                </div>
            )
        },
        {
            label: 'PERIOD',
            key: 'period_name',
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500">
                        {row.period_start ? new Date(row.period_start).toLocaleDateString() : 'N/A'} - {row.period_end ? new Date(row.period_end).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            )
        },
        {
            label: 'POSITION',
            key: 'position_name',
            render: (row: any) => (
                <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{row.position_name}</span>
                </div>
            )
        },
        {
            label: 'FREQUENCY',
            key: 'pay_frequency',
            isBadge: true,
            render: (row: any) => (
                <span>{row.pay_frequency}</span>
            )
        },
        {
            label: 'GROSS PAY',
            key: 'gross_pay',
            render: (row: any) => (
                <span className="font-medium text-green-600">{formatCurrency(row.gross_pay)}</span>
            )
        },
        {
            label: 'DEDUCTIONS',
            key: 'total_deduction',
            render: (row: any) => (
                <span className="text-red-600">{formatCurrency(row.total_deduction)}</span>
            )
        },
        {
            label: 'NET PAY',
            key: 'net_pay',
            render: (row: any) => (
                <span className="font-bold text-blue-600">{formatCurrency(row.net_pay)}</span>
            )
        },
        {
            label: 'ACTIONS',
            key: 'actions',
            isAction: true,
        }
    ];

    const actions = [
        { label: 'View', icon: 'Eye', route: '', className: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Payroll Processing Cards with Filters */}
                <PayrollProcessingCards
                    payrolls={payrolls}
                    totalOvertimePay={initialOvertimePay}
                    totalOvertimeHours={initialOvertimeHours}
                    totalDeductions={initialDeductions}
                    totalNetPay={initialNetPay}
                    totalGrossPay={initialGrossPay}
                    activeEmployee={initialActiveEmployee}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    selectedFrequency={selectedFrequency}
                    selectedPosition={selectedPosition}
                    onDateFromChange={handleDateFromChange}
                    onDateToChange={handleDateToChange}
                    onFrequencyChange={handleFrequencyChange}
                    onPositionChange={handlePositionChange}
                    onRefresh={handleRefresh}
                    frequencyOptions={uniqueFrequencies}
                    positionOptions={uniquePositions}
                    totalFilteredPayrolls={filteredCount}
                    totalOriginalPayrolls={totalCount}
                />

                {/* Notification Toast */}
                {showNotification && notification && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
                        <Bell className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-xs text-green-600">{notification.timestamp}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowNotification(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Table Section */}
                {isTableLoading ? (
                    <div className='mx-4'>
                        <TableSkeleton
                            columns={skeletonColumns}
                            rows={parseInt(perPage)}
                            title="Payroll Records"
                        />
                    </div>
                ) : (
                    payrolls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <CreditCard className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No payroll records found</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                {totalCount > 0
                                    ? "No records match your current filters. Try adjusting your filter criteria."
                                    : "Import the Attendance and Payroll data to generate payroll records."
                                }
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={handleRefresh}>
                                    Clear All Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className='mx-4'>
                            <CustomTable
                                columns={columns}
                                actions={actions}
                                data={payrollTableData}
                                from={serverPagination?.from || 0}
                                title="Payroll Records"
                                onView={handleViewPayroll}
                                onEdit={handleEditPayroll}
                                onDelete={handleDeletePayroll}
                            />

                            {/* Pagination */}
                            <CustomPagination
                                pagination={serverPagination}
                                perPage={perPage}
                                onPerPageChange={handlePerPageChange}
                                onPageChange={handlePageChange}
                                totalCount={totalCount}
                                filteredCount={filteredCount}
                                search={searchTerm}
                                resourceName="payroll"
                            />
                        </div>
                    )
                )}
            </div>

            {/* Payroll Details Modal */}
            {selectedPayroll && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${isModalOpen ? 'visible' : 'invisible'}`}>
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Payroll Details</h2>
                            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Employee</label>
                                    <p className="font-semibold">{selectedPayroll.employee?.user.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Employee Code</label>
                                    <p>{selectedPayroll.employee?.emp_code}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Period</label>
                                    <p>{selectedPayroll.payroll_period?.period_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Pay Frequency</label>
                                    <p>{selectedPayroll.employee?.pay_frequency}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Gross Pay</label>
                                    <p className="text-green-600 font-semibold">{formatCurrency(selectedPayroll.gross_pay)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Total Deductions</label>
                                    <p className="text-red-600 font-semibold">{formatCurrency(selectedPayroll.total_deduction)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Net Pay</label>
                                    <p className="text-blue-600 font-bold text-lg">{formatCurrency(selectedPayroll.net_pay)}</p>
                                </div>
                            </div>

                            {selectedPayroll.payroll_items && selectedPayroll.payroll_items.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">Payroll Items</h3>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Code</th>
                                                    <th className="px-3 py-2 text-left">Description</th>
                                                    <th className="px-3 py-2 text-right">Type</th>
                                                    <th className="px-3 py-2 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPayroll.payroll_items.map((item, idx) => (
                                                    <tr key={idx} className="border-t">
                                                        <td className="px-3 py-2">{item.code}</td>
                                                        <td className="px-3 py-2">{item.description || '-'}</td>
                                                        <td className={`px-3 py-2 text-right ${item.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {item.type === 'earning' ? 'Earning' : 'Deduction'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}