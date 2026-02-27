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
        regPay: 100,
        otPay: 200,
        holidayPay: 300,
        incentives: 400,
        loans: 500,
        netPay: 600,
        status: 'Inactive'
    }
]

export default function EmployeeTable() {
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
                    
                    @media print {
                        body { 
                            padding: 20px; 
                            background: white; 
                            margin: 0;
                        }
                        
                        /* Hide any browser-generated headers/footers */
                        html, body {
                            height: 100%;
                        }
                        
                        .no-print { 
                            display: none !important; 
                        }
                        
                        /* Ensure your receipt content is visible */
                        .receipt-container {
                            max-width: 400px;
                            margin: 0 auto;
                        }
                    }
                    
                    @media screen {
                        body { 
                            font-family: system-ui, -apple-system, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background: #f3f4f6;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }
                        
                        .receipt-container {
                            max-width: 400px;
                            margin: 0 auto;
                        }
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
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <Dialog>
                                                <DialogTrigger className="p-1 px-2 text-sm w-full text-left hover:bg-accent hover:text-accent-foreground">
                                                    Open
                                                </DialogTrigger>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Receipt</DialogTitle>
                                                        <DialogDescription>
                                                            View and print receipt
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    
                                                    {/* Minimalist Receipt */}
                                                    <div ref={PrintRef} className="p-4 border border-gray-200 rounded-lg bg-white">
                                                        {/* Store Info */}
                                                        <div className="text-center mb-4">
                                                            <div className="text-xl font-bold tracking-tight">{item.empName}</div>
                                                            <div className="text-xs text-gray-500">123 Business St, City</div>
                                                            <div className="text-xs text-gray-500">(555) 123-4567</div>
                                                        </div>
                                                        
                                                        {/* Transaction Details */}
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Date:</span>
                                                                <span className="text-gray-600">{new Date().toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Time:</span>
                                                                <span className="text-gray-600">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Receipt #:</span>
                                                                <span className="font-mono text-gray-600">R{Date.now().toString().slice(-5)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Items */}
                                                        <div className="my-4">
                                                            <div className="border-t border-b border-gray-300 py-2">
                                                                <div className="flex justify-between font-medium">
                                                                    <span className="text-gray-600">Service Plan</span>
                                                                    <span className="text-gray-600">$49.99</span>
                                                                </div>
                                                                <div className="text-xs text-gray-500">Task Management - Monthly</div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Total */}
                                                        <div className="border-t border-gray-300 pt-3">
                                                            <div className="flex justify-between text-lg font-bold">
                                                                <span className="text-gray-600">TOTAL</span>
                                                                <span className="text-gray-600">$49.99</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1 text-center">Payment completed successfully</div>
                                                        </div>
                                                        
                                                        {/* Thank You */}
                                                        <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                                                            <div className="text-xs text-gray-500">Thank you for your purchase!</div>
                                                            <div className="text-xs text-gray-400 mt-1">Keep this receipt for your records</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <DialogFooter className="mt-4 flex gap-2">
                                                        <Button variant="outline" onClick={handlePrintIframe} className="flex-1">
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