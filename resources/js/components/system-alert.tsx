import { Button } from "@headlessui/react";
import { Link } from "@inertiajs/react";
import { ScrollText, CalendarDays, UserRoundPlus, CalendarClock, ArrowRight, Info } from 'lucide-react'
import { memo } from "react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

interface SystemAlertProps {
    newlyRegistered?: number;
    scheduleDeviation?: number;
    pendingRequests?: number;
    payrollActivityMessage?: string | null;
    // Dynamic link props - these will override defaults if provided
    newlyRegisteredLink?: string;
    scheduleDeviationLink?: string;
    pendingRequestsLink?: string;
    payrollActivityLink?: string;
}

const AlertCard = memo(({ item, index }: { item: any, index: number }) => {
    const Icon = item.icon
    
    return (
        <Button key={index} className="group animate-fade-in-out w-full">
            <Link href={item.link || "#"}>
                <Card className="w-full transition-all duration-300 group-hover:shadow-lg group-hover:border-blue-500 lg:col-span-5">
                    <CardHeader className='flex justify-between items-center'>
                        <div className="relative flex-1 px-5 md:px-0 xl:px-0">
                            <Icon className='absolute mt-4 -ml-3 sm:mt-5 md:h-5 md:w-5 md:mt-5 lg:ml-1 lg:h-6 lg:w-6 lg:mt-5 xl:ml-1 xl:h-6 xl:w-6 xl:mt-5'/>
                            <CardTitle className='pl-6 md:text-xs md:pl-4 text-sm lg:pl-10 lg:text-base text-left min-w-[150px] pt-4'>
                                {item.title}
                            </CardTitle>
                            <CardDescription className='pl-6 md:w-[130px] lg:w-full md:pl-4 text-[10px] lg:pl-10 lg:text-[12px] pb-4 text-left '>
                                {item.subtitle}
                            </CardDescription>
                        </div>
                        <div className="flex-shrink-0">
                            <ArrowRight className='-ml-5 flex justify-center md:h-4 md:w-4 lg:-mt-3 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 group-hover:text-blue-600 animate-[wiggle_1s_ease-in-out_infinite] group-hover:animate-[wiggle_1s_ease-in-out_infinite]'/>
                        </div>
                    </CardHeader>
                </Card>
            </Link>
        </Button>
    )
})

AlertCard.displayName = 'AlertCard'

export default memo(function SystemAlert({ 
    newlyRegistered = 0, 
    scheduleDeviation = 0, 
    pendingRequests = 0, 
    payrollActivityMessage = null,
    newlyRegisteredLink = "/employees",
    scheduleDeviationLink = "/attendances",
    pendingRequestsLink = "/application-leave",
    payrollActivityLink = "/payroll-periods"
}: SystemAlertProps) {
    // Build all four cards always, with dynamic subtitles including fallback messages
    const alerts = [
        {
            icon: UserRoundPlus,
            title: "Newly Registered",
            subtitle: newlyRegistered > 0 
                ? `${newlyRegistered} employee${newlyRegistered !== 1 ? 's' : ''} added` 
                : "No new employees registered",
            link: newlyRegisteredLink
        },
        {
            icon: CalendarDays,
            title: "Schedule Deviation",
            subtitle: scheduleDeviation > 0 
                ? `${scheduleDeviation} early timeout${scheduleDeviation !== 1 ? 's' : ''}` 
                : "No early timeouts",
            link: scheduleDeviationLink
        },
        {
            icon: CalendarClock,
            title: "Pending Requests",
            subtitle: pendingRequests > 0 
                ? `${pendingRequests} leave request${pendingRequests !== 1 ? 's' : ''} pending` 
                : "No pending leave requests",
            link: pendingRequestsLink
        },
        {
            icon: ScrollText,
            title: "Payroll Activity",
            subtitle: payrollActivityMessage || "No active payroll period",
            link: payrollActivityLink
        }
    ];

    return (
        <div className='rounded-lg px-4 sm:px-0 lg:px-0'>
            <div className="flex flex-row gap-3">
                <h3 className="font-semibold mb-4 md:text-sm">System Alerts</h3> 
                <Info className="h-4 w-4 mt-1 md:h-4 md:w-4 lg:h-5 lg:w-5 lg:mt-0"/>
            </div>
            <div className='grid md:grid-cols-2 lg:grid-cols-1 gap-3'> 
                {alerts.map((item, idx) => (
                    <AlertCard key={idx} item={item} index={idx} />
                ))}
            </div>
        </div>
    );
});