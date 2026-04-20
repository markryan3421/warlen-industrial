// resources/js/pages/branches/edit.tsx
import { Head, Link, useForm } from '@inertiajs/react';
import { Building2, MapPin, Pencil, Save, ArrowLeft, PlusCircle } from 'lucide-react';
import { toast } from '@/components/custom-toast';
import InputError from '@/components/input-error';
import SiteRepeater from '@/components/site-repeater';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────
interface FormData {
	branch_name: string;
	branch_address: string;
	sites: Array<{ id?: number; site_name: string }>;
}

interface Props {
	branch: {
		id: number;
		branch_slug: string;
		branch_name: string;
		branch_address: string;
		sites: Array<{ id: number; site_name: string }>;
	};
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Edit({ branch }: Props) {
	const { data, setData, errors, processing, put } = useForm<FormData>({
		branch_name: branch.branch_name || '',
		branch_address: branch.branch_address || '',
		sites: branch.sites || [],
	});

	function submitBranch(e: React.FormEvent) {
		e.preventDefault();
		put(`/branches/${branch.branch_slug}`, {
			onSuccess: (page) => {
				toast.success((page.props as any).flash?.success || 'Branch updated successfully.');
			},
			onError: (errors) => {
				const msg = Object.values(errors).flat()[0] || 'Failed to update branch.';
				toast.error(msg);
			},
		});
	}

	const setSites = (sites: Array<{ id?: number; site_name: string }>) => {
		setData('sites', sites);
	};

	const breadcrumbs: BreadcrumbItem[] = [
		{ title: 'Branches', href: '/branches' },
		{ title: 'Edit', href: `/branches/${branch.branch_slug}/edit` },
	];

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title={`Edit Branch: ${branch.branch_name}`} />

			<style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .fade-up { 
                    animation: fadeUp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.05) both;
                    animation-fill-mode: both;
                }
                .stagger-1 { animation-delay: 0ms; }
                .stagger-2 { animation-delay: 80ms; }
                .stagger-3 { animation-delay: 160ms; }
                .stagger-4 { animation-delay: 240ms; }
            `}</style>

			<div className="p-4 md:p-6 lg:p-8 max-w-6xl space-y-5">

				{/* ─── Header ───────────────────────────────────────────────── */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 fade-up stagger-1">
					<Link
						href="/branches"
						className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#1d4791] transition-colors group"
					>
						<ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
						Back to branches
					</Link>

					<div className="bg-gradient-to-r from-[#1d4791] to-[#1a3d7a] px-5 py-3 rounded-xl flex items-center gap-3 w-full sm:w-auto shadow-md">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
							<Pencil className="h-4.5 w-4.5 text-white" />
						</div>
						<div className="min-w-0">
							<h1 className="text-sm font-semibold text-white tracking-wide uppercase">Editing:</h1>
							<p className="text-xs text-white/80 truncate mt-0.5">{branch.branch_name}</p>
						</div>
					</div>
				</div>

				{/* ─── Form ─────────────────────────────────────────────────── */}
				<form onSubmit={submitBranch} className="space-y-5">
					{/* Two-column layout with equal height cards */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

						{/* Branch Details Card - Left Column */}
						<Card className="border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-md">
							<CardHeader className="bg-gradient-to-r from-[#1d4791] to-[#1a3d7a] text-white px-6 py-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
										<Building2 className="h-5 w-5" />
									</div>
									<div>
										<CardTitle className="text-base font-semibold tracking-wide">Branch Details</CardTitle>
										<CardDescription className="text-xs text-white/75 mt-0.5">
											Update basic information
										</CardDescription>
									</div>
								</div>
							</CardHeader>

							<CardContent className="p-6 flex-1">
								<div className="space-y-5">
									{/* Branch Name Field */}
									<div className="space-y-2">
										<label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
											<span className="text-[#d85e39] text-base">*</span>
											Branch Name
											<span className="text-xs font-normal text-slate-400 ml-1">(required)</span>
										</label>
										<div className="relative group">
											<Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1d4791] transition-colors" />
											<Input
												type="text"
												value={data.branch_name}
												onChange={e => setData('branch_name', e.target.value)}
												placeholder="e.g., Main Branch, North Hub"
												className="pl-9 h-11 border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20 transition-all"
											/>
										</div>
										<InputError message={errors.branch_name} />
									</div>

									{/* Branch Address Field */}
									<div className="space-y-2">
										<label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
											<span className="text-[#d85e39] text-base">*</span>
											Branch Address
											<span className="text-xs font-normal text-slate-400 ml-1">(required)</span>
										</label>
										<div className="relative group">
											<MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1d4791] transition-colors" />
											<Input
												type="text"
												value={data.branch_address}
												onChange={e => setData('branch_address', e.target.value)}
												placeholder="Enter complete branch address"
												className="pl-9 h-11 border-slate-200 focus:border-[#1d4791] focus:ring-2 focus:ring-[#1d4791]/20 transition-all"
											/>
										</div>
										<InputError message={errors.branch_address} />
									</div>

									{/* Helper text */}
									<div className="pt-2 border-t border-slate-100">
										<p className="text-xs text-slate-400 flex items-center gap-1">
											<span className="inline-block h-1 w-1 rounded-full bg-slate-300"></span>
											Fields marked with <span className="text-[#d85e39]">*</span> are required
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Branch Sites Card - Right Column */}
						<Card className="border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-md">
							<CardHeader className="bg-gradient-to-r from-[#1d4791] to-[#1a3d7a] text-white px-6 py-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
											<PlusCircle className="h-5 w-5" />
										</div>
										<div>
											<CardTitle className="text-base font-semibold tracking-wide">Branch Sites</CardTitle>
											<CardDescription className="text-xs text-white/75 mt-0.5">
												Manage associated locations
											</CardDescription>
										</div>
									</div>

									{/* Site count badge */}
									{data.sites.length > 0 && (
										<div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1">
											<span className="text-xs font-semibold text-white">
												{data.sites.length}
											</span>
											<span className="text-[10px] text-white/75 uppercase tracking-wider">
												{data.sites.length === 1 ? 'Site' : 'Sites'}
											</span>
										</div>
									)}
								</div>
							</CardHeader>

							<CardContent className="p-6 flex-1">
								<SiteRepeater
									sites={data.sites}
									setSites={setSites}
									errors={errors}
								/>
							</CardContent>
						</Card>
					</div>

					{/* ─── Action Buttons ──────────────────────────────────────────── */}
					<div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 mt-6 -mx-4 px-4 py-4 lg:relative lg:bg-transparent lg:border-t-0 lg:mt-8 lg:px-0 lg:py-0">
						<div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 max-w-6xl mx-auto">
							<Button
								type="button"
								variant="outline"
								onClick={() => window.history.back()}
								className="w-full sm:w-auto min-w-[120px] h-11 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={processing}
								className="w-full sm:w-auto min-w-[160px] h-11 px-6 gap-2 bg-gradient-to-r from-[#1d4791] to-[#1a3d7a] hover:from-[#1a3d7a] hover:to-[#163568] text-white shadow-md shadow-[#1d4791]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
							>
								{processing ? (
									<>
										<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
										<span>Saving...</span>
									</>
								) : (
									<>
										<Save className="h-4 w-4" />
										<span>Update Branch</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</AppLayout>
	);
}