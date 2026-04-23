import { Head, useForm, usePage, router} from '@inertiajs/react';
import { Building2, MapPin, PlusCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from '@/components/custom-toast';          // ← custom toast, same as index
import { store } from '@/actions/App/Http/Controllers/BranchController';
import InputError from '@/components/input-error';
import SiteRepeater from '@/components/site-repeater';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { CustomToast } from '@/components/custom-toast';   // ← add CustomToast component

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Branches',
		href: '/branches',
	},
	{
		title: 'Create Branch',
		href: '/branch/create',
	},
];

interface FormData {
	branch_name: string;
	branch_address: string;
	sites: Array<{ site_name: string }>;
}

// Same toastStyle helper as index
const toastStyle = (color: string) => ({
	style: {
		backgroundColor: 'white',
		color: color,
		border: '1px solid #e2e8f0',
		boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
	},
});

export default function Create() {
	const { data, setData, errors, processing, post } = useForm<FormData>({
		branch_name: '',
		branch_address: '',
		sites: [],
	});

	const { props } = usePage<{ flash?: { success?: string; error?: string; warning?: string; info?: string } }>();

	// Track last shown flash to prevent duplicates (time‑based, same as index)
	const lastFlashRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

	useEffect(() => {
		const flash = props.flash;
		if (!flash) return;

		const flashKey = JSON.stringify(flash);
		const now = Date.now();
		const last = lastFlashRef.current;

		if (last.key === flashKey && (now - last.time) < 500) {
			return;
		}
		lastFlashRef.current = { key: flashKey, time: now };

		if (flash.success) toast.success(flash.success, toastStyle('#16a34a'));
		if (flash.error) toast.error(flash.error, toastStyle('#dc2626'));
		if (flash.warning) toast.warning(flash.warning, toastStyle('#f97316'));
		if (flash.info) toast.info(flash.info, toastStyle('#3b82f6'));
	}, [props.flash]);

	function submitBranch(e: React.FormEvent) {
		e.preventDefault();
		post(store().url);
	}

	const setSites = (sites: Array<{ site_name: string }>) => {
		setData('sites', sites);
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Create Branch" />
			<CustomToast />   {/* ← same as index */}

			<div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
				{/* Page Header */}
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
						<Building2 className="h-6 w-6 text-primary" />
					</div>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Create New Branch</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Add a new branch and configure its associated sites
						</p>
					</div>
				</div>

				<form onSubmit={submitBranch} className="space-y-6">
					{/* Two-column layout for Branch Info and Sites */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
						{/* Branch Information Card - Left Column */}
						<Card className="border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-md">
							<CardHeader className="bg-gradient-to-r from-[#1d4791] to-[#1a3d7a] text-white px-6 py-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
										<Building2 className="h-5 w-5" />
									</div>
									<div>
										<CardTitle className="text-base font-semibold tracking-wide">Branch Information</CardTitle>
										<CardDescription className="text-xs text-white/75 mt-0.5">
											Enter the basic details of the branch
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
												placeholder="e.g., Main Branch, North Branch"
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

									{/* Optional: Helper text */}
									<div className="pt-2 border-t border-slate-100">
										<p className="text-xs text-slate-400 flex items-center gap-1">
											<span className="inline-block h-1 w-1 rounded-full bg-slate-300"></span>
											All fields marked with <span className="text-[#d85e39]">*</span> are required
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
												Add locations under this branch
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

					{/* Form Actions */}
					<div className="flex items-center justify-end gap-3 pt-4 border-t">
						<Button
							type="button"
							variant="outline"
							onClick={() =>  router.get('/branches')}
							className="min-w-[100px] gap-2 hover:cursor-pointer"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={processing}
							className="min-w-[140px] gap-2 hover:cursor-pointer"
						>
							{processing ? (
								<>
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
									Creating...
								</>
							) : (
								<>
									<Building2 className="h-4 w-4" />
									Create Branch
								</>
							)}
						</Button>
					</div>
				</form>
			</div>
		</AppLayout>
	);
}