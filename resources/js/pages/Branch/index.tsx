// pages/branches/index.tsx
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Building2, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import BranchController from "@/actions/App/Http/Controllers/BranchController";
import { CustomHeader } from '@/components/custom-header';
import { CustomTable } from '@/components/custom-table';
// import { CustomToast, toast } from '@/components/custom-toast';
import { toast } from 'sonner';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { Button } from '@/components/ui/button';
import { CustomPagination } from '@/components/custom-pagination';
import { BranchesTableConfig } from '@/config/tables/branch-table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-modal";

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Branches',
		href: '/branches',
	},
];

interface Branches {
	id: number;
	branch_name: string;
	branch_slug: string;
	branch_address: string;
	sites?: {
		id: number;
		site_name: string;
	}[];
}

interface LinkProps {
	active: boolean;
	label: string;
	url: string | null;
}

interface BranchesPagination {
	data: Branches[];
	links: LinkProps[];
	from: number;
	to: number;
	total: number;
}

interface FilterProps {
	search: string;
	perPage: string;
}

interface IndexProps {
	branches: BranchesPagination;
	filters: FilterProps;
	totalCount: number;
	filteredCount: number;
}

// Custom toast style helper
const toastStyle = (color: string) => ({
	style: {
		backgroundColor: 'white',
		color: color,
		border: '1px solid #e2e8f0',
		boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
	},
});

export default function Index({ branches, filters, totalCount, filteredCount }: IndexProps) {
	const { delete: destroy } = useForm();
	const { props } = usePage<{ flash?: { success?: string; error?: string; warning?: string; info?: string } }>();

	// Delete confirmation dialog state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [branchToDelete, setBranchToDelete] = useState<Branches | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { data, setData } = useForm({
		search: filters.search || '',
		perPage: filters.perPage || '10',
	});

	// Track last shown flash to prevent duplicates within a short time window
	const lastFlashRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

	// Flash message listener – prevents duplicate toasts within 500ms
	useEffect(() => {
		const flash = props.flash;
		if (!flash) return;

		const flashKey = JSON.stringify(flash);
		const now = Date.now();
		const last = lastFlashRef.current;

		// If same flash key appeared within last 500ms, skip (prevents double toast)
		if (last.key === flashKey && (now - last.time) < 500) {
			return;
		}

		// Update ref
		lastFlashRef.current = { key: flashKey, time: now };

		if (flash.success) {
			toast.success(flash.success, toastStyle('#16a34a')); // green text
		}
		if (flash.error) {
			toast.error(flash.error, toastStyle('#dc2626')); // red text (danger)
		}
		if (flash.warning) {
			toast.warning(flash.warning, toastStyle('#f97316')); // orange text (warning)
		}
		if (flash.info) {
			toast.info(flash.info, toastStyle('#3b82f6')); // blue text (info)
		}
	}, [props.flash]);

	const handleSearchChange = (value: string) => {
		setData('search', value);

		const queryString = {
			...(value && { search: value }),
			...(data.perPage && { perPage: data.perPage }),
		};

		router.get(BranchController.index.url(), queryString, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleClearAll = () => {
		setData('search', '');
		setData('perPage', '10');

		router.get(BranchController.index.url(), {}, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handlePerPageChange = (value: string) => {
		setData('perPage', value);

		const queryString = {
			...(data.search && { search: data.search }),
			...(value && { perPage: value }),
		};

		router.get(BranchController.index.url(), queryString, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleDeleteClick = (branch: Branches) => {
		setBranchToDelete(branch);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (!branchToDelete) return;

		setIsDeleting(true);
		destroy(BranchController.destroy(branchToDelete.branch_slug).url, {
			onSuccess: () => {
				// Flash message will be shown by global useEffect
				setDeleteDialogOpen(false);
				setBranchToDelete(null);
			},
			onError: (errors) => {
				const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete branch.';
				toast.error(errorMessage, toastStyle('#dc2626')); // red text, white background
			},
			onFinish: () => {
				setIsDeleting(false);
			}
		});
	};

	const editBranch = (branch: Branches) => {
		router.get(BranchController.edit(branch.branch_slug).url);
	};

	const hasActiveFilters = !!data.search.trim();

	const handleShowSites = (branch: Branches) => {
		router.get(BranchController.show(branch.branch_slug).url);
	}

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Branches" />
			{/* <CustomToast /> */}

			<style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-row { animation: fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both; }
                @keyframes headerReveal {
                    from { opacity: 0; transform: translateY(-10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .pp-header { animation: headerReveal 0.35s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

			<div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 mx-4">
				<div className="flex pp-header justify-between">
					<CustomHeader
						title='Branch'
						icon={<Building2 className="h-6 w-6" />}
						description='A list of all branches'
					/>

					<div className="flex items-center gap-2">
						<Link
							href={BranchController.create()}
							className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
						>
							+ Add Branch
						</Link>
					</div>
				</div>

				<div className="pp-row">
					<CustomTable
						columns={BranchesTableConfig.columns}
						actions={BranchesTableConfig.actions}
						data={branches.data}
						from={branches.from}
						onDelete={handleDeleteClick}
						onView={handleShowSites}
						onEdit={editBranch}
						title="Branches"
						toolbar={
							<EmployeeFilterBar
								filters={{
									search: true,
									position: false,
									branch: false,
									site: false,
									date: false,
									status: false,
								}}
								searchTerm={data.search}
								onSearchChange={handleSearchChange}
								onClearAll={hasActiveFilters ? handleClearAll : undefined}
								searchPlaceholder="Search by branch name or address..."
							/>
						}
						filterEmptyState={
							hasActiveFilters && branches.data.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 px-6 text-center">
									<div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
										<Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
									</div>
									<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
										No results found
									</h3>
									<p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
										No branches matching "{data.search}".
									</p>
									<Button variant="outline" size="sm" onClick={handleClearAll}>
										Clear search
									</Button>
								</div>
							) : undefined
						}
					/>

					<CustomPagination
						pagination={branches}
						perPage={data.perPage}
						onPerPageChange={handlePerPageChange}
						totalCount={totalCount}
						filteredCount={filteredCount}
						search={data.search}
						resourceName='branches'
					/>

					<DeleteConfirmationDialog
						isOpen={deleteDialogOpen}
						onClose={() => {
							setDeleteDialogOpen(false);
							setBranchToDelete(null);
						}}
						onConfirm={confirmDelete}
						title="Delete Branch"
						itemName={branchToDelete?.branch_name}
						isLoading={isDeleting}
						confirmText="Delete Branch"
					/>
				</div>
			</div>
		</AppLayout>
	);
}