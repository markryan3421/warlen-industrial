import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Briefcase, Eye, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useMemo, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import HrLayout from '@/layouts/hr-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Incentives',
        href: '/incentives',
    },
];

interface PayrollPeriod {
    id: number;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: string;
}

interface Employee {
    id: number;
    user?: {
        name: string;
        email: string;
    };
    position?: {
        pos_name: string;
    }
    branch?: {
        branch_name: string;
    }
    employee_status?: string;
    hire_date?: string;
}

interface Incentive {
    id: number;
    payroll_period_id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period?: PayrollPeriod;
    employees?: Employee[];
}

interface Props {
    incentives: Incentive[];
    filters?: {
        date_from?: string;
        date_to?: string;
    };
}

export default function Index({ incentives, filters = {} }: Props) {
    const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Date range filter state
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined
    );

    // Separate month states for left and right calendars
    const [leftCalendarMonth, setLeftCalendarMonth] = useState<Date>(new Date());
    const [rightCalendarMonth, setRightCalendarMonth] = useState<Date>(() => {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
    });

    // Pagination state with localStorage
    const [currentPage, setCurrentPage] = useState(() => {
        const saved = localStorage.getItem('incentives-currentPage');
        return saved ? parseInt(saved) : 1;
    });
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const saved = localStorage.getItem('incentives-itemsPerPage');
        return saved ? parseInt(saved) : 10;
    });

    // Save to localStorage whenever values change
    useEffect(() => {
        localStorage.setItem('incentives-currentPage', currentPage.toString());
    }, [currentPage]);

    useEffect(() => {
        localStorage.setItem('incentives-itemsPerPage', itemsPerPage.toString());
    }, [itemsPerPage]);

    // Filter incentives based on date range and search term
    const filteredIncentives = useMemo(() => {
        let filtered = incentives;

        // Apply date range filter
        if (dateFrom || dateTo) {
            filtered = filtered.filter(incentive => {
                if (!incentive.payroll_period) return false;

                const periodStart = new Date(incentive.payroll_period.start_date);
                const periodEnd = new Date(incentive.payroll_period.end_date);

                if (dateFrom && dateTo) {
                    // Both dates selected - check if period overlaps with range
                    return periodStart <= dateTo && periodEnd >= dateFrom;
                } else if (dateFrom) {
                    // Only from date selected - periods starting after or on from date
                    return periodEnd >= dateFrom;
                } else if (dateTo) {
                    // Only to date selected - periods ending before or on to date
                    return periodStart <= dateTo;
                }

                return true;
            });
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(incentive =>
                incentive.incentive_name.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [incentives, dateFrom, dateTo, searchTerm]);

    // Pagination logic
    const totalItems = filteredIncentives.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Get current page items
    const currentItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredIncentives.slice(startIndex, endIndex);
    }, [filteredIncentives, currentPage, itemsPerPage]);

    // Reset to first page when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFrom, dateTo]);

    // Update URL when date filters change
    useEffect(() => {
        const params: any = {};

        if (dateFrom) {
            params.date_from = format(dateFrom, 'yyyy-MM-dd');
        }
        if (dateTo) {
            params.date_to = format(dateTo, 'yyyy-MM-dd');
        }

        router.get('/hr/incentives', params, { preserveState: true, replace: true });
    }, [dateFrom, dateTo]);

    const deleteIncentive = (id: number) => {
        if (confirm('Are you sure you want to delete this incentive?')) {
            router.delete(`/hr/incentives/${id}`);
        }
    }

    const clearDateFilters = () => {
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: string | number) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(numAmount);
    };

    const viewIncentiveDetails = (incentive: Incentive) => {
        setSelectedIncentive(incentive);
        setIsModalOpen(true);
    };

    // Pagination helper functions
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const goToFirstPage = () => goToPage(1);
    const goToLastPage = () => goToPage(totalPages);
    const goToPreviousPage = () => goToPage(currentPage - 1);
    const goToNextPage = () => goToPage(currentPage + 1);

    // Generate page numbers for pagination controls - FIXED TYPES
    const getPageNumbers = (): (number | string)[] => {
        const delta = 2;
        const range: number[] = [];
        const rangeWithDots: (number | string)[] = [];
        let l: number | undefined;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    // Check if any filter is active
    const hasActiveFilters = dateFrom || dateTo || searchTerm;

    return (
        <HrLayout breadcrumbs={breadcrumbs}>
            <Head title="Incentives" />
            <>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 md:px-6 py-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Incentives</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage and track employee incentives across different payroll periods
                        </p>
                    </div>
                    <Link href="/hr/incentives/create">
                        <Button size="default" className="gap-2">
                            <Briefcase className="h-4 w-4" />
                            Add Incentive
                        </Button>
                    </Link>
                </div>

                {incentives.length === 0 ? (
                    <Card className="border-dashed mx-4 md:mx-6">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="rounded-full bg-primary/10 p-6 mb-4">
                                <Briefcase className="h-12 w-12 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No incentives yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Get started by creating your first incentive. Define incentives and their corresponding amounts for payroll periods.
                            </p>
                            <Link href="/hr/incentives/create">
                                <Button className="gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    Create Your First Incentive
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="mx-4 md:mx-6">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <CardTitle>Incentive List</CardTitle>

                                {/* Filter and Search controls */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                    {/* Search Bar */}
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Search by incentive name..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-10 py-2 w-full h-9"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={clearSearch}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Date Range Picker with Clear Button */}
                                    <div className="relative w-full sm:w-[300px]">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={`w-full justify-start text-left font-normal h-9 pr-10 ${!dateFrom && !dateTo ? 'text-muted-foreground' : ''
                                                        }`}
                                                >
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    {dateFrom || dateTo ? (
                                                        <>
                                                            {dateFrom && format(dateFrom, 'MMM d, yyyy')}
                                                            {dateFrom && dateTo && ' - '}
                                                            {dateTo && format(dateTo, 'MMM d, yyyy')}
                                                        </>
                                                    ) : (
                                                        <span>Filter by date range</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <div className="flex">
                                                    {/* Left Calendar - FIXED: removed captionLayout */}
                                                    <div className="border-r">
                                                        <CalendarComponent
                                                            mode="range"
                                                            selected={{
                                                                from: dateFrom,
                                                                to: dateTo,
                                                            }}
                                                            onSelect={(range) => {
                                                                setDateFrom(range?.from);
                                                                setDateTo(range?.to);
                                                            }}
                                                            month={leftCalendarMonth}
                                                            onMonthChange={setLeftCalendarMonth}
                                                            numberOfMonths={1}
                                                            initialFocus
                                                        />
                                                    </div>

                                                    {/* Right Calendar - FIXED: removed captionLayout */}
                                                    <div>
                                                        <CalendarComponent
                                                            mode="range"
                                                            selected={{
                                                                from: dateFrom,
                                                                to: dateTo,
                                                            }}
                                                            onSelect={(range) => {
                                                                setDateFrom(range?.from);
                                                                setDateTo(range?.to);
                                                            }}
                                                            month={rightCalendarMonth}
                                                            onMonthChange={setRightCalendarMonth}
                                                            numberOfMonths={1}
                                                        />
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>

                                        {/* Clear button for date filter */}
                                        {(dateFrom || dateTo) && (
                                            <button
                                                onClick={clearDateFilters}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                title="Clear date filter"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {filteredIncentives.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                                    <div className="rounded-full bg-muted p-6 mb-4">
                                        {searchTerm ? (
                                            <Search className="h-12 w-12 text-muted-foreground" />
                                        ) : (
                                            <Calendar className="h-12 w-12 text-muted-foreground" />
                                        )}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        {searchTerm ? 'No incentives found' : 'No incentives found for this date range'}
                                    </h3>
                                    <p className="text-muted-foreground mb-6 max-w-sm">
                                        {searchTerm
                                            ? `No incentives matching "${searchTerm}" found.`
                                            : 'No incentives match the selected date range.'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="w-[250px]">Incentive Name</TableHead>
                                                    <TableHead className="w-[150px]">Amount</TableHead>
                                                    <TableHead className="min-w-[300px]">Payroll Period</TableHead>
                                                    <TableHead className="w-[100px] text-center">Employees</TableHead>
                                                    <TableHead className="w-[200px] text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {currentItems.map((incentive) => (
                                                    <TableRow key={incentive.id} className="hover:bg-muted/50">
                                                        <TableCell className="font-medium">
                                                            {incentive.incentive_name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="font-mono">
                                                                {formatCurrency(incentive.incentive_amount)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {incentive.payroll_period ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm">
                                                                        {formatDate(incentive.payroll_period.start_date)} - {formatDate(incentive.payroll_period.end_date)}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Pay date: {formatDate(incentive.payroll_period.pay_date)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">N/A</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline">
                                                                {incentive.employees?.length || 0}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => viewIncentiveDetails(incentive)}
                                                                    className="hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                    <span className="sr-only">View</span>
                                                                </Button>
                                                                <Link href={`/hr/incentives/${incentive.id}/edit`}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="hover:bg-primary/10 hover:text-primary"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                        <span className="sr-only">Edit</span>
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => deleteIncentive(incentive.id)}
                                                                    className="hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    <span className="sr-only">Delete</span>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="grid grid-cols-3 items-center mt-4 px-6 py-4">
                                        {/* Left column - Showing entries text */}
                                        <div className="text-sm text-muted-foreground">
                                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                                        </div>

                                        {/* Center column - Show entries dropdown */}
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-sm text-muted-foreground">Show</span>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="border rounded-md px-2 py-1 text-sm bg-background"
                                            >
                                                {[5, 10, 20, 50, 100].map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Right column - Pagination controls */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={goToFirstPage}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronsLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={goToPreviousPage}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>

                                                {/* Page Numbers */}
                                                <div className="flex items-center gap-1">
                                                    {getPageNumbers().map((page, index) => (
                                                        page === '...' ? (
                                                            <span key={`dots-${index}`} className="px-2 py-1 text-muted-foreground">...</span>
                                                        ) : (
                                                            <Button
                                                                key={page}
                                                                variant={currentPage === page ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => goToPage(Number(page))}
                                                                className="min-w-[32px]"
                                                            >
                                                                {page}
                                                            </Button>
                                                        )
                                                    ))}
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={goToNextPage}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={goToLastPage}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    <ChevronsRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{selectedIncentive?.incentive_name}</DialogTitle>
                            <DialogDescription>
                                {selectedIncentive && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className="font-mono text-base">
                                            {formatCurrency(selectedIncentive.incentive_amount)}
                                        </Badge>
                                        {selectedIncentive.payroll_period && (
                                            <span className="text-sm text-muted-foreground">
                                                • {formatDate(selectedIncentive.payroll_period.start_date)} - {formatDate(selectedIncentive.payroll_period.end_date)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedIncentive && (
                            <div className="mt-4">
                                <h3 className="text-sm font-medium mb-3">Assigned Employees</h3>

                                {selectedIncentive.employees && selectedIncentive.employees.length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead>Employee Name</TableHead>
                                                    <TableHead>Position</TableHead>
                                                    <TableHead>Branch</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedIncentive.employees.map((employee) => (
                                                    <TableRow key={employee.id}>
                                                        <TableCell className="font-medium">
                                                            {employee.user?.name || `Employee #${employee.id}`}
                                                        </TableCell>
                                                        <TableCell>{employee.position?.pos_name || '—'}</TableCell>
                                                        <TableCell>{employee.branch?.branch_name || '—'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground border rounded-md">
                                        No employees assigned to this incentive
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </>
        </HrLayout>
    );
}