import { TrendingUp, PhilippinePeso, Inbox, UsersRound, CalendarClock, HandCoins, EllipsisVertical } from "lucide-react"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@headlessui/react"
import { Link } from "@inertiajs/react"
import { useEffect, useState, useRef } from "react"

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
    }, [])
    
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

export function SectionCards() {
    return (
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-10 @xl/main:grid-cols-5 @5xl/main:grid-cols-5">
            <Card className="
                @container/card border-2 border-gray-300
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                <CardHeader>
                    <div className="flex justify-between">
                        <CardDescription className="font-extrabold text-base text-black">Total Revenue</CardDescription>
                        <CardDescription>
                            <PhilippinePeso className="w-5 h-5 text-blue-800" />
                        </CardDescription>
                    </div>
                    <div className="flex justify-start gap-2">                  
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-500">+12.5%</span>
                    </div>
                    <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl flex mb-1 items-center">
                        <PhilippinePeso className="h-7 w-5" />
                        <AnimatedValue 
                            value="124,000.50"
                            duration={1500}
                            className="ml-1"
                        />
                    </CardTitle>
                </CardHeader>
                <CardFooter className="-mt-8 pb-3 flex justify-start">
                    <span className="text-gray-600 text-sm">Last Month</span>
                </CardFooter>
            </Card>
            
            <Card className="
                @container/card border-2 border-gray-300
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                <CardHeader>
                    <div className="flex justify-between">
                        <CardDescription className="font-extrabold text-base text-black">Anomalies</CardDescription>
                        <CardDescription>
                            <Inbox className="w-6 h-6 text-blue-800" />
                        </CardDescription>
                    </div>
                    <div className="flex justify-start gap-2">                  
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-500">+12.5%</span>
                    </div>
                    <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl flex mb-1 items-center">
                        <AnimatedValue 
                            value="12"
                            duration={1500}
                        />
                    </CardTitle>
                </CardHeader>
                <CardFooter className="-mt-8 pb-3 flex justify-start">
                    <span className="text-gray-600 text-sm">Approvals</span>
                </CardFooter>
            </Card>
            
            <Card className="
                @container/card border-2 border-gray-300
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                <CardHeader>
                    <div className="flex justify-between mb-7">
                        <CardDescription className="font-extrabold text-base text-black">Pending Actions</CardDescription>
                        <CardDescription>
                            <CalendarClock className="w-6 h-6 text-blue-800" />
                        </CardDescription>
                    </div>
                    <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl flex mb-1">
                        <AnimatedValue 
                            value="1"
                            duration={1500}
                        />
                    </CardTitle>
                </CardHeader>
                <CardFooter className="-mt-8 pb-3 flex justify-start">
                    <span className="text-gray-600 text-sm">Last Month</span>
                </CardFooter>
            </Card>
            
            <Card className="
                @container/card border-2 border-gray-300
                animate-in fade-in slide-in-from-bottom-4 duration-400
                hover:-translate-y-1 hover:scale-100
                transition-all ease-out
            ">
                <CardHeader>
                    <div className="flex justify-between">
                        <CardDescription className="font-extrabold text-base text-black">Total Employees</CardDescription>
                        <CardDescription>
                            <UsersRound className="w-6 h-6 text-blue-800" />
                        </CardDescription>
                    </div>
                    <div className="flex justify-start gap-2">                  
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-500">+12.5%</span>
                    </div>
                    <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl flex mb-1">
                        <AnimatedValue 
                            value="7"
                            duration={1500}
                        />
                    </CardTitle>
                </CardHeader>
                <CardFooter className="-mt-8 pb-3 flex justify-start">
                    <span className="text-gray-600 text-sm">New hires</span>
                </CardFooter>
            </Card>
            
            <Card className="
                @container/card border-2 border-gray-300 pb-3
            ">
                <CardHeader>
                    <div className="flex justify-between">
                        <CardDescription className="font-extrabold text-base text-black">Actions</CardDescription>
                        <CardDescription>
                            <EllipsisVertical className="w-5 h-5 text-black" />
                        </CardDescription>
                    </div>
                    <Button className="border-1 rounded-md py-1.5 bg-[#05469D] text-white hover:bg-[#05469D]/90 hover:text-white">
                        <Link className="text-sm flex justify-center" href="/payroll"> <HandCoins className="h-4 w-6"/>Run Payroll</Link>
                    </Button>
                    <Button className="border-1 rounded-md py-1.5 bg-white hover:bg-gray-100 hover:border-1">
                        <Link className="text-sm flex justify-center"> <HandCoins className="h-4 w-6"/>View Full Report</Link>
                    </Button>
                </CardHeader>
            </Card>
        </div>
    )
}