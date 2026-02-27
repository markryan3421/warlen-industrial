import { Head } from '@inertiajs/react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
// import { StaticTable } from '@/components/static-table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import Footer from '@/components/footer';
import type { BreadcrumbItem } from '@/types';
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { RechartsDevtools } from '@recharts/devtools';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, Pie, PieChart, Tooltip, Cell } from "recharts"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ScrollText, CalendarDays, UserRoundPlus, CalendarClock, ArrowRight, Dot } from 'lucide-react'
import { useState } from 'react'
import SystemAlert from '@/components/system-alert';

// Line chart data
const lineChartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
    { month: "July", desktop: 186, mobile: 80 },
    { month: "August", desktop: 305, mobile: 200 },
    { month: "September", desktop: 237, mobile: 120 },
    { month: "October", desktop: 73, mobile: 190 },
    { month: "November", desktop: 209, mobile: 130 },
    { month: "December", desktop: 214, mobile: 140 },
];

// ✅ Define a proper type for pie chart data
type PieDataItem = {
    name: string;
    value: number;
    color: string;
};

// ✅ Create pie chart data with the correct structure
const pieChartData: PieDataItem[] = [
    { 
        name: "Desktop Total", 
        value: lineChartData.reduce((sum, item) => sum + item.desktop, 0),
        color: "#2563eb" 
    },
    { 
        name: "Mobile Total", 
        value: lineChartData.reduce((sum, item) => sum + item.mobile, 0),
        color: "#60a5fa" 
    },
    {
        name: "Average",
        value: Math.round(
            (lineChartData.reduce((sum, item) => sum + item.desktop + item.mobile, 0)) / 
            lineChartData.length
        ),
        color: "#34d399"
    }
];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "#2563eb",
    },
    mobile: {
        label: "Mobile",
        color: "#bb2543",
    },
} satisfies ChartConfig;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title:'Dashboard',
        href: dashboard().url,
    },
];


export default function Dashboard() {

    const [isAnimationActive] = useState(true);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <SectionCards />
                </div>

                {/* ✅ Fixed: Added the missing closing div for this section */}
                <div className="my-4 relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border mx-6">
                    <div className='grid grid-cols-6 gap-1 p-8 px-10'>


                        <SystemAlert/>
                        
                       {/* Line Chart Column */}
                        <div className='col-span-3 rounded-lg pt-4 -mb-10'>
                            <div className='rounded-lg text-xs'>
                                <div style={{ width: "100%", height: 420 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={lineChartData} margin={{ top: 30, right:40, left: 0, bottom: 30 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="month" 
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(month) => month.substring(0, 3)}
                                                interval={0}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 10 }}
                                                tickFormatter={(value) => value.toLocaleString()}
                                                width={35}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                                            <Line 
                                                type="monotone" 
                                                dataKey="desktop" 
                                                stroke={chartConfig.desktop.color} 
                                                strokeWidth={2}
                                                name="Desktop"
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="mobile" 
                                                stroke={chartConfig.mobile.color} 
                                                strokeWidth={2}
                                                name="Mobile"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                                                
                        {/* Pie Chart Column */}
                        <div className='w-[220px] h-[300px]'>
                            <div className='border-1 rounded-lg p-5 mt-9 -ml-7'>
                            <h3 className="font-extrabold text-lg flex justify-center items-center">Employee</h3>
                                <div style={{ width: "100%", height: 255 }} className='mx-auto'>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius="0%"
                                                outerRadius="100"
                                                labelLine={true}
                                                isAnimationActive={isAnimationActive}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={entry.color}
                                                        className="text-xs"
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value) => [`${value} units`, 'Count']}
                                            />
                                            <RechartsDevtools />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <div className="my-4 relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border mx-6">
                    <StaticTable />
                </div> */}
            </div>

            <Footer/>
        </AppLayout>
    );
}