import { useState, useMemo, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, DollarSign, Briefcase, TrendingUp, Award, ChevronRight } from 'lucide-react';

export default function EmployeeStats() {
    const { periodStats, lifetime, availableMonths, defaultMonth } = usePage().props;

    const [selectedMonth, setSelectedMonth] = useState(defaultMonth || '');
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
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl border border-gray-200 bg-gray-50">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No payroll data available for your contract period.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with month selector */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Employee Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Monthly performance and earnings overview</p>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[220px] rounded-lg border-gray-300 bg-white shadow-sm focus:border-[#1d4791] focus:ring-1 focus:ring-[#1d4791]">
                        <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableMonths.map(({ year, month, label, has_data }) => (
                            <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                                {label} {!has_data && '(no data)'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Monthly Stats Cards */}
            {selectedMonthData ? (
                <div className="space-y-8">
                    {/* Key metrics - 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <MetricCard
                            title="Net Salary"
                            value={formatCurrency(selectedMonthData.net_pay)}
                            icon={DollarSign}
                            trend={selectedMonthData.net_pay > 0 ? '+ from last month' : undefined}
                            animate={isAnimating}
                            delay={0}
                        />
                        <MetricCard
                            title="Hours Worked"
                            value={`${selectedMonthData.normal_work_hours} hrs`}
                            subtitle={`of ${selectedMonthData.scheduled_days} days`}
                            icon={Briefcase}
                            animate={isAnimating}
                            delay={100}
                        />
                        <MetricCard
                            title="Overtime"
                            value={`${selectedMonthData.overtime_workday + selectedMonthData.overtime_holiday + selectedMonthData.overtime_label} hrs`}
                            icon={TrendingUp}
                            animate={isAnimating}
                            delay={200}
                        />
                    </div>

                    {/* Secondary metrics - 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            color="blue"
                            animate={isAnimating}
                            delay={100}
                        />
                        <SecondaryMetricCard
                            title="Early Leave"
                            value={`${selectedMonthData.leave_early_minutes} min`}
                            icon={Clock}
                            color="orange"
                            animate={isAnimating}
                            delay={200}
                        />
                    </div>

                    {/* Insight bar - subtle */}
                    <div className="mt-4 rounded-lg bg-[#1d4791]/5 p-4 border border-[#1d4791]/10">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Award className="h-4 w-4 text-[#1d4791]" />
                            <span>
                                {selectedMonth === defaultMonth
                                    ? 'Latest month summary'
                                    : `Performance for ${new Date(selectedMonthData.period_start).toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-gray-500">No data for this period</p>
                </div>
            )}

            {/* Lifetime Summary */}
            {lifetime && (
                <div className="pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-5">
                        <Award className="h-5 w-5 text-[#1d4791]" />
                        <h2 className="text-lg font-semibold text-gray-900">Lifetime totals</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        <LifetimeCard
                            title="Total earnings"
                            value={formatCurrency(lifetime.total_pay)}
                            icon={DollarSign}
                            delay={0}
                        />
                        <LifetimeCard
                            title="Total hours worked"
                            value={`${lifetime.total_work_hours} hrs`}
                            icon={Briefcase}
                            delay={100}
                        />
                        <LifetimeCard
                            title="Total late minutes"
                            value={`${lifetime.total_late_minutes} min`}
                            icon={Clock}
                            delay={200}
                        />
                        <LifetimeCard
                            title="Total overtime"
                            value={`${lifetime.total_overtime_hours} hrs`}
                            icon={TrendingUp}
                            delay={300}
                        />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .card-fade-up {
                    animation: fadeUp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) both;
                }
            `}</style>
        </div>
    );
}

// Primary metric card (blue accent)
function MetricCard({ title, value, subtitle, icon: Icon, trend, animate, delay }) {
    const style = animate ? { animationDelay: `${delay}ms` } : {};
    const animateClass = animate ? 'card-fade-up' : '';

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${animateClass}`} style={style}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
                    {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
                    {trend && <p className="mt-2 text-xs text-green-600">{trend}</p>}
                </div>
                <div className="rounded-lg bg-[#1d4791]/10 p-2">
                    <Icon className="h-5 w-5 text-[#1d4791]" />
                </div>
            </div>
            <div className="mt-3 h-1 w-12 rounded-full bg-[#1d4791]/20" />
        </div>
    );
}

// Secondary metric card (orange accent)
function SecondaryMetricCard({ title, value, icon: Icon, color, animate, delay }) {
    const accentColor = color === 'orange' ? '#d85e39' : '#1d4791';
    const bgOpacity = color === 'orange' ? 'bg-[#d85e39]/10' : 'bg-[#1d4791]/10';
    const style = animate ? { animationDelay: `${delay}ms` } : {};
    const animateClass = animate ? 'card-fade-up' : '';

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${animateClass}`} style={style}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
                </div>
                <div className={`rounded-lg ${bgOpacity} p-2`}>
                    <Icon className="h-5 w-5" style={{ color: accentColor }} />
                </div>
            </div>
            <div className="mt-3 h-1 w-8 rounded-full" style={{ backgroundColor: `${accentColor}20` }} />
        </div>
    );
}

// Lifetime card (neutral, minimal)
function LifetimeCard({ title, value, icon: Icon, delay }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200 hover:shadow-sm card-fade-up" style={{ animationDelay: `${delay}ms` }}>
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 shadow-sm">
                    <Icon className="h-4 w-4 text-[#1d4791]" />
                </div>
                <div>
                    <p className="text-xs text-gray-500">{title}</p>
                    <p className="text-lg font-semibold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}