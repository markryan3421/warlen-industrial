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
        subtitle: "Marky Bigote requested a leave."
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
            <div className='col-span-2 rounded-lg'>
                <div className="flex flex-row gap-3">
                    <h3 className="font-semibold mb-4">System Alerts</h3> 
                    <Info className="h-5 w-5"/>
                </div>
                <div className='grid grid-cols-1 gap-3'>
                    {cardArrayItems.map((item, index) => (
                    <Card key={index}>
                        <CardHeader className='py-2 flex justify-between items-center'>
                        <div>
                            <item.icon className='absolute'/>
                            <CardTitle className='pl-10'>{item.title}</CardTitle>
                            <CardDescription className='pl-10 pb-2 text-xs'>{item.subtitle}</CardDescription>
                            </div>
                <div>
                    <ArrowRight className='mr-3 -mt-3'/>
                </div>
                        </CardHeader>
                    </Card>
                    ))}
                </div>
            </div>
        </>
    );
}