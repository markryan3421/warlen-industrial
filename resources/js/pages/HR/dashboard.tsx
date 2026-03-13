import { ArrowUpRight, Circle, Minus } from 'lucide-react';
import { useState } from 'react';
import {
    CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip,
    XAxis, YAxis
} from 'recharts';

import Footer from '@/components/footer';
import { SectionCards } from '@/components/section-cards';
import SystemAlert from '@/components/system-alert';
import { ChartConfig, type } from '@/components/ui/chart';
import HrLayout from '@/layouts/hr-layout';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { RechartsDevtools } from '@recharts/devtools';

import type { BreadcrumbItem } from '@/types';
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
];

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "#2563eb",
    },
} satisfies ChartConfig;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];


export default function Dashboard() {

    const [isAnimationActive] = useState(true);

    return (
        <HrLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <SectionCards />
                </div>

                <div className="my-4 relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border mx-10">
                    <div className='grid md:grid-cols-5 lg:grid-cols-6 gap-1 p-8 px-10'>

                        {/* System Alert Container Component */}
                        <SystemAlert />

                        {/* Line Chart Column */}
                        <div className='md:col-span-2 lg:col-span-3 rounded-lg mt-10'>
                            <div className='rounded-lg text-xs'>
                                {/* Chart Container */}
                                <div className="w-full transition-all duration-300 ease-in-out">
                                    <div className="relative h-[200px] md:h-[300px] lg:h-[350px] w-full">
                                        <ResponsiveContainer
                                            width="100%"
                                            height="100%"
                                            className="transition-all duration-300 ease-in-out"
                                        >
                                            <LineChart
                                                data={lineChartData}
                                                margin={{ top: 10, right: 40, left: 0, bottom: 0 }}
                                            >
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
                                                <Line
                                                    type="monotone"
                                                    dataKey="desktop"
                                                    stroke={chartConfig.desktop.color}
                                                    strokeWidth={2}
                                                    name="Total Revenue"
                                                    label={{
                                                        position: 'top',
                                                        fontSize: 8,
                                                        fill: '#666',
                                                        formatter: (value) => value
                                                    }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Footer with Total Revenue text and View Full Analysis link */}
                                <div className="flex items-center justify-between px-10">
                                    <div className="flex items-center gap-4">
                                        {/* Legend indicator and text */}
                                        <div className="flex items-center gap-1">
                                            <div className=" text-blue-800"><Minus className='h-8 w-8' /><Circle className='absolute -mt-[22px] h-3 w-[10px] ml-[10.5px] font-bold bg-white' /></div>
                                            <span className="text-xs text-gray-600 font-medium">Total Revenue</span>
                                        </div>
                                    </div>

                                    {/* View Full Analysis Link */}
                                    <Link
                                        href="/reports/analysis"
                                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline hover:decoration-blue-800 font-medium transition-colors duration-200 group"
                                    >
                                        <span>View Full Analysis</span>
                                        <ArrowUpRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Pie Chart Column */}
                        <div style={{ width: 220, height: 300 }} className=' p-1 rounded-md border-1 flex flex-col justify-center my-auto -ml-5'>
                            <header className='flex justify-center mt-3 font-bold'>Employees</header>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="0%"
                                        outerRadius={70} // Reduced from 100 to 70
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
                                        formatter={(value) => [`${value}`, 'Employee Count']}
                                        contentStyle={{
                                            fontSize: '12px',
                                            padding: '4px 8px',
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px'
                                        }}
                                        itemStyle={{ fontSize: '12px' }} // specifically for the value items
                                        labelStyle={{ fontSize: '12px', fontWeight: 'bold' }} // for the label if needed
                                    />
                                    <RechartsDevtools />
                                </PieChart>
                            </ResponsiveContainer>
                            <p className="text-[10px] font-medium w-35 flex mx-auto text-center pb-10">
                                2% added on the employee count this month
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </HrLayout>
    );
}