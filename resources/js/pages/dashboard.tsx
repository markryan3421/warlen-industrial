import { ArrowUpRight, Circle, Minus } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
    CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip,
    XAxis, YAxis
} from 'recharts';

import Footer from '@/components/footer';
import { SectionCards } from '@/components/section-cards';
import SystemAlert from '@/components/system-alert';
import { ChartConfig } from '@/components/ui/chart';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';

import type { BreadcrumbItem } from '@/types';

// Line chart data - moved outside component to prevent recreation
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

// ✅ Sample pie chart data - moved outside component
const pieChartData = [
    { name: "Full-Time", value: 245, color: "#2563eb" },
    { name: "Part-Time", value: 120, color: "#60a5fa" },
    { name: "Contract", value: 85, color: "#93c5fd" },
    { name: "Intern", value: 42, color: "#bfdbfe" },
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

function useDebouncedElementSize(debounceMs: number) {
    const ref = useRef<HTMLDivElement | null>(null);
    // "Stable" size updates after the resize stops (debounced) and is what we draw with.
    const [size, setSize] = useState({ width: 0, height: 0 });
    // "Live" size updates immediately and is used for CSS scaling to keep the UI smooth.
    const [liveSize, setLiveSize] = useState({ width: 0, height: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const didInitRef = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let timer: ReturnType<typeof setTimeout> | undefined;

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;

            const { width, height } = entry.contentRect;
            // Update live size immediately so scaling feels responsive.
            setLiveSize({ width, height });

            // Initialize stable size on first measurement so the chart can render immediately.
            if (!didInitRef.current) {
                didInitRef.current = true;
                setSize({ width, height });
                setIsResizing(false);
                return;
            }

            if (timer) clearTimeout(timer);
            setIsResizing(true);
            timer = setTimeout(() => {
                setSize({ width, height });
                setIsResizing(false);
            }, debounceMs);
        });

        ro.observe(el);

        return () => {
            if (timer) clearTimeout(timer);
            ro.disconnect();
            setIsResizing(false);
        };
    }, [debounceMs]);

    return {
        ref,
        // Stable (debounced)
        width: size.width,
        height: size.height,
        // Live (immediate)
        liveWidth: liveSize.width,
        liveHeight: liveSize.height,
        isResizing,
    };
}

let hasAnimatedLineChart = false;

const StableLineChart = memo(
    ({ data, width, height }: { data: typeof lineChartData; width: number; height: number }) => {
        const [activePoint, setActivePoint] = useState<{
            x: number;
            y: number;
            value: number;
            label: string;
        } | null>(null);

        return (
            <div className="relative">
                <LineChart
                    width={width}
                    height={height}
                    data={data}
                    margin={{ top: 30, right: 20, left: 0, bottom: 0 }}
                    onMouseMove={(state) => {
                        if (state && state.activeTooltipIndex !== undefined && state.activePayload) {
                            const payload = state.activePayload[0]?.payload;
                            if (payload) {
                                setActivePoint({
                                    x: state.activeCoordinate?.x || 0,
                                    y: state.activeCoordinate?.y || 0,
                                    value: payload.desktop,
                                    label: payload.month,
                                });
                            }
                        } else {
                            setActivePoint(null);
                        }
                    }}
                    onMouseLeave={() => setActivePoint(null)}
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
                    <Tooltip 
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-black/90 text-white rounded-lg px-3 py-2 shadow-lg border border-white/10">
                                        <p className="font-semibold text-sm">{label}</p>
                                        <p className="text-xs text-gray-300">
                                            Total Revenue: ${payload[0]?.value?.toLocaleString()}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                        cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="desktop"
                        stroke={chartConfig.desktop.color}
                        strokeWidth={2}
                        name="Total Revenue"
                        isAnimationActive={!hasAnimatedLineChart}
                        animationDuration={800}
                        onAnimationEnd={() => {
                            hasAnimatedLineChart = true;
                        }}
                        activeDot={{ 
                            r: 6, 
                            stroke: 'white', 
                            strokeWidth: 2,
                            fill: chartConfig.desktop.color,
                        }}
                    />
                </LineChart>
                
                {/* Custom floating label (alternative to default tooltip) */}
                {activePoint && (
                    <div
                        style={{
                            position: 'absolute',
                            left: activePoint.x,
                            top: activePoint.y - 40,
                            transform: 'translateX(-50%)',
                            pointerEvents: 'none',
                            zIndex: 100,
                        }}
                        className="bg-black/90 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-lg border border-white/20"
                    >
                        <div className="font-semibold">{activePoint.label}</div>
                        <div>PHP{activePoint.value.toLocaleString()}</div>
                        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/90"></div>
                        </div>
                    </div>
                )}
            </div>
        );
    },
);
StableLineChart.displayName = "StableLineChart";

// Memoized chart components to prevent unnecessary re-renders
const LineChartComponent = memo(({ data }: { data: typeof lineChartData }) => {
    const {
        ref: containerRef,
        width: stableWidth,
        height: stableHeight,
        liveWidth,
        liveHeight,
        isResizing,
    } = useDebouncedElementSize(60);

    const scaleX = stableWidth > 0 && liveWidth > 0 ? liveWidth / stableWidth : 1;
    const scaleY = stableHeight > 0 && liveHeight > 0 ? liveHeight / stableHeight : 1;

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden">
            {stableWidth > 0 && stableHeight > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: stableWidth,
                        height: stableHeight,
                        transformOrigin: "top left",
                        transform: `scale(${scaleX}, ${scaleY})`,
                        transition: isResizing
                            ? "transform 80ms ease-out"
                            : "transform 150ms ease-out",
                        willChange: "transform",
                    }}
                >
                    <StableLineChart data={data} width={stableWidth} height={stableHeight} />
                </div>
            )}
        </div>
    );
});

LineChartComponent.displayName = 'LineChartComponent';
const PieChartComponent = memo(({ data }: { data: typeof pieChartData }) => {
    const animationPlayed = useRef(false);
    const { ref: containerRef, width, height } = useDebouncedElementSize(120);
    
    return (
        <div ref={containerRef} className="w-full h-full">
            {width > 0 && height > 0 && (
                <PieChart width={width} height={height}>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={65}
                        labelLine={false}
                        isAnimationActive={!animationPlayed.current}
                        animationDuration={800}
                        onAnimationEnd={() => {
                            animationPlayed.current = true;
                        }}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [`${value} employees`, '']}
                        contentStyle={{
                            fontSize: '10px',
                            padding: '4px 6px',
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                        }}
                    />
                </PieChart>
            )}
        </div>
    );
});

PieChartComponent.displayName = 'PieChartComponent';

const DesktopPieChartComponent = memo(({ data }: { data: typeof pieChartData }) => {
    const animationPlayed = useRef(false);
    const { ref: containerRef, width, height } = useDebouncedElementSize(120);
    
    return (
        <div ref={containerRef} className="w-full h-full">
            {width > 0 && height > 0 && (
                <PieChart width={width} height={height}>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={65}
                        labelLine={false}
                        isAnimationActive={!animationPlayed.current}
                        animationDuration={800}
                        onAnimationEnd={() => {
                            animationPlayed.current = true;
                        }}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [`${value} employees`, '']}
                        contentStyle={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                        }}
                    />
                </PieChart>
            )}
        </div>
    );
});

DesktopPieChartComponent.displayName = 'DesktopPieChartComponent';

export default function Dashboard() {
    // Memoize calculations
    const totalEmployees = useMemo(() => 
        pieChartData.reduce((sum, item) => sum + item.value, 0), 
    []);

    // Memoize percentage calculations for legend items
    const legendItems = useMemo(() => 
        pieChartData.map(item => ({
            ...item,
            percentage: ((item.value / totalEmployees) * 100).toFixed(1)
        })), 
    [totalEmployees]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="@container/main flex flex-1 flex-col gap-2">
                <SectionCards />

                <div className="my-4 relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border mx-2 sm:mx-4 lg:mx-10">

                    {/* Main 3-column grid layout */}
                    <div className='grid grid-cols-1 lg:grid-cols-9 gap-4 p-3 sm:p-5 lg:p-8'>

                        {/* Column 1: System Alert */}
                        <div className="col-span-1 md:col-span-1 lg:col-span-3">
                            <SystemAlert />
                        </div>

                        {/* Column 2: Line Chart */}
                        <div className="col-span-1 md:col-span-1 lg:col-span-4">
                            <div className='rounded-lg text-xs h-full flex flex-col'>
                                {/* Chart Container */}
                                <div className="w-full transition-all duration-300 ease-in-out flex-1">
                                    <div className="relative h-[200px] md:h-[250px] lg:h-[300px] lg:mt-5 w-full">
                                        <LineChartComponent 
                                            data={lineChartData} 
                                        />
                                    </div>
                                </div>

                                {/* Footer with Total Revenue text */}
                                <div className="flex flex-row sm:flex-row items-start sm:items-center justify-between gap-2 px-2 sm:px-4 mt-2">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <div className="relative text-blue-800">
                                                <Minus className='h-6 w-6 sm:h-8 sm:w-8' />
                                                <Circle className='absolute -mt-[18px] sm:-mt-[22px] h-2 w-[8px] sm:h-3 sm:w-[10px] ml-[8px] sm:ml-[10.5px] font-bold bg-white' />
                                            </div>
                                            <span className="text-xs text-gray-600 font-medium">Total Revenue</span>
                                        </div>
                                    </div>

                                    {/* View Full Analysis Link */}
                                    <Link
                                        href="/reports/analysis"
                                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200 group"
                                    >
                                        <span>View Full Analysis</span>
                                        <ArrowUpRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Pie Chart */}
                        <div className="col-span-1 md:col-span-1 lg:col-span-2 flex items-center justify-center">
                            {/* Mobile & Tablet Layout */}
                            <div className="block lg:hidden w-full px-3">
                                <div className="p-3 rounded-md border flex flex-col justify-center items-center w-full max-w-[600px] mx-auto">
                                    <header className='flex justify-center mt-1 font-bold text-sm'>
                                        Employee Distribution
                                    </header>

                                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full mt-2">
                                        <div className="w-full sm:w-[50%] md:w-[40%]">
                                            <div className="w-full h-[140px]">
                                                <PieChartComponent data={pieChartData} />
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-[50%]">
                                            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                                                {legendItems.map((item) => (
                                                    <div key={item.name} className="flex items-center gap-2 text-xs">
                                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                                                        <span className="truncate">{item.name}</span>
                                                        <span className="font-semibold ml-auto">{item.percentage}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        2% increase in employee count this month
                                    </p>
                                </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden lg:block">
                                <div className="p-5 mt-2 rounded-md border flex flex-col justify-center items-center w-[240px]">
                                    <header className='flex justify-center mt-1 font-bold text-sm'>
                                        Employee Distribution
                                    </header>

                                    <div className="w-full h-[160px]">
                                        <DesktopPieChartComponent data={pieChartData} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-1 mt-2 w-full px-2">
                                        {legendItems.map((item) => (
                                            <div key={item.name} className="flex items-center gap-1 text-[10px]">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="truncate">{item.name}: {item.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>

                                    <p className="text-[9px] text-gray-500 mt-2 text-center px-2">
                                        2% increase in employee count this month
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}