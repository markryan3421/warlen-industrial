import { Button } from "@headlessui/react";
import { Link } from "@inertiajs/react";
import { ScrollText, CalendarDays, UserRoundPlus, CalendarClock, ArrowRight, Info } from 'lucide-react'
import { memo } from "react";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const cardArrayItems = [
    {
        icon: UserRoundPlus,
        title: "Newly Registered",
        subtitle: "8 employees added",
        link: "/dashboard"
    },
    {
        icon: CalendarDays,
        title: "Schedule Deviation",
        subtitle: "4 early timeouts",
        link: "/dashboard"
    },
    {
        icon: CalendarClock,
        title: "Pending Requests",
        subtitle: "Employee requested a leave."
    },
    {
        icon: ScrollText,
        title: "Payroll Activity",
        subtitle: "You haven't run your payroll for a while now",
        link: "/dashboard"
    },
]

// Memoized card component
const AlertCard = memo(({ item, index }: { item: typeof cardArrayItems[0], index: number }) => {
    const Icon = item.icon
    
    return (
        <Button key={index} className="group animate-fade-in-out w-full">
            <Link href={item.link}>
                <Card className="w-full transition-all duration-300 group-hover:shadow-lg group-hover:border-blue-500 lg:col-span-5">
                    <CardHeader className='flex justify-between items-center'>
                        <div className="relative flex-1">
                            <Icon className='absolute -ml-3 md:h-5 md:w-5 md:mt-1 lg:ml-1 lg:h-6 lg:w-6 lg:mt-1'/>
                            <CardTitle className='pl-6 md:pl-4 text-xs lg:pl-10 lg:text-base text-left min-w-[150px]'>
                                {item.title}
                            </CardTitle>
                            <CardDescription className='pl-6 -ml-pxmd:w-[130px] lg:w-full md:pl-4 text-[10px] md:text-[10px] lg:pl-10 lg:text-xs pb-4 text-left '>
                                {item.subtitle}
                            </CardDescription>
                        </div>
                        <div className="flex-shrink-0">
                            <ArrowRight className='-ml-5 -mt-4 md:h-4 md:w-4 lg:-mt-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:text-blue-600 animate-[wiggle_1s_ease-in-out_infinite] group-hover:animate-[wiggle_1s_ease-in-out_infinite]'/>
                        </div>
                    </CardHeader>
                </Card>
            </Link>
        </Button>
    )
})

AlertCard.displayName = 'AlertCard'

export default memo(function SystemAlert() {
    return (
        <>
            {/* Alerts Column */}
            <div className='rounded-lg px-4 sm:px-0 lg:px-0'>
                <div className="flex flex-row gap-3">
                    <h3 className="font-semibold mb-4 md:text-sm">System Alerts</h3> 
                    <Info className="h-4 w-4 mt-1 md:h-4 md:w-4 lg:h-5 lg:w-5 lg:mt-0"/>
                </div>
                <div className='grid md:grid-cols-2 lg:grid-cols-1 gap-3'> 
                    {cardArrayItems.map((item, index) => (
                        <AlertCard key={index} item={item} index={index} />
                    ))}
                </div>
            </div>
        </>
    )
});