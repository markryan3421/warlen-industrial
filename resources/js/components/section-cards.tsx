import { TrendingUp, PhilippinePeso, Inbox, UsersRound, CalendarClock, HandCoins, EllipsisVertical } from "lucide-react"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card"
import { Button } from "@headlessui/react"
import { Link } from "@inertiajs/react"
import { useEffect, useState, useRef, memo, useCallback, useMemo, useLayoutEffect } from "react"
import { cn } from "@/lib/utils"
import PayrollController from "@/actions/App/Http/Controllers/PayrollController"
import ApplicationLeaveController from "@/actions/App/Http/Controllers/ApplicationLeaveController";
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';

// In React 18 dev/StrictMode, components can mount/unmount/mount again.
// This ensures the count-up animation only runs once per value+duration.
const hasAnimatedOnceByKey = new Map<string, true>()

// Custom hook for counting animation - optimized with useCallback and useMemo
function useCountAnimation(end: number | string, duration: number = 1000, startOnMount: boolean = true) {
    const [count, setCount] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const isAnimatingRef = useRef(false)
    const countRef = useRef<number>(0)
    const animationRef = useRef<number | undefined>(undefined)
    const startTimeRef = useRef<number>(0)
    const shouldAnimateThisMountRef = useRef(false)

    // Parse the end value (handles strings with commas) - memoized
    const parseNumericValue = useCallback((val: number | string): number => {
        if (typeof val === 'number') return val
        return parseFloat(val.replace(/,/g, '')) || 0
    }, [])

    const numericEnd = useMemo(() => parseNumericValue(end), [end, parseNumericValue])

    const animationKey = useMemo(() => `${String(end)}|${duration}`, [end, duration])

    useLayoutEffect(() => {
        if (!startOnMount) return

        const alreadyAnimated = hasAnimatedOnceByKey.get(animationKey)
        shouldAnimateThisMountRef.current = !alreadyAnimated

        if (alreadyAnimated) {
            // Prevent intermediate "0" render from looking like a rerun.
            setCount(numericEnd)
            setIsAnimating(false)
            isAnimatingRef.current = false
        }
    }, [animationKey, startOnMount, numericEnd])

    const startAnimation = useCallback(() => {
        // If this key was already animated (e.g. another mount started it),
        // don't run again.
        if (hasAnimatedOnceByKey.get(animationKey)) return

        if (isAnimatingRef.current) return

        // Mark only when we actually start, so StrictMode's first mount
        // (which may get unmounted before the timer fires) doesn't block
        // the real animation.
        hasAnimatedOnceByKey.set(animationKey, true)

        isAnimatingRef.current = true
        setIsAnimating(true)
        startTimeRef.current = performance.now()
        const startValue = 0

        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTimeRef.current
            const progress = Math.min(elapsedTime / duration, 1)

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            const currentCount = startValue + (numericEnd - startValue) * easeOutQuart

            setCount(currentCount)
            countRef.current = currentCount

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate)
                return
            } else {
                setCount(numericEnd)
                setIsAnimating(false)
                isAnimatingRef.current = false
            }
        }

        animationRef.current = requestAnimationFrame(animate)
    }, [animationKey, numericEnd, duration])

    useEffect(() => {
        if (!startOnMount) return

        if (!shouldAnimateThisMountRef.current) {
            // Safety: ensure we never animate on this mount.
            setCount(numericEnd)
            setIsAnimating(false)
            isAnimatingRef.current = false
            return
        }

        // Reduced delay for faster initial animation
        const timer = setTimeout(() => startAnimation(), 500)

        return () => {
            clearTimeout(timer)
            if (animationRef.current) cancelAnimationFrame(animationRef.current)
            animationRef.current = undefined
            isAnimatingRef.current = false
            setIsAnimating(false)
        }
    }, [startOnMount, numericEnd, startAnimation])

    return { count, isAnimating, startAnimation }
}

// Component for animated value with formatting - memoized
const AnimatedValue = memo(({
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
}) => {
    const { count } = useCountAnimation(value, duration, startOnMount)

    // Format the number with commas - memoized with useCallback
    const formatNumber = useCallback((num: number): string => {
        if (Number.isInteger(num)) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
        }
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }, [])

    const formattedValue = useMemo(() => formatNumber(count), [count, formatNumber])

    return (
        <span className={className}>
            {prefix}{formattedValue}{suffix}
        </span>
    )
})

AnimatedValue.displayName = 'AnimatedValue'

// Memoized individual card component for better performance
const StatCard = memo(({
    title,
    value,
    icon: Icon,
    trend,
    footer,
    valuePrefix,
    customClasses,
    iconSize = "w-5 h-5 md:w-6 md:h-6"
}: {
    title: string
    value: string
    icon: any
    trend?: string
    footer: string
    valuePrefix?: React.ReactNode
    customClasses?: {
        header?: string
        title?: string
        value?: string
        valueWrapper?: string
        footer?: string
        content?: string
    }
    iconSize?: string
}) => {
    return (
        <Card className="
            @container/card border-2 border-gray-300
            animate-in fade-in slide-in-from-bottom-4 duration-400
            hover:-translate-y-1 hover:scale-100
            transition-all ease-out
            flex flex-col h-full
            py-3
        ">
            <CardHeader className={cn("pb-2", customClasses?.header)}>
                <div className="flex justify-between items-start">
                    <CardDescription className="font-extrabold text-base text-black">
                        {title}
                    </CardDescription>
                    <CardDescription>
                        <Icon className={iconSize + " text-blue-800"} />
                    </CardDescription>
                </div>

                {trend && (
                    <div className="flex justify-start gap-2 mt-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-500">{trend}</span>
                    </div>
                )}
            </CardHeader>

            {/* Spacer to push content to bottom */}
            <div className="flex-1"></div>

            <CardContent className={cn("pb-2 -mt-12", customClasses?.content)}>
                <CardTitle className={cn(
                    "text-xl font-semibold tabular-nums @[250px]/card:text-xl flex items-center -mb-2",
                    customClasses?.valueWrapper
                )}>
                    <span className = "-mb-5 mt-2">{valuePrefix}</span>
                    <AnimatedValue
                        value={value}
                        duration={1500}
                        className={cn("-mb-9 monetary-value text-[18px] md:text-[20px] lg:text-lg", customClasses?.value)}
                    />
                </CardTitle>
            </CardContent>

            <CardFooter className={cn("pt-0", customClasses?.footer)}>
                <span className="text-gray-600 text-[13px]">{footer}</span>
            </CardFooter>
        </Card>
    )
})

StatCard.displayName = 'StatCard'
interface SectionCardsProps {
    totalNetPay?: number;
    totalActiveEmployee?: number;
    openPayrollPeriod?: number;
    pendingApplicationLeave?: number;
}

export const SectionCards = memo(function SectionCards({
    totalNetPay = 0, 
    totalActiveEmployee = 0 ,
    openPayrollPeriod = 0,
    pendingApplicationLeave = 0
}: SectionCardsProps) {
    // Memoize grid classes to prevent recalculation    
    const gridClasses = "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-4 px-4 mt-4 lg:px-10 lg:py-5 @xl/main:grid-cols-4 @5xl/main:grid-cols-4"

    return (
        <div className={gridClasses}>
            {/* Total Revenue Card */}
            <Link href={PayrollController.index()}>
            <StatCard
                title="Total Net Pay"
                value={totalNetPay}
                icon={PhilippinePeso}
                // trend="+12.5%"
                footer="Tap to view breakdown"
                iconSize="w-5 h-5 text-blue-800"
                valuePrefix={<PhilippinePeso className="h-7 w-4 md:-ml-1 md:w-5 lg:-ml-0" />}
            />
            </Link>

            {/* Anomalies Card */}
            <Link href={ApplicationLeaveController.index()}>
            <StatCard
                title="Pending Leave Requests"
                value={pendingApplicationLeave}
                icon={Inbox}
                // trend="+12.5%"
                footer="Need Approvals"
                iconSize="w-6 h-6 text-blue-800"
            />
            </Link>

            {/* Pending Actions Card */}
            <StatCard
                title="Payroll Activity"
                value={openPayrollPeriod}
                icon={CalendarClock}
                footer="You haven't run this month's payroll."
                iconSize="w-6 h-6 text-blue-800"
            />

            {/* Total Employees Card */}
            <Link href={EmployeeController.index()}>
            <StatCard
                title="Active Employees"
                value={totalActiveEmployee}
                icon={UsersRound}
                // trend="+12.5%"
                footer="New hires"
                iconSize="w-6 h-6 text-blue-800"
            />
            </Link>
        </div>
    )
})