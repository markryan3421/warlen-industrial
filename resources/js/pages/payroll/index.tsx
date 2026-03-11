import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useState, useEffect } from 'react';
import type { BreadcrumbItem } from '@/types';
import { CreditCard, Eye, X, Bell } from 'lucide-react';
import Echo from 'laravel-echo';

// IMPORTANT: For Reverb, we need to import Pusher with a different name
// Reverb uses the Pusher protocol but connects to your Reverb server
import Pusher from 'pusher-js';

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
}

export default function Index({ payrolls }: PageProps) {
    const { delete: destroy } = useForm();
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notification, setNotification] = useState<{message: string, timestamp: string} | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [echoInitialized, setEchoInitialized] = useState(false);

    // Initialize Echo with Reverb configuration
    useEffect(() => {
        // Set Pusher on window (required for Echo)
        window.Pusher = Pusher;

        // Get Reverb configuration from environment variables
        const key = import.meta.env.VITE_REVERB_APP_KEY;
        const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
        const port = import.meta.env.VITE_REVERB_PORT || '8080';
        const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
        
        console.log('Reverb Config:', { key, host, port, scheme }); // Debug log

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

        console.log('Listening to payroll channel...'); // Debug log

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
            router.reload({ only: ['payrolls'] });
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
    
    // const handleDelete = (id: number) => {
    //     if (confirm("Are you sure you want to delete this payroll record?")) {
    //         destroy(PayrollController.destroy(id).url);
    //     }
    // };

    const handleViewItems = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedPayroll(null);
    };
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll" />
            <div className="flex flex-1 flex-col gap-2 p-4">
                
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
                    <h1 className="text-2xl font-bold">Payroll</h1>
                    <Link href="/payroll/create">
                        <Button size="sm">+ Generate Payroll</Button>
                    </Link>
                </div>

                <div className="py-4">
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
                                {payrolls.map((payroll) => {
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
                                                    {/* <Link href={PayrollController.edit(payroll.id)}>
                                                        <Button variant="outline" size="sm">Edit</Button>
                                                    </Link> */}
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

            {/* Payroll Items Modal - Same as before */}
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
        </AppLayout>
    );
}