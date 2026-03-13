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
    activeEmployee = 0,  // Add this line with default value
    formatCurrency,
    formatNumber 
}: PayrollProcessingCardsProps) {
    // Date range state
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
        to: new Date() // Today
    })

    // Remove the local employeeCount calculation since we're using activeEmployee from props
    // const employeeCount = payrolls.length;  // DELETE THIS LINE

    // Calculate percentage changes (you can implement actual calculations later)
    // For now, keeping the static percentages as placeholders
    const netPayPercentage = "+12.5%";
    const deductionsPercentage = "-12.5%";
    const overtimePercentage = "+12.5%";
    const employeePercentage = "+12.5%";

    return (
        <>
        <div className="p-5 px-7">
            <h1 className="text-lg font-semibold">Payroll Processing</h1>
            <p>Review and calculate salaries for the specific time-frame.</p>
        </div>

        <section className="grid grid-cols-4 gap-4 px-7 py-5 pb-9 mx-7 border-1 border-gray-300 rounded-lg">
            {/* Your filter section - unchanged */}
            <div className="">
                <Label htmlFor="terms">Payroll Date Period</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
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
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="ml-8">
                <Label htmlFor="terms">Payroll Type</Label>
                <Select>
                    <SelectTrigger className="w-full max-w-48 hover:cursor-pointer hover:bg-gray-100">
                        <SelectValue placeholder="Select Payroll Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <div className="ml-8">
                <Label htmlFor="terms">Employee Batch</Label>
                <Select>
                    <SelectTrigger className="w-full max-w-48 hover:cursor-pointer hover:bg-gray-100">
                        <SelectValue placeholder="Select Employee Batch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="regular-workers">Regular Workers</SelectItem>
                            <SelectItem value="Contractors">Contractors</SelectItem>
                            <SelectItem value="project-managers">Project Managers</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-center items-center mt-6 space-x-3">
                <Button className="px-20 bg-white border-1 rounded-lg text-black hover:cursor-pointer hover:bg-gray-100"><ListFilter/>Filter</Button>
                <Button className="px-20 bg-white border-1 rounded-lg text-black hover:cursor-pointer hover:bg-gray-100"><RefreshCcw/>Refresh</Button>
            </div>
        </section>

        <div className="grid grid-cols-4 gap-4 p-3 px-7 mt-5">

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
                        {/* Show peso sign */}
                        <PhilippinePeso className="h-7 w-5" />
                        <AnimatedValue
                            value={formatNumber(totalNetPay)}
                            duration={1000}
                        />
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">{netPayPercentage}</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
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
                        {/* Show peso sign */}
                        <PhilippinePeso className="h-7 w-5" />
                        <AnimatedValue
                            value={formatNumber(totalDeductions)}
                            duration={1000}
                        />
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">{deductionsPercentage}</span>
                        <TrendingDown className="h-4 w-4 text-red-600" />
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
                        {/* Show peso sign */}
                        <PhilippinePeso className="h-7 w-5" />
                        <AnimatedValue
                            value={formatNumber(totalOvertimePay)}
                            duration={1000}
                        />
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">{overtimePercentage}</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
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
                        {/* Don't show peso sign */}
                        <AnimatedValue
                            value={activeEmployee} 
                            duration={1000}
                        />
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">{employeePercentage}</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardFooter className="-mt-8 pb-3 text">
                    <span className="text-gray-600 text-sm">Active Status</span>  {/* Changed from "Newly Hires" to "Active Status" */}
                </CardFooter>
            </Card>
        </div>
        </>
    )
}