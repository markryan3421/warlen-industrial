// resources/js/pages/employees/show.tsx
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	ArrowLeft, Edit, Trash2, Mail, Phone, Calendar, MapPin,
	Building2, Briefcase, CreditCard, Clock, User, Hash
} from 'lucide-react';
import { useState } from 'react';
import EmployeeController from '@/actions/App/Http/Controllers/EmployeeController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Employee {
	id: number;
	slug_emp: string;
	emp_code: number;
	avatar: string;
	employee_number: string;
	emergency_contact_number: string;
	contract_start_date: string;
	contract_end_date: string;
	pay_frequency: 'weekender' | 'monthly' | 'semi_monthly';
	employee_status: 'active' | 'inactive';
	created_at: string;
	updated_at: string;
	position: {
		id: number;
		pos_name: string;
		deleted_at: string | null;
	} | null;
	branch: {
		id: number;
		branch_name: string;
		branch_address: string;
	} | null;
	site: {
		id: number;
		site_name: string;
	} | null;
	user: {
		id: number;
		name: string;
		email: string;
		avatar: string;
	};
}

interface PageProps {
	employee: Employee;
}

// ─── Utility Functions ──────────────────────────────────────────────────────
const formatDate = (dateString?: string | null): string => {
	if (!dateString) return '—';
	try {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	} catch {
		return dateString;
	}
};

const formatPayFrequency = (freq: string): string => {
	return freq.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Deterministic HSL color from string hash
const stringToHslColor = (str: string, s = 70, l = 45): string => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = hash % 360;
	return `hsl(${hue}, ${s}%, ${l}%)`;
};

const getAvatarBg = (name: string): string => {
	return {
		backgroundColor: stringToHslColor(name),
		color: '#ffffff',
	};
};

const getInitials = (name?: string): string => {
	if (!name) return '?';
	return name.split(' ').map(part => part[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2) || '?';
};

// ─── Status Badge Component ─────────────────────────────────────────────────
interface StatusBadgeProps {
	status: 'active' | 'inactive';
}

function StatusBadge({ status }: StatusBadgeProps) {
	const isActive = status === 'active';
	return (
		<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isActive
			? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
			: 'bg-orange-500/10 text-orange-700 border-orange-200'
			}`}>
			<span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-emerald-500' : 'bg-orange-500'
				}`} />
			{status}
		</span>
	);
}

// ─── Frequency Badge Component ──────────────────────────────────────────────
interface FreqBadgeProps {
	frequency: string;
}

function FreqBadge({ frequency }: FreqBadgeProps) {
	return (
		<span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#1d4791]/10 text-[#1d4791] border border-[#1d4791]/20">
			<CreditCard className="h-3 w-3 mr-1" />
			{formatPayFrequency(frequency)}
		</span>
	);
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Show({ employee }: PageProps) {
	const { delete: destroy } = useForm();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = () => {
		setIsDeleting(true);
		destroy(EmployeeController.destroy(employee.slug_emp).url, {
			onFinish: () => {
				setIsDeleting(false);
				setIsDeleteDialogOpen(false);
			},
		});
	};

	const breadcrumbs: BreadcrumbItem[] = [
		{ title: 'Employees', href: '/employees' },
		{ title: employee.user?.name ?? `Employee #${employee.emp_code}`, href: `/employees/${employee.slug_emp}` },
	];

	const avatarUrl = employee.avatar
		? employee.avatar.startsWith('http')
			? employee.avatar
			: `/storage/${employee.avatar}`
		: null;

	const employeeName = employee.user?.name || 'Employee';

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title={`Employee: ${employeeName}`} />

			<style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { 
                    animation: fadeUp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.05) both;
                }
                .stagger-1 { animation-delay: 0ms; }
                .stagger-2 { animation-delay: 40ms; }
                .stagger-3 { animation-delay: 80ms; }
                .stagger-4 { animation-delay: 120ms; }
                .stagger-5 { animation-delay: 160ms; }
            `}</style>

			<div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">

				{/* ─── Header Actions ──────────────────────────────────────── */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 fade-up stagger-1">
					{/* Back to the previous page */}
					<Button
						onClick={() => router.get('/employees')}
						className="inline-flex items-center gap-2 text-sm group"
					>
						<ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
						<span>Back to list</span>
					</Button>

					<div className="flex gap-2 self-start sm:self-auto">
						<Link href={EmployeeController.edit(employee.slug_emp).url}>
							<Button
								variant="outline"
								size="sm"
								className="gap-2 h-9 border-slate-200 text-slate-700 hover:bg-[#1d4791] hover:text-white hover:border-[#1d4791] transition-all"
							>
								<Edit className="h-4 w-4" />
								Edit
							</Button>
						</Link>

						<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
							<DialogTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="gap-2 h-9 border-[#d85e39]/30 text-[#d85e39] bg-[#d85e39]/5 hover:bg-[#d85e39] hover:text-white transition-all"
								>
									<Trash2 className="h-4 w-4" />
									Delete
								</Button>
							</DialogTrigger>
							<DialogContent className="rounded-xl shadow-xl">
								<DialogHeader>
									<DialogTitle className="text-slate-900">Confirm deletion</DialogTitle>
									<DialogDescription className="text-slate-500">
										Are you sure you want to delete <span className="font-semibold text-slate-700">{employeeName}</span>? This action cannot be undone.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter className="gap-2 sm:gap-0">
									<Button
										variant="outline"
										onClick={() => setIsDeleteDialogOpen(false)}
										disabled={isDeleting}
										className="border-slate-200"
									>
										Cancel
									</Button>
									<Button
										variant="destructive"
										onClick={handleDelete}
										disabled={isDeleting}
										className="bg-[#d85e39] hover:bg-[#d85e39]/90 text-white shadow-sm shadow-[#d85e39]/20"
									>
										{isDeleting ? 'Deleting...' : 'Delete'}
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>

				{/* ─── Employee Card ───────────────────────────────────────── */}
				<Card className="overflow-hidden border-slate-200 shadow-sm fade-up stagger-2">
					{/* Navy Header */}
					<div className="bg-[#1d4791] px-5 py-4 flex items-center justify-between">
						<div className="flex items-center gap-3">
							<User className="h-4 w-4 text-white/90" />
							<h2 className="text-sm font-semibold text-white tracking-wide uppercase">Employee Details</h2>
						</div>
						<StatusBadge status={employee.employee_status} />
					</div>

					<CardContent className="p-0">
						{/* Profile Section */}
						<div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
							<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
								{/* Avatar */}
								<div className="relative shrink-0">
									{avatarUrl ? (
										<img
											src={avatarUrl}
											alt={employeeName}
											className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-sm"
											onError={(e) => {
												const target = e.currentTarget;
												target.style.display = 'none';
												target.nextElementSibling?.classList.remove('hidden');
											}}
										/>
									) : null}
									<div
										className={`h-20 w-20 rounded-full flex items-center justify-center text-xl font-bold shadow-sm border-4 border-white ${!avatarUrl ? '' : 'hidden'}`}
										style={getAvatarBg(employeeName)}
									>
										{getInitials(employeeName)}
									</div>
								</div>

								{/* Name & Contact */}
								<div className="flex-1 text-center sm:text-left space-y-2">
									<div>
										<h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
											{employeeName}
										</h1>
										<div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
											<span className="text-sm text-slate-500">#{employee.employee_number}</span>
											<span className="text-slate-300">•</span>
											<FreqBadge frequency={employee.pay_frequency} />
										</div>
									</div>

									<div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1.5 pt-1">
										<a
											href={`mailto:${employee.user?.email}`}
											className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#1d4791] transition-colors"
										>
											<Mail className="h-3.5 w-3.5 text-slate-400" />
											{employee.user?.email || '—'}
										</a>
										{employee.emergency_contact_number && (
											<a
												href={`tel:${employee.emergency_contact_number}`}
												className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-[#1d4791] transition-colors"
											>
												<Phone className="h-3.5 w-3.5 text-slate-400" />
												{employee.emergency_contact_number}
											</a>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Info Grid */}
						<div className="p-5 sm:p-6">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

								{/* Left: Personal & Employment */}
								<div className="space-y-4">
									<InfoSection
										icon={User}
										title="Personal Information"
										delay={3}
									>
										<InfoRow label="Employee Code" value={`#${employee.emp_code}`} />
										<InfoRow label="Employee Number" value={employee.employee_number} />
										<InfoRow label="Emergency Contact" value={employee.emergency_contact_number || '—'} />
									</InfoSection>

									<InfoSection
										icon={Briefcase}
										title="Position & Pay"
										delay={4}
									>
										<InfoRow
											label="Position"
											value={
												employee.position?.pos_name
													? employee.position.deleted_at
														? <span className="text-slate-400 line-through">{employee.position.pos_name}</span>
														: employee.position.pos_name
													: <span className="text-slate-400 italic">Not assigned</span>
											}
										/>
										<InfoRow label="Pay Frequency" value={<FreqBadge frequency={employee.pay_frequency} />} isComponent />
									</InfoSection>
								</div>

								{/* Right: Location, Contract, System */}
								<div className="space-y-4">
									<InfoSection
										icon={MapPin}
										title="Work Location"
										delay={5}
									>
										<InfoRow label="Branch" value={employee.branch?.branch_name || '—'} />
										{employee.branch?.branch_address && (
											<InfoRow label="Address" value={employee.branch.branch_address} isMultiline />
										)}
										<InfoRow label="Site" value={employee.site?.site_name || '—'} />
									</InfoSection>

									<InfoSection
										icon={Calendar}
										title="Contract Period"
										delay={6}
									>
										<InfoRow label="Start Date" value={formatDate(employee.contract_start_date)} />
										<InfoRow label="End Date" value={formatDate(employee.contract_end_date)} />
									</InfoSection>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}

// ─── Helper Components ──────────────────────────────────────────────────────

interface InfoSectionProps {
	icon: React.ElementType;
	title: string;
	children: React.ReactNode;
	delay: number;
	fullWidth?: boolean;
}

function InfoSection({ icon: Icon, title, children, delay, fullWidth = false }: InfoSectionProps) {
	return (
		<div className={`rounded-lg border border-slate-200 bg-white fade-up stagger-${delay} ${fullWidth ? '' : ''}`}>
			<div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
				<Icon className="h-4 w-4 text-[#1d4791]" />
				<h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</h3>
			</div>
			<dl className="p-4 space-y-2.5 text-sm">{children}</dl>
		</div>
	);
}

interface InfoRowProps {
	label: string;
	value: React.ReactNode;
	isComponent?: boolean;
	isMultiline?: boolean;
}

function InfoRow({ label, value, isComponent = false, isMultiline = false }: InfoRowProps) {
	return (
		<div className="flex justify-between items-start gap-3">
			<dt className="text-slate-500 shrink-0">{label}:</dt>
			<dd className={`font-medium text-slate-900 text-right ${isMultiline ? 'text-left' : ''} ${isComponent ? '' : ''}`}>
				{value}
			</dd>
		</div>
	);
}

interface SystemInfoProps {
	label: string;
	value: string;
	mono?: boolean;
}

function SystemInfo({ label, value, mono = false }: SystemInfoProps) {
	return (
		<div className="text-center sm:text-left">
			<span className="text-xs text-slate-400 block mb-0.5">{label}</span>
			<span className={`text-sm font-medium text-slate-700 ${mono ? 'font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded' : ''}`}>
				{value}
			</span>
		</div>
	);
}