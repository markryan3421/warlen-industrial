import { useState, useMemo, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, DollarSign, Briefcase, TrendingUp, Award, PhilippinePeso } from 'lucide-react';

export default function EmployeeStats() {
    const { periodStats, lifetime, availableMonths, defaultMonth } = usePage().props;

    // Filter months that actually have data
    const monthsWithData = useMemo(() => {
        if (!Array.isArray(periodStats) || periodStats.length === 0) return [];

        // Create a map to avoid duplicates
        const monthMap = new Map();

        periodStats.forEach(stat => {
            const date = new Date(stat.period_start);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${month}`;
            if (!monthMap.has(key)) {
                monthMap.set(key, {
                    year,
                    month,
                    label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    has_data: true,
                });
            }
        });

        // Sort chronologically
        return Array.from(monthMap.values()).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });
    }, [periodStats]);

    const initialMonth = useMemo(() => {
        if (monthsWithData.length === 0) return '';
        // Prefer defaultMonth if it exists and has data, otherwise take the most recent
        if (defaultMonth && monthsWithData.some(m => `${m.year}-${m.month}` === defaultMonth)) {
            return defaultMonth;
        }
        // Return the last (most recent) month
        return `${monthsWithData[monthsWithData.length - 1].year}-${monthsWithData[monthsWithData.length - 1].month}`;
    }, [defaultMonth, monthsWithData]);

    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [isAnimating, setIsAnimating] = useState(false);

    const selectedMonthData = useMemo(() => {
        if (!selectedMonth) return null;
        const [year, month] = selectedMonth.split('-');
        return periodStats.find(stat => {
            const statDate = new Date(stat.period_start);
            return statDate.getFullYear() == year && (statDate.getMonth() + 1) == month;
        }) || null;
    }, [selectedMonth, periodStats]);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), 400);
        return () => clearTimeout(timer);
    }, [selectedMonthData]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
    };

    if (!availableMonths.length) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl border border-slate-200 bg-slate-50">
                <Calendar className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-500 text-sm">No payroll data available for your contract period.</p>
            </div>
        );
    }

    console.log('availableMonths:', availableMonths);
    console.log('monthsWithData:', monthsWithData);

    return (
        <div className="space-y-6">
            <>
                <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .card-fade-up { animation: fadeUp 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.05) both; }
            `}</style>

                {/* Section header — navy pattern matching CustomTable */}
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-[#1d4791] px-5 py-4">
                        <div>
                            <h1 className="text-base font-semibold tracking-tight text-white">Employee Dashboard</h1>
                            <p className="text-xs text-white/60 mt-0.5">Weekly performance and earnings overview</p>
                        </div>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[200px] h-9 rounded-lg border-white/20 bg-white/10 text-white text-sm shadow-none focus:ring-1 focus:ring-white/40 focus:border-white/40 [&>span]:text-white [&>svg]:text-white/60">
                                <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                {monthsWithData.map(({ year, month, label }) => (
                                    <SelectItem key={`${year}-${month}`} value={`${year}-${month}`} className="text-sm">
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Monthly Stats Body */}
                    <div className="bg-white px-5 py-5">
                        {selectedMonthData ? (
                            <div className="space-y-5">
                                {/* Primary metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <MetricCard
                                        title="Net Salary"
                                        value={formatCurrency(selectedMonthData.net_pay)}
                                        icon={PhilippinePeso}
                                        trend={selectedMonthData.net_pay > 0 ? '+ from last month' : undefined}
                                        animate={isAnimating}
                                        delay={0} subtitle={undefined} />
                                    <MetricCard
                                        title="Hours Worked"
                                        value={`${selectedMonthData.normal_work_hours} hrs`}
                                        subtitle={`of ${selectedMonthData.scheduled_days} days`}
                                        icon={Briefcase}
                                        animate={isAnimating}
                                        delay={60}
                                    />
                                    <MetricCard
                                        title="Overtime"
                                        value={`${selectedMonthData.overtime_workday + selectedMonthData.overtime_holiday + selectedMonthData.overtime_label} hrs`}
                                        icon={TrendingUp}
                                        animate={isAnimating}
                                        delay={120}
                                    />
                                </div>

                                {/* Secondary metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <SecondaryMetricCard
                                        title="Late Minutes"
                                        value={`${selectedMonthData.late_minutes} min`}
                                        icon={Clock}
                                        color="orange"
                                        animate={isAnimating}
                                        delay={0}
                                    />
                                    <SecondaryMetricCard
                                        title="Attended Days"
                                        value={`${selectedMonthData.attended_days} / ${selectedMonthData.scheduled_days}`}
                                        icon={Calendar}
                                        color="navy"
                                        animate={isAnimating}
                                        delay={60}
                                    />
                                    <SecondaryMetricCard
                                        title="Early Leave"
                                        value={`${selectedMonthData.leave_early_minutes} min`}
                                        icon={Clock}
                                        color="orange"
                                        animate={isAnimating}
                                        delay={120}
                                    />
                                </div>

                                {/* Insight bar */}
                                <div className="rounded-lg bg-[#1d4791]/5 px-4 py-3 border border-[#1d4791]/10">
                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <Award className="h-3.5 w-3.5 text-[#1d4791] shrink-0" />
                                        <span>
                                            {selectedMonth === defaultMonth
                                                ? 'Latest weekly summary'
                                                : `Performance for ${new Date(selectedMonthData.period_start).toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
                                <Calendar className="mx-auto h-9 w-9 text-slate-400 mb-3" />
                                <p className="text-sm text-slate-500">No data for this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lifetime Summary — separate card */}
                {lifetime && (
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="flex items-center gap-2 bg-[#1d4791] px-5 py-4">
                            <Award className="h-4 w-4 text-white/80" />
                            <h2 className="text-sm font-semibold text-white tracking-tight">Lifetime Totals</h2>
                        </div>
                        <div className="bg-white px-5 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <LifetimeCard title="Total earnings" value={formatCurrency(lifetime.total_pay)} icon={DollarSign} delay={0} />
                                <LifetimeCard title="Total hours worked" value={`${lifetime.total_work_hours} hrs`} icon={Briefcase} delay={60} />
                                <LifetimeCard title="Total late minutes" value={`${lifetime.total_late_minutes} min`} icon={Clock} delay={120} />
                                <LifetimeCard title="Total overtime" value={`${lifetime.total_overtime_hours} hrs`} icon={TrendingUp} delay={180} />
                            </div>
                        </div>
                    </div>
                )}
            </>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    trend?: string;
    animate: boolean;
    delay: number;
}
function MetricCard({ title, value, subtitle, icon: Icon, trend, animate, delay }: MetricCardProps) {
    const style = animate ? { animationDelay: `${delay}ms` } : {};
    return (
        <div
            className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${animate ? 'card-fade-up' : ''}`}
            style={style}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
                    {trend && <p className="mt-2 text-xs text-emerald-600">{trend}</p>}
                </div>
                <div className="rounded-lg bg-[#1d4791]/10 p-2 shrink-0">
                    <Icon className="h-4 w-4 text-[#1d4791]" />
                </div>
            </div>
            <div className="mt-4 h-0.5 w-10 rounded-full bg-[#1d4791]/20" />
        </div>
    );
}

interface SecondaryMetricCardProps {
    title: string;
    value: string;
    icon: any;
    color: 'orange' | 'navy';
    animate: boolean;
    delay: number;
}
function SecondaryMetricCard({ title, value, icon: Icon, color, animate, delay }: SecondaryMetricCardProps) {
    const isOrange = color === 'orange';
    const accent = isOrange ? '#d85e39' : '#1d4791';
    const bg = isOrange ? 'bg-[#d85e39]/10' : 'bg-[#1d4791]/10';
    const style = animate ? { animationDelay: `${delay}ms` } : {};
    return (
        <div
            className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${animate ? 'card-fade-up' : ''}`}
            style={style}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
                </div>
                <div className={`rounded-lg ${bg} p-2 shrink-0`}>
                    <Icon className="h-4 w-4" style={{ color: accent }} />
                </div>
            </div>
            <div className="mt-4 h-0.5 w-8 rounded-full" style={{ backgroundColor: `${accent}30` }} />
        </div>
    );
}

interface LifetimeCardProps {
    title: string;
    value: string;
    icon: any;
    delay: number;
}
function LifetimeCard({ title, value, icon: Icon, delay }: LifetimeCardProps) {
    return (
        <div
            className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-200 hover:shadow-sm card-fade-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 shadow-sm border border-slate-100 shrink-0">
                    <Icon className="h-4 w-4 text-[#1d4791]" />
                </div>
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{title}</p>
                    <p className="text-base font-semibold text-slate-900">{value}</p>
                </div>
            </div>
        </div>
    );
}