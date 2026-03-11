import AppLayout from '@/layouts/app-layout';
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import ContributionVersionController from "@/actions/App/Http/Controllers/ContributionVersionController";
import { useState, useMemo, useEffect } from 'react';
import { Calculator, PlusCircle, Percent, Filter, CalendarDays, X } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Contributions',
        href: '/contributions',
    },
];

interface ContributionBracket {
    id: number;
    salary_from: number;
    salary_to: number;
    employee_share: number;
    employer_share: number;
}

interface ContributionVersion {
    id: number;
    type: 'sss' | 'philhealth' | 'pagibig';
    effective_from: string;
    effective_to: string;
    contribution_brackets: ContributionBracket[];
    created_at: string;
    updated_at: string;
}

interface ContributionsProps {
    contributionVersions: ContributionVersion[];
}

export default function Index({ contributionVersions }: ContributionsProps) {
    const { delete: destroy } = useForm();
    const [selectedVersion, setSelectedVersion] = useState<ContributionVersion | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    
    // Separate filters for table and calendar
    const [tableTypeFilter, setTableTypeFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('contributions-table-typeFilter');
        return savedFilter || 'all';
    });
    
    // New date range filters for table view
    const [tableDateFrom, setTableDateFrom] = useState<Date | undefined>(() => {
        const saved = localStorage.getItem('contributions-table-dateFrom');
        return saved ? new Date(saved) : undefined;
    });
    
    const [tableDateTo, setTableDateTo] = useState<Date | undefined>(() => {
        const saved = localStorage.getItem('contributions-table-dateTo');
        return saved ? new Date(saved) : undefined;
    });
    
    const [calendarTypeFilter, setCalendarTypeFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('contributions-calendar-typeFilter');
        return savedFilter || 'all';
    });
    
    const [calendarYearFilter, setCalendarYearFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('contributions-calendar-yearFilter');
        return savedFilter || new Date().getFullYear().toString();
    });
    
    const [calendarMonthFilter, setCalendarMonthFilter] = useState<string>(() => {
        const savedFilter = localStorage.getItem('contributions-calendar-monthFilter');
        return savedFilter || 'all';
    });

    // Save filters to localStorage with view-specific keys
    useEffect(() => {
        localStorage.setItem('contributions-table-typeFilter', tableTypeFilter);
    }, [tableTypeFilter]);

    useEffect(() => {
        if (tableDateFrom) {
            localStorage.setItem('contributions-table-dateFrom', tableDateFrom.toISOString());
        } else {
            localStorage.removeItem('contributions-table-dateFrom');
        }
    }, [tableDateFrom]);

    useEffect(() => {
        if (tableDateTo) {
            localStorage.setItem('contributions-table-dateTo', tableDateTo.toISOString());
        } else {
            localStorage.removeItem('contributions-table-dateTo');
        }
    }, [tableDateTo]);

    useEffect(() => {
        localStorage.setItem('contributions-calendar-typeFilter', calendarTypeFilter);
    }, [calendarTypeFilter]);

    useEffect(() => {
        localStorage.setItem('contributions-calendar-yearFilter', calendarYearFilter);
    }, [calendarYearFilter]);

    useEffect(() => {
        localStorage.setItem('contributions-calendar-monthFilter', calendarMonthFilter);
    }, [calendarMonthFilter]);

    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this contribution version?")) {
            destroy(ContributionVersionController.destroy(id).url);
        }
    }

    const viewContributionBrackets = (version: ContributionVersion) => {
        setSelectedVersion(version);
        setIsModalOpen(true);
    };

    const clearDateFilters = () => {
        setTableDateFrom(undefined);
        setTableDateTo(undefined);
    };

    // Filter versions for table view with date range
    const tableFilteredVersions = useMemo(() => {
        let filtered = contributionVersions;
        
        if (tableTypeFilter !== 'all') {
            filtered = filtered.filter(version => version.type === tableTypeFilter);
        }
        
        // Apply date range filter
        if (tableDateFrom) {
            filtered = filtered.filter(version => {
                const effectiveDate = new Date(version.effective_from);
                return effectiveDate >= tableDateFrom;
            });
        }
        
        if (tableDateTo) {
            filtered = filtered.filter(version => {
                const effectiveDate = new Date(version.effective_from);
                // Add one day to include the end date
                const endDate = new Date(tableDateTo);
                endDate.setDate(endDate.getDate() + 1);
                return effectiveDate <= endDate;
            });
        }
        
        return filtered;
    }, [contributionVersions, tableTypeFilter, tableDateFrom, tableDateTo]);

    // Filter versions for calendar view
    const calendarFilteredVersions = useMemo(() => {
        let filtered = contributionVersions;
        
        if (calendarTypeFilter !== 'all') {
            filtered = filtered.filter(version => version.type === calendarTypeFilter);
        }
        
        if (calendarYearFilter !== 'all') {
            filtered = filtered.filter(version => {
                const versionYear = new Date(version.effective_from).getFullYear().toString();
                return versionYear === calendarYearFilter;
            });
        }
        
        if (calendarMonthFilter !== 'all') {
            filtered = filtered.filter(version => {
                const versionMonth = (new Date(version.effective_from).getMonth() + 1).toString();
                return versionMonth === calendarMonthFilter;
            });
        }
        
        return filtered;
    }, [contributionVersions, calendarTypeFilter, calendarYearFilter, calendarMonthFilter]);

    // Group versions by month for calendar view using calendarFilteredVersions
    const calendarData = useMemo(() => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const year = parseInt(calendarYearFilter) || new Date().getFullYear();
        
        return months.map((month, index) => {
            const monthNum = index + 1;
            const versionsInMonth = calendarFilteredVersions.filter(version => {
                const versionDate = new Date(version.effective_from);
                return versionDate.getFullYear() === year && 
                       versionDate.getMonth() === index;
            });
            
            return {
                month,
                monthNum,
                versions: versionsInMonth,
                hasVersions: versionsInMonth.length > 0,
                sssCount: versionsInMonth.filter(v => v.type === 'sss').length,
                philhealthCount: versionsInMonth.filter(v => v.type === 'philhealth').length,
                pagibigCount: versionsInMonth.filter(v => v.type === 'pagibig').length,
            };
        });
    }, [calendarFilteredVersions, calendarYearFilter]);

    // Get available years from data
    const availableYears = useMemo(() => {
        const years = contributionVersions.map(v => 
            new Date(v.effective_from).getFullYear().toString()
        );
        return [...new Set(years)].sort().reverse();
    }, [contributionVersions]);

    const getContributionTypeColor = (type: string) => {
        switch(type) {
            case 'sss':
                return 'bg-blue-100 text-blue-800';
            case 'philhealth':
                return 'bg-green-100 text-green-800';
            case 'pagibig':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getContributionTypeLabel = (type: string) => {
        switch(type) {
            case 'sss':
                return 'SSS';
            case 'philhealth':
                return 'PhilHealth';
            case 'pagibig':
                return 'Pag-IBIG';
            default:
                return type;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatPercentage = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount / 100);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contributions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 px-10  ">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Contribution Versions</h1>
                    <div className="flex items-center gap-2">
                        {/* View Toggle */}
                        <div className="flex items-center border rounded-md mr-2">
                            <Button
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                                className="rounded-r-none"
                            >
                                Table
                            </Button>
                            <Button
                                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('calendar')}
                                className="rounded-l-none"
                            >
                                <CalendarDays className="h-4 w-4 mr-1" />
                                Calendar
                            </Button>
                        </div>
                        <Link 
                            href={ContributionVersionController.create()} 
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            + Create Contribution Version
                        </Link>
                    </div>
                </div>
                
                {contributionVersions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Calculator className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No contribution versions yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Create your first contribution version to set up SSS, PhilHealth, and Pag-IBIG contribution tables with their corresponding brackets.
                        </p>
                        <Link href={ContributionVersionController.create()}>
                            <Button className="gap-2">
                                Create Your First Version
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Filter Section - FIXED LAYOUT: Left side for filters, right side empty */}
                        {viewMode === 'calendar' ? (
                            <div className="flex justify-between items-center px-4">
                                <div className="flex items-center gap-2">
                                    <Select value={calendarYearFilter} onValueChange={setCalendarYearFilter}>
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Years</SelectItem>
                                            {availableYears.map(year => (
                                                <SelectItem key={year} value={year}>{year}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={calendarMonthFilter} onValueChange={setCalendarMonthFilter}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Months</SelectItem>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <SelectItem key={month} value={month.toString()}>
                                                    {new Date(2000, month - 1, 1).toLocaleString('default', { month: 'long' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    
                                    <Select value={calendarTypeFilter} onValueChange={setCalendarTypeFilter}>
                                        <SelectTrigger className="w-[130px]">
                                            <SelectValue placeholder="Filter by Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="sss">SSS</SelectItem>
                                            <SelectItem value="philhealth">PhilHealth</SelectItem>
                                            <SelectItem value="pagibig">Pag-IBIG</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Empty div for right side to maintain flex-between */}
                                <div></div>
                            </div>
                        ) : (
                            /* Table View Filters - FIXED LAYOUT: Left side for filters */
/* Table View Filters - FIXED: From and To side by side with X inside filter */
<div className="flex justify-between items-center px-4">
    <div className="flex items-center gap-3">
        <Select value={tableTypeFilter} onValueChange={setTableTypeFilter}>
            <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sss">SSS</SelectItem>
                <SelectItem value="philhealth">PhilHealth</SelectItem>
                <SelectItem value="pagibig">Pag-IBIG</SelectItem>
            </SelectContent>
        </Select>

        {/* Date Range Filter - with X button inside */}
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-[320px] justify-between text-left font-normal relative group",
                        !tableDateFrom && !tableDateTo && "text-muted-foreground"
                    )}
                >
                    <span className="flex items-center truncate">
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {tableDateFrom || tableDateTo ? (
                            <span className="truncate">
                                {tableDateFrom ? format(tableDateFrom, "MMM d, yyyy") : "Any"} - {tableDateTo ? format(tableDateTo, "MMM d, yyyy") : "Any"}
                            </span>
                        ) : (
                            <span>Filter by effective date</span>
                        )}
                    </span>
                    
                    {/* X Button inside the filter button */}
                    {(tableDateFrom || tableDateTo) && (
                        <span 
                            onClick={(e) => {
                                e.stopPropagation();
                                clearDateFilters();
                            }}
                            className="ml-2 rounded-full hover:bg-gray-200 p-1 -mr-1 transition-colors"
                            role="button"
                            tabIndex={0}
                            aria-label="Clear date filter"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                    <div className="text-sm font-medium mb-3">Select Date Range</div>
                    <div className="flex gap-4">
                        {/* From Calendar */}
                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">From</div>
                            <Calendar
                                mode="single"
                                selected={tableDateFrom}
                                onSelect={setTableDateFrom}
                                initialFocus
                                className="rounded-md border"
                            />
                        </div>
                        {/* To Calendar */}
                        <div>
                            <div className="text-xs font-medium text-gray-500 mb-2">To</div>
                            <Calendar
                                mode="single"
                                selected={tableDateTo}
                                onSelect={setTableDateTo}
                                initialFocus
                                className="rounded-md border"
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    </div>
    {/* Empty div for right side to maintain flex-between */}
    <div></div>
</div>
                        )}

                        {viewMode === 'table' ? (
                            /* Table View - use tableFilteredVersions */
                            <Table>
                                <TableCaption>A list of all contribution versions.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Effective From</TableHead>
                                        <TableHead>Effective To</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableFilteredVersions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                No contribution versions found with the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        tableFilteredVersions.map((version) => (
                                            <TableRow key={version.id}>
                                                <TableCell>
                                                    <Badge className={getContributionTypeColor(version.type)}>
                                                        {getContributionTypeLabel(version.type)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(version.effective_from)}</TableCell>
                                                <TableCell>{formatDate(version.effective_to)}</TableCell>
                                                <TableCell className="space-x-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => viewContributionBrackets(version)}
                                                    >
                                                        View Brackets
                                                    </Button>
                                                    <Link 
                                                        href={ContributionVersionController.edit(version.id)}
                                                        className="inline-flex items-center justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/90"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="sm"
                                                        onClick={() => handleDelete(version.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            /* Calendar View - use calendarFilteredVersions through calendarData */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {calendarData.map((monthData) => (
                                    <Card key={monthData.month} className={!monthData.hasVersions ? 'opacity-50' : ''}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg flex justify-between items-center">
                                                <span>{monthData.month} {calendarYearFilter !== 'all' ? calendarYearFilter : ''}</span>
                                                {monthData.hasVersions && (
                                                    <Badge variant="outline">{monthData.versions.length} version(s)</Badge>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {monthData.hasVersions ? (
                                                <div className="space-y-3">
                                                    {/* Summary badges */}
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {monthData.sssCount > 0 && (
                                                            <Badge className="bg-blue-100 text-blue-800">
                                                                SSS: {monthData.sssCount}
                                                            </Badge>
                                                        )}
                                                        {monthData.philhealthCount > 0 && (
                                                            <Badge className="bg-green-100 text-green-800">
                                                                PhilHealth: {monthData.philhealthCount}
                                                            </Badge>
                                                        )}
                                                        {monthData.pagibigCount > 0 && (
                                                            <Badge className="bg-purple-100 text-purple-800">
                                                                Pag-IBIG: {monthData.pagibigCount}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    {/* List of versions */}
                                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                                        {monthData.versions.map((version) => (
                                                            <div 
                                                                key={version.id}
                                                                className="p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
                                                                onClick={() => viewContributionBrackets(version)}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <Badge className={getContributionTypeColor(version.type)}>
                                                                        {getContributionTypeLabel(version.type)}
                                                                    </Badge>
                                                                    <span className="text-xs text-gray-500">
                                                                        Effective: {new Date(version.effective_from).getDate()} {new Date(version.effective_from).toLocaleString('default', { month: 'short' })}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-600 mt-1">
                                                                    {version.contribution_brackets.length} bracket(s)
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    to {formatDate(version.effective_to)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                                    <CalendarDays className="h-8 w-8 text-gray-300 mb-2" />
                                                    <p className="text-sm text-gray-500">No versions</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Modal for displaying contribution brackets */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                Contribution Brackets - {selectedVersion && getContributionTypeLabel(selectedVersion.type)}
                            </DialogTitle>
                            <DialogDescription>
                                <div className="-mt-1 space-y-1">
                                    <p><span className="font-bold text-black">Effective Period:</span> {selectedVersion && formatDate(selectedVersion.effective_from)} to {selectedVersion && formatDate(selectedVersion.effective_to)}</p>
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="mt-4">
                            {selectedVersion?.contribution_brackets && selectedVersion.contribution_brackets.length > 0 ? (
                                <div className="space-y-4 -mt-5">
                                    <Table className='border-2 rounded-lg'>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Salary Range</TableHead>
                                                <TableHead className="text-right">Employee Share</TableHead>
                                                <TableHead className="text-right">Employer Share</TableHead>
                                                <TableHead className="text-right">Total Contribution</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedVersion.contribution_brackets.map((bracket) => {
                                                const total = bracket.employee_share + bracket.employer_share;
                                                return (
                                                    <TableRow key={bracket.id}>
                                                        <TableCell className="font-medium">
                                                            {formatCurrency(bracket.salary_from)} - {formatCurrency(bracket.salary_to)}
                                                            {bracket.salary_to === 999999999 && ' (and above)'}
                                                        </TableCell>
                                                        <TableCell className="text-right">{formatPercentage(bracket.employee_share)}</TableCell>
                                                        <TableCell className="text-right">{formatPercentage(bracket.employer_share)}</TableCell>
                                                        <TableCell className="text-right font-medium">{formatPercentage(total)}</TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="rounded-full bg-gray-100 p-4 mb-4">
                                        <Percent className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-muted-foreground font-medium mb-1">No brackets found</p>
                                    <p className="text-sm text-gray-500">
                                        This contribution version doesn't have any brackets configured yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}