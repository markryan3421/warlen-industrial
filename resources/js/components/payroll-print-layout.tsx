import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, User, Calendar, Minus, HandCoins, Coins, Landmark } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

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
    employee?: {
        avatar?: string;
        name?: string;
        emp_code?: string;
        position?: { pos_name?: string };
    };
    avatar?: string;
    employee_avatar?: string;
}

const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return '₱0.00';
    }
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

// Helper function to categorize deductions
const categorizeDeductions = (deductions: Array<{ description: string; amount: number }>) => {
    const contributionKeywords = ['sss', 'philhealth', 'pag-ibig', 'pagibig', 'contribution', 'gsis', 'tax', 'withholding', 'provident', 'health', 'pension'];
    const contributions: Array<{ description: string; amount: number }> = [];
    const otherDeductions: Array<{ description: string; amount: number }> = [];

    if (!deductions || deductions.length === 0) {
        return { contributions: [], otherDeductions: [] };
    }

    deductions.forEach(deduction => {
        const lowerDesc = (deduction.description || '').toLowerCase();
        const isContribution = contributionKeywords.some(keyword => lowerDesc.includes(keyword));

        if (isContribution) {
            contributions.push(deduction);
        } else {
            otherDeductions.push(deduction);
        }
    });

    return { contributions, otherDeductions };
};

// Helper function to categorize earnings
const categorizeEarnings = (earnings: Array<{ description: string; amount: number }>) => {
    const incentiveKeywords = ['incentive', 'bonus', 'reward', 'extra', 'commission', 'allowance', 'gift', 'prize'];
    const incentives: Array<{ description: string; amount: number }> = [];
    const otherEarnings: Array<{ description: string; amount: number }> = [];

    if (!earnings || earnings.length === 0) {
        return { incentives: [], otherEarnings: [] };
    }

    earnings.forEach(earning => {
        const lowerDesc = (earning.description || '').toLowerCase();
        const isIncentive = incentiveKeywords.some(keyword => lowerDesc.includes(keyword));

        if (isIncentive) {
            incentives.push(earning);
        } else {
            otherEarnings.push(earning);
        }
    });

    return { incentives, otherEarnings };
};

export default function PayrollPrintLayout({ isOpen, onClose, payrollId }: PayrollPrintLayoutProps) {
    const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const printAreaRef = useRef<HTMLDivElement>(null);

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
            setPayrollData(data);
        } catch (err) {
            console.error('Failed to fetch payroll data:', err);
            setError('Failed to load payroll data');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!printAreaRef.current) return;

        const printContent = printAreaRef.current.cloneNode(true) as HTMLElement;
        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            alert('Please allow pop-ups to print');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payroll Slip - ${payrollData?.employee_name || 'Employee'}</title>
                <meta charset="utf-8">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.5;
                        color: #1f2937;
                        background: white;
                        padding: 20px;
                    }
                    .print-container {
                        max-width: 900px;
                        margin: 0 auto;
                        background: white;
                    }
                    .border { border: 1px solid #e5e7eb; }
                    .border-t { border-top: 1px solid #e5e7eb; }
                    .border-b { border-bottom: 1px solid #e5e7eb; }
                    .rounded-lg { border-radius: 0.5rem; }
                    .rounded-full { border-radius: 9999px; }
                    .bg-gray-50 { background-color: #f9fafb; }
                    .bg-white { background-color: white; }
                    .bg-green-100 { background-color: #dcfce7; }
                    .bg-red-100 { background-color: #fee2e2; }
                    .bg-amber-100 { background-color: #fef3c7; }
                    .bg-purple-100 { background-color: #f3e8ff; }
                    .text-green-600 { color: #16a34a; }
                    .text-red-600 { color: #dc2626; }
                    .text-amber-600 { color: #d97706; }
                    .text-purple-600 { color: #9333ea; }
                    .text-gray-500 { color: #6b7280; }
                    .text-gray-600 { color: #4b5563; }
                    .text-gray-700 { color: #374151; }
                    .text-gray-800 { color: #1f2937; }
                    .text-blue-600 { color: #2563eb; }
                    .text-blue-800 { color: #1e40af; }
                    .font-semibold { font-weight: 600; }
                    .font-bold { font-weight: 700; }
                    .text-xs { font-size: 0.75rem; }
                    .text-sm { font-size: 0.875rem; }
                    .text-base { font-size: 1rem; }
                    .text-lg { font-size: 1.125rem; }
                    .p-1 { padding: 0.25rem; }
                    .p-2 { padding: 0.5rem; }
                    .p-3 { padding: 0.75rem; }
                    .p-4 { padding: 1rem; }
                    .p-6 { padding: 1.5rem; }
                    .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
                    .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
                    .px-4 { padding-left: 1rem; padding-right: 1rem; }
                    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
                    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .mb-3 { margin-bottom: 0.75rem; }
                    .mb-4 { margin-bottom: 1rem; }
                    .mb-6 { margin-bottom: 1.5rem; }
                    .mt-2 { margin-top: 0.5rem; }
                    .mt-3 { margin-top: 0.75rem; }
                    .mt-4 { margin-top: 1rem; }
                    .mt-6 { margin-top: 1.5rem; }
                    .mr-2 { margin-right: 0.5rem; }
                    .ml-2 { margin-left: 0.5rem; }
                    .flex { display: flex; }
                    .flex-shrink-0 { flex-shrink: 0; }
                    .flex-1 { flex: 1; }
                    .items-center { align-items: center; }
                    .items-start { align-items: flex-start; }
                    .justify-between { justify-content: space-between; }
                    .justify-center { justify-content: center; }
                    .gap-2 { gap: 0.5rem; }
                    .gap-3 { gap: 0.75rem; }
                    .gap-4 { gap: 1rem; }
                    .gap-6 { gap: 1.5rem; }
                    .space-y-1 > * + * { margin-top: 0.25rem; }
                    .space-y-2 > * + * { margin-top: 0.5rem; }
                    .grid { display: grid; }
                    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                    .w-18 { width: 4.5rem; }
                    .h-18 { height: 4.5rem; }
                    .w-full { width: 100%; }
                    .object-cover { object-fit: cover; }
                    .text-left { text-align: left; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .pl-4 { padding-left: 1rem; }
                    .pt-2 { padding-top: 0.5rem; }
                    .pt-3 { padding-top: 0.75rem; }
                    .pb-4 { padding-bottom: 1rem; }
                    .pb-5 { padding-bottom: 1.25rem; }
                    .border-t { border-top-width: 1px; }
                    .border-b { border-bottom-width: 1px; }
                    .border-gray-200 { border-color: #e5e7eb; }
                    .border-gray-300 { border-color: #d1d5db; }
                    .border-gray-800 { border-color: #1f2937; }
                    @media (max-width: 640px) {
                        .flex.items-start.gap-6 {
                            flex-direction: column;
                            align-items: center;
                            text-align: center;
                        }
                        .grid-cols-2 {
                            grid-template-columns: 1fr;
                        }
                        .pl-4 {
                            padding-left: 0.5rem;
                        }
                    }
                    @media print {
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        .print-container {
                            padding: 0;
                            margin: 0;
                            max-width: 100%;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${printContent.outerHTML}
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                        window.onafterprint = () => window.close();
                    };
                <\/script>
            </body>
            </html>
        `);

        printWindow.document.close();
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

    const avatarUrl = payrollData.avatar || payrollData.employee_avatar || payrollData.employee?.avatar;
    const fullAvatarUrl = avatarUrl
        ? (avatarUrl.startsWith('/storage/') || avatarUrl.startsWith('http'))
            ? avatarUrl
            : `/storage/${avatarUrl}`
        : null;

    const employeeName = payrollData.employee_name || payrollData.employee?.name || 'N/A';
    const employeeCode = payrollData.employee_code || payrollData.employee?.emp_code || 'N/A';
    const position = payrollData.position || payrollData.employee?.position?.pos_name || 'N/A';

    // Categorize earnings and deductions
    const { contributions, otherDeductions } = payrollData.deductions
        ? categorizeDeductions(payrollData.deductions)
        : { contributions: [], otherDeductions: [] };

    const { incentives, otherEarnings } = payrollData.earnings
        ? categorizeEarnings(payrollData.earnings)
        : { incentives: [], otherEarnings: [] };

    // Calculate totals with safe handling
    const totalContributions = contributions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalOtherDeductions = otherDeductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalIncentives = incentives.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalOtherEarnings = otherEarnings.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&_.absolute.right-4.top-4]:hidden">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <DialogTitle className="text-2xl font-bold">
                            <span className="px-2 py-1 border rounded-xl text-[15px]">Payroll Slip</span>
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handlePrint} className='cursor-pointer'>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={onClose} className='cursor-pointer'>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {/* Print Area */}
                <div ref={printAreaRef} className="border rounded-lg bg-gray-50" id="print-area">
                    <div className="mb-6 p-4">
                        {/* Personal Info */}
                        <div className="flex items-start gap-6">
                            {/* Avatar - Shows on screen always, but hides in print if it exists */}
                            <div className={`flex-shrink-0 ${fullAvatarUrl ? 'print:hidden' : ''}`}>
                                {fullAvatarUrl ? (
                                    <img
                                        src={fullAvatarUrl}
                                        alt={employeeName}
                                        className="w-18 h-18 rounded-full object-cover border-2 border-gray-800"
                                        onError={(e) => {
                                            console.error('Avatar load error:', fullAvatarUrl);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center border-2 border-gray-800">
                                        <User className="h-9 w-9 text-blue-900" />
                                    </div>
                                )}
                            </div>

                            {/* Employee Details - Always visible on screen and print */}
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
                            <p className="px-2 py-1 bg-white rounded-lg flex items-center text-gray-700 font-bold border border-gray-300">
                                <Calendar className='h-4 w-4 mr-2 text-blue-800' />
                                {formatDate(payrollData.start_date)} - {formatDate(payrollData.end_date)}
                            </p>
                        </div>
                    </div>

                    <div className="border rounded-lg px-4 -mt-5 bg-white">
                        {/* Regular Earnings (Non-incentive) */}
                        {otherEarnings.length > 0 && (
                            <div className='border-b pb-5'>
                                <div className="flex items-center gap-2 py-4">
                                    <div className="p-1.5 rounded-lg bg-green-100">
                                        <Coins className="h-4 w-4 text-green-600" />
                                    </div>
                                    <h3 className="font-semibold text-md text-gray-700">REGULAR EARNINGS</h3>
                                </div>
                                <div className="space-y-2">
                                    {otherEarnings.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center last:border-0">
                                            <span className="text-sm text-gray-700">{item.description || 'N/A'}</span>
                                            <span className="text-sm font-medium text-green-600">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="text-sm font-semibold text-gray-800">Total Regular Earnings</span>
                                        <span className="text-sm font-semibold text-green-700">
                                            {formatCurrency(totalOtherEarnings)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Incentives (Bonus, Rewards, etc.) */}
                        {incentives.length > 0 && (
                            <div className='border-b pb-5'>
                                <div className="flex items-center gap-2 py-4">
                                    <div className="p-1.5 rounded-lg bg-orange-100">
                                        <HandCoins className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <h3 className="font-semibold text-md text-gray-700">INCENTIVES</h3>
                                </div>
                                <div className="space-y-2">
                                    {incentives.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center last:border-0">
                                            <span className="text-sm text-gray-700">{item.description ? item.description.replace(/^(INCENTIVE|INCENTIVES)\s*-\s*/i, '').trim() : 'N/A'}</span>
                                            <span className="text-sm font-medium text-orange-600">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="text-sm font-semibold text-gray-800">Total Incentives</span>
                                        <span className="text-sm font-semibold text-orange-700">
                                            {formatCurrency(totalIncentives)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Government Contributions */}
                        {contributions.length > 0 && (
                            <div className='border-b pb-5'>
                                <div className="flex items-center gap-2 py-4">
                                    <div className="p-1.5 rounded-lg bg-blue-100">
                                        <Landmark className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-md text-gray-700">GOVERNMENT CONTRIBUTIONS</h3>
                                </div>
                                <div className="space-y-2">
                                    {contributions.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center last:border-0">
                                            <span className="text-sm text-gray-700">{item.description || 'N/A'}</span>
                                            <span className="text-sm font-medium text-blue-600">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="text-sm font-semibold text-gray-800">Total Contributions</span>
                                        <span className="text-sm font-semibold text-blue-700">
                                            {formatCurrency(totalContributions)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Deductions - Just showing deduction names without "DEDUCTIONS" in the item description */}
                        {otherDeductions.length > 0 && (
                            <div className='border-b pb-5'>
                                <div className="flex items-center gap-2 py-4">
                                    <div className="p-1.5 rounded-lg bg-red-100">
                                        <Minus className="h-4 w-4 text-red-600" />
                                    </div>
                                    <h3 className="font-semibold text-md text-gray-700">DEDUCTIONS</h3>
                                </div>
                                <div className="space-y-2">
                                    {otherDeductions.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center last:border-0">
                                            <span className="text-sm text-gray-700">
                                                {item.description ? item.description.replace(/^(DEDUCTION|DEDUCTIONS)\s*-\s*/i, '').trim() : 'N/A'}
                                            </span>
                                            <span className="text-sm font-medium text-red-600">
                                                {formatCurrency(item.amount)}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="text-sm font-semibold text-gray-800">Total Deductions</span>
                                        <span className="text-sm font-semibold text-red-700">
                                            {formatCurrency(totalOtherDeductions)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="mt-6 pb-4">
                            <h3 className="font-semibold mb-3 text-gray-800">SUMMARY</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Gross Pay:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(payrollData.gross_pay)}</span>
                                </div>
                                {totalOtherEarnings > 0 && (
                                    <div className="flex justify-between pl-4 text-xs text-gray-500">
                                        <span>├─ Regular Earnings:</span>
                                        <span>{formatCurrency(totalOtherEarnings)}</span>
                                    </div>
                                )}
                                {totalIncentives > 0 && (
                                    <div className="flex justify-between pl-4 text-xs text-gray-500">
                                        <span>├─ Incentives:</span>
                                        <span>{formatCurrency(totalIncentives)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Deductions:</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(payrollData.total_deduction)}</span>
                                </div>
                                {totalContributions > 0 && (
                                    <div className="flex justify-between pl-4 text-xs text-gray-500">
                                        <span>├─ Government Contributions:</span>
                                        <span>{formatCurrency(totalContributions)}</span>
                                    </div>
                                )}
                                {totalOtherDeductions > 0 && (
                                    <div className="flex justify-between pl-4 text-xs text-gray-500">
                                        <span>├─ Deductions:</span>
                                        <span>{formatCurrency(totalOtherDeductions)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-2">
                                    <span className="font-semibold text-gray-800">Net Pay:</span>
                                    <span className="font-bold text-blue-600 text-lg">{formatCurrency(payrollData.net_pay)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}