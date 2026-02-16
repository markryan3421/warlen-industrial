import { MoreHorizontalIcon, Eye, Pencil, Trash2, ListFilter, ChevronDown, Plus } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const invoices = [
    {
        invoice: "INV001",
        paymentStatus: "Paid",
        totalAmount: "$250.00",
        paymentMethod: "Credit Card",
    },
    {
        invoice: "INV002",
        paymentStatus: "Pending",
        totalAmount: "$150.00",
        paymentMethod: "PayPal",
    },
    {
        invoice: "INV003",
        paymentStatus: "Unpaid",
        totalAmount: "$350.00",
        paymentMethod: "Bank Transfer",
    },
    {
        invoice: "INV004",
        paymentStatus: "Paid",
        totalAmount: "$450.00",
        paymentMethod: "Credit Card",
    },
    {
        invoice: "INV005",
        paymentStatus: "Paid",
        totalAmount: "$550.00",
        paymentMethod: "PayPal",
    },
    {
        invoice: "INV006",
        paymentStatus: "Pending",
        totalAmount: "$200.00",
        paymentMethod: "Bank Transfer",
    },
    {
        invoice: "INV007",
        paymentStatus: "Unpaid",
        totalAmount: "$300.00",
        paymentMethod: "Credit Card",
    },
]

// Status badge variants
const getStatusBadge = (status: string) => {
    switch (status) {
        case "Paid":
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 border-0">Paid</Badge>
        case "Pending":
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50 border-0">Pending</Badge>
        case "Unpaid":
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 border-0">Unpaid</Badge>
        default:
            return <Badge variant="outline">{status}</Badge>
    }
}

export const CustomTable = () => {
    return (
        <Card className="shadow-md border-0">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 py-5">
                <div className="flex">
                    <div className="grid gap-1">
                        <CardTitle className="text-2xl font-bold">
                            Invoices
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                            Manage and track your invoice payments
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 w-full">
                        {/* Filter Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="button-sm w-full sm:w-auto justify-center sm:justify-start px-4"
                                >
                                    <ListFilter className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Filter By</span>
                                    <span className="sm:hidden">Filter</span>
                                    <ChevronDown className="h-4 w-4 ml-2 sm:hidden" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer">
                                    <span className="flex-1">Paid</span>
                                    <Badge className="bg-green-100 text-green-800 border-0">12</Badge>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <span className="flex-1">Unpaid</span>
                                    <Badge className="bg-red-100 text-red-800 border-0">3</Badge>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                    <span className="flex-1">Pending</span>
                                    <Badge className="bg-yellow-100 text-yellow-800 border-0">5</Badge>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* New Invoice Button */}
                        <Button className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">New Invoice</span>
                            <span className="sm:hidden">Create</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table className="px-4 rounded rounded-md">
                    <TableHeader className="bg-gray-50 dark:bg-gray-900/50 p-3">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px] font-semibold text-primary/80">Invoice #</TableHead>
                            <TableHead className="font-semibold text-primary/80">Status</TableHead>
                            <TableHead className="font-semibold text-primary/80">Method</TableHead>
                            <TableHead className="font-semibold text-primary/80">Amount</TableHead>
                            <TableHead className="text-right font-semibold text-primary/80">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow
                                key={invoice.invoice}
                                className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                            >
                                <TableCell className="font-medium font-mono">
                                    <span className="text-primary">#</span>
                                    {invoice.invoice}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(invoice.paymentStatus)}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300">
                                    {invoice.paymentMethod}
                                </TableCell>
                                <TableCell className="font-semibold">
                                    {invoice.totalAmount}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreHorizontalIcon className="h-4 w-4" />
                                                    <span className="sr-only">More</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4 text-blue-600" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4 text-amber-600" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem variant="destructive" className="cursor-pointer">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter className="bg-gray-50 dark:bg-gray-900/50">
                        <TableRow>
                            <TableCell colSpan={3} className="text-start font-semibold text-primary text-md">
                                Total
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                                $2,500.00
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>
    )
}
