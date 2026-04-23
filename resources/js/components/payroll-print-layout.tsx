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

    const generateSalarySlipHTML = () => {
        if (!payrollData) return '';

        const employeeNameValue = payrollData.employee_name || payrollData.employee?.name || 'N/A';
        const employeeCodeValue = payrollData.employee_code || payrollData.employee?.emp_code || 'N/A';
        const positionValue = payrollData.position || payrollData.employee?.position?.pos_name || 'N/A';

        const startDateFormatted = payrollData.start_date ? new Date(payrollData.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const endDateFormatted = payrollData.end_date ? new Date(payrollData.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        const payDateFormatted = payrollData.pay_date ? new Date(payrollData.pay_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase() : 'N/A';

        const earningsItems = payrollData.earnings && payrollData.earnings.length > 0 ? payrollData.earnings : [];
        const deductionsItems = payrollData.deductions && payrollData.deductions.length > 0 ? payrollData.deductions : [];

        let totalEarningsAmount = 0;
        let totalDeductionsAmount = 0;

        earningsItems.forEach(item => {
            totalEarningsAmount += Number(item.amount) || 0;
        });

        deductionsItems.forEach(item => {
            totalDeductionsAmount += Number(item.amount) || 0;
        });

        let allRowsHtml = '';
        const maxRows = Math.max(earningsItems.length, deductionsItems.length);

        for (let i = 0; i < maxRows; i++) {
            const earning = earningsItems[i];
            const deduction = deductionsItems[i];

            const earningDesc = earning ? earning.description : '';
            const earningAmount = earning ? Number(earning.amount) || 0 : 0;
            const deductionDesc = deduction ? deduction.description : '';
            const deductionAmount = deduction ? Number(deduction.amount) || 0 : 0;

            allRowsHtml += `
                <tr>
                    <td style="padding: 5px 5px; border-right: 1px solid #000000; border-left: 1px solid #000000;  font-size: 0.7rem;">
                        ${earningDesc || ''}
                    </td>
                    <td style="padding: 5px 5px; border-right: 1px solid #000000; border-left: 1px solid #000000;  text-align: right;font-size: 0.7rem;">
                        ${earningAmount > 0 ? formatCurrency(earningAmount) : ''}
                    </td>
                    <td style="padding: 5px 5px; border-right: 1px solid #000000; border-left: 1px solid #000000;  font-size: 0.7rem;">
                        ${deductionDesc ? `
                            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                <span style="text-align: left;">${deductionDesc}</span>
                                <span style="text-align: right;">${deductionAmount > 0 ? formatCurrency(deductionAmount) : ''}</span>
                            </div>
                        ` : (deductionAmount > 0 ? `
                            <div style="display: flex; justify-content: flex-end; width: 100%;">
                                <span>${formatCurrency(deductionAmount)}</span>
                            </div>
                        ` : '')}
                    </td>
                </tr>
            `;
        }

        return `
            <div class="salary-slip" style="max-width: 100%; width: 100%; background: white; border: 1.5px solid #2c2c2c; padding: 15px; position: relative; font-family: 'Courier New', 'Lucida Sans Typewriter', monospace; min-height: 100%;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('/images/dekalogo.webp'); background-repeat: no-repeat; background-position: center; background-size: 40%; opacity: 0.1; pointer-events: none; z-index: 0;"></div>

                <div class="company-header" style="text-align: center; border-bottom: 1.5px dashed #333; margin-bottom: 12px; padding-bottom: 10px; position: relative; z-index: 1;">
                    <div class="company-name" style="font-size: 1.1rem; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">WARLEN INDUSTRIAL SALES CORPORATION</div>
                    <div class="deka-sales" style="font-size: 0.75rem; font-weight: 700; margin-top: 3px;">DEKA SALES</div>
                    <div class="specialty-contractor" style="font-size: 0.55rem; font-weight: 600; text-transform: uppercase; color: #555; margin-top: 2px;">SPECIALTY CONTRACTOR</div>
                    <div class="period" style="margin-top: 8px; font-weight: 700; font-size: 0.7rem; text-align: right;">Date Period: ${startDateFormatted} – ${endDateFormatted}</div>
                </div>

                <div class="emp-info" style="margin: 12px 0; border: 1px solid #222; padding: 8px 10px; background: #f9f9f0; position: relative; z-index: 1;">
                    <div class="emp-row" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.7rem; font-weight: 600;">
                        <span><span class="emp-label" style="font-weight: 700; text-transform: uppercase;">EMPLOYEE NAME:</span> ${employeeNameValue}</span>
                        <span><span class="emp-label" style="font-weight: 700; text-transform: uppercase;">POSITION:</span> ${positionValue}</span>
                    </div>
                    <div class="emp-row" style="display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 600;">
                        <span><span class="emp-label" style="font-weight: 700; text-transform: uppercase;">EMPLOYEE CODE:</span> EMP-${employeeCodeValue}</span>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.7rem; position: relative; z-index: 1;">
                    <thead>
                        <tr>
                            <th style="width: 50%; text-align: left; border: 1px solid #222; padding: 6px 5px; text-transform: uppercase; background: #f0ede0; font-size: 0.7rem;">DESCRIPTION</th>
                            <th style="width: 25%; text-align: right; border: 1px solid #222; padding: 6px 5px; text-transform: uppercase; background: #f0ede0; font-size: 0.7rem;">EARNINGS</th>
                            <th style="width: 25%; text-align: right; border: 1px solid #222; padding: 6px 5px; text-transform: uppercase; background: #f0ede0; font-size: 0.7rem;">DEDUCTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allRowsHtml}
                        <tr class="total-row">
                            <td style="border: 1.5px solid #222; font-weight: 800; padding: 6px 5px; background: #faf7ec; font-size: 0.75rem;">TOTAL</td>
                            <td style="text-align: right; border: 1.5px solid; #222; font-weight: 800; padding: 6px 5px; background: #faf7ec; font-size: 0.75rem;">${formatCurrency(totalEarningsAmount)}</td>
                            <td style="text-align: right; border: 1.5px solid;  #222; font-weight: 800; padding: 6px 5px; background: #faf7ec; font-size: 0.75rem;">${formatCurrency(totalDeductionsAmount)}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="summary-section" style="margin: 12px 0; border-top: 1.5px solid #222; padding-top: 10px; position: relative; z-index: 1;">
                    <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.7rem;">
                        <span>Gross Pay</span>
                        <span>${formatCurrency(totalEarningsAmount)}</span>
                    </div>
                    <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.7rem;">
                        <span>Total Deductions</span>
                        <span>${formatCurrency(totalDeductionsAmount)}</span>
                    </div>
                    <div class="net-pay" style="font-size: 0.85rem; font-weight: 800; color: #075985; border-top: 1px solid #aaa; margin-top: 5px; padding-top: 5px; display: flex; justify-content: space-between;">
                        <span>NET PAY</span>
                        <span>${formatCurrency(payrollData.net_pay || (totalEarningsAmount - totalDeductionsAmount))} PHP</span>
                    </div>
                </div>

                <div class="footer" style="margin-top: 15px; font-size: 0.55rem; border-top: 1px dashed #aaa; padding-top: 8px; display: flex; justify-content: space-between; position: relative; z-index: 1;">
                    <div>PRINTED DATE: <span id="printedDate">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <div>RELEASE DATE: ${payDateFormatted}</div>
                    <div>AUTHORIZED SIGNATURE: _________________</div>
                </div>
                <div class="note" style="font-size: 0.55rem; margin-top: 8px; text-align: right; position: relative; z-index: 1;">
                    * This is a system-generated salary slip. For any discrepancy, contact payroll officer.
                </div>
            </div>
        `;
    };

    const handlePrintWithPDF = async () => {
        if (!payrollData) return;

        const element = document.createElement('div');
        element.innerHTML = generateSalarySlipHTML();
        document.body.appendChild(element);

        const opt = {
            margin: [0.2, 0.2, 0.2, 0.2],
            filename: `Salary_Slip_${payrollData.employee_name || payrollData.employee?.name || 'Employee'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, letterRendering: true, useCORS: true },
            jsPDF: { unit: 'in', format: 'a5', orientation: 'landscape' }
        };

        try {
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('PDF generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            document.body.removeChild(element);
        }
    };

    const handleDirectPrint = () => {
        if (!payrollData) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to print');
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Salary Slip - ${payrollData.employee_name || payrollData.employee?.name || 'Employee'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        background: white; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        padding: 0;
                        margin: 0;
                        font-family: 'Courier New', 'Lucida Sans Typewriter', monospace;
                    }
                    .salary-slip {
                        max-width: 100%;
                        width: 100%;
                        margin: 0;
                        padding: 15px;
                    }
                    @media print {
                        body { 
                            padding: 0; 
                            margin: 0; 
                        }
                        .salary-slip { 
                            border: none; 
                            padding: 0.2cm;
                            margin: 0;
                            width: 100%;
                        }
                        @page {
                            size: A5 landscape;
                            margin: 0.2cm;
                        }
                        html, body {
                            margin: 0;
                            padding: 0;
                            height: auto;
                        }
                    }
                </style>
            </head>
            <body>
                ${generateSalarySlipHTML()}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                <\/script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
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
                            <span className="px-2 py-1 border rounded-xl text-[15px]">Payroll Slip</span>
                        </DialogTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleDirectPrint} className='cursor-pointer'>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrintWithPDF} className='cursor-pointer'>
                                <Download className="h-4 w-4 mr-2" />
                                Save as PDF
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