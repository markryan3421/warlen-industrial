import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import type { BreadcrumbItem } from '@/types';
import { CreditCard, X, Bell } from 'lucide-react';
import Echo from 'laravel-echo';
import PayrollProcessingCards from '@/components/payroll-processing-cards';
import Pusher from 'pusher-js';
import EmployeePayrollTable from '@/components/employee-payroll-table'; // Import the new component

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

// Transform payroll data to match EmployeePayroll format
const transformToEmployeePayroll = (payrolls: Payroll[]) => {
    return payrolls.map((payroll, index) => ({
        empID: payroll.employee?.emp_code || `EMP-${String(index + 1).padStart(3, '0')}`,
        empName: payroll.employee?.user.name || 'Unknown Employee',
        empRole: payroll.employee?.position?.pos_name || 'No Position',
        empType: 'Full-Time', // You might want to get this from your data
        regPay: payroll.gross_pay || 0,
        otPay: 0, // Calculate from payroll_items if needed
        holidayPay: 0, // Calculate from payroll_items if needed
        incentives: 0, // Calculate from payroll_items if needed
        loans: payroll.total_deduction || 0,
        netPay: payroll.net_pay || 0,
        status: 'Active' // Determine from your data
    }));
};

export default function Index({
    payrolls,
    totalOvertimePay,
    totalOvertimeHours,
    totalDeductions,
    totalNetPay,
    totalGrossPay,
    activeEmployee
}: PageProps) {
    const { delete: destroy } = useForm();
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [echoInitialized, setEchoInitialized] = useState(false);

    // Transform payrolls for the employee table
    const employeePayrollData = transformToEmployeePayroll(payrolls);

    // Initialize Echo with Reverb configuration
    useEffect(() => {
        window.Pusher = Pusher;

        const key = import.meta.env.VITE_REVERB_APP_KEY;
        const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
        const port = import.meta.env.VITE_REVERB_PORT || '8080';
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

        if (!key) {
            console.error('VITE_REVERB_APP_KEY is not defined in your .env file');
            return;
        }

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

        return () => {
            if (window.Echo) {
                window.Echo.leave('payroll');
            }
        };
    }, []);

    // Listen to payroll channel after Echo is initialized
    useEffect(() => {
        if (!echoInitialized || !window.Echo) return;

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

            router.reload({ only: ['payrolls', 'totalOvertimePay', 'totalOvertimeHours', 'totalDeductions', 'totalNetPay', 'totalGrossPay'] });
        });

        return () => {
            channel.stopListening('.payroll.completed');
        };
    }, [echoInitialized]);

    // Format functions
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Handlers for employee table actions
    const handleViewEmployee = (employee: any) => {
        console.log('View employee:', employee);
        // Implement view logic
    };

    const handleEditEmployee = (employee: any) => {
        console.log('Edit employee:', employee);
        // Implement edit logic
    };

    const handleDeleteEmployee = (employee: any) => {
        if (confirm(`Are you sure you want to delete ${employee.empName}'s record?`)) {
            console.log('Delete employee:', employee);
            // Implement delete logic
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="flex flex-1 flex-col gap-2 p-4">
                <PayrollProcessingCards
                    payrolls={payrolls}
                    totalOvertimePay={totalOvertimePay}
                    totalOvertimeHours={totalOvertimeHours}
                    totalDeductions={totalDeductions}
                    totalNetPay={totalNetPay}
                    totalGrossPay={totalGrossPay}
                    activeEmployee={activeEmployee}
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                />

                {/* Notification Toast */}
                {showNotification && notification && (
                    <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
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

                <div className="flex justify-between items-center px-8">
                    <h1 className="text-2xl font-bold">Payroll</h1>
                    <Link href="/payroll/create">
                        <Button size="sm">+ Generate Payroll</Button>
                    </Link>
                </div>

                <div className="py-4 px-8">
                    {payrolls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="rounded-full bg-gray-100 p-6 mb-4">
                                <CreditCard className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No payroll records yet</h3>
                            <p className="text-gray-500 mb-6 max-w-sm">
                                Get started by generating your first payroll.
                            </p>
                            <Link href="/payroll/create">
                                <Button>Generate Your First Payroll</Button>
                            </Link>
                        </div>
                    ) : (
                        <EmployeePayrollTable 
                            data={payrolls}
                            onView={handleViewEmployee}
                            onEdit={handleEditEmployee}
                            onDelete={handleDeleteEmployee}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}