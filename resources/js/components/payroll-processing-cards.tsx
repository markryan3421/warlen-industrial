"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { RefreshCcw, ListFilter, CalendarIcon, Banknote, TrendingUp, TrendingDown, Wallet, SquareUserRound, PhilippinePeso, Newspaper } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "./ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useEffect, useState, useRef } from "react"

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
}

// Custom hook for counting animation
function useCountAnimation(end: number | string, duration: number = 1000, startOnMount: boolean = true) {
    const [count, setCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const countRef = useRef<number>(0)
    const animationRef = useRef<number>()

    // Parse the end value (handles strings with commas)
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

            // Easing function for smooth animation
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
            // Small delay to ensure component is mounted
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

    // Format the number with commas
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

export default function PayrollProcessingCards({
    payrolls = [],
    totalOvertimePay = 0,
    totalOvertimeHours = 0,
    totalDeductions = 0,
    totalNetPay = 0,
    totalGrossPay = 0,
    activeEmployee = 0,
    formatCurrency,
    formatNumber
}: PayrollProcessingCardsProps) {
    // Date range state
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
        to: new Date() // Today
    })

    // Calculate percentage changes (you can implement actual calculations later)
    const netPayPercentage = "+12.5%";
    const deductionsPercentage = "-12.5%";
    const overtimePercentage = "+12.5%";
    const employeePercentage = "+12.5%";

    return (
        <>
            {/* Header Section - Responsive */}
            <div className="p-4 sm:p-5 px-4 sm:px-7">
                <h1 className="text-base sm:text-lg font-semibold">Payroll Processing</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Review and calculate salaries for the specific time-frame.</p>
            </div>

            {/* Filter Section - Responsive Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-4 sm:px-7 py-5 pb-9 mx-4 sm:mx-7 border border-gray-300 rounded-lg">
                {/* Action Buttons - First on mobile/tablet, last on desktop */}
                <div className="flex flex-row sm:justify-between justify-center items-center space-x-2  -mr-20 lg:mt-6 sm:space-y-0 sm:space-x-3 order-1 lg:order-4 col-span-1 lg:col-span-1">
                    <div>
                        <Button className="lg:w-full sm:w-auto lg:w-full px-4 sm:px-8 lg:px-6 xl:px-12 bg-white border rounded-lg text-black hover:cursor-pointer hover:bg-gray-100 text-xs sm:text-sm">
                            <ListFilter className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Filter
                        </Button>
                        </div>
                        <div>
                        <Button className="lg:w-full sm:w-auto lg:w-full px-4 sm:px-8 lg:px-6 xl:px-12 bg-white border rounded-lg text-black hover:cursor-pointer hover:bg-gray-100 text-xs sm:text-sm">
                            <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Date Period Filter - Second on mobile/tablet, first on desktop */}
                <div className="w-full order-2 lg:order-1">
                    <Label htmlFor="terms" className="text-xs sm:text-sm">Payroll Date Period</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal text-xs sm:text-sm mt-1",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                                            {format(dateRange.to, "MMM dd, yyyy")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "MMM dd, yyyy")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                className="sm:number-of-months-2"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Payroll Type Filter - Third on mobile/tablet, second on desktop */}
                <div className="w-full order-3 lg:order-2">
                    <Label htmlFor="payroll-type" className="text-xs sm:text-sm">Payroll Type</Label>
                    <Select>
                        <SelectTrigger className="w-full mt-1 text-xs sm:text-sm hover:cursor-pointer hover:bg-gray-100">
                            <SelectValue placeholder="Select Payroll Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="monthly" className="text-xs sm:text-sm">Monthly</SelectItem>
                                <SelectItem value="yearly" className="text-xs sm:text-sm">Yearly</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Employee Batch Filter - Fourth on mobile/tablet, third on desktop */}
                <div className="w-full order-4 lg:order-3">
                    <Label htmlFor="employee-batch" className="text-xs sm:text-sm">Employee Batch</Label>
                    <Select>
                        <SelectTrigger className="w-full mt-1 text-xs sm:text-sm hover:cursor-pointer hover:bg-gray-100">
                            <SelectValue placeholder="Select Employee Batch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="regular-workers" className="text-xs sm:text-sm">Regular Workers</SelectItem>
                                <SelectItem value="contractors" className="text-xs sm:text-sm">Contractors</SelectItem>
                                <SelectItem value="project-managers" className="text-xs sm:text-sm">Project Managers</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </section>

            {/* Stats Cards Section - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 px-4 sm:px-7 mt-5">
                {/* Estimated Net Payroll Card */}
                <Card className="
                    @container/card
                    animate-in fade-in slide-in-from-bottom-4 duration-400
                    hover:-translate-y-1 hover:scale-100
                    transition-all ease-out
                ">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex justify-between items-start">
                            <CardDescription className="font-extrabold text-xs sm:text-base">Estimated Net Payroll</CardDescription>
                            <CardDescription>
                                <Newspaper className="w-6 h-6 sm:w-9 sm:h-9 -mt-1 -mb-2 sm:-mt-3 sm:-mb-10 text-blue-800" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-base sm:text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-2 sm:-mb-4 flex mt-3 sm:mt-6">
                            <PhilippinePeso className="h-4 w-4 sm:h-7 sm:w-5" />
                            <AnimatedValue
                                value={formatNumber(totalNetPay)}
                                duration={1000}
                                className="text-sm sm:text-base lg:text-xl  "
                            />
                        </CardTitle>
                        <div className="flex justify-start items-center gap-1 sm:gap-2 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm">{netPayPercentage}</span>
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-4 sm:-mt-8 pb-2 sm:pb-3 px-4 sm:px-6">
                        <span className="text-gray-600 text-xs sm:text-sm">Last Month</span>
                    </CardFooter>
                </Card>

                {/* Total Deductions Card */}
                <Card className="
                    @container/card
                    animate-in fade-in slide-in-from-bottom-4 duration-400
                    hover:-translate-y-1 hover:scale-100
                    transition-all ease-out
                ">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex justify-between items-start">
                            <CardDescription className="font-extrabold text-xs sm:text-base">Total Deductions</CardDescription>
                            <CardDescription>
                                <Banknote className="w-6 h-6 sm:w-9 sm:h-9 -mt-1 -mb-2 sm:-mt-3 sm:-mb-10 text-blue-800" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-base sm:text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-2 sm:-mb-4 flex mt-3 sm:mt-6">
                            <PhilippinePeso className="h-4 w-4 sm:h-7 sm:w-5" />
                            <AnimatedValue
                                value={formatNumber(totalDeductions)}
                                duration={1000}
                                className="text-sm sm:text-base lg:text-xl"
                            />
                        </CardTitle>
                        <div className="flex justify-start items-center gap-1 sm:gap-2 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm">{deductionsPercentage}</span>
                            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-4 sm:-mt-8 pb-2 sm:pb-3 px-4 sm:px-6">
                        <span className="text-gray-600 text-xs sm:text-sm">Approvals</span>
                    </CardFooter>
                </Card>

                {/* Total Overtime Pay Card */}
                <Card className="
                    @container/card
                    animate-in fade-in slide-in-from-bottom-4 duration-400
                    hover:-translate-y-1 hover:scale-100
                    transition-all ease-out
                ">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex justify-between items-start">
                            <CardDescription className="font-extrabold text-xs sm:text-base">Total Overtime Pay</CardDescription>
                            <CardDescription>
                                <Wallet className="w-6 h-6 sm:w-9 sm:h-9 -mt-1 -mb-2 sm:-mt-3 sm:-mb-10 text-blue-800" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-base sm:text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-2 sm:-mb-4 flex mt-3 sm:mt-6">
                            <PhilippinePeso className="h-4 w-4 sm:h-7 sm:w-5" />
                            <AnimatedValue
                                value={formatNumber(totalOvertimePay)}
                                duration={1000}
                                className="text-sm sm:text-base lg:text-xl"
                            />
                        </CardTitle>
                        <div className="flex justify-start items-center gap-1 sm:gap-2 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm">{overtimePercentage}</span>
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-4 sm:-mt-8 pb-2 sm:pb-3 px-4 sm:px-6">
                        <span className="text-gray-600 text-xs sm:text-sm">Total Hours: {totalOvertimeHours} hrs</span>
                    </CardFooter>
                </Card>

                {/* Active Employees Card */}
                <Card className="
                    @container/card
                    animate-in fade-in slide-in-from-bottom-4 duration-400
                    hover:-translate-y-1 hover:scale-100
                    transition-all ease-out
                ">
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex justify-between items-start">
                            <CardDescription className="font-extrabold text-xs sm:text-base">Active Employees</CardDescription>
                            <CardDescription>
                                <SquareUserRound className="w-6 h-6 sm:w-9 sm:h-9 -mt-1 -mb-2 sm:-mt-3 sm:-mb-10 text-blue-800" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-base sm:text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-2 sm:-mb-4 flex mt-3 sm:mt-6">
                            <AnimatedValue
                                value={activeEmployee}
                                duration={1000}
                                className="text-sm sm:text-base lg:text-xl"
                            />
                        </CardTitle>
                        <div className="flex justify-start items-center gap-1 sm:gap-2 py-2 sm:py-3">
                            <span className="text-xs sm:text-sm">{employeePercentage}</span>
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-4 sm:-mt-8 pb-2 sm:pb-3 px-4 sm:px-6">
                        <span className="text-gray-600 text-xs sm:text-sm">Active Status</span>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}