import { TrendingDown, TrendingUp, Users, PhilippinePeso, Inbox, UsersRound, CalendarClock, HandCoins, MoveUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@headlessui/react"
import { Link } from "@inertiajs/react"
import { title } from "process"

const cardItems = [
    {
        title: "Total Revenue",
        symbol: {type: "icon", value: PhilippinePeso},
        value: "124,000.50",
        badge: "+12.5%",
        footer: "Last Month",
        icon: TrendingUp
    },
    {
        title: "Anomalies",
        symbol: {type: "icon", value: Inbox},
        value: "12",
        badge: "+12.5%",
        footer: "Approvals",
        icon: TrendingUp
    },
    {
        title: "Pending Actions",
        symbol: {type: "icon", value: CalendarClock},
        value: "124,000.50",
        badge: "+12.5%",
        footer: "Last Month",
        icon: TrendingUp
    },
    {
        title: "Total Employees",
        symbol: {type: "icon", value: UsersRound},
        value: "1,234",
        badge: "+12.5%",
        footer: "Newly Hires",
        icon: TrendingUp
    }
]
export function SectionCards() {
    return (
        <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {/* Total Revenue Card */}
            <Card className="group relative py-4 overflow-hidden border border-gray-200 shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl dark:border-gray-800">
                <div className="absolute -right-10 h-40 w-40 rounded-full blur-3xl transition-all group-hover:scale-150"></div>

                <CardHeader className="relative pb-0">
                    <div className="flex items-center justify-between">
                        <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Total Revenue
                        </CardDescription>
                        <div className="rounded-lg p-2 text-orange-600 dark:text-orange-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        $1,250.00
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge className="border-0 px-2 py-0.5 text-xs font-medium text-white">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            +12.5%
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
                    </div>
                </CardHeader>

                <CardFooter className="relative mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        <span className="text-gray-700 dark:text-gray-300">Trending up this month</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Visitors for the last 6 months
                    </div>
                </CardFooter>
            </Card>

            {/* New Customers Card */}
            <Card className="group relative overflow-hidden border border-gray-200 shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl dark:border-gray-800">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-all group-hover:scale-150"></div>

                <CardHeader className="relative pb-0">
                    <div className="flex items-center justify-between">
                        <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            New Customers
                        </CardDescription>
                        <div className="rounded-lg p-2 text-violet-600 dark:text-orange-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        1,234
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge className="border-0 px-2 py-0.5 text-xs font-medium text-white">
                            <TrendingDown className="mr-1 h-3 w-3" />
                            -20%
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
                    </div>

                        <Button className='py-2 flex justify-center items-center border-1 rounded-md bg-[#05469D] mt-3'>
                            <Link className="text-white text-sm ml-5" href="/payroll"><HandCoins className="absolute -ml-8 h-5 w-8" />Run Payroll</Link>
                        </Button>
                        <Button className='py-2 flex justify-center items-center border-1 rounded-md bg-white'>
                            <Link className="text-black text-sm ml-5"><MoveUpRight className="absolute -ml-8 h-5 w-8" />View Full Report</Link>
                        </Button>
                </CardHeader>

                <CardFooter className="relative mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingDown className="h-4 w-4 text-red-500 dark:text-red-400" />
                        <span className="text-gray-700 dark:text-gray-300">Down 20% this period</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Acquisition needs attention
                    </div>
                </CardFooter>
            </Card>

            {/* Active Accounts Card */}
            <Card className="group relative overflow-hidden shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-all group-hover:scale-150"></div>

                <CardHeader className="relative pb-0">
                    <div className="flex items-center justify-between">
                        <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Active Accounts
                        </CardDescription>
                        <div className="rounded-lg p-2 text-orange-600 dark:text-orange-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        45,678
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge className="border-0 px-2 py-0.5 text-xs font-medium text-white">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            +12.5%
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">vs last month</span>
                    </div>
                </CardHeader>

                <CardFooter className="relative mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        <span className="text-gray-700 dark:text-gray-300">Strong user retention</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Engagement exceeds targets
                    </div>
                </CardFooter>
            </Card>

            {/* Growth Rate Card */}
            <Card className="group relative overflow-hidden border border-gray-200 shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl dark:border-gray-800">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-all group-hover:scale-150"></div>

                <CardHeader className="relative pb-0">
                    <div className="flex items-center justify-between">
                        <CardDescription className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Growth Rate
                        </CardDescription>
                        <div className="rounded-lg p-2 text-orange-600 dark:text-orange-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <CardTitle className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        4.5%
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2">
                        <Badge className="border-0 px-2 py-0.5 text-xs font-medium text-white">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            +4.5%
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">vs target</span>
                    </div>
                </CardHeader>

                <CardFooter className="relative mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        <span className="text-gray-700 dark:text-gray-300">Steady performance</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Meets growth projections
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
