import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ScrollText, CalendarDays, UserRoundPlus, CalendarClock, ArrowRight, Info } from 'lucide-react'
import { Button } from "@headlessui/react";

const cardArrayItems = [
    {
        icon: UserRoundPlus,
        title: "Newly Registered",
        subtitle: "8 employees added"
    },
    {
        icon: CalendarDays,
        title: "Schedule Deviation",
        subtitle: "4 early timeouts . 2 missing punches"
    },
    {
        icon: CalendarClock,
        title: "Pending Requests",
        subtitle: "Employee requested a leave."
    },
    {
        icon: ScrollText,
        title: "Payroll Activity",
        subtitle: "You haven't run your payroll for a while now"
    },
]

export default function SystemAlert() {
    return (
        <>
            {/* Alerts Column */}
            <div className=' lg:col-span-2 rounded-lg'>
                <div className="flex flex-row gap-3">
                    <h3 className="font-semibold mb-4">System Alerts</h3> 
                    <Info className="h-5 w-5"/>
                </div>
                <div className='grid grid-cols-1 gap-3'> 
                    {cardArrayItems.map((item, index) => (
                        <Button key={index} className="group animate-fade-in-out">
                            <Card className="w-full transition-all duration-300 group-hover:shadow-lg group-hover:border-blue-500">
                                <CardHeader className='py-2 flex justify-between items-center'>
                                    <div>
                                        <item.icon className='absolute md:h-4 md:w-4'/>
                                        <CardTitle className='pl-8 text-xs lg:pl-10 lg:text-base text-left'>{item.title}</CardTitle>
                                        <CardDescription className='pl-8 md:text-[10px] lg:pl-10 lg:text-xs pb-2 text-left'>{item.subtitle}</CardDescription>
                                    </div>
                                    <div>
                                        <ArrowRight className='md:h-4 md:w-4 lg:-mt-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:text-blue-600 animate-[wiggle_1s_ease-in-out_infinite] group-hover:animate-[wiggle_1s_ease-in-out_infinite]'/>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Button>
                    ))}
                </div>
            </div>
        </>
    );
}