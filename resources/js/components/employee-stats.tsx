import { useState, useMemo, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Calendar,
	Clock,
	DollarSign,
	Briefcase,
	TrendingUp,
	Award,
	PhilippinePeso,
	User,
	AlertCircle
} from 'lucide-react';

interface PeriodStat {
	period_start: string;
	net_pay: number;
	real_pay: number;
	late_minutes: number;
	leave_early_minutes: number;
	normal_work_hours: number;
	scheduled_days: number;
	attended_days: number;
	overtime_workday: number;
	overtime_holiday: number;
	overtime_label: number;
}

interface LifetimeTotals {
	total_pay: number;
	total_late_minutes: number;
	total_work_hours: number;
	total_overtime_hours: number;
}

interface MonthData {
	year: number;
	month: number;
	label: string;
	has_data: boolean;
}

interface UserProps {
	name: string;
	email: string;
	profile_photo_url?: string;
	employee?: {
		employee_number?: string;
		avatar?: string;
		position?: { name: string };
	};
}

interface PageProps {
	user: UserProps;
	periodStats: PeriodStat[];
	lifetime: LifetimeTotals;
	availableMonths: MonthData[];
	defaultMonth?: string;
}

export default function EmployeeStats() {
	const { user, periodStats, lifetime, availableMonths, defaultMonth } = usePage<PageProps>().props;

	const monthsWithData = useMemo(() => {
		if (!Array.isArray(periodStats) || periodStats.length === 0) return [];

		const monthMap = new Map<string, MonthData>();

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

		return Array.from(monthMap.values()).sort((a, b) => {
			if (a.year !== b.year) return a.year - b.year;
			return a.month - b.month;
		});
	}, [periodStats]);

	const initialMonth = useMemo(() => {
		if (monthsWithData.length === 0) return '';

		if (defaultMonth && monthsWithData.some(m => `${m.year}-${m.month}` === defaultMonth)) {
			return defaultMonth;
		}

		return `${monthsWithData[monthsWithData.length - 1].year}-${monthsWithData[monthsWithData.length - 1].month}`;
	}, [defaultMonth, monthsWithData]);

	const [selectedMonth, setSelectedMonth] = useState(initialMonth);
	const [isAnimating, setIsAnimating] = useState(false);

	const selectedMonthData = useMemo(() => {
		if (!selectedMonth || !Array.isArray(periodStats)) return null;
		const [year, month] = selectedMonth.split('-').map(Number);

		return periodStats.find(stat => {
			const statDate = new Date(stat.period_start);
			return statDate.getFullYear() === year && (statDate.getMonth() + 1) === month;
		}) || null;
	}, [selectedMonth, periodStats]);

	useEffect(() => {
		if (selectedMonthData) {
			setIsAnimating(true);
			const timer = setTimeout(() => setIsAnimating(false), 400);
			return () => clearTimeout(timer);
		}
	}, [selectedMonthData]);

	const formatCurrency = (value: number) => {
		if (value === null || value === undefined) return '₱0.00';
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
	};

	const avatarUrl = user.employee?.avatar
		? user.employee.avatar.startsWith('http') ? user.employee.avatar : `/storage/${user.employee.avatar}`
		: null;

	if (!availableMonths || availableMonths.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl border border-slate-200 bg-slate-50/50">
				<Calendar className="h-12 w-12 text-slate-300 mb-4" />
				<h3 className="text-slate-700 font-medium">No data available</h3>
				<p className="text-slate-500 text-sm mt-1">Your payroll or attendance records will appear here once processed.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-1 sm:px-2">
			<style>{`
				@keyframes fadeUp {
				from { opacity: 0; transform: translateY(12px); }
				to   { opacity: 1; transform: translateY(0); }
				}
				.card-fade-up { 
				animation: fadeUp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.05) both;
				animation-fill-mode: both;
				}
			`}</style>

			{/* Profile & Header */}
			<div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-5 shadow-sm overflow-hidden relative">
				<div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-r from-[#1d4791] to-[#2a5bb5]" />
				<div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-4 pt-4">
					<div className="relative -mt-12 shrink-0">
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt={user?.name || 'Avatar'}
								className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md bg-slate-100"
								onError={(e) => {
									e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=1d4791&color=fff&size=192`;
								}}
							/>
						) : (
							<div className="h-24 w-24 rounded-full border-4 border-white bg-[#1d4791] flex items-center justify-center shadow-md">
								<span className="text-3xl font-bold text-white">
									{user?.name?.charAt(0).toUpperCase() || 'U'}
								</span>
							</div>
						)}
					</div>
					<div className="flex-1 text-center sm:text-left">
						<h1 className="text-xl font-semibold text-slate-400">
							Welcome back, <span className="font-bold gochi-hand-regular">{user?.name || 'Employee'}!</span>
						</h1>
						<p className="text-sm text-slate-500 mt-0.5">
							Here's your weekly performance summary. Keep up the great work and strive for excellence every day!
						</p>
					</div>
					<div className="w-full sm:w-auto flex justify-center sm:justify-end pt-2 sm:pt-0">
						<Select value={selectedMonth} onValueChange={setSelectedMonth}>
							<SelectTrigger className="w-full sm:w-[220px] h-10 rounded-lg border-slate-200 bg-white text-slate-700 text-sm shadow-sm focus:ring-1 focus:ring-[#1d4791]/50">
								<SelectValue placeholder="Select month" />
							</SelectTrigger>
							<SelectContent className="rounded-xl shadow-xl">
								{monthsWithData.map(({ year, month, label }) => (
									<SelectItem key={`${year}-${month}`} value={`${year}-${month}`} className="text-sm cursor-pointer">
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{/* Monthly Stats Grid */}
			{selectedMonthData ? (
				<>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<MetricCard
							title="Net Salary"
							value={formatCurrency(selectedMonthData.net_pay)}
							icon={PhilippinePeso}
							trend={selectedMonthData.net_pay > 0 ? 'Successfully paid' : undefined}
							animate={isAnimating}
							delay={0}
							color="navy"
						/>
						<MetricCard
							title="Hours Worked"
							value={`${selectedMonthData.normal_work_hours} hrs`}
							subtitle={`of ${selectedMonthData.scheduled_days} scheduled days`}
							icon={Briefcase}
							animate={isAnimating}
							delay={60}
							color="navy"
						/>
						<MetricCard
							title="Overtime"
							value={`${(selectedMonthData.overtime_workday + selectedMonthData.overtime_holiday + selectedMonthData.overtime_label).toFixed(1)} hrs`}
							icon={TrendingUp}
							animate={isAnimating}
							delay={120}
							color="navy"
						/>
					</div>

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
							title="Early Leaves"
							value={`${selectedMonthData.leave_early_minutes} min`}
							icon={AlertCircle}
							color="orange"
							animate={isAnimating}
							delay={120}
						/>
					</div>

					<div className={`rounded-lg bg-[#1d4791]/5 px-4 py-3 border border-[#1d4791]/10 flex items-center gap-2 card-fade-up ${isAnimating ? 'animate-delay-200' : ''}`}>
						<Award className="h-4 w-4 text-[#1d4791] shrink-0" />
						<span className="text-xs font-medium text-slate-600">
							{selectedMonth === defaultMonth
								? 'Current weekly performance summary'
								: `Performance report for ${new Date(selectedMonthData.period_start).toLocaleString('default', { month: 'long', year: 'numeric' })}`}
						</span>
					</div>
				</>
			) : (
				<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
					<Calendar className="mx-auto h-10 w-10 text-slate-400 mb-3" />
					<p className="text-sm font-medium text-slate-600">No records for this period</p>
					<p className="text-xs text-slate-400 mt-1">Please select a different month or check back later.</p>
				</div>
			)}

			{/* Lifetime Summary */}
			{lifetime && (
				<div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-2">
					<div className="flex items-center gap-2 bg-slate-50 px-5 py-3 border-b border-slate-100">
						<Award className="h-4 w-4 text-[#1d4791]" />
						<h2 className="text-sm font-semibold text-slate-800 tracking-tight">Lifetime Totals</h2>
					</div>
					<div className="bg-white px-5 py-5">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<LifetimeCard title="Total Earnings" value={formatCurrency(lifetime.total_pay)} icon={DollarSign} delay={0} />
							<LifetimeCard title="Total Work Hours" value={`${lifetime.total_work_hours} hrs`} icon={Briefcase} delay={60} />
							<LifetimeCard title="Total Late Minutes" value={`${lifetime.total_late_minutes} min`} icon={Clock} delay={120} />
							<LifetimeCard title="Total Overtime" value={`${lifetime.total_overtime_hours} hrs`} icon={TrendingUp} delay={180} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

interface MetricCardProps {
	title: string;
	value: string;
	subtitle?: string;
	icon: React.ElementType;
	trend?: string;
	animate: boolean;
	delay: number;
	color: 'navy' | 'orange';
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, animate, delay, color }: MetricCardProps) {
	const style = animate ? { animationDelay: `${delay}ms` } : {};
	const isNavy = color === 'navy';
	const accentColor = isNavy ? '#1d4791' : '#d85e39';
	const bgIcon = isNavy ? 'bg-[#1d4791]/10 text-[#1d4791]' : 'bg-[#d85e39]/10 text-[#d85e39]';

	return (
		<div
			className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 ${animate ? 'card-fade-up' : ''}`}
			style={style}
		>
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<p className="text-sm font-medium text-slate-500">{title}</p>
					<h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
					{subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
					{trend && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 mt-2">{trend}</span>}
				</div>
				<div className={`p-2.5 rounded-lg ${bgIcon}`}>
					<Icon className="h-5 w-5" />
				</div>
			</div>
		</div>
	);
}

interface SecondaryMetricCardProps {
	title: string;
	value: string;
	icon: React.ElementType;
	color: 'orange' | 'navy';
	animate: boolean;
	delay: number;
}

function SecondaryMetricCard({ title, value, icon: Icon, color, animate, delay }: SecondaryMetricCardProps) {
	const isOrange = color === 'orange';
	const accent = isOrange ? '#d85e39' : '#1d4791';
	const bg = isOrange ? 'bg-[#d85e39]/10 text-[#d85e39]' : 'bg-[#1d4791]/10 text-[#1d4791]';
	const style = animate ? { animationDelay: `${delay}ms` } : {};

	return (
		<div
			className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between ${animate ? 'card-fade-up' : ''}`}
			style={style}
		>
			<div>
				<p className="text-sm font-medium text-slate-500">{title}</p>
				<p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
			</div>
			<div className={`rounded-lg p-2 shrink-0 ${bg}`}>
				<Icon className="h-5 w-5" />
			</div>
		</div>
	);
}

interface LifetimeCardProps {
	title: string;
	value: string;
	icon: React.ElementType;
	delay: number;
}

function LifetimeCard({ title, value, icon: Icon, delay }: LifetimeCardProps) {
	return (
		<div
			className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm card-fade-up flex items-center gap-3"
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className="p-2 rounded-full bg-slate-200/50 text-slate-600">
				<Icon className="h-4 w-4" />
			</div>
			<div>
				<p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
				<p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
			</div>
		</div>
	);
}
