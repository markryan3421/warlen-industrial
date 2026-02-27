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
import { Input } from "./ui/input"
import { Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "./ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const hours = 1000;
export default function PayrollProcessingCards () {
    // Date range state
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
        to: new Date() // Today
    })

    return (
        <>
        <div className="p-5 px-7">
            <h1 className="text-lg font-semibold">Payroll Processing</h1>
            <p>Review and calculate salaries for the specific time-frame.</p>
        </div>

        <section className="grid grid-cols-4 gap-4 px-7 py-5 pb-9 mx-7 border-1 border-gray-300 rounded-lg">
            <div className="">
                <Label htmlFor="terms">Payroll Type</Label>
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
                    <SelectTrigger className="w-full max-w-48">
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
                    <SelectTrigger className="w-full max-w-48">
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
                <Button className="px-20 bg-white border-1 rounded-lg text-black"><ListFilter/>Filter</Button>
                <Button className="px-20 bg-white border-1 rounded-lg text-black hover:bg-gray/40"><RefreshCcw/>Refresh</Button>
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
                        {/* Show peso sign since showPeso is true */}
                        <PhilippinePeso className="h-7 w-5" />
                        124,000.50
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">+12.5%</span>
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
                        {/* Show peso sign since showPeso is true */}
                        <PhilippinePeso className="h-7 w-5" />
                        12
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">-12.5%</span>
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
                        {/* Show peso sign since showPeso is true */}
                        <PhilippinePeso className="h-7 w-5" />
                        124,000.50
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">+12.5%</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardFooter className="-mt-8 pb-3 text">
                    <span className="text-gray-600 text-sm">Total Hours: {hours} hrs</span>
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
                        <CardDescription className="font-extrabold text-base">Employee Count</CardDescription>
                        <CardDescription>
                            <SquareUserRound className="w-9 h-13 -mt-3 -mb-10 text-blue-800" />
                        </CardDescription>
                    </div>
                    <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-xl -mb-4 flex mt-6">
                        {/* Don't show peso sign since showPeso is false */}
                        1,234
                    </CardTitle>
                    <div className="flex justify-start gap-2 py-3">
                        {/* Percentage of difference compare to previous month */}
                        <span className="text-xs">+12.5%</span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                </CardHeader>
                <CardFooter className="-mt-8 pb-3 text">
                    <span className="text-gray-600 text-sm">Newly Hires</span>
                </CardFooter>
            </Card>
        </div>
        </>
    )
}