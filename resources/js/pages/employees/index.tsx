import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { BreadcrumbItem } from '@/types';
import EmmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import {
    Users, MoreHorizontalIcon, Search, X, Filter, ChevronDown, Check, Circle, CheckCircle, XCircle,
    UserPlus, Calendar
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
];

interface Employee {
    id: number;
    position: {
        pos_name: string;
        deleted_at: string | null;
    } | null;
    branch: {
        branch_name: string;
        branch_address: string;
    } | null;
    site: {
        site_name: string;
        id: number;
    } | null;
    user: {
        name: string;
        email: string;
    };
    slug_emp: string;
    emp_code: string | number;
    pay_frequency: string;
    contract_start_date: string;
    contract_end_date: string;
    employee_status: string;
    hire_date?: string;
    created_at?: string;
}

interface BranchData {
    id: number;
    branch_name: string;
    branch_address: string;
    sites: Array<{
        id: number;
        site_name: string;
    }>;
}

interface PageProps {
    employees: Employee[];
    branchesData?: BranchData[];
    filters?: {
        date_from?: string;
        date_to?: string;
    };
}

export default function Index({ employees, branchesData = [], filters = {} }: PageProps) {
    const { delete: destroy } = useForm();

    // Refs for dropdown positioning
    const branchButtonRef = useRef<HTMLButtonElement>(null);
    const branchDropdownRef = useRef<HTMLDivElement>(null);
    const siteDropdownRef = useRef<HTMLDivElement>(null);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [positionSearchTerm, setPositionSearchTerm] = useState('');
    const [positionPopoverOpen, setPositionPopoverOpen] = useState(false);

    // Branch filter state
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [branchPopoverOpen, setBranchPopoverOpen] = useState(false);
    const [branchSearchTerm, setBranchSearchTerm] = useState('');

    // Site filter state
    const [selectedSite, setSelectedSite] = useState<string>('');
    const [sitePopoverOpen, setSitePopoverOpen] = useState(false);
    const [siteSearchTerm, setSiteSearchTerm] = useState('');

    // Status filter state - Using Switch
    const [showActiveOnly, setShowActiveOnly] = useState(true); // true = show only active employees

    // Date range filter state (similar to incentives)
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

    // Branch dropdown position for site dropdown
    const [branchDropdownPosition, setBranchDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    // Update branch dropdown position when it opens
    useEffect(() => {
        const updatePosition = () => {
            if (branchDropdownRef.current) {
                const rect = branchDropdownRef.current.getBoundingClientRect();
                setBranchDropdownPosition({
                    top: rect.top + window.scrollY,
                    left: rect.right + window.scrollX,
                    width: rect.width,
                });
            }
        };

        if (branchPopoverOpen && selectedBranch) {
            // Small delay to ensure the dropdown is rendered
            setTimeout(updatePosition, 10);
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [branchPopoverOpen, selectedBranch]);

    // Handle branch button click
    const handleBranchButtonClick = () => {
        const newState = !branchPopoverOpen;
        setBranchPopoverOpen(newState);
        if (!newState) {
            setSitePopoverOpen(false);
        }
    };

    // When branch is selected, open site dropdown
    useEffect(() => {
        if (selectedBranch && branchPopoverOpen) {
            // Small delay to ensure branch dropdown is rendered
            setTimeout(() => {
                setSitePopoverOpen(true);
            }, 50);
        } else if (!selectedBranch) {
            setSitePopoverOpen(false);
            setSelectedSite('');
        }
    }, [selectedBranch, branchPopoverOpen]);

    // Handle click outside to close both dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                branchButtonRef.current &&
                !branchButtonRef.current.contains(event.target as Node) &&
                branchDropdownRef.current &&
                !branchDropdownRef.current.contains(event.target as Node) &&
                siteDropdownRef.current &&
                !siteDropdownRef.current.contains(event.target as Node)
            ) {
                setBranchPopoverOpen(false);
                setSitePopoverOpen(false);
            }
        };

        if (branchPopoverOpen || sitePopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [branchPopoverOpen, sitePopoverOpen]);

    // Update URL when date filters change (similar to incentives)
    useEffect(() => {
        const params: any = {};

        if (dateFrom) {
            params.date_from = format(dateFrom, 'yyyy-MM-dd');
        }
        if (dateTo) {
            params.date_to = format(dateTo, 'yyyy-MM-dd');
        }

        // Preserve other filters if needed
        router.get('/employees', params, { preserveState: true, replace: true });
    }, [dateFrom, dateTo]);

    // Helper function
    const safeToLowerCase = (value: any): string => {
        if (value === null || value === undefined) return '';
        return String(value).toLowerCase();
    };

    // Get unique positions
    const allPositions = useMemo(() => {
        const positions = employees
            .map(emp => emp.position?.pos_name)
            .filter((pos): pos is string =>
                pos !== null && pos !== undefined && pos.trim() !== ''
            );
        return [...new Set(positions)].sort();
    }, [employees]);

    // Filter positions
    const filteredPositions = useMemo(() => {
        if (!positionSearchTerm.trim()) return allPositions;
        const term = safeToLowerCase(positionSearchTerm);
        return allPositions.filter(position =>
            safeToLowerCase(position).includes(term)
        );
    }, [allPositions, positionSearchTerm]);

    // Filter branches
    const filteredBranches = useMemo(() => {
        if (!branchSearchTerm.trim()) return branchesData;
        const term = safeToLowerCase(branchSearchTerm);
        return branchesData.filter(branch =>
            safeToLowerCase(branch.branch_name).includes(term)
        );
    }, [branchesData, branchSearchTerm]);

    // Get sites for selected branch
    const availableSites = useMemo(() => {
        if (!selectedBranch) return [];
        const branch = branchesData.find(b => b.branch_name === selectedBranch);
        return branch?.sites || [];
    }, [branchesData, selectedBranch]);

    // Filter sites
    const filteredSites = useMemo(() => {
        if (!siteSearchTerm.trim()) return availableSites;
        const term = safeToLowerCase(siteSearchTerm);
        return availableSites.filter(site =>
            safeToLowerCase(site.site_name).includes(term)
        );
    }, [availableSites, siteSearchTerm]);

    const hasValidPosition = (employee: Employee) => {
        return employee.position && !employee.position.deleted_at;
    }

    const handleDelete = (slug: string) => {
        if (confirm("Are you sure you want to delete this employee?")) {
            destroy(EmmployeeController.destroy(slug).url);
        }
    }

    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return '';
        }
    };

    const formatContractRange = (employee: Employee) => {
        if (employee.contract_start_date && employee.contract_end_date) {
            return `${formatDate(employee.contract_start_date)} - ${formatDate(employee.contract_end_date)}`;
        }
        return 'No contract period';
    };

    const clearDateFilters = () => {
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    // Filter employees
    const filteredEmployees = useMemo(() => {
        let filtered = employees;

        // Apply date range filter (using hire_date or created_at)
        if (dateFrom || dateTo) {
            filtered = filtered.filter(employee => {
                // Use hire_date if available, otherwise use created_at or contract_start_date
                const employeeDate = employee.hire_date || employee.created_at || employee.contract_start_date;
                
                if (!employeeDate) return false;

                const empDate = new Date(employeeDate);

                if (dateFrom && dateTo) {
                    // Both dates selected - check if date falls within range
                    return empDate >= dateFrom && empDate <= dateTo;
                } else if (dateFrom) {
                    // Only from date selected - dates after or on from date
                    return empDate >= dateFrom;
                } else if (dateTo) {
                    // Only to date selected - dates before or on to date
                    return empDate <= dateTo;
                }

                return true;
            });
        }

        if (selectedPositions.length > 0) {
            filtered = filtered.filter(employee =>
                employee.position?.pos_name && selectedPositions.includes(employee.position.pos_name)
            );
        }

        if (selectedBranch) {
            filtered = filtered.filter(employee =>
                employee.branch?.branch_name === selectedBranch
            );
        }

        if (selectedSite) {
            filtered = filtered.filter(employee =>
                employee.site?.site_name === selectedSite
            );
        }

        // Status filter - Using Switch
        if (showActiveOnly) {
            filtered = filtered.filter(employee =>
                ['active', 'Active', 'ACTIVE'].includes(employee.employee_status)
            );
        }

        if (searchTerm.trim()) {
            const term = safeToLowerCase(searchTerm);
            filtered = filtered.filter(employee => {
                const empCode = safeToLowerCase(employee.emp_code);
                const empName = safeToLowerCase(employee.user?.name);
                const positionName = safeToLowerCase(employee.position?.pos_name);
                const payFrequency = safeToLowerCase(employee.pay_frequency);
                const branchName = safeToLowerCase(employee.branch?.branch_name);
                const siteName = safeToLowerCase(employee.site?.site_name);
                const status = safeToLowerCase(employee.employee_status);

                return empCode.includes(term) ||
                    empName.includes(term) ||
                    positionName.includes(term) ||
                    payFrequency.includes(term) ||
                    branchName.includes(term) ||
                    siteName.includes(term) ||
                    status.includes(term);
            });
        }

        return filtered;
    }, [employees, searchTerm, selectedPositions, selectedBranch, selectedSite, showActiveOnly, dateFrom, dateTo]);

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedPositions([]);
        setSelectedBranch('');
        setSelectedSite('');
        setShowActiveOnly(true); // Reset to show active only
        setDateFrom(undefined);
        setDateTo(undefined);
        setPositionSearchTerm('');
        setBranchSearchTerm('');
        setSiteSearchTerm('');
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handlePositionSelect = (position: string) => {
        setSelectedPositions(prev => {
            if (prev.includes(position)) {
                return prev.filter(p => p !== position);
            } else {
                return [...prev, position];
            }
        });
    };

    const handleBranchSelect = (branch: string) => {
        setSelectedBranch(prev => prev === branch ? '' : branch);
        setSelectedSite(''); // Reset site when branch changes
        setSiteSearchTerm(''); // Reset site search
        // Keep branch dropdown open
    };

    const handleSiteSelect = (site: string) => {
        setSelectedSite(prev => prev === site ? '' : site);
        // Keep both dropdowns open
    };

    const activeFiltersCount = [
        ...selectedPositions,
        selectedBranch,
        selectedSite,
        !showActiveOnly, // Count as filter if showing all employees
        dateFrom,
        dateTo
    ].filter(Boolean).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
            <div className="flex flex-1 flex-col gap-2 p-4">
                {/* Header with title and create button aligned right */}
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                        <p className="text-sm text-gray-500 mt-1">See who's active on this run.</p>
                    </div>
                    <Link href="/employees/create">
                        <Button className="h-14">
                            <UserPlus className="h-5 w-5" />
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-sm font-medium">Create</span>
                                <span className="text-xs font-normal">Employee</span>
                            </div>
                        </Button>
                    </Link>
                </div>

                {/* Header with filters */}
                {employees.length > 0 && (
                    <div className="flex items-end gap-4 flex-wrap">
                        {/* Search Bar with Label */}
                        <div className="flex flex-col min-w-[250px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Search by ID or name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-10 h-14 w-full"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 hover:bg-gray-100 transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Position Filter with Label */}
                        <div className="flex flex-col min-w-[140px]">
                            <Label className="text-xs font-semibold text-black mb-1 ml-1">
                                Position
                            </Label>
                            <Popover open={positionPopoverOpen} onOpenChange={setPositionPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={positionPopoverOpen}
                                        className={cn(
                                            "w-[140px] justify-between h-14",
                                            selectedPositions.length > 0 && "border-primary text-primary"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="truncate text-gray-500">
                                                {selectedPositions.length === 0
                                                    ? "Select Position"
                                                    : `${selectedPositions.length} selected`
                                                }
                                            </span>
                                        </div>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-3">
                                    <div className="space-y-3">
                                        <div className="relative w-full">
                                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                            <Input
                                                placeholder="Search positions..."
                                                value={positionSearchTerm}
                                                onChange={(e) => setPositionSearchTerm(e.target.value)}
                                                className="pl-7 h-8 text-sm w-full"
                                            />
                                            {positionSearchTerm && (
                                                <button
                                                    onClick={() => setPositionSearchTerm('')}
                                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        {filteredPositions.length === 0 ? (
                                            <div className="text-center py-3 text-sm text-gray-500">
                                                No positions found.
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5 max-h-[280px] overflow-y-auto p-1">
                                                {filteredPositions.map((position) => {
                                                    const isSelected = selectedPositions.includes(position);
                                                    return (
                                                        <Badge
                                                            key={position}
                                                            variant={isSelected ? "default" : "outline"}
                                                            className={cn(
                                                                "cursor-pointer px-2 py-0.5 text-xs font-normal inline-flex items-center gap-1 transition-all h-6 w-fit",
                                                                isSelected
                                                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                                                    : "hover:bg-gray-100"
                                                            )}
                                                            onClick={() => handlePositionSelect(position)}
                                                        >
                                                            <span>{position}</span>
                                                            {isSelected && (
                                                                <Check className="h-2.5 w-2.5 shrink-0" />
                                                            )}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {selectedPositions.length > 0 && (
                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedPositions([])}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-xs px-2"
                                                >
                                                    Clear all
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Branches Filter with Label */}
                        <div className="flex flex-col">
                            <Label className="text-xs font-semibold text-black mb-1 ml-1">
                                Branch
                            </Label>
                            <div className="relative">
                                <Button
                                    ref={branchButtonRef}
                                    variant="outline"
                                    onClick={handleBranchButtonClick}
                                    className={cn(
                                        "w-[140px] justify-between h-14",
                                        selectedBranch && "border-primary text-primary"
                                    )}
                                >
                                    <span className="truncate text-gray-500">{selectedBranch || "Select Branch"}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
                                </Button>

                                {/* Branch Dropdown */}
                                {branchPopoverOpen && (
                                    <div
                                        ref={branchDropdownRef}
                                        className="absolute z-50 w-[220px] bg-white rounded-md border shadow-md mt-1"
                                        style={{
                                            top: '100%',
                                            left: 0,
                                        }}
                                    >
                                        <div className="p-2 border-b">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="Search branches..."
                                                    value={branchSearchTerm}
                                                    onChange={(e) => setBranchSearchTerm(e.target.value)}
                                                    className="pl-8 h-9 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-[280px] overflow-y-auto">
                                            {filteredBranches.length === 0 ? (
                                                <div className="text-center py-4 text-sm text-gray-500">
                                                    No branches found
                                                </div>
                                            ) : (
                                                filteredBranches.map((branch) => (
                                                    <div
                                                        key={branch.id}
                                                        className={cn(
                                                            "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                                                            selectedBranch === branch.branch_name && "bg-blue-50 text-blue-600"
                                                        )}
                                                        onClick={() => handleBranchSelect(branch.branch_name)}
                                                    >
                                                        <span>{branch.branch_name}</span>
                                                        {selectedBranch === branch.branch_name && (
                                                            <Check className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {selectedBranch && sitePopoverOpen && branchDropdownPosition.left > 0 && (
                            <div
                                ref={siteDropdownRef}
                                className="fixed z-50 w-[220px] bg-white rounded-md border shadow-md"
                                style={{
                                    top: branchDropdownPosition.top,
                                    left: branchDropdownPosition.left + 1,
                                }}
                            >
                                <div className="p-2 border-b">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search sites..."
                                            value={siteSearchTerm}
                                            onChange={(e) => setSiteSearchTerm(e.target.value)}
                                            className="pl-8 h-9 text-sm"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[280px] overflow-y-auto">
                                    {/* All Sites option */}
                                    <div
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                                            !selectedSite && "bg-blue-50 text-blue-600 font-medium"
                                        )}
                                        onClick={() => handleSiteSelect('')}
                                    >
                                        <span>All Sites</span>
                                        {!selectedSite && <Check className="h-4 w-4 text-blue-600" />}
                                    </div>

                                    {/* Site options */}
                                    {filteredSites.length === 0 ? (
                                        <div className="text-center py-4 text-sm text-gray-500">
                                            No sites found
                                        </div>
                                    ) : (
                                        filteredSites.map((site) => (
                                            <div
                                                key={site.id}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50",
                                                    selectedSite === site.site_name && "bg-blue-50 text-blue-600"
                                                )}
                                                onClick={() => handleSiteSelect(site.site_name)}
                                            >
                                                <span>{site.site_name}</span>
                                                {selectedSite === site.site_name && (
                                                    <Check className="h-4 w-4 text-blue-600" />
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Date Range Filter - Added before Status */}
                        <div className="flex flex-col min-w-[300px]">
                            <Label className="text-xs font-semibold text-black mb-1 ml-1">
                                Hire Date Range
                            </Label>
                            <div className="relative">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-14",
                                                !dateFrom && !dateTo && "text-muted-foreground"
                                            )}
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
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <div className="flex">
                                            {/* Left Calendar */}
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

                                            {/* Right Calendar */}
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

                        {/* Status Switch - Active Only Toggle */}
                        <div className="flex flex-col border rounded-md px-3 py-2 bg-white shadow-sm min-w-[110px] h-14 justify-center">
                            <Label className="text-xs font-semibold text-black mb-0.5">
                                Status
                            </Label>
                            <div className="flex items-center">
                                <Label
                                    htmlFor="active-filter"
                                    className={cn(
                                        "text-sm cursor-pointer select-none mr-3",
                                        showActiveOnly ? "text-gray-600 font-medium" : "text-gray-600"
                                    )}
                                >
                                    Active
                                </Label>
                                <Switch
                                    id="active-filter"
                                    checked={showActiveOnly}
                                    onCheckedChange={setShowActiveOnly}
                                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Employee Table */}
                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="rounded-full bg-gray-100 p-6 mb-4">
                            <Users className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
                        <p className="text-gray-500 mb-6 max-w-sm">
                            Get started by creating your first employee.
                        </p>
                        <Link href="/employees/create">
                            <Button>Create Your First Employee</Button>
                        </Link>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-gray-50">
                        <Search className="h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm && selectedPositions.length > 0
                                ? `No employees matching "${searchTerm}" in selected positions found.`
                                : searchTerm
                                    ? `No employees matching "${searchTerm}" found.`
                                    : selectedBranch && selectedSite
                                        ? `No employees in ${selectedBranch} / ${selectedSite} found.`
                                        : selectedBranch
                                            ? `No employees in ${selectedBranch} found.`
                                            : dateFrom || dateTo
                                                ? `No employees found for the selected date range.`
                                                : !showActiveOnly
                                                    ? `No employees found.`
                                                    : "No employees match your current filters."
                            }
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="border rounded-lg overflow-hidden mt-4">
                            <Table>
                                <TableHeader className="bg-gray-100 font-black">
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Pay Frequency</TableHead>
                                        <TableHead>Branch</TableHead>
                                        <TableHead>Site</TableHead>
                                        <TableHead>Contract Period</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-[13px]">
                                    {filteredEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>{employee.emp_code}</TableCell>
                                            <TableCell>{employee.user?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                {hasValidPosition(employee) ? (
                                                    employee.position?.pos_name
                                                ) : (
                                                    <span className="text-gray-500 italic text-xs">Not assigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {employee.pay_frequency?.replace('_', ' ') || 'N/A'}
                                            </TableCell>
                                            <TableCell>{employee.branch?.branch_name || 'N/A'}</TableCell>
                                            <TableCell>{employee.site?.site_name || 'N/A'}</TableCell>
                                            <TableCell>{formatContractRange(employee)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${['active', 'Active', 'ACTIVE'].includes(employee.employee_status)
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {employee.employee_status || 'Unknown'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="icon" className="size-8 bg-transparent hover:cursor-pointer hover:bg-transparent text-black">
                                                            <MoreHorizontalIcon />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={EmmployeeController.edit(employee.slug_emp)} className="w-full">
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="hover:!bg-red-100 hover:!text-red-800 hover:cursor-pointer"
                                                                onClick={() => handleDelete(employee.slug_emp)}
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Show filter and total count */}
                        <div className="text-sm text-gray-500 flex justify-between items-center mt-2">
                            <span>
                                Showing {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
                            </span>
                            {activeFiltersCount > 0 && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    Filtered by: {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}