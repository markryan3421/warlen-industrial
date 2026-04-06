"use client"
import { format } from "date-fns"
import { RefreshCcw, Banknote, TrendingUp, TrendingDown, Wallet, SquareUserRound, PhilippinePeso, Newspaper, Calendar as CalendarIcon, X } from "lucide-react"
import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { CustomHeader } from '@/components/custom-header'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "./ui/select"

// Define the Payroll interface to match the one from the index page
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

interface Payroll {
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
        pay_frequency: string;
    };
    created_at: string;
    updated_at: string;
}

interface PayrollProcessingCardsProps {
    payrolls: Payroll[];
    totalOvertimePay: number;
    totalOvertimeHours: number;
    totalDeductions: number;
    totalNetPay: number;
    totalGrossPay: number;
    activeEmployee: number;
    formatCurrency: (amount: number) => string;
    formatNumber: (amount: number) => string;

    // Filter props
    dateFrom?: Date;
    dateTo?: Date;
    selectedFrequency: string;
    selectedPosition: string;
    onDateFromChange: (date: Date | undefined) => void;
    onDateToChange: (date: Date | undefined) => void;
    onFrequencyChange: (value: string) => void;
    onPositionChange: (value: string) => void;
    onRefresh: () => void;

    // Options for dropdowns
    frequencyOptions: string[];
    positionOptions: string[];

    // New props for filtered counts
    totalFilteredPayrolls?: number;
    totalOriginalPayrolls?: number;
}

// Custom hook for counting animation
function useCountAnimation(end: number | string, duration: number = 1000, startOnMount: boolean = true) {
    const [count, setCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const countRef = useRef<number>(0)
    const animationRef = useRef<number>()

    const parseNumericValue = (val: number | string): number => {
        if (typeof val === 'number') return val
        return parseFloat(val.replace(/,/g, '')) || 0
    }

    const numericEnd = parseNumericValue(end)

    const startAnimation = () => {
        if (isAnimating) return

        setIsAnimating(true)
        const startTime = performance.now()
        const startValue = 0

        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime
            const progress = Math.min(elapsedTime / duration, 1)
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const currentCount = startValue + (numericEnd - startValue) * easeOutQuart

            setCount(currentCount)
            countRef.current = currentCount

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate)
            } else {
                setCount(numericEnd)
                setIsAnimating(false)
            }
        }

        animationRef.current = requestAnimationFrame(animate)
    }

    useEffect(() => {
        if (startOnMount) {
            const timer = setTimeout(startAnimation, 100)
            return () => clearTimeout(timer)
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [numericEnd, startOnMount])

    return { count, isAnimating, startAnimation }
}

// Component for animated value with formatting
function AnimatedValue({
    value,
    prefix = "",
    suffix = "",
    duration = 1000,
    className = "",
    startOnMount = true
}: {
    value: string | number
    prefix?: string
    suffix?: string
    duration?: number
    className?: string
    startOnMount?: boolean
}) {
    const { count, startAnimation } = useCountAnimation(value, duration, startOnMount)

    const formatNumber = (num: number): string => {
        if (Number.isInteger(num)) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        }
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }

    return (
        <span
            className={className}
            onMouseEnter={() => !startOnMount && startAnimation()}
        >
            {prefix}{formatNumber(count)}{suffix}
        </span>
    )
}

// Helper function to format frequency display names
const getFrequencyDisplayName = (frequency: string): string => {
    const frequencyMap: Record<string, string> = {
        'monthly': 'Monthly',
        'semi_monthly': 'Semi-Monthly',
        'weekender': 'Weekender'
    }
    return frequencyMap[frequency] || frequency
}

export default function PayrollProcessingCards({
    payrolls = [],
    totalOvertimePay = 0,
    totalOvertimeHours = 0,
    totalDeductions = 0,
    totalNetPay = 0,
    activeEmployee = 0,
    formatCurrency,
    formatNumber,

    // Filter props
    dateFrom,
    dateTo,
    selectedFrequency,
    selectedPosition,
    onDateFromChange,
    onDateToChange,
    onFrequencyChange,
    onPositionChange,
    onRefresh,

    // Options
    frequencyOptions,
    positionOptions,

    // New props
    totalFilteredPayrolls,
    totalOriginalPayrolls
}: PayrollProcessingCardsProps) {
    // Calendar month states
    const [leftCalendarMonth, setLeftCalendarMonth] = React.useState<Date>(
        dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    )
    const [rightCalendarMonth, setRightCalendarMonth] = React.useState<Date>(
        dateFrom ? new Date(dateFrom.getFullYear(), dateFrom.getMonth() + 1, 1) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    )

    // Check if any filter is active
    const hasActiveFilters = React.useMemo(() => {
        return dateFrom !== undefined || dateTo !== undefined ||
            selectedFrequency !== "all" || selectedPosition !== "all";
    }, [dateFrom, dateTo, selectedFrequency, selectedPosition]);

    // Clear date filters function
    const clearDateFilters = () => {
        onDateFromChange(undefined)
        onDateToChange(undefined)
    }

    // Clear all filters function
    const clearAllFilters = () => {
        onDateFromChange(undefined)
        onDateToChange(undefined)
        onFrequencyChange("all")
        onPositionChange("all")
        onRefresh()
    }

    // Update calendar months when dateFrom changes
    React.useEffect(() => {
        if (dateFrom) {
            setLeftCalendarMonth(dateFrom)
            setRightCalendarMonth(new Date(dateFrom.getFullYear(), dateFrom.getMonth() + 1, 1))
        } else {
            // Reset to current month if no date selected
            const currentDate = new Date()
            setLeftCalendarMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
            setRightCalendarMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
        }
    }, [dateFrom])

    // Calculate percentage changes (you can implement actual calculations later)
    const netPayPercentage = hasActiveFilters ? "Filtered" : "+12.5%";
    const deductionsPercentage = hasActiveFilters ? "Filtered" : "-12.5%";
    const overtimePercentage = hasActiveFilters ? "Filtered" : "+12.5%";
    const employeePercentage = hasActiveFilters ? "Filtered" : "+12.5%";

    // Get the display value for frequency
    const getFrequencyDisplayValue = (value: string): string => {
        if (value === "all") return "All Frequencies"
        return getFrequencyDisplayName(value)
    }

    // Get the display value for position
    const getPositionDisplayValue = (value: string): string => {
        if (value === "all") return "All Positions"
        return value
    }

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-row { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>
            <div className="pp-header">
                <CustomHeader
                    className="mx-4"
                    icon={<Banknote className="h-6 w-6" />}
                    title="Run Payroll"
                    description="Manage and organize payroll periods with ease. Create, edit, and close payroll cycles."
                />

                <section className="flex flex-wrap items-end gap-4 px-7 py-5 pb-9 mx-4 border border-gray-300 rounded-lg">
                    {/* Date Range Picker */}
                    <div className="w-full sm:w-[300px]">
                        <Label htmlFor="date-range" className="mb-2 block text-sm font-medium">
                            Date Range
                        </Label>
                        <div className="relative">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal h-10"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFrom && dateTo ? (
                                            <>
                                                {format(dateFrom, 'MMM d, yyyy')} - {format(dateTo, 'MMM d, yyyy')}
                                            </>
                                        ) : (
                                            <span>Select date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="flex">
                                        <div className="border-r">
                                            <Calendar
                                                mode="range"
                                                selected={{
                                                    from: dateFrom,
                                                    to: dateTo,
                                                }}
                                                onSelect={(range) => {
                                                    onDateFromChange(range?.from)
                                                    onDateToChange(range?.to)
                                                }}
                                                month={leftCalendarMonth}
                                                onMonthChange={setLeftCalendarMonth}
                                                numberOfMonths={1}
                                                initialFocus
                                            />
                                        </div>
                                        <div>
                                            <Calendar
                                                mode="range"
                                                selected={{
                                                    from: dateFrom,
                                                    to: dateTo,
                                                }}
                                                onSelect={(range) => {
                                                    onDateFromChange(range?.from)
                                                    onDateToChange(range?.to)
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

                    {/* Pay Frequency */}
                    <div className="w-full sm:w-[200px]">
                        <Label htmlFor="pay-frequency" className="mb-2 block text-sm font-medium">
                            Pay Frequency
                        </Label>
                        <Select 
                            value={selectedFrequency} 
                            onValueChange={onFrequencyChange}
                        >
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select Pay Frequency">
                                    {getFrequencyDisplayValue(selectedFrequency)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">All Frequencies</SelectItem>
                                    {frequencyOptions.map((frequency, index) => (
                                        <SelectItem key={index} value={frequency}>
                                            {getFrequencyDisplayName(frequency)}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Employee Position */}
                    <div className="w-full sm:w-[200px]">
                        <Label htmlFor="employee-position" className="mb-2 block text-sm font-medium">
                            Employee Position
                        </Label>
                        <Select 
                            value={selectedPosition} 
                            onValueChange={onPositionChange}
                        >
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select Employee Position">
                                    {getPositionDisplayValue(selectedPosition)}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">All Positions</SelectItem>
                                    {positionOptions.map((position, index) => (
                                        <SelectItem key={index} value={position}>
                                            {position}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Refresh Button */}
                    <div className="flex items-end gap-2">
                        <Button
                            variant="outline"
                            className="h-10 px-8 gap-2"
                            onClick={onRefresh}
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </Button>
                        
                        {/* Clear All Filters Button - Only show when filters are active */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                className="h-10 px-4 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={clearAllFilters}
                            >
                                <X className="h-4 w-4" />
                                Clear All
                            </Button>
                        )}
                    </div>
                </section>

                {/* Filter indicator */}
                {hasActiveFilters && totalFilteredPayrolls !== undefined && totalOriginalPayrolls !== undefined && (
                    <div className="px-7 mt-2 flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-blue-600">{totalFilteredPayrolls}</span> of{" "}
                            <span className="font-semibold">{totalOriginalPayrolls}</span> records
                            {selectedFrequency !== "all" && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                    • Frequency: <span className="font-medium">{getFrequencyDisplayName(selectedFrequency)}</span>
                                </span>
                            )}
                            {selectedPosition !== "all" && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                    • Position: <span className="font-medium">{selectedPosition}</span>
                                </span>
                            )}
                            {(dateFrom || dateTo) && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                    • Date: {dateFrom && format(dateFrom, 'MMM d')} {dateTo && `- ${format(dateTo, 'MMM d, yyyy')}`}
                                </span>
                            )}
                        </p>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 lg:mx-2 lg:mt-5">
                    <Card className="
                        @container/card
                        animate-in fade-in slide-in-from-bottom-4 duration-400
                        hover:-translate-y-1 hover:scale-100
                        transition-all ease-out
                    ">
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardDescription className="font-extrabold text-base">Estimated Net Payroll</CardDescription>
                                <CardDescription>
                                    <Newspaper className="w-9 h-13 -mt-3 -mb-10 text-blue-800" />
                                </CardDescription>
                            </div>
                            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-6">
                                <PhilippinePeso className="h-7 w-5" />
                                <AnimatedValue
                                    value={formatNumber(totalNetPay)}
                                    duration={1000}
                                />
                            </CardTitle>
                            <div className="flex justify-start gap-2 py-3">
                                <span className="text-xs">{netPayPercentage}</span>
                                {!hasActiveFilters && <TrendingUp className="h-4 w-4 text-green-600" />}
                            </div>
                        </CardHeader>
                        <CardFooter className="-mt-8 pb-3 text">
                            <span className="text-gray-600 text-sm">Last Month</span>
                        </CardFooter>
                    </Card>

                    <Card className="
                        @container/card
                        animate-in fade-in slide-in-from-bottom-4 duration-400
                        hover:-translate-y-1 hover:scale-100
                        transition-all ease-out
                    ">
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardDescription className="font-extrabold text-base">Total Deductions</CardDescription>
                                <CardDescription>
                                    <Banknote className="w-10 h-15 -mt-3 -mb-10 text-blue-800" />
                                </CardDescription>
                            </div>
                            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-6">
                                <PhilippinePeso className="h-7 w-5" />
                                <AnimatedValue
                                    value={formatNumber(totalDeductions)}
                                    duration={1000}
                                />
                            </CardTitle>
                            <div className="flex justify-start gap-2 py-3">
                                <span className="text-xs">{deductionsPercentage}</span>
                                {!hasActiveFilters && <TrendingDown className="h-4 w-4 text-red-600" />}
                            </div>
                        </CardHeader>
                        <CardFooter className="-mt-8 pb-3 text">
                            <span className="text-gray-600 text-sm">Approvals</span>
                        </CardFooter>
                    </Card>

                    <Card className="
                        @container/card
                        animate-in fade-in slide-in-from-bottom-4 duration-400
                        hover:-translate-y-1 hover:scale-100
                        transition-all ease-out
                    ">
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardDescription className="font-extrabold text-base">Total Overtime Pay</CardDescription>
                                <CardDescription>
                                    <Wallet className="w-9 h-13 -mt-3 -mb-10 text-blue-800" />
                                </CardDescription>
                            </div>
                            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-6">
                                <PhilippinePeso className="h-7 w-5" />
                                <AnimatedValue
                                    value={formatNumber(totalOvertimePay)}
                                    duration={1000}
                                />
                            </CardTitle>
                            <div className="flex justify-start gap-2 py-3">
                                <span className="text-xs">{overtimePercentage}</span>
                                {!hasActiveFilters && <TrendingUp className="h-4 w-4 text-green-600" />}
                            </div>
                        </CardHeader>
                        <CardFooter className="-mt-8 pb-3 text">
                            <span className="text-gray-600 text-sm">Total Hours: {totalOvertimeHours} hrs</span>
                        </CardFooter>
                    </Card>

                    <Card className="
                        @container/card
                        animate-in fade-in slide-in-from-bottom-4 duration-400
                        hover:-translate-y-1 hover:scale-100
                        transition-all ease-out
                    ">
                        <CardHeader>
                            <div className="flex justify-between">
                                <CardDescription className="font-extrabold text-base">Active Employees</CardDescription>
                                <CardDescription>
                                    <SquareUserRound className="w-9 h-13 -mt-3 -mb-10 text-blue-800" />
                                </CardDescription>
                            </div>
                            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-6">
                                <AnimatedValue
                                    value={activeEmployee}
                                    duration={1000}
                                />
                            </CardTitle>
                            <div className="flex justify-start gap-2 py-3">
                                <span className="text-xs">{employeePercentage}</span>
                                {!hasActiveFilters && <TrendingUp className="h-4 w-4 text-green-600" />}
                            </div>
                        </CardHeader>
                        <CardFooter className="-mt-8 pb-3 text">
                            <span className="text-gray-600 text-sm">Active Status</span>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    )
}