"use client"
import { format } from "date-fns"
import { RefreshCcw, Banknote, TrendingUp, TrendingDown, Wallet, SquareUserRound, PhilippinePeso, Newspaper, Calendar as CalendarIcon, X } from "lucide-react"
import * as React from "react"
import { useEffect, useState, useRef } from "react"
import { CustomHeader } from '@/components/custom-header'
import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

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

export default function PayrollProcessingCards({
    payrolls = [],
    totalOvertimePay = 0,
    totalOvertimeHours = 0,
    totalDeductions = 0,
    totalNetPay = 0,
    activeEmployee = 0,
    formatCurrency,
    formatNumber,

    // New props
    totalFilteredPayrolls,
    totalOriginalPayrolls
}: PayrollProcessingCardsProps) {
    // Calculate total counts from the payrolls array (default view, no filtering)
    const totalPayrollCount = payrolls.length;
    const totalEmployeesCount = new Set(payrolls.map(p => p.employee_id)).size;
    
    // Calculate totals from the actual payroll data
    const calculatedTotalNetPay = payrolls.reduce((sum, payroll) => sum + (payroll.net_pay || 0), 0);
    const calculatedTotalDeductions = payrolls.reduce((sum, payroll) => sum + (payroll.total_deduction || 0), 0);
    const calculatedTotalGrossPay = payrolls.reduce((sum, payroll) => sum + (payroll.gross_pay || 0), 0);
    
    // Calculate overtime totals from payroll items
    const calculatedTotalOvertimePay = payrolls.reduce((sum, payroll) => {
        const overtimeItems = payroll.payroll_items?.filter(item => 
            item.type === 'earning' && 
            item.description?.toLowerCase().includes('overtime')
        ) || [];
        return sum + overtimeItems.reduce((itemSum, item) => itemSum + (item.amount || 0), 0);
    }, 0);
    
    const calculatedTotalOvertimeHours = payrolls.reduce((sum, payroll) => {
        const overtimeItems = payroll.payroll_items?.filter(item => 
            item.type === 'earning' && 
            item.description?.toLowerCase().includes('overtime')
        ) || [];
        // Assuming each overtime item represents hours, you may need to adjust this logic
        return sum + overtimeItems.length;
    }, 0);

    // Use calculated values for default view, or passed props if they represent totals
    const displayNetPay = totalNetPay > 0 ? totalNetPay : calculatedTotalNetPay;
    const displayDeductions = totalDeductions > 0 ? totalDeductions : calculatedTotalDeductions;
    const displayOvertimePay = totalOvertimePay > 0 ? totalOvertimePay : calculatedTotalOvertimePay;
    const displayOvertimeHours = totalOvertimeHours > 0 ? totalOvertimeHours : calculatedTotalOvertimeHours;
    const displayActiveEmployees = activeEmployee > 0 ? activeEmployee : totalEmployeesCount;

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 lg:mx-2 lg:mt-5">
                <Card className="
                @container/card
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                    <CardHeader>
                        <div className="flex justify-between pt-4">
                            <CardDescription className="font-extrabold text-base">Estimated Net Payroll</CardDescription>
                            <CardDescription>
                                <Newspaper className="w-9 h-13 -mt-3 -mb-10 text-blue-800" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-10">
                            {/* Show peso sign */}
                            <PhilippinePeso className="h-7 w-5" />
                            <AnimatedValue
                                value={formatNumber(displayNetPay)}
                                duration={1000}
                            />
                        </CardTitle>
                        <div className="flex justify-start gap-2 py-2">
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-8 pb-3 text">
                        <span className="text-gray-600 text-sm">Payroll period net pay ({totalPayrollCount} payrolls)</span>
                    </CardFooter>
                </Card>

                <Card className="
                @container/card
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                    <CardHeader>
                        <div className="flex justify-between pt-4">
                            <CardDescription className="font-extrabold text-base">Total Deductions</CardDescription>
                            <CardDescription>
                                <Banknote className="w-10 h-15 -mt-3 -mb-10 text-blue-900" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-10">
                            {/* Show peso sign */}
                            <PhilippinePeso className="h-7 w-5" />
                            <AnimatedValue
                                value={formatNumber(displayDeductions)}
                                duration={1000}
                            />
                        </CardTitle>
                        <div className="flex justify-start gap-2 py-2">
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-8 pb-3 text">
                        <span className="text-gray-600 text-sm">Total deductions this period</span>
                    </CardFooter>
                </Card>

                <Card className="
                @container/card
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                    <CardHeader>
                        <div className="flex justify-between pt-4">
                            <CardDescription className="font-extrabold text-base">Total Overtime Pay</CardDescription>
                            <CardDescription>
                                <Wallet className="w-9 h-13 -mt-3 -mb-10 text-blue-800" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-10">
                            {/* Show peso sign */}
                            <PhilippinePeso className="h-7 w-5" />
                            <AnimatedValue
                                value={formatNumber(displayOvertimePay)}
                                duration={1000}
                            />
                        </CardTitle>
                        <div className="flex justify-start gap-2 py-2">
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-8 pb-3 text">
                        <span className="text-gray-600 text-sm">Overtime pay ({displayOvertimeHours} hrs)</span>
                    </CardFooter>
                </Card>

                <Card className="
                @container/card
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                    <CardHeader>
                        <div className="flex justify-between pt-4">
                            <CardDescription className="font-extrabold text-base">Active Employees</CardDescription>
                            <CardDescription>
                                <SquareUserRound className="w-9 h-13 -mt-3 -mb-10 text-blue-800" />
                            </CardDescription>
                        </div>
                        <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-10">
                            {/* Don't show peso sign */}
                            <AnimatedValue
                                value={displayActiveEmployees}
                                duration={1000}
                            />
                        </CardTitle>
                        <div className="flex justify-start gap-2 py-2">
                           
                        </div>
                    </CardHeader>
                    <CardFooter className="-mt-8 pb-3 text">
                        <span className="text-gray-600 text-sm">Currently active employees</span>
                    </CardFooter>
                </Card>
            </div>  
            </div>
        </>
    )
}