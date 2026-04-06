// components/employee-payroll-table.tsx
import { Eye, X } from 'lucide-react';
import React, { useState, useMemo, useRef } from 'react';
import { CustomPagination } from "@/components/custom-pagination";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

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
    data: PayrollData[];
    onView?: (payroll: PayrollData) => void;
    onEdit?: (payroll: PayrollData) => void;
    onDelete?: (payroll: PayrollData) => void;
    onViewItems?: (payroll: PayrollData) => void;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (value: string) => void;
    currentPage?: number;
    totalCount?: number;
    toolbar?: React.ReactNode;
    filterEmptyState?: React.ReactNode;
    isLoading?: boolean;
}

export default function EmployeePayrollTable({
    data = [],
    onView,
    onEdit,
    onDelete,
    onViewItems,
    itemsPerPage = 10,
    onPageChange,
    onPerPageChange,
    currentPage: externalCurrentPage = 1,
    totalCount: externalTotalCount = 0,
    toolbar,
    filterEmptyState,
    isLoading = false,
}: EmployeePayrollTableProps) {
    const PrintRef = useRef<HTMLDivElement>(null);
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
    
    // Use external pagination - no internal state
    const currentPage = externalCurrentPage;
    const totalCount = externalTotalCount;
    const perPage = itemsPerPage;

    const formatCurrency = (amount: any): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPeriodRange = (payroll: PayrollData) => {
        if (payroll.payroll_period) {
            return `${formatDate(payroll.payroll_period.start_date)} - ${formatDate(payroll.payroll_period.end_date)}`;
        }
        return 'N/A';
    };

    const getPeriodDisplay = (payroll: PayrollData) => {
        if (payroll.payroll_period) {
            return payroll.payroll_period.period_name || 'N/A';
        }
        return 'N/A';
    };

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
                        .receipt-container { margin: 0 auto; }
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

    const deductionCodeMapping: Record<string, string> = {
        'SSS': 'SSS Contribution',
        'PHILHEALTH': 'PhilHealth Contribution',
        'PAGIBIG': 'Pag-IBIG Contribution',
        'TAX': 'Withholding Tax',
        'WITHHOLDING_TAX': 'Withholding Tax',
        'LOAN': 'Loan Payment',
        'LATE': 'Late Deduction',
    };

    const earningCodeMapping: Record<string, string> = {
        'BASE': 'Base Pay',
        'REGULAR': 'Regular Pay',
        'OVERTIME': 'Overtime Pay',
        'OT': 'Overtime Pay',
        'HOLIDAY': 'Holiday Pay',
        'INCENTIVE': 'Incentive',
        '13TH_MONTH': '13th Month Pay',
    };

    const formatItemName = (item: PayrollItem): string => {
        const code = item.code.toUpperCase();
        const mapping = item.type === 'earning' ? earningCodeMapping : deductionCodeMapping;
        if (mapping[code]) return mapping[code];
        return code.split(/[_-\s]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const handleViewReceipt = (payroll: PayrollData) => {
        setSelectedPayroll(payroll);
        setIsDialogOpen(true);
        if (onView) onView(payroll);
    };

    const handleViewItems = (payroll: PayrollData) => {
        setSelectedPayroll(payroll);
        setIsItemsDialogOpen(true);
        if (onViewItems) onViewItems(payroll);
    };

    const renderActionButtons = (payroll: PayrollData) => (
        <div className="flex justify-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="size-8 hover:bg-[#1d4791]/10 hover:text-[#1d4791] transition-all duration-200"
                onClick={() => handleViewReceipt(payroll)}
            >
                <Eye className="h-4 w-4" />
            </Button>
        </div>
    );

    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalCount);
    const lastPage = Math.ceil(totalCount / perPage);

    const generatePageLinks = () => {
        const links = [];
        links.push({
            url: currentPage > 1 ? '#' : null,
            label: '&laquo;',
            active: false
        });
        
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const endPage = Math.min(lastPage, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            links.push({
                url: '#',
                label: i.toString(),
                active: i === currentPage
            });
        }
        
        links.push({
            url: currentPage < lastPage ? '#' : null,
            label: '&raquo;',
            active: false
        });
        
        return links;
    };

    const paginationObject = {
        data: data,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total: totalCount,
        from: startItem,
        to: endItem,
        links: generatePageLinks()
    };

    const handlePageClick = (url: string | null) => {
        if (url && onPageChange) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const page = parseInt(urlParams.get('page') || '1', 10);
            onPageChange(page);
        }
    };

    const handlePerPageChange = (value: string) => {
        if (onPerPageChange) {
            onPerPageChange(value);
        }
    };

    // Desktop View
    const DesktopView = () => (
        <div className="hidden lg:block">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {/* Toolbar slot */}
                {toolbar && (
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                        {toolbar}
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13px] text-slate-700 dark:text-slate-300">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/80">
                                <th className="w-14 px-5 py-3 text-center text-[10px] font-black tracking-widest uppercase text-[#1d4791] dark:text-blue-400">#</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">PERIOD</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">EMPLOYEE CODE</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">EMPLOYEE NAME</th>
                                <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">POSITION</th>
                                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">GROSS PAY</th>
                                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">DEDUCTIONS</th>
                                <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">NET PAY</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">STATUS</th>
                                <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest uppercase whitespace-nowrap text-slate-500 dark:text-slate-400">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={item.id || index} className="group border-b border-slate-100 dark:border-slate-800 last:border-0 bg-white dark:bg-slate-900 hover:bg-[#1d4791]/[0.03] dark:hover:bg-[#1d4791]/10 transition-colors duration-150">
                                    <td className="px-5 py-3.5 text-center align-middle">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d4791]/10 dark:bg-[#1d4791]/25 text-[#1d4791] dark:text-blue-300 text-[11px] font-black tabular-nums">
                                            {startItem + index}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 align-middle">
                                        <div>
                                            <div className="font-medium text-sm">{getPeriodDisplay(item)}</div>
                                            <div className="text-xs text-gray-500">{formatPeriodRange(item)}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 align-middle text-sm">{item.employee?.emp_code || 'N/A'}</td>
                                    <td className="px-4 py-3.5 align-middle text-sm">{item.employee?.user.name || 'N/A'}</td>
                                    <td className="px-4 py-3.5 align-middle text-sm">{hasValidPosition(item) ? item.employee?.position.pos_name : 'Not assigned'}</td>
                                    <td className="px-4 py-3.5 align-middle text-right text-sm font-medium text-green-600">{formatCurrency(item.gross_pay)}</td>
                                    <td className="px-4 py-3.5 align-middle text-right text-sm text-red-600">-{formatCurrency(item.total_deduction)}</td>
                                    <td className="px-4 py-3.5 align-middle text-right text-sm font-semibold text-blue-600">{formatCurrency(item.net_pay)}</td>
                                    <td className="px-4 py-3.5 align-middle text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold ${item.payroll_period?.is_closed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                            {item.payroll_period?.is_closed ? 'Closed' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 align-middle text-center">
                                        {renderActionButtons(item)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d85e39]" />
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Showing <span className="font-black text-slate-600 dark:text-slate-300">{data.length}</span> of <span className="font-black">{totalCount}</span> records
                        </p>
                    </div>
                    <p className="text-[11px] text-slate-300 dark:text-slate-600">
                        Row {startItem} – {endItem}
                    </p>
                </div>
            </div>
        </div>
    );

    // Tablet View
    const TabletView = () => (
        <div className="hidden md:block lg:hidden">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {toolbar && (
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                        {toolbar}
                    </div>
                )}
                <div className="p-4 grid grid-cols-2 gap-3">
                    {data.map((item, index) => (
                        <div key={item.id || index} className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/60 p-4 hover:border-[#1d4791]/40 dark:hover:border-[#1d4791]/50 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d4791]/10 dark:bg-[#1d4791]/25 text-[#1d4791] dark:text-blue-300 text-[11px] font-black">
                                    {startItem + index}
                                </span>
                                {renderActionButtons(item)}
                            </div>
                            <dl className="space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Period</dt>
                                    <dd className="text-[12.5px] font-medium text-right">{getPeriodDisplay(item)}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Employee</dt>
                                    <dd className="text-[12.5px] font-medium text-right">{item.employee?.emp_code} - {item.employee?.user.name}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Position</dt>
                                    <dd className="text-[12.5px] font-medium text-right">{hasValidPosition(item) ? item.employee?.position.pos_name : 'N/A'}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Gross Pay</dt>
                                    <dd className="text-[12.5px] font-medium text-right text-green-600">{formatCurrency(item.gross_pay)}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Net Pay</dt>
                                    <dd className="text-[12.5px] font-medium text-right font-semibold text-blue-600">{formatCurrency(item.net_pay)}</dd>
                                </div>
                            </dl>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d85e39]" />
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Showing <span className="font-black text-slate-600 dark:text-slate-300">{data.length}</span> of <span className="font-black">{totalCount}</span> records
                        </p>
                    </div>
                    <p className="text-[11px] text-slate-300 dark:text-slate-600">
                        Row {startItem} – {endItem}
                    </p>
                </div>
            </div>
        </div>
    );

    // Mobile View
    const MobileView = () => (
        <div className="block md:hidden">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                {toolbar && (
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                        {toolbar}
                    </div>
                )}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.map((item, index) => (
                        <div key={item.id || index} className="px-4 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-150">
                            <div className="flex items-center justify-between mb-3">
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1d4791]/10 dark:bg-[#1d4791]/25 text-[#1d4791] dark:text-blue-300 text-[11px] font-black">
                                    {startItem + index}
                                </span>
                                {renderActionButtons(item)}
                            </div>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                                <div className="flex flex-col">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Period</dt>
                                    <dd className="text-[13px] text-slate-700 dark:text-slate-300">{getPeriodDisplay(item)}</dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Emp Code</dt>
                                    <dd className="text-[13px] text-slate-700 dark:text-slate-300">{item.employee?.emp_code || 'N/A'}</dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Name</dt>
                                    <dd className="text-[13px] text-slate-700 dark:text-slate-300">{item.employee?.user.name || 'N/A'}</dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Position</dt>
                                    <dd className="text-[13px] text-slate-700 dark:text-slate-300">{hasValidPosition(item) ? item.employee?.position.pos_name : 'N/A'}</dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Gross Pay</dt>
                                    <dd className="text-[13px] text-green-600">{formatCurrency(item.gross_pay)}</dd>
                                </div>
                                <div className="flex flex-col">
                                    <dt className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">Net Pay</dt>
                                    <dd className="text-[13px] font-semibold text-blue-600">{formatCurrency(item.net_pay)}</dd>
                                </div>
                            </dl>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d85e39]" />
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Showing <span className="font-black text-slate-600 dark:text-slate-300">{data.length}</span> of <span className="font-black">{totalCount}</span> records
                        </p>
                    </div>
                    <p className="text-[11px] text-slate-300 dark:text-slate-600">
                        Row {startItem} – {endItem}
                    </p>
                </div>
            </div>
        </div>
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="w-full">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                    {toolbar && (
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                            {toolbar}
                        </div>
                    )}
                    <div className="animate-pulse">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700" />
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 border-t" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {data.length === 0 && filterEmptyState ? (
                filterEmptyState
            ) : (
                <>
                    <DesktopView />
                    <TabletView />
                    <MobileView />
                    
                    {/* Pagination */}
                    {data.length > 0 && totalCount > perPage && (
                        <div className="mt-4">
                            <CustomPagination
                                pagination={paginationObject}
                                perPage={String(perPage)}
                                onPerPageChange={handlePerPageChange}
                                onPageChange={handlePageClick}
                                totalCount={totalCount}
                                filteredCount={totalCount}
                                search=""
                                resourceName="payroll"
                            />
                        </div>
                    )}
                </>
            )}

            {/* Items View Dialog */}
            <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
                <DialogContent className="lg:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Payroll Items</DialogTitle>
                        <DialogDescription>View payroll items for this employee</DialogDescription>
                    </DialogHeader>
                    {selectedPayroll && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                                <h3 className="font-bold text-lg">{selectedPayroll.employee?.user.name}</h3>
                                <p className="text-sm text-gray-500">{selectedPayroll.employee?.position?.pos_name} • ID: {selectedPayroll.employee?.emp_code}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Pay Period</p>
                                    <p className="font-semibold">{selectedPayroll.payroll_period?.period_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Period Date</p>
                                    <p className="text-sm">{formatPeriodRange(selectedPayroll)}</p>
                                </div>
                            </div>
                            
                            {/* Earnings Section */}
                            <div>
                                <h4 className="font-bold mb-3 text-green-700">Earnings</h4>
                                <div className="space-y-2">
                                    {selectedPayroll.payroll_items?.filter(item => item.type === 'earning').map((item) => (
                                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <div>
                                                <span className="font-medium">{formatItemName(item)}</span>
                                                {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                                            </div>
                                            <span className="font-medium text-green-600">{formatCurrency(item.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-2 border-t flex justify-between font-semibold">
                                    <span>Total Earnings</span>
                                    <span className="text-green-600">{formatCurrency(selectedPayroll.gross_pay)}</span>
                                </div>
                            </div>

                            {/* Deductions Section */}
                            {selectedPayroll.payroll_items?.some(item => item.type === 'deduction') && (
                                <div>
                                    <h4 className="font-bold mb-3 text-red-700">Deductions</h4>
                                    <div className="space-y-2">
                                        {selectedPayroll.payroll_items?.filter(item => item.type === 'deduction').map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                                                <div>
                                                    <span className="font-medium">{formatItemName(item)}</span>
                                                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                                                </div>
                                                <span className="font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-2 border-t flex justify-between font-semibold">
                                        <span>Total Deductions</span>
                                        <span className="text-red-600">-{formatCurrency(selectedPayroll.total_deduction)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Net Pay Summary */}
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">Net Pay</span>
                                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPayroll.net_pay)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsItemsDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Receipt Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="lg:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Payslip</DialogTitle>
                        <DialogDescription>View and print employee payslip</DialogDescription>
                    </DialogHeader>
                    {selectedPayroll && (
                        <div ref={PrintRef} className="space-y-4 p-4">
                            <div className="text-center border-b pb-4">
                                <h2 className="text-xl font-bold">PAYSLIP</h2>
                                <p className="text-sm text-gray-500">Payroll Period: {selectedPayroll.payroll_period?.period_name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Employee Name</p>
                                    <p className="font-semibold">{selectedPayroll.employee?.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Employee Code</p>
                                    <p>{selectedPayroll.employee?.emp_code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Position</p>
                                    <p>{selectedPayroll.employee?.position?.pos_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Period</p>
                                    <p>{formatPeriodRange(selectedPayroll)}</p>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <h3 className="font-bold mb-2">Earnings</h3>
                                {selectedPayroll.payroll_items?.filter(item => item.type === 'earning').map((item) => (
                                    <div key={item.id} className="flex justify-between py-1">
                                        <span>{formatItemName(item)}</span>
                                        <span>{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                                    <span>Gross Pay</span>
                                    <span>{formatCurrency(selectedPayroll.gross_pay)}</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-bold mb-2">Deductions</h3>
                                {selectedPayroll.payroll_items?.filter(item => item.type === 'deduction').map((item) => (
                                    <div key={item.id} className="flex justify-between py-1">
                                        <span>{formatItemName(item)}</span>
                                        <span>-{formatCurrency(item.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                                    <span>Total Deductions</span>
                                    <span>-{formatCurrency(selectedPayroll.total_deduction)}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold">NET PAY</span>
                                    <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPayroll.net_pay)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                        <Button onClick={handlePrintIframe} className="bg-[#1d4791] hover:bg-[#1d4791]/90">Print Payslip</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}