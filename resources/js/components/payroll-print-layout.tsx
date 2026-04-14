import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, User, Calendar, Minus, Coins } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PayrollPrintLayoutProps {
    isOpen: boolean;
    onClose: () => void;
    payrollId?: number | null;
}

interface PayrollData {
    id: number;
    employee_name: string;
    employee_code: string;
    position: string;
    payroll_period: string;
    start_date: string;
    end_date: string;
    pay_date: string;
    gross_pay: number;
    total_deduction: number;
    net_pay: number;
    earnings?: Array<{ description: string; amount: number }>;
    deductions?: Array<{ description: string; amount: number }>;
    // Allow nested employee object
    employee?: {
        avatar?: string;
        name?: string;
        emp_code?: string;
        position?: { pos_name?: string };
    };
    // Direct avatar fields
    avatar?: string;
    employee_avatar?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export default function PayrollPrintLayout({ isOpen, onClose, payrollId }: PayrollPrintLayoutProps) {
    const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && payrollId) {
            fetchPayrollData();
        }
    }, [isOpen, payrollId]);

    const fetchPayrollData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/payrolls/${payrollId}/print-data`);
            const data = await response.json();
            console.log('Full payroll response:', JSON.stringify(data, null, 2));

            // Try to extract avatar from various possible locations
            let avatarUrl = null;
            if (data.avatar) avatarUrl = data.avatar;
            else if (data.employee_avatar) avatarUrl = data.employee_avatar;
            else if (data.employee?.avatar) avatarUrl = data.employee.avatar;

            console.log('Extracted avatar URL:', avatarUrl);

            setPayrollData(data);
        } catch (err) {
            console.error('Failed to fetch payroll data:', err);
            setError('Failed to load payroll data');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    if (isLoading) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading payroll data...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (error || !payrollData) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <div className="text-center py-12">
                        <p className="text-red-600">{error || 'No payroll data available'}</p>
                        <Button variant="outline" onClick={onClose} className="mt-4">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Get avatar URL from the most likely places
    const avatarUrl = payrollData.avatar || payrollData.employee_avatar || payrollData.employee?.avatar;
    const fullAvatarUrl = avatarUrl
        ? (avatarUrl.startsWith('/storage/') || avatarUrl.startsWith('http'))
            ? avatarUrl
            : `/storage/${avatarUrl}`
        : null;

    // Use employee name from either root or nested employee object
    const employeeName = payrollData.employee_name || payrollData.employee?.name || 'N/A';
    const employeeCode = payrollData.employee_code || payrollData.employee?.emp_code || 'N/A';
    const position = payrollData.position || payrollData.employee?.position?.pos_name || 'N/A';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&_.absolute.right-4.top-4]:hidden ">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-2xl font-bold">
                            <span className="px-2 py-1 border rounded-xl text-[15px]">Payroll Slip</span>
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => window.print()} className='cursor-pointer'>
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={onClose} className='cursor-pointer'>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="border-1 rounded-lg bg-gray-50" id="print-area">
                    <div className="mb-6 p-4">
                        {/* Personal Info & Payroll Period */}
                        <div className="flex items-start gap-6">
                            <div className="flex-shrink-0">
                                {fullAvatarUrl ? (
                                    <img
                                        src={fullAvatarUrl}
                                        alt={employeeName}
                                        className="w-18 h-18 rounded-full object-cover border-2 border-gray-300"
                                        onError={(e) => {
                                            console.error('Avatar load error:', fullAvatarUrl);
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling;
                                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`w-18 h-18 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-2 border-gray-300 ${fullAvatarUrl ? 'hidden' : ''}`}>
                                    <User className="h-12 w-12 text-blue-500" />
                                </div>
                            </div>

                            <div className="flex-1 gap-4">
                                <div>
                                    <p className="font-semibold text-lg">{employeeName}</p>
                                    <p className="text-gray-500 text-sm">EMP-{employeeCode}</p>
                                    <p className="text-gray-500 text-sm">{position}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payroll Period */}
                        <div className='w-full text-left mt-3'>
                            <p className="px-2 py-1 bg-white rounded-lg flex items-center font-bold border-1 border-gray-300">
                                <Calendar className='h-4 w-4 mr-2 text-blue-800' />
                                {formatDate(payrollData.start_date)} - {formatDate(payrollData.end_date)}
                            </p>
                        </div>
                    </div>

                    <div className="border-1 rounded-lg px-4 -mt-5 bg-white">
                        {/* Earnings Header */}
                        <div className='border-b-2 pb-5'>
                            <div className="flex items-center gap-2 py-4">
                                <div className="p-1.5 rounded-lg bg-green-100">
                                    <Coins className="h-4 w-4 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-md text-gray-700">EARNINGS</h3>
                            </div>

                            {/* Earnings List */}
                            <div className="space-y-2">
                                {payrollData.earnings && payrollData.earnings.length > 0 ? (
                                    payrollData.earnings.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center last:border-0">
                                            <span className="text-sm text-gray-700">{item.description}</span>
                                            <span className="text-sm font-medium text-green-600">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">No earnings recorded</div>
                                )}
                            </div>
                        </div>

                        {/* Deductions Header */}
                        <div className='border-b-2 pb-5'>
                            <div className="flex items-center gap-2 py-4">
                                <div className="p-1.5 rounded-lg bg-red-100">
                                    <Minus className="h-4 w-4 text-red-600" />
                                </div>
                                <h3 className="font-semibold text-md text-gray-700">DEDUCTIONS</h3>
                            </div>

                            {/* Deductions List */}
                            <div className="space-y-2">
                                {payrollData.deductions && payrollData.deductions.length > 0 ? (
                                    payrollData.deductions.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center last:border-0">
                                            <span className="text-sm text-gray-700">{item.description}</span>
                                            <span className="text-sm font-medium text-red-600">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">No deductions recorded</div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="mt-6 rounded-lg">
                            <h3 className="font-semibold mb-2">Summary</h3>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Gross Pay:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(payrollData.gross_pay)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Deductions:</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(payrollData.total_deduction)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span>Net Pay:</span>
                                    <span className="font-semibold text-blue-600 text-lg">{formatCurrency(payrollData.net_pay)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}