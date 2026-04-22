import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Coins, Plus, X, Users, Calendar } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { EmployeeSelectionModal } from '@/components/employee-selection-modal';
import { toast } from '@/components/custom-toast';
import type { BreadcrumbItem } from '@/types';
import { store } from '@/actions/App/Http/Controllers/IncentiveController';

interface Employee {
	id: number;
	emp_code: string | number | null;
	user?: { name: string } | null;
	name?: string;
}

interface PayrollPeriod {
	id: number;
	start_date: string;
	end_date: string;
	pay_date: string;
	payroll_per_status: string;
}

interface Props {
	payroll_periods: PayrollPeriod[];
	employees: Employee[];
}

const breadcrumbs: BreadcrumbItem[] = [
	{ title: 'Incentives', href: '/incentives' },
	{ title: 'Create', href: '/incentives/create' },
];

export default function Create({ payroll_periods, employees }: Props) {
	const [showEmployeeModal, setShowEmployeeModal] = useState(false);

	const { data, setData, post, processing, errors, reset } = useForm({
		incentive_name: '',
		incentive_amount: '',
		payroll_period_id: '',
		employee_ids: [] as number[],
		is_daily: false,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		post(store().url, {
			onSuccess: () => {
				toast.success('Incentive created successfully');
				reset();
			},
			onError: (errors) => {
				toast.error(Object.values(errors).flat()[0] || 'Failed to create incentive');
			},
		});
	};

	const toggleEmployee = (id: number) => {
		setData('employee_ids',
			data.employee_ids.includes(id)
				? data.employee_ids.filter(eId => eId !== id)
				: [...data.employee_ids, id]
		);
	};

	const removeEmployee = (id: number) => {
		setData('employee_ids', data.employee_ids.filter(employeeId => employeeId !== id));
	};

	const addAllEmployees = (ids: number[]) => {
		setData('employee_ids', [...data.employee_ids, ...ids]);
	};

	const getEmployeeName = (emp: Employee) =>
		emp.user?.name || emp.name || 'Unnamed Employee';

	const selectedEmployeesList = employees.filter(emp => data.employee_ids.includes(emp.id));

	const formatCurrency = (amount: string | number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(amount));

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Create Incentive" />

			<style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }
                .stagger-1 { animation-delay: 0ms; }
                .stagger-2 { animation-delay: 80ms; }
                .stagger-3 { animation-delay: 160ms; }
                .stagger-4 { animation-delay: 240ms; }
            `}</style>

			<div className="p-4 md:p-6 lg:p-8 mx-12 space-y-5">
				{/* Header */}
				<div className="flex items-center justify-between fade-up stagger-1">
					<div className="flex items-center gap-4">
						<a
							href="/incentives"
							className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1d4791] transition-colors group"
						>
							<ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
							Back to Incentives
						</a>
					</div>
					<div className="bg-gradient-to-r from-[#1d4791] to-[#1a3d7a] px-5 py-3 rounded-xl flex items-center gap-3 shadow-md">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
							<Coins className="h-4.5 w-4.5 text-white" />
						</div>
						<div>
							<h1 className="text-sm font-semibold text-white tracking-wide uppercase">Create Incentive</h1>
							<p className="text-xs text-white/80 truncate mt-0.5">Add a new employee incentive</p>
						</div>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-5">
					<Card className="border border-slate-200 shadow-sm fade-up stagger-2">
						<CardHeader className="bg-gradient-to-r from-[#1d4791] to-[#1a3d7a] text-white px-6 py-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
									<Plus className="h-5 w-5" />
								</div>
								<div>
									<CardTitle className="text-base font-semibold tracking-wide">Incentive Details</CardTitle>
									<CardDescription className="text-xs text-white/75 mt-0.5">
										Enter the incentive information
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-6 space-y-5">
							{/* Incentive Name */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-slate-700">
									<span className="text-[#d85e39]">*</span> Incentive Name
								</Label>
								<Input
									type="text"
									value={data.incentive_name}
									onChange={e => setData('incentive_name', e.target.value)}
									placeholder="e.g., Christmas Bonus, Performance Bonus"
									className="h-11 border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20"
								/>
								{errors.incentive_name && (
									<p className="text-sm text-red-600">{errors.incentive_name}</p>
								)}
							</div>

							{/* Incentive Amount */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-slate-700">
									<span className="text-[#d85e39]">*</span> Incentive Amount
								</Label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₱</span>
									<Input
										type="number"
										step="0.01"
										value={data.incentive_amount}
										onChange={e => setData('incentive_amount', e.target.value)}
										placeholder="0.00"
										className="pl-7 h-11 border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20"
									/>
								</div>
								{errors.incentive_amount && (
									<p className="text-sm text-red-600">{errors.incentive_amount}</p>
								)}
							</div>

							{/* Daily Incentive Toggle */}
							<div className="flex items-center space-x-2">
								<Checkbox
									id="is_daily"
									checked={data.is_daily}
									onCheckedChange={(checked) => setData('is_daily', checked as boolean)}
								/>
								<Label htmlFor="is_daily" className="text-sm font-medium text-slate-700 cursor-pointer">
									Daily Incentive
								</Label>
								<span className="text-xs text-slate-400 ml-2">(Applies per day instead of one-time)</span>
							</div>

							{/* Payroll Period */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-slate-700">
									<span className="text-[#d85e39]">*</span> Payroll Period
								</Label>
								<Select
									value={data.payroll_period_id}
									onValueChange={(value) => setData('payroll_period_id', value)}
								>
									<SelectTrigger className="h-11 border-slate-200">
										<SelectValue placeholder="Select payroll period" />
									</SelectTrigger>
									<SelectContent>
										{payroll_periods.map((period) => (
											<SelectItem key={period.id} value={String(period.id)}>
												{new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.payroll_period_id && (
									<p className="text-sm text-red-600">{errors.payroll_period_id}</p>
								)}
							</div>

							{/* Employees Selection */}
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label className="text-sm font-semibold text-slate-700">
										Assigned Employees
									</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => setShowEmployeeModal(true)}
										className="h-8 gap-1 text-xs"
									>
										<Users className="h-3.5 w-3.5" />
										Select Employees
									</Button>
								</div>

								{selectedEmployeesList.length > 0 ? (
									<div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
										{selectedEmployeesList.map(emp => (
											<div key={emp.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
												<span className="text-sm font-medium">{getEmployeeName(emp)}</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => removeEmployee(emp.id)}
													className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
												>
													<X className="h-3.5 w-3.5" />
												</Button>
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 border-2 border-dashed rounded-lg text-slate-400">
										<Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No employees selected</p>
										<p className="text-xs mt-1">Click "Select Employees" to add employees</p>
									</div>
								)}
								{errors.employee_ids && (
									<p className="text-sm text-red-600">{errors.employee_ids}</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Action Buttons */}
					<div className="flex items-center justify-end gap-3 pt-4 fade-up stagger-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => window.history.back()}
							className="h-11 min-w-[100px] border-slate-200"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={processing}
							className="h-11 min-w-[140px] gap-2 bg-[#1d4791] hover:bg-[#1d4791]/90"
						>
							{processing ? (
								<>
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
									Creating...
								</>
							) : (
								<>
									<Plus className="h-4 w-4" />
									Create Incentive
								</>
							)}
						</Button>
					</div>
				</form>
			</div>

			{/* Employee Selection Modal */}
			<EmployeeSelectionModal
				isOpen={showEmployeeModal}
				onClose={() => setShowEmployeeModal(false)}
				employees={employees}
				selectedIds={data.employee_ids}
				onToggle={toggleEmployee}
				onRemove={removeEmployee}
				onAddAll={addAllEmployees}
				onRemoveAll={() => setData('employee_ids', [])}
			/>
		</AppLayout>
	);
}