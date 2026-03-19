import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import HrLayout from '@/layouts/hr-layout';
import { useState, useEffect, useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import { CreditCard, Eye, X, Bell } from 'lucide-react';
import Echo from 'laravel-echo';

// IMPORTANT: For Reverb, we need to import Pusher with a different name
// Reverb uses the Pusher protocol but connects to your Reverb server
import Pusher from 'pusher-js';
import PayrollProcessingCards from '@/components/payroll-processing-cards';

// Declare global window interface for Echo
declare global {
    interface Window {
        Pusher: any;
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
    totalOvertimePay: number;
    totalOvertimeHours: number;
    totalDeductions: number;
    totalNetPay: number;
    totalGrossPay: number;
    activeEmployee: number; 
}

export default function Index({ 
    payrolls, 
    totalOvertimePay: initialOvertimePay, 
    totalOvertimeHours: initialOvertimeHours,
    totalDeductions: initialDeductions,
    totalNetPay: initialNetPay,
    totalGrossPay: initialGrossPay,
    activeEmployee: initialActiveEmployee
}: PageProps) {
    const { delete: destroy } = useForm();
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{message: string, timestamp: string} | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [echoInitialized, setEchoInitialized] = useState(false);

    // Filter states - initialize with undefined (no default dates)
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
    const [selectedFrequency, setSelectedFrequency] = useState<string>("all");
    const [selectedPosition, setSelectedPosition] = useState<string>("all");

    // Initialize Echo with Reverb configuration
    useEffect(() => {
        // Set Pusher on window (required for Echo)
        window.Pusher = Pusher;

        // Get Reverb configuration from environment variables
        const key = import.meta.env.VITE_REVERB_APP_KEY;
        const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
        const port = import.meta.env.VITE_REVERB_PORT || '8080';
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
        
        console.log('Reverb Config:', { key, host, port, scheme });

        if (!key) {
            console.error('VITE_REVERB_APP_KEY is not defined in your .env file');
            return;
        }

        // Initialize Echo with Reverb configuration
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: key,
            wsHost: host,
            wsPort: port,
            wssPort: port,
            forceTLS: scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            authEndpoint: '/broadcasting/auth',
            auth: {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
            },
        });

        setEchoInitialized(true);

        // Cleanup on unmount
        return () => {
            if (window.Echo) {
                window.Echo.leave('payroll');
            }
        };
    }, []);

    // Listen to payroll channel after Echo is initialized
    useEffect(() => {
        if (!echoInitialized || !window.Echo) return;

        console.log('Listening to payroll channel...');

        // Listen to payroll channel for completion events
        const channel = window.Echo.private('payroll');
        
        channel.listen('.payroll.completed', (e: any) => {
            console.log('Payroll period completed:', e);
            
            // Show notification
            setNotification({
                message: e.message,
                timestamp: new Date(e.timestamp).toLocaleString()
            });
            setShowNotification(true);
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
                setShowNotification(false);
            }, 5000);
            
            // Refresh the payroll list using Inertia
            router.reload({ only: ['payrolls', 'totalOvertimePay', 'totalOvertimeHours', 'totalDeductions', 'totalNetPay', 'totalGrossPay'] });
        });

        // Optional: Listen for connection events
        channel.subscribed(() => {
            console.log('Successfully subscribed to payroll channel');
        });

        channel.error((error: any) => {
            console.error('Channel error:', error);
        });

        // Cleanup
        return () => {
            channel.stopListening('.payroll.completed');
        };
    }, [echoInitialized]);

    // Function to check if any filter is applied
    const hasActiveFilters = useMemo(() => {
        return dateFrom !== undefined || dateTo !== undefined || 
               selectedFrequency !== "all" || selectedPosition !== "all";
    }, [dateFrom, dateTo, selectedFrequency, selectedPosition]);

    // Function to filter payrolls based on selected filters
    const getFilteredPayrolls = useMemo(() => {
        // If no filters are applied, return all payrolls
        if (!hasActiveFilters) {
            return payrolls;
        }

        return payrolls.filter(payroll => {
            // Date filter - only apply if both dates are selected
            if (dateFrom && dateTo && payroll.payroll_period) {
                const periodStart = new Date(payroll.payroll_period.start_date);
                const periodEnd = new Date(payroll.payroll_period.end_date);
                const filterStart = new Date(dateFrom);
                const filterEnd = new Date(dateTo);
                
                // Set time to start/end of day for accurate comparison
                filterStart.setHours(0, 0, 0, 0);
                filterEnd.setHours(23, 59, 59, 999);
                
                // Check if period overlaps with selected date range
                if (periodEnd < filterStart || periodStart > filterEnd) {
                    return false;
                }
            }

            // Frequency filter
            if (selectedFrequency !== "all" && payroll.employee?.pay_frequency !== selectedFrequency) {
                return false;
            }

            // Position filter
            if (selectedPosition !== "all" && payroll.employee?.position?.pos_name !== selectedPosition) {
                return false;
            }

            return true;
        });
    }, [payrolls, dateFrom, dateTo, selectedFrequency, selectedPosition, hasActiveFilters]);

    // Get filtered payrolls
    const filteredPayrolls = getFilteredPayrolls;

    // Calculate totals based on filtered payrolls
    const filteredTotals = useMemo(() => {
        // If no filters are applied, use the initial values from props
        if (!hasActiveFilters) {
            return {
                totalOvertimePay: initialOvertimePay,
                totalOvertimeHours: initialOvertimeHours,
                totalDeductions: initialDeductions,
                totalNetPay: initialNetPay,
                activeEmployee: initialActiveEmployee
            };
        }

        // Debug logs to help identify the issue
        console.log('Filtered Payrolls Count:', filteredPayrolls.length);
        console.log('Sample Payroll Structure:', filteredPayrolls[0]);

        // Calculate from filtered payrolls
        const totals = filteredPayrolls.reduce((acc, payroll) => {
            // Calculate overtime pay from payroll items
            let overtimePay = 0;
            let overtimeHours = 0;
            
            // Check if payroll_items exists and has items
            if (payroll.payroll_items && payroll.payroll_items.length > 0) {
                console.log(`Payroll ID ${payroll.id} - Payroll Items:`, payroll.payroll_items);

                // Define overtime codes to look for
                const overtimeKeywords = [
                    'OT', 'OTS', 'OVERTIME', 'OT PAY', 'REG OT', 
                    'OTHR', 'OT HRS', 'OVERTIME PAY', 'OT_WORK',
                    'overtime', 'ot', 'ots'
                ];

                // Filter for overtime items
                const overtimeItems = payroll.payroll_items.filter(item => {
                    // Check if it's an earning type
                    if (item.type !== 'earning') return false;
                    
                    const code = (item.code || '').toUpperCase().trim();
                    const description = (item.description || '').toUpperCase().trim();
                    
                    // Check against keywords
                    const isOvertime = overtimeKeywords.some(keyword => 
                        code.includes(keyword) || 
                        description.includes(keyword) ||
                        code === keyword ||
                        description === keyword
                    );

                    if (isOvertime) {
                        console.log(`Found overtime item:`, { code, description, amount: item.amount });
                    }

                    return isOvertime;
                });

                // Sum up overtime pay
                overtimePay = overtimeItems.reduce((sum, item) => {
                    const amount = Number(item.amount) || 0;
                    return sum + amount;
                }, 0);

                // Try to extract hours from description if available
                overtimeItems.forEach(item => {
                    if (item.description) {
                        // Look for patterns like "2 hours", "2.5 hrs", etc.
                        const hoursMatch = item.description.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)/i);
                        if (hoursMatch) {
                            overtimeHours += parseFloat(hoursMatch[1]) || 0;
                        }
                    }
                });
            } else {
                console.log(`Payroll ID ${payroll.id} - No payroll items found`);
                
                // Alternative: If overtime is not in items, maybe it's part of gross_pay?
                // You might need to implement a different logic here based on your data structure
            }

            // Ensure all values are numbers
            const deduction = Number(payroll.total_deduction) || 0;
            const netPay = Number(payroll.net_pay) || 0;

            console.log(`Payroll ID ${payroll.id} - Calculated:`, {
                overtimePay,
                overtimeHours,
                deduction,
                netPay
            });

            return {
                totalOvertimePay: acc.totalOvertimePay + overtimePay,
                totalOvertimeHours: acc.totalOvertimeHours + overtimeHours,
                totalDeductions: acc.totalDeductions + deduction,
                totalNetPay: acc.totalNetPay + netPay,
                activeEmployee: acc.activeEmployee + 1
            };
        }, {
            totalOvertimePay: 0,
            totalOvertimeHours: 0,
            totalDeductions: 0,
            totalNetPay: 0,
            activeEmployee: 0
        });

        console.log('Final Filtered Totals:', totals);
        return totals;
    }, [filteredPayrolls, hasActiveFilters, initialOvertimePay, initialOvertimeHours, initialDeductions, initialNetPay, initialActiveEmployee]);

    // Handle refresh button click - clear all filters
    const handleRefresh = () => {
        // Clear all filters
        setDateFrom(undefined);
        setDateTo(undefined);
        setSelectedFrequency("all");
        setSelectedPosition("all");
        
        // Reload data from server
        router.reload({ only: ['payrolls', 'totalOvertimePay', 'totalOvertimeHours', 'totalDeductions', 'totalNetPay', 'totalGrossPay', 'activeEmployee'] });
    };

    // Function to check if employee position is valid
    const hasValidPosition = (payroll: Payroll) => {
        return payroll.employee?.position && !payroll.employee.position.deleted_at;
    };

    // Function to format currency to Philippine Peso
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Function to format number with commas (without currency symbol)
    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format period range from payroll_period if available
    const formatPeriodRange = (payroll: Payroll) => {
        if (payroll.payroll_period) {
            return `${formatDate(payroll.payroll_period.start_date)} - ${formatDate(payroll.payroll_period.end_date)}`;
        }
        return 'N/A';
    };

    const handleViewItems = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPayroll(null);
    };

    // Get unique values for filters
    const uniqueFrequencies = useMemo(() => 
        Array.from(new Set(payrolls.map(p => p.employee?.pay_frequency).filter(Boolean))), 
        [payrolls]
    );
    
    const uniquePositions = useMemo(() => 
        Array.from(new Set(payrolls.map(p => p.employee?.position?.pos_name).filter(Boolean))), 
        [payrolls]
    );
    
    return (
        <HrLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="flex flex-1 flex-col gap-2 p-4">
                <PayrollProcessingCards 
                    payrolls={payrolls}
                    totalOvertimePay={filteredTotals.totalOvertimePay}
                    totalOvertimeHours={filteredTotals.totalOvertimeHours}
                    totalDeductions={filteredTotals.totalDeductions}
                    totalNetPay={filteredTotals.totalNetPay}
                    activeEmployee={filteredTotals.activeEmployee}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    
                    // Filter props
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    selectedFrequency={selectedFrequency}
                    selectedPosition={selectedPosition}
                    onDateFromChange={setDateFrom}
                    onDateToChange={setDateTo}
                    onFrequencyChange={setSelectedFrequency}
                    onPositionChange={setSelectedPosition}
                    onRefresh={handleRefresh}
                    
                    // Options for dropdowns
                    frequencyOptions={uniqueFrequencies}
                    positionOptions={uniquePositions}
                    
                    // New props for filtered counts
                    totalFilteredPayrolls={filteredPayrolls.length}
                    totalOriginalPayrolls={payrolls.length}
                />
                
                {/* Notification Toast */}
                {showNotification && notification && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
                        <Bell className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-xs text-green-600">{notification.timestamp}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-4" 
                            onClick={() => setShowNotification(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">
                        Payroll 
                        {hasActiveFilters && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                (Showing {filteredPayrolls.length} of {payrolls.length} records)
                            </span>
                        )}
                    </h1>
                </div>

                <div className="py-4">
                    {filteredPayrolls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <CreditCard className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No payroll records found</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                {payrolls.length > 0 
                                    ? "No records match your current filters. Try adjusting your filter criteria."
                                    : "Get started by generating your first payroll."
                                }
                            </p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={handleRefresh}>
                                    Clear All Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Employee Code</TableHead>
                                    <TableHead>Employee Name</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Gross Pay</TableHead>
                                    <TableHead>Total Deduction</TableHead>
                                    <TableHead>Net Pay</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayrolls.map((payroll) => {
                                    return (
                                        <TableRow key={payroll.id}>
                                            <TableCell>
                                                {payroll.payroll_period ? (
                                                    <div>
                                                        <div className="font-medium">{payroll.payroll_period.period_name}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {formatPeriodRange(payroll)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No period</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{payroll.employee?.emp_code || 'N/A'}</TableCell>
                                            <TableCell>{payroll.employee?.user.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                {hasValidPosition(payroll) ? 
                                                    payroll.employee?.position.pos_name : 
                                                    <span className="text-gray-400 italic">Not assigned</span>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(payroll.gross_pay)}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                -{formatCurrency(payroll.total_deduction)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold text-green-600">
                                                {formatCurrency(payroll.net_pay)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleViewItems(payroll)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View Items
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            {/* Payroll Items Modal */}
            {isModalOpen && selectedPayroll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50" 
                        onClick={closeModal}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                            <div>
                                <h2 className="text-xl font-semibold">Payroll Items</h2>
                                <p className="text-sm text-gray-500">
                                    {selectedPayroll.employee?.user.name} - {selectedPayroll.payroll_period?.period_name}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={closeModal}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-6">
                                {/* Earnings Section */}
                                {selectedPayroll.payroll_items?.some(item => item.type === 'earning') && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-3 text-green-600">Earnings</h3>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="space-y-2">
                                                {selectedPayroll.payroll_items
                                                    ?.filter(item => item.type === 'earning')
                                                    .map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                                            <div>
                                                                <span className="font-medium">{item.code}</span>
                                                                {item.description && (
                                                                    <p className="text-xs text-gray-500">{item.description}</p>
                                                                )}
                                                            </div>
                                                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="mt-4 pt-3 border-t flex justify-between items-center font-semibold">
                                                <span>Total Earnings</span>
                                                <span className="text-green-600">{formatCurrency(selectedPayroll.gross_pay)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Deductions Section */}
                                {selectedPayroll.payroll_items?.some(item => item.type === 'deduction') && (
                                    <div>
                                        <h3 className="text-lg font-medium mb-3 text-red-600">Deductions</h3>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="space-y-2">
                                                {selectedPayroll.payroll_items
                                                    ?.filter(item => item.type === 'deduction')
                                                    .map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                                            <div>
                                                                <span className="font-medium">{item.code}</span>
                                                                {item.description && (
                                                                    <p className="text-xs text-gray-500">{item.description}</p>
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="mt-4 pt-3 border-t flex justify-between items-center font-semibold">
                                                <span>Total Deductions</span>
                                                <span className="text-red-600">-{formatCurrency(selectedPayroll.total_deduction)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Net Pay Summary */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-lg font-semibold">Net Pay</span>
                                            <p className="text-xs text-gray-600">Take home pay</p>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(selectedPayroll.net_pay)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 sticky bottom-0">
                            <Button variant="outline" onClick={closeModal}>
                                Close
                            </Button>
                            <Button>
                                Download Payslip
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </HrLayout>
    );
}