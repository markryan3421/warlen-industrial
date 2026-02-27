import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import { MoreHorizontalIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import React from 'react';

const dataTables = [
    {
        empID: 'EMP-001',
        empName: 'Juan Dela Cruz',
        empRole: 'Senior Engineer',
        empType:'Full-Time',
        regPay: 100,
        otPay: 200,
        holidayPay: 300,
        incentives: 400,
        loans: 500,
        netPay: 600,
        status: 'Active'
    },
    {
        empID: 'EMP-002',
        empName: 'John Doe',
        empRole: 'Junior Engineer',
        empType:'Part-Time',
        regPay: 100,
        otPay: 200,
        holidayPay: 300,
        incentives: 400,
        loans: 500,
        netPay: 600,
        status: 'Inactive'
    }
]

export default function EmployeePayrollTable() {
    const PrintRef = React.useRef<HTMLDivElement>(null);

    // Alternative method that modifies content before printing
   // Alternative simpler method using iframe
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

    // Get styles
    const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
    
    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Print Receipt</title>
                ${Array.from(styles).map(style => style.outerHTML).join('')}
                <style>
                    /* Remove browser's default header and footer when printing */
                    @page {
                        size: auto;   /* auto is the initial value */
                        margin: 0mm;  /* this affects the margin in the printer settings */
                    } 
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
                        }, 500);
                    };
                </script>
            </body>
        </html>
    `);
    iframeDoc.close();
};

    return (
        <div className='px-7 py-3'>
            <div className="rounded-lg border-2 border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-white">
                        <TableRow>
                            <TableHead className='text-center py-4'><Checkbox className='bg-white border-gray-400 mr-3'/>Employee ID</TableHead>
                            <TableHead className='text-center py-4'>Employee Name</TableHead>
                            <TableHead className='text-center py-4'>Regular Pay</TableHead>
                            <TableHead className='text-center py-4'>OT Pay <span>(hrs/pay)</span></TableHead>
                            <TableHead className='text-center py-4'>Holiday Pay</TableHead>
                            <TableHead className='text-center py-4'>Incentives</TableHead>
                            <TableHead className='text-center py-4'>Loans</TableHead>
                            <TableHead className='text-center py-4'>Net Pay</TableHead>
                            <TableHead className='text-center py-4'>Status</TableHead>
                            <TableHead className="text-center py-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dataTables.map((item, index) => (
                            <TableRow key={index} className='hover:bg-gray-100'>
                                <TableCell className="text-center text-medium">
                                    <Checkbox className='bg-white border-gray-400 -ml-5 mr-3'/>
                                    {item.empID}
                                </TableCell>
                                <TableCell className="text-center">{item.empName}</TableCell>
                                <TableCell className="text-center"><span className="font-semibold">₱</span> {item.regPay}</TableCell>
                                <TableCell className="text-center">₱ {item.otPay}</TableCell>
                                <TableCell className="text-center">₱ {item.holidayPay}</TableCell>
                                <TableCell className="text-center">₱ {item.incentives}</TableCell>
                                <TableCell className="text-center">₱ {item.loans}</TableCell>
                                <TableCell className="text-center">₱ {item.netPay}</TableCell>
                                <TableCell className="text-center">
                                    <span 
                                        className={`
                                            border px-1 text-xs rounded-xl 
                                            ${item.status === 'Active' 
                                                ? 'border-green-500 bg-green-100 text-green-700' 
                                                : 'border-red-500 bg-red-100 text-red-700'
                                            }
                                        `}
                                    >
                                        {item.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <MoreHorizontalIcon />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <Dialog>
                                                <DialogTrigger className="p-1 px-2 text-sm text-left hover:bg-accent w-full hover:text-accent-foreground ">
                                                    Open
                                                </DialogTrigger>
                                                <DialogContent className="lg:max-w-lg overflow-auto">
                                                    <DialogHeader className="items-center">
                                                        <DialogTitle>Receipt</DialogTitle>
                                                        <DialogDescription className="-mt-3">
                                                            View and print receipt
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    
                                                    <div ref={PrintRef} className="p-6 md:p-8 border border-gray-200 rounded-lg bg-white print:max-w-full print:p-4 h-full overflow-auto">
                                                    {/* Employee Details */}
                                                    <div className="flex justify-between mb-4">
                                                        <div className = "flex gap-2">
                                                            <img src="/images/dekalogo.png" alt="" height= "50px" width="50px" />
                                                            <span className="font-bold text-muted-background">{item.empName} <br /> 
                                                            <span className="font-normal text-xs text-gray-500 mb-3"> {item.empRole || 'Role'} - (ID: {item.empID})</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Payment Date Details and Employee Type */}
                                                    <div className="text-sm">
                                                        <div className="grid grid-cols-2 mb-4">
                                                            <div className="text-gray-600">
                                                                Payment Period: <br/> 
                                                                <span className="text-black font-semibold">
                                                                    {new Date().toLocaleDateString('en-US', { 
                                                                        year: 'numeric', 
                                                                        month: 'long', 
                                                                        day: 'numeric' 
                                                                    })} - &nbsp;
                                                                    {new Date().toLocaleDateString('en-US', { 
                                                                        year: 'numeric', 
                                                                        month: 'long', 
                                                                        day: 'numeric' 
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div className="text-gray-600">
                                                                Payment Date: <br/> 
                                                                <span className="text-black font-semibold">
                                                                    {new Date().toLocaleDateString('en-US', { 
                                                                        year: 'numeric', 
                                                                        month: 'long', 
                                                                        day: 'numeric' 
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3">
                                                            <div className="text-gray-600">
                                                                Employee Type: <br/> <span className="text-black font-semibold">{item.empType}</span>
                                                            </div>
                                                            <div className="text-gray-600">
                                                                Total Hours: <br/> <span className="text-black font-semibold">400 hrs</span>
                                                            </div>
                                                            <div className="text-gray-600">
                                                                Total Hours: <br/> <span className="text-black font-semibold">400 hrs</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Earning Breakdown */}
                                                    <div className="my-4">
                                                        <h1 className="font-bold mt-5">Earnings Breakdown</h1>
                                                        
                                                        <div className="flex justify-between font-medium py-2">
                                                            <span className="text-gray-600 text-sm">Regular Pay</span>
                                                            <span className="text-gray-600 text-sm">PHP {item.regPay}</span>
                                                        </div>
                                                        <div className="flex justify-between font-medium py-2">
                                                            <span className="text-gray-600 text-sm">Overtime Pay</span>
                                                            <span className="text-gray-600 text-sm">PHP 1,000.00</span>
                                                        </div>
                                                        <div className="flex justify-between font-medium py-2">
                                                            <span className="text-gray-600 text-sm">Bonus</span>
                                                            <span className="text-gray-600 text-sm">PHP 1,000.00</span>
                                                        </div>
                                                    </div>
                                                    
                                                    
                                                    {/* Earning Breakdown */}
                                                    <div className="my-4">
                                                        <h1 className="font-bold mt-5">Deductions</h1>
                                                        <div className="flex justify-between font-medium py-2">
                                                            <span className="text-gray-600 text-sm">PhilHealth</span>
                                                            <span className="text-gray-600 text-sm">PHP 1,000.00</span>
                                                        </div>
                                                        <div className="flex justify-between font-medium py-2">
                                                            <span className="text-gray-600 text-sm">Overtime</span>
                                                            <span className="text-gray-600 text-sm">PHP 1,000.00</span>
                                                        </div>
                                                        <div className="flex justify-between font-medium py-2">
                                                            <span className="text-gray-600 text-sm">Bonus</span>
                                                            <span className="text-gray-600 text-sm">PHP 1,000.00</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Total */}
                                                    <div className="border-t border-gray-300 pt-3">
                                                        <div className="flex justify-between text-lg font-bold">
                                                            <span className="text-gray-600">TOTAL</span>
                                                            <span className="text-gray-600">$49.99</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                    
                                                    <DialogFooter className="mt-4 flex gap-2">
                                                        <Button variant="outline" onClick={handlePrintIframe} className="flex-1 hover:cursor-pointer">
                                                            🖨️ Print (Iframe)
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem variant="destructive">
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}