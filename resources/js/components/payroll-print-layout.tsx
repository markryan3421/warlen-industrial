import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, User, Calendar, Minus, HandCoins, Coins, Landmark, Download } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';

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
        daily_rate?: number;
        monthly_rate?: number;
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

const formatCurrencyNoSymbol = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return '0.00';
    }
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Add this helper function before the component
const parseLateMinutes = (description: string): number => {
    const lowerDesc = description.toLowerCase();
    let totalMinutes = 0;

    // Match hours (e.g., "1hr", "2 hours", "1h")
    const hourMatch = lowerDesc.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|hours|h)/i);
    if (hourMatch) {
        totalMinutes += parseFloat(hourMatch[1]) * 60;
    }

    // Match minutes (e.g., "45mins", "30 min", "45m")
    const minuteMatch = lowerDesc.match(/(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes|m)/i);
    if (minuteMatch) {
        totalMinutes += parseFloat(minuteMatch[1]);
    }

    // If only a number is present, assume it's minutes
    if (totalMinutes === 0) {
        const numberMatch = lowerDesc.match(/(\d+(?:\.\d+)?)/);
        if (numberMatch && !lowerDesc.includes('hour')) {
            totalMinutes = parseFloat(numberMatch[1]);
        }
    }

    return totalMinutes;
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

    // Define helper functions after fetchPayrollData but before they're used
    const getBasicPay = () => {
        if (!payrollData?.earnings) return 0;
        const basicPayItem = payrollData.earnings.find(item =>
            item.description?.toLowerCase().includes('basic') ||
            item.description?.toLowerCase().includes('basic pay')
        );
        return basicPayItem ? Number(basicPayItem.amount) || 0 : 0;
    };

    const getDailyRate = () => {
        if (payrollData?.employee?.daily_rate) {
            return payrollData.employee.daily_rate;
        }
        if (payrollData?.employee?.monthly_rate) {
            return payrollData.employee.monthly_rate / 22;
        }
        const basicPay = getBasicPay();
        if (basicPay > 0 && payrollData?.start_date && payrollData?.end_date) {
            const start = new Date(payrollData.start_date);
            const end = new Date(payrollData.end_date);
            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return basicPay / daysDiff;
        }
        return 0;
    };

    const getPeriodDays = () => {
        if (payrollData?.start_date && payrollData?.end_date) {
            const start = new Date(payrollData.start_date);
            const end = new Date(payrollData.end_date);
            return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }
        return 0;
    };

    // Calculate values after payrollData is loaded
    const basicPay = payrollData ? getBasicPay() : 0;
    const dailyRate = payrollData ? getDailyRate() : 0;
    const periodDays = payrollData ? getPeriodDays() : 0;

    const generateSalarySlipHTML = () => {
        if (!payrollData) return '';

        const employeeNameValue = payrollData.employee_name || payrollData.employee?.name || 'N/A';
        const employeeCodeValue = payrollData.employee_code || payrollData.employee?.emp_code || 'N/A';
        const positionValue = payrollData.position || payrollData.employee?.position?.pos_name || 'N/A';

        const startDateFormatted = payrollData.start_date ? new Date(payrollData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const endDateFormatted = payrollData.end_date ? new Date(payrollData.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const payDateFormatted = payrollData.pay_date ? new Date(payrollData.pay_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase() : 'N/A';

        // Categorize earnings and deductions
        const { contributions, otherDeductions } = categorizeDeductions(payrollData.deductions || []);
        const { incentives, otherEarnings } = categorizeEarnings(payrollData.earnings || []);

        // Combine all earnings (regular earnings + incentives)
        const allEarnings = [...otherEarnings, ...incentives];
        // Combine all deductions (contributions + other deductions)
        const allDeductions = [...contributions, ...otherDeductions];

        let totalEarningsAmount = 0;
        let totalDeductionsAmount = 0;
        let totalIncentivesAmount = 0;
        let totalRegularEarningsAmount = 0;
        let totalContributionsAmount = 0;
        let totalOtherDeductionsAmount = 0;

        otherEarnings.forEach(item => {
            const amount = Number(item.amount) || 0;
            totalRegularEarningsAmount += amount;
            totalEarningsAmount += amount;
        });

        incentives.forEach(item => {
            const amount = Number(item.amount) || 0;
            totalIncentivesAmount += amount;
            totalEarningsAmount += amount;
        });

        contributions.forEach(item => {
            const amount = Number(item.amount) || 0;
            totalContributionsAmount += amount;
            totalDeductionsAmount += amount;
        });

        otherDeductions.forEach(item => {
            const amount = Number(item.amount) || 0;
            totalOtherDeductionsAmount += amount;
            totalDeductionsAmount += amount;
        });

        // Build combined rows - align earnings and deductions side by side
        const maxRows = Math.max(allEarnings.length, allDeductions.length);

        let allRowsHtml = '';
        for (let i = 0; i < maxRows; i++) {
            const earning = allEarnings[i];
            const deduction = allDeductions[i];

            // Process earning
            let earningDesc = '';
            let earningAmount = 0;
            if (earning) {
                earningDesc = earning.description || '';
                if (earningDesc.toLowerCase().includes('incentive')) {
                    earningDesc = earningDesc.replace(/^(INCENTIVE|INCENTIVES)\s*-\s*/i, '').trim();
                }
                earningAmount = Number(earning.amount) || 0;
            }

            // Process deduction
            let deductionDesc = '';
            let deductionAmount = 0;
            if (deduction) {
                deductionDesc = deduction.description || '';
                // Remove "DEDUCTIONS - " or "DEDUCTION - " prefix if present
                deductionDesc = deductionDesc.replace(/^(DEDUCTION|DEDUCTIONS)\s*-\s*/i, '').trim();
                // Change the word "LATE" (case-insensitive, whole word) to "Late"
                deductionDesc = deductionDesc.replace(/\bLATE\b/i, 'Late');
                deductionAmount = Number(deduction.amount) || 0;
            }

            allRowsHtml += `
        <tr>
            <td style="padding: 6px 4px;">${earningDesc || ''}</td>
            <td style="padding: 6px 4px; text-align: right; border-right: 0.5px solid #000;">${earningAmount > 0 ? formatCurrency(earningAmount) : ''}</td>
            <td style="padding: 6px 4px;">
                ${deductionDesc ? `
                    <div style="display: flex; justify-content: space-between; width: 100%;">
                        <span>${deductionDesc}</span>
                        <span>${formatCurrency(deductionAmount)}</span>
                    </div>
                ` : (deductionAmount > 0 ? formatCurrency(deductionAmount) : '')}
            </td>
        </tr>
    `;
        }

        return `
        <div class="salary-slip" style="max-width: 100%; width: 100%; margin: 0 auto; background: #ffffff; padding: 15px; position: relative; border: 1px solid #000;">
            <div style="position: absolute; top: 100px; left: 0; right: 0; bottom: 0; background-image: url('/images/dekalogo.webp'); background-repeat: no-repeat; background-position: center; background-size: 48%; opacity: 0.06; pointer-events: none; z-index: 0;"></div>
            
            <div style="position: relative; z-index: 1;">
                <div style="text-align: center; border-bottom: 0.5px solid #333; margin-bottom: 10px; padding-bottom: 8px;">
                    <img src="/images/dekalogo.webp" alt="Deka Sales Logo" style="height: 50px; width = 50px; margin-bottom: 4px;" />
                    <div style="font-size: 1rem; color: #05469D; font-weight: 800; text-transform: uppercase;">WARLEN INDUSTRIAL SALES CORPORATION</div>
                    <div style="font-size: 0.7rem; font-weight: 700; color: #FD0C0B; margin-top: 2px;">DEKA SALES</div>
                    <div style="font-size: 0.5rem; font-weight: 600; text-transform: uppercase; color: #555;">SPECIALTY CONTRACTOR</div>
                </div>

                <div style="margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.65rem;">
                        <span><strong>EMPLOYEE NAME:</strong> ${employeeNameValue}</span>
                        <span><strong>EMPLOYEE CODE:</strong> EMP-${employeeCodeValue}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.65rem;">
                        <span><strong>POSITION:</strong> ${positionValue}</span>
                        <span><strong>DATE PERIOD:</strong> ${startDateFormatted} – ${endDateFormatted}</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.65rem; border: 1px solid #000;">
                    <thead>
                        <tr>
                            <th style="width: 40%; text-align: left; padding: 6px 4px; border-bottom: 1px solid #000;">EARNINGS </th>
                            <th style="width: 20%; text-align: right; padding: 6px 4px; border-bottom: 1px solid #000; border-right: 1px solid #000;">AMOUNT</th>
                            <th style="width: 40%; text-align: left; padding: 6px 4px; border-bottom: 1px solid #000;"><div style = "display:flex; justify-content: space-between;"><span>DEDUCTIONS </span> <span>AMOUNT</span></div></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allRowsHtml}
                        <tr style="border-top: 2px solid #000;">
                            <td style="font-weight: 800; padding: 6px 4px;"><strong>TOTAL</strong></td>
                            <td style="text-align: right; font-weight: 800; padding: 6px 4px; border-right: 1px solid #000;">${formatCurrency(totalEarningsAmount)}</td>
                            <td style="text-align: right; font-weight: 800; padding: 6px 4px;">${formatCurrency(totalDeductionsAmount)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin: 10px 0; border-top: 2px solid #000; padding-top: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.7rem;">
                        <span>Gross Pay</span>
                        <span>${formatCurrency(totalEarningsAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.7rem;">
                        <span>Total Deductions</span>
                        <span>${formatCurrency(totalDeductionsAmount)}</span>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 800; color: #075985; border-top: 1px solid #aaa; margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between;">
                        <span>NET PAY</span>
                        <span>${formatCurrency(payrollData.net_pay || (totalEarningsAmount - totalDeductionsAmount))} PHP</span>
                    </div>
                </div>

                <div style="margin-top: 15px; font-size: 0.55rem; border-top: 1px dashed #aaa; padding-top: 8px; display: flex; justify-content: space-between;">
                    <div>PRINTED DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div>RELEASE DATE: ${payDateFormatted}</div>
                </div>
                <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 0.55rem;">
                    <div>AUTHORIZED SIGNATURE: _________________</div>
                    <div style="text-align: right;">* This is a system-generated salary slip. For any discrepancy, contact payroll officer.</div>
                </div>
            </div>
        </div>
    `;
    };

    const handleDirectPrint = () => {
        if (!payrollData) return;

        const printContent = generateSalarySlipHTML();

        // Create a temporary iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Salary Slip - ${payrollData.employee_name || 'Employee'}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        background: white;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        padding: 10px;
                    }
                    @media print {
                        body {
                            padding: 0;
                            margin: 0;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .salary-slip {
                            border: 1px solid #000;
                            padding: 0.1cm;
                            margin: 0;
                            width: 100%;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        @page {
                            size: A5 landscape;
                            margin: 0.1cm;
                        }
                    }
                    .salary-slip {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.parent.document.body.removeChild(window.frameElement);
                        };
                    };
                <\/script>
            </body>
            </html>
        `);
            iframeDoc.close();
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

    const avatarUrl = payrollData.avatar || payrollData.employee_avatar || payrollData.employee?.avatar;
    const fullAvatarUrl = avatarUrl
        ? (avatarUrl.startsWith('/storage/') || avatarUrl.startsWith('http'))
            ? avatarUrl
            : `/storage/${avatarUrl}`
        : null;

    const employeeName = payrollData.employee_name || payrollData.employee?.name || 'N/A';
    const employeeCode = payrollData.employee_code || payrollData.employee?.emp_code || 'N/A';
    const position = payrollData.position || payrollData.employee?.position?.pos_name || 'N/A';

    const { contributions, otherDeductions } = payrollData.deductions
        ? categorizeDeductions(payrollData.deductions)
        : { contributions: [], otherDeductions: [] };

    const { incentives, otherEarnings } = payrollData.earnings
        ? categorizeEarnings(payrollData.earnings)
        : { incentives: [], otherEarnings: [] };

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
                            <span className="px-2 py-1 border rounded-xl text-[15px]">Payroll Slip Preview</span>
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleDirectPrint} className='cursor-pointer'>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={onClose} className='cursor-pointer'>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div ref={printAreaRef} className="border rounded-lg bg-gray-50" id="print-area">
                    <div className="mb-6 p-4">
                        <div className="flex items-start gap-6">
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
                            <div className="flex-1 gap-4">
                                <div>
                                    <p className="font-semibold text-lg">{employeeName}</p>
                                    <p className="text-gray-500 text-sm">EMP-{employeeCode}</p>
                                    <p className="text-gray-500 text-sm">{position}</p>
                                </div>
                            </div>
                        </div>
                        <div className='w-full text-left mt-3'>
                            <p className="px-2 py-1 bg-white rounded-lg flex items-center text-gray-700 font-bold border border-gray-300">
                                <Calendar className='h-4 w-4 mr-2 text-blue-800' />
                                {formatDate(payrollData.start_date)} - {formatDate(payrollData.end_date)}
                            </p>
                        </div>
                    </div>

                    <div className="border rounded-lg px-4 -mt-5 bg-white">
                        {otherEarnings.length > 0 && (
                            <div className='border-b pb-5'>
                                <div className="flex items-center gap-2 py-4">
                                    <div className="p-1.5 rounded-lg bg-green-100">
                                        <Coins className="h-4 w-4 text-green-600" />
                                    </div>
                                    <h3 className="font-semibold text-md text-gray-700">REGULAR EARNINGS</h3>
                                </div>
                                <div className="space-y-2">
                                    {otherEarnings.map((item, index) => {
                                        // Check if this is a Basic Pay item
                                        const isBasicPay = item.description?.toLowerCase().includes('basic') ||
                                            item.description?.toLowerCase().includes('basic pay');

                                        return (
                                            <div key={index} className="flex justify-between items-center last:border-0">
                                                {isBasicPay ? (
                                                    <div className="flex flex-col w-full">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-700">{item.description || 'N/A'} <span className="text-xs text-gray-500">({formatCurrencyNoSymbol(dailyRate)} daily x {periodDays} days)</span></span>
                                                            <span className="text-sm font-medium text-green-600">
                                                                {formatCurrency(item.amount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm text-gray-700">{item.description || 'N/A'}</span>
                                                        <span className="text-sm font-medium text-green-600">
                                                            {formatCurrency(item.amount)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="text-sm font-semibold text-gray-800">Total Regular Earnings</span>
                                        <span className="text-sm font-semibold text-green-700">
                                            {formatCurrency(totalOtherEarnings)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                                {item.description
                                                    ? item.description.replace(/^(DEDUCTION|DEDUCTIONS)\s*-\s*/i, '')
                                                        .trim()
                                                        .replace(/\bLATE\b/i, 'Late')
                                                    : 'N/A'
                                                }
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