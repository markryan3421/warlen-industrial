// components/employee-payroll-table.tsx
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import React, { useRef, useState } from 'react';

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

// Update this interface to match your actual payroll data structure
interface PayrollData {
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

interface EmployeePayrollTableProps {
    data: PayrollData[];  // Changed from EmployeePayroll to PayrollData
    onView?: (payroll: PayrollData) => void;
    onEdit?: (payroll: PayrollData) => void;
    onDelete?: (payroll: PayrollData) => void;
    onViewItems?: (payroll: PayrollData) => void; // Added for viewing payroll items
}

export default function EmployeePayrollTable({
    data = [],
    onView,
    onEdit,
    onDelete,
    onViewItems
}: EmployeePayrollTableProps) {
    const PrintRef = useRef<HTMLDivElement>(null);
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Helper function to safely format currency values
    const formatCurrency = (amount: any): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;

        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    };

    // Helper function to safely format number without currency symbol
    const formatNumber = (amount: any): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
        return numAmount.toFixed(2);
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format period range
    const formatPeriodRange = (payroll: PayrollData) => {
        if (payroll.payroll_period) {
            return `${formatDate(payroll.payroll_period.start_date)} - ${formatDate(payroll.payroll_period.end_date)}`;
        }
        return 'N/A';
    };

    // Check if position is valid
    const hasValidPosition = (payroll: PayrollData) => {
        return payroll.employee?.position && !payroll.employee.position.deleted_at;
    };

    const handlePrintIframe = () => {
        if (!PrintRef.current) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) return;

        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');

        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print Receipt</title>
                    ${Array.from(styles).map(style => style.outerHTML).join('')}
                    <style>
                        @page { size: auto; margin: 0mm; }
                        body { padding: 50px; font-family: system-ui, sans-serif; }
                        .receipt-container { margin: 0 auto; padding-left: 10px: padding-right: 10px; }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        ${PrintRef.current.outerHTML}
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                                setTimeout(() => window.close(), 100);
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        iframeDoc.close();
    };

    // Enhanced mapping for deduction codes
    const deductionCodeMapping: Record<string, string> = {
        'SSS': 'SSS Contribution',
        'PHILHEALTH': 'PhilHealth Contribution',
        'PAGIBIG': 'Pag-IBIG Contribution',
        'TAX': 'Withholding Tax',
        'WITHHOLDING_TAX': 'Withholding Tax',
        'LOAN': 'Loan Payment',
        'LATE': 'Late Deduction',
        'HOLIDAY OT': 'Holiday Overtime Pay',
        'HOLIDAY_OT': 'Holiday Overtime Pay',
    };

    // Enhanced mapping for earning codes
    const earningCodeMapping: Record<string, string> = {
        'BASE': 'Base Pay',
        'BASIC': 'Basic Pay',
        'REGULAR': 'Regular Pay',
        'OVERTIME': 'Overtime Pay',
        'OT': 'Overtime Pay',
        'HOLIDAY': 'Holiday Pay',
        'HOLIDAY_OT': 'Holiday Overtime Pay',
        'HOLIDAY OT': 'Holiday Overtime Pay',
        'ALLOWANCE': 'Allowance',
        'TRANSPO': 'Transportation Allowance',
        'TRANSPORTATION': 'Transportation Allowance',
        'MEAL': 'Meal Allowance',
        'COMMISSION': 'Commission',
        'BONUS': 'Bonus',
        'INCENTIVE': 'Incentive',
        '13TH_MONTH': '13th Month Pay',
        'THIRTEENTH_MONTH': '13th Month Pay',
        'SIL': 'SIL Pay',
        'LEAVE': 'Leave Pay',
        'SICK_LEAVE': 'Sick Leave Pay',
        'VACATION_LEAVE': 'Vacation Leave Pay',
    };

    // Unified function to format item names
    const formatItemName = (item: PayrollItem): string => {
        const code = item.code.toUpperCase();
        const mapping = item.type === 'earning' ? earningCodeMapping : deductionCodeMapping;
        
        // Check for exact match in mapping
        if (mapping[code]) {
            return mapping[code];
        }
        
        // Check for partial matches (e.g., "HOLIDAY OT" vs "HOLIDAY_OT")
        for (const [key, value] of Object.entries(mapping)) {
            if (code.includes(key) || key.includes(code)) {
                return value;
            }
        }
        
        // If no mapping found, format the code
        return code
            .split(/[_-\s]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const handleViewReceipt = (payroll: PayrollData) => {
        setSelectedPayroll(payroll);
        setIsDialogOpen(true);
        if (onView) onView(payroll);
    };

    const handleViewItems = (payroll: PayrollData) => {
        if (onViewItems) onViewItems(payroll);
    };

    const renderActionButtons = (payroll: PayrollData) => (
        <div className="flex justify-center gap-2">
            {onViewItems && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewItems(payroll)}
                    className="transition-all duration-200 hover:scale-105"
                >
                    <Eye className="h-4 w-4 mr-1" />
                    Items
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8 hover:bg-transparent hover:cursor-pointer hover:text-gray-500" onClick={() => handleViewReceipt(payroll)}>
                        <Eye />
                    </Button>
                </DropdownMenuTrigger>
            </DropdownMenu>
        </div>
    );

    return (
        <>
            {/* Desktop View - lg and above */}
            <div className="hidden lg:block">
                <div className="rounded-lg border-2 border-gray-200 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-white">
                            <TableRow>
                                <TableHead className='text-center py-4'>Period</TableHead>
                                <TableHead className='text-center py-4'>Employee Code</TableHead>
                                <TableHead className='text-center py-4'>Employee Name</TableHead>
                                <TableHead className='text-center py-4'>Position</TableHead>
                                <TableHead className='text-center py-4'>Gross Pay</TableHead>
                                <TableHead className='text-center py-4'>Total Deduction</TableHead>
                                <TableHead className='text-center py-4'>Net Pay</TableHead>
                                <TableHead className='text-center py-4'>Status</TableHead>
                                <TableHead className="text-center py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow
                                    key={item.id || index}
                                    className="text-center odd:bg-white even:bg-stone-50/60 hover:bg-blue-50/60 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-2 duration-500"
                                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                                >
                                    <TableCell className="text-center">
                                        {item.payroll_period ? (
                                            <div>
                                                <div className="font-medium">{item.payroll_period.period_name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {formatPeriodRange(item)}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">No period</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">{item.employee?.emp_code || 'N/A'}</TableCell>
                                    <TableCell className="text-center">{item.employee?.user.name || 'N/A'}</TableCell>
                                    <TableCell className="text-center">
                                        {hasValidPosition(item) ?
                                            item.employee?.position.pos_name :
                                            <span className="text-gray-400 italic">Not assigned</span>
                                        }
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {formatCurrency(item.gross_pay)}
                                    </TableCell>
                                    <TableCell className="text-center text-red-600">
                                        -{formatCurrency(item.total_deduction)}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold text-green-600">
                                        {formatCurrency(item.net_pay)}

                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={`
                                                border px-2 py-1 text-xs rounded-full inline-block
                                                ${item.payroll_period?.is_closed
                                                    ? 'border-gray-500 bg-gray-100 text-gray-700'
                                                    : 'border-green-500 bg-green-100 text-green-700'
                                                }
                                            `}
                                        >
                                            {item.payroll_period?.is_closed ? 'Closed' : 'Active'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {renderActionButtons(item)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {/* Footer with record count */}
                    {data.length > 0 && (
                        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-200 bg-stone-50">
                            <p className="text-xs font-medium text-stone-500">
                                Showing{" "}
                                <span className="font-bold text-blue-600">
                                    {data.length}
                                </span>{" "}
                                record{data.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tablet View - md to lg */}
            <div className="hidden md:block lg:hidden">
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {data.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 duration-500"
                                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                            >
                                <div className="flex items-center justify-between mb-3 pb-2.5 border-b">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-[7px] bg-blue-100 text-blue-600 text-[11px] font-bold">
                                        {index + 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewItems(item)}
                                        className="transition-all duration-200 hover:scale-105"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                </div>

                                <dl className="flex flex-col gap-2">
                                    <div className="flex items-start justify-between">
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Period</dt>
                                        <dd className="text-[12.5px] font-medium text-right">
                                            {item.payroll_period?.period_name || 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Employee</dt>
                                        <dd className="text-[12.5px] font-medium text-right">
                                            {item.employee?.emp_code} - {item.employee?.user.name}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Position</dt>
                                        <dd className="text-[12.5px] font-medium text-right">
                                            {hasValidPosition(item) ? item.employee?.position.pos_name : 'N/A'}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Gross Pay</dt>
                                        <dd className="text-[12.5px] font-medium text-right text-green-600">
                                            {formatCurrency(item.gross_pay)}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Net Pay</dt>
                                        <dd className="text-[12.5px] font-medium text-right font-semibold text-green-600">
                                            {formatCurrency(item.net_pay)}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    {data.length > 0 && (
                        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t bg-stone-50">
                            <p className="text-xs font-medium text-stone-500">
                                Showing <span className="font-bold text-blue-600">{data.length}</span> records
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View - below md */}
            <div className="block md:hidden">
                <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
                    <div className="divide-y">
                        {data.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="px-4 py-4 odd:bg-white even:bg-stone-50 animate-in fade-in slide-in-from-bottom-2 duration-500"
                                style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-[7px] bg-blue-100 text-blue-600 text-[11px] font-bold">
                                        {index + 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewItems(item)}
                                        className="transition-all duration-200 hover:scale-105"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                    </Button>
                                </div>

                                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Period</dt>
                                        <dd className="text-[13px] mt-0.5">{item.payroll_period?.period_name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Emp Code</dt>
                                        <dd className="text-[13px] mt-0.5">{item.employee?.emp_code || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Name</dt>
                                        <dd className="text-[13px] mt-0.5">{item.employee?.user.name || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Position</dt>
                                        <dd className="text-[13px] mt-0.5">
                                            {hasValidPosition(item) ? item.employee?.position.pos_name : 'N/A'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Gross Pay</dt>
                                        <dd className="text-[13px] text-green-600 mt-0.5">{formatCurrency(item.gross_pay)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-[10px] font-bold uppercase text-stone-400">Net Pay</dt>
                                        <dd className="text-[13px] font-semibold text-green-600 mt-0.5">{formatCurrency(item.net_pay)}</dd>
                                    </div>
                                </dl>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Receipt Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="lg:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="items-center">
                        <DialogTitle>Payslip</DialogTitle>
                        <DialogDescription className="-mt-3">
                            View and print employee payslip
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPayroll && (
                        <div ref={PrintRef} className="p-6 border border-gray-200 rounded-lg bg-white">
                            <div className="flex items-center gap-4 mb-6">
                                <div>
                                    <h3 className="font-bold text-lg">{selectedPayroll.employee?.user.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {selectedPayroll.employee?.position?.pos_name} • ID: Emp-{selectedPayroll.employee?.emp_code}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <p className="text-gray-600">Pay Period:</p>
                                    <p className="font-semibold">
                                        {selectedPayroll.payroll_period?.period_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Period Date:</p>
                                    <p className="font-semibold">
                                        {formatPeriodRange(selectedPayroll)}
                                    </p>
                                </div>
                            </div>

                            {/* Earnings Section */}
                            <div className="mb-6">
                                <h4 className="font-bold mb-3 text-green-700">Earnings</h4>
                                <div className="space-y-2">
                                    {selectedPayroll.payroll_items
                                        ?.filter(item => item.type === 'earning')
                                        .map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                                <div>
                                                    <span className="font-medium text-gray-800">
                                                        {formatItemName(item)}
                                                    </span>
                                                    {item.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {item.description.charAt(0).toUpperCase() + item.description.slice(1).toLowerCase()}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="font-medium text-green-600">
                                                    {formatCurrency(item.amount)}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center font-semibold">
                                    <span className="text-gray-700">Total Earnings</span>
                                    <span className="text-green-600">{formatCurrency(selectedPayroll.gross_pay)}</span>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            {selectedPayroll.payroll_items?.some(item => item.type === 'deduction') && (
                                <div className="mb-6">
                                    <h4 className="font-bold mb-3 text-red-700">Deductions</h4>
                                    <div className="space-y-2">
                                        {selectedPayroll.payroll_items
                                            ?.filter(item => item.type === 'deduction')
                                            .map((item) => (
                                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                                    <div>
                                                        <span className="font-medium text-gray-800">
                                                            {formatItemName(item)}
                                                        </span>
                                                        {item.description && (
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {item.description.charAt(0).toUpperCase() + item.description.slice(1).toLowerCase()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-red-600">
                                                        -{formatCurrency(item.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center font-semibold">
                                        <span className="text-gray-700">Total Deductions</span>
                                        <span className="text-red-600">-{formatCurrency(selectedPayroll.total_deduction)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Net Pay Summary */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-lg font-bold text-gray-800">Net Income Pay</span>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(selectedPayroll.net_pay)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Close
                        </Button>
                        <Button onClick={handlePrintIframe}>
                            🖨️ Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}