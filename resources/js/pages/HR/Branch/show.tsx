// resources/js/pages/branches/show.tsx
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, MapPin, Users, Mail, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { CustomHeader } from '@/components/custom-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/hr-layout';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface EmployeePreview {
	id: number;
	employee_number: string;
	avatar?: string;
	slug_emp?: string;
	user: { name: string; email: string };
}

interface Site {
	id: number;
	site_name: string;
	employees_count: number;
	employees_preview?: EmployeePreview[];
}

interface Branch {
	id: number;
	branch_name: string;
	branch_slug: string;
	branch_address: string;
}

interface PageProps {
	branch: Branch;
	sites: Site[];
}

// ─── Utilities ──────────────────────────────────────────────────────────────
const stringToHslColor = (str: string, s = 70, l = 45): string => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
	return `hsl(${hash % 360}, ${s}%, ${l}%)`;
};

const getInitials = (name: string): string => {
	return name.split(' ').map(p => p[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2) || '?';
};

// ─── Employee Row Component ────────────────────────────────────────────────
function EmployeeRow({ emp }: { emp: EmployeePreview }) {
	const avatarUrl = emp.avatar
		? emp.avatar.startsWith('http') ? emp.avatar : `/storage/${emp.avatar}`
		: null;
	const bg = stringToHslColor(emp.user.name);
	const initials = getInitials(emp.user.name);

	const employeeHref = emp.slug_emp
		? `/hr/employees/${emp.slug_emp}/edit`
		: `/hr/employees/${emp.id}/edit`;

	return (
		<Link
			href={employeeHref}
			className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1d4791]/5 active:bg-[#1d4791]/10 transition-colors cursor-pointer"
		>
			<div
				className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden shadow-sm border border-white/20"
				style={!avatarUrl ? { backgroundColor: bg } : {}}
			>
				{avatarUrl ? (
					<img src={avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
				) : initials}
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-medium text-slate-900 truncate group-hover:text-[#1d4791] transition-colors">
					{emp.user.name}
				</p>
				<p className="text-xs text-slate-500">#{emp.employee_number}</p>
			</div>
			<Mail className="h-4 w-4 text-slate-300 group-hover:text-[#1d4791] transition-colors shrink-0" />
		</Link>
	);
}

// ─── Site Card Component - Always shows ALL employees ──────────────────────
function SiteCard({ site, index }: { site: Site; index: number }) {
	const [showAll, setShowAll] = useState(false);
	const hasEmployees = site.employees_count > 0 && site.employees_preview?.length > 0;
	const allEmployees = site.employees_preview || [];

	// Show first 5 employees initially, all if showAll is true
	const displayedEmployees = showAll ? allEmployees : allEmployees.slice(0, 5);
	const hasMoreEmployees = allEmployees.length > 5;
	const remainingCount = allEmployees.length - 5;

	const staggerDelay = Math.min(6, index + 1) * 40;

	return (
		<div
			className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-[#1d4791]/20 transition-all duration-200 flex flex-col"
			style={{ animationDelay: `${staggerDelay}ms` }}
		>
			{/* Navy Header - Fixed height */}
			<div className="bg-[#1d4791] px-4 py-3 flex items-center justify-between select-none shrink-0">
				<div className="flex items-center gap-2 min-w-0">
					<MapPin className="h-4 w-4 text-white/90 shrink-0" />
					<h3 className="font-semibold text-white text-sm truncate cousine-regular">{site.site_name}</h3>
				</div>
				<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white shrink-0">
					{site.employees_count}
				</span>
			</div>

			{/* Body - Fixed height with scroll when needed */}
			<div className="p-4 flex-1 flex flex-col min-h-0">
				{!hasEmployees ? (
					<div className="flex flex-col items-center justify-center py-5 text-center">
						<div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center mb-2">
							<Users className="h-4 w-4 text-slate-400" />
						</div>
						<p className="text-sm text-slate-500">No employees assigned</p>
					</div>
				) : (
					<>
						{/* Employee list with fixed max height and scrollbar */}
						<div
							className={`space-y-1 overflow-y-auto transition-all duration-300 ${showAll ? 'max-h-[400px]' : 'max-h-[280px]'
								}`}
						>
							{displayedEmployees.map(emp => (
								<EmployeeRow key={emp.id} emp={emp} />
							))}
						</div>

						{/* Load More / Show Less button */}
						{hasMoreEmployees && (
							<button
								onClick={() => setShowAll(!showAll)}
								className="mt-3 w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs font-medium text-[#1d4791] bg-[#1d4791]/5 hover:bg-[#1d4791]/10 transition-colors"
							>
								{showAll ? (
									<>
										<ChevronUp className="h-3.5 w-3.5" />
										Show less
									</>
								) : (
									<>
										<ChevronDown className="h-3.5 w-3.5" />
										Load {remainingCount} more employee{remainingCount > 1 ? 's' : ''}
									</>
								)}
							</button>
						)}
					</>
				)}
			</div>
		</div>
	);
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Show({ branch, sites }: PageProps) {
	const breadcrumbs: BreadcrumbItem[] = [
		{ title: 'Branches', href: '/hr/branches' },
		{ title: branch.branch_name, href: `/hr/branches/${branch.branch_slug}` },
		{ title: 'Sites', href: `/hr/branches/${branch.branch_slug}/sites` },
	];

	const safeSites = sites || [];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title={`Sites • ${branch.branch_name}`} />

			<style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up { 
                    animation: fadeUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
                    animation-fill-mode: both;
                }
            `}</style>

			<div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 mx-4">
				{/* Header */}
				<div className="flex justify-between items-start animate-fade-up">
					<div className="space-y-1">
						<Link
							href="/hr/branches"
							className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1d4791] transition-colors group mb-4"
						>
							<ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
							Back to branches
						</Link>
						<CustomHeader
							title={branch.branch_name}
							icon={<Building2 className="h-6 w-6" />}
							description={branch.branch_address}
						/>
					</div>
					<Link href={`/hr/branches/${branch.branch_slug}/edit`}>
						<Button variant="outline" className="border-slate-200 transition-all mt-10">
							<Pencil size={16} />
							Edit Branch
						</Button>
					</Link>
				</div>

				{/* Sites Grid */}
				<div className="animate-fade-up" style={{ animationDelay: '40ms' }}>
					{safeSites.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{safeSites.map((site, idx) => (
								<SiteCard key={site.id} site={site} index={idx} />
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50">
							<div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
								<Building2 className="h-5 w-5 text-slate-400" />
							</div>
							<h3 className="text-sm font-semibold text-slate-700 mb-1">No sites found</h3>
							<p className="text-xs text-slate-500">This branch doesn't have any sites assigned yet.</p>
						</div>
					)}
				</div>
			</div>
		</AppLayout>
	);
}