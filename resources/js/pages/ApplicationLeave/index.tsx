import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import Echo from 'laravel-echo';
import { CalendarDays, PlusCircle, Clipboard, X, Bell, Eye, Pencil, Trash2, CheckCircle2, XCircle, Clock, MessageSquare, ShieldCheck, User } from 'lucide-react';
import Pusher from 'pusher-js';
import { useState, useMemo, useEffect } from 'react';
import ApplicationLeaveController from "@/actions/App/Http/Controllers/ApplicationLeaveController";
import { CustomHeader } from '@/components/custom-header';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

// Import Echo and Pusher for Reverb
import { ApplicationLeavesTableConfig } from '@/config/tables/application-leave';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type BranchWithSites } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

// Declare global window interface for Echo
declare global {
	interface Window {
		Echo: any;
	}
}

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: 'Application Leave',
		href: '/application-leave',
	},
];

interface ApplicationLeaveProps {
	applicationLeaves: any[];
}

interface PageProps {
	applicationLeaveEnum: Array<{
		value: string;
		label: string;
	}>;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	});
};

// Helper function to calculate duration
const durationDays = (start: string, end: string) => {
	if (!start || !end) return null;
	const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
	return diff > 0 ? diff : null;
};

export default function Index({ applicationLeaves }: ApplicationLeaveProps) {
	const { delete: destroy } = useForm();
	const { applicationLeaveEnum } = usePage<PageProps>().props;

	// State for real-time updates
	const [leaves, setLeaves] = useState(applicationLeaves);
	const [notification, setNotification] = useState<{ message: string, timestamp: string } | null>(null);
	const [showNotification, setShowNotification] = useState(false);

	// Filter state
	const [statusFilter, setStatusFilter] = useState<string>(() => {
		const savedFilter = localStorage.getItem('applicationLeaves-statusFilter');
		return savedFilter || 'all';
	});

	// Search state
	const [searchTerm, setSearchTerm] = useState<string>("");

	// Dialog state for viewing details
	const [selectedLeave, setSelectedLeave] = useState<any>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Approve/Reject state
	const [approveStatus, setApproveStatus] = useState<'approved' | 'rejected'>('approved');
	const [remarks, setRemarks] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Listen to application-leave channel (Echo is already initialized globally)
	useEffect(() => {
		if (!window.Echo) return;

		const channel = window.Echo.private('application-leave');

		channel.listen('.ApplicationLeaveEvent', (event: any) => {
			setNotification({
				message: `New application leave created/updated`,
				timestamp: new Date().toLocaleString()
			});
			setShowNotification(true);

			// Show notification
			setNotification({
				message: `New application leave created`,
				timestamp: new Date().toLocaleString()
			});
			setShowNotification(true);

			// Auto-hide notification after 5 seconds
			setTimeout(() => {
				setShowNotification(false);
			}, 5000);

			// Update the leaves state with the new data
			setLeaves(prevLeaves => {
				const existingIndex = prevLeaves.findIndex(
					leave => leave.id === event.id
				);

				if (existingIndex !== -1) {
					const updatedLeaves = [...prevLeaves];
					updatedLeaves[existingIndex] = {
						...updatedLeaves[existingIndex],
						...event,
						employee: event.employee || updatedLeaves[existingIndex].employee
					};
					return updatedLeaves;
				} else {
					return [event, ...prevLeaves];
				}
			});
		});

		channel.error((error: any) => {
			console.error('Channel error:', error);
		});

		return () => {
			channel.stopListening('.ApplicationLeaveEvent');
		};
	}, []);

	// Reset approve/reject state when dialog opens with new leave
	useEffect(() => {
		if (selectedLeave) {
			setApproveStatus(selectedLeave.app_status || 'pending');
			setRemarks(selectedLeave.remarks || '');
		}
	}, [selectedLeave]);

	// Save filter to localStorage
	useEffect(() => {
		localStorage.setItem('applicationLeaves-statusFilter', statusFilter);
	}, [statusFilter]);

	// Handle delete
	const handleDelete = (slug_app: string) => {
		if (confirm("Are you sure you want to delete this application leave?")) {
			destroy(ApplicationLeaveController.destroy(slug_app).url, {
				onSuccess: () => {
					setLeaves(prevLeaves =>
						prevLeaves.filter(leave => leave.slug_app !== slug_app)
					);
				}
			});
		}
	};

	// Handle view details
	const handleView = (leave: any) => {
		setSelectedLeave(leave);
		setIsDialogOpen(true);
	};

	// Handle approve/reject submission
	const handleStatusUpdate = () => {
		if (!selectedLeave) return;

		setIsSubmitting(true);

		router.put(ApplicationLeaveController.update(selectedLeave.slug_app).url, {
			app_status: approveStatus,
			remarks: remarks,
		}, {
			onSuccess: () => {
				toast.success(`Leave application ${approveStatus} successfully`);
				setIsDialogOpen(false);
				// Refresh the leaves list
				setLeaves(prevLeaves =>
					prevLeaves.map(leave =>
						leave.id === selectedLeave.id
							? { ...leave, app_status: approveStatus, remarks: remarks }
							: leave
					)
				);
			},
			onError: (errors) => {
				const msg = Object.values(errors).flat()[0] || `Failed to ${approveStatus} leave application.`;
				toast.error(msg);
			},
			onFinish: () => {
				setIsSubmitting(false);
			},
		});
	};

	// Filter and search leaves
	const filteredLeaves = useMemo(() => {
		let result = leaves;

		// Filter by status
		if (statusFilter !== 'all') {
			result = result.filter(leave => {
				const status = leave.app_status || 'pending';
				return status.toLowerCase() === statusFilter.toLowerCase();
			});
		}

		// Filter by search term
		if (searchTerm.trim()) {
			const searchLower = searchTerm.toLowerCase().trim();
			result = result.filter(leave => {
				const employeeName = leave.employee?.user?.name || leave.employee_name || '';
				const employeeCode = leave.employee?.emp_code || '';
				return employeeName.toLowerCase().includes(searchLower) ||
					employeeCode.toLowerCase().includes(searchLower);
			});
		}

		return result;
	}, [leaves, statusFilter, searchTerm]);

	// Handle edit
	const handleEdit = (row: any) => {
		router.get(ApplicationLeaveController.edit(row.slug_app).url);
	};

	// Filter toolbar component
	const FilterToolbar = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{/* Search */}
			{/* <div className="flex flex-col gap-2">
				<Label htmlFor="search">Search</Label>
				<Input
					id="search"
					placeholder="Search by employee name or code..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full h-10"
				/>
			</div> */}

			{/* Status Filter */}
			<div className="flex flex-col gap-2">
				<Label htmlFor="status-filter">Status</Label>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger id="status-filter" className="h-10">
						<SelectValue placeholder="Filter by status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						{applicationLeaveEnum?.map(({ value, label }) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);

	// Empty state for filtered results
	const FilterEmptyState = () => (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="rounded-full bg-gray-100 p-6 mb-4">
				<CalendarDays className="h-12 w-12 text-gray-400" />
			</div>
			<h3 className="text-lg font-semibold mb-2">No leaves found</h3>
			<p className="text-gray-500 mb-6 max-w-sm">
				{searchTerm
					? `No results match "${searchTerm}". Try adjusting your search.`
					: statusFilter !== "all"
						? `No ${statusFilter} leaves found.`
						: 'No application leaves available at the moment.'}
			</p>
			{(searchTerm || statusFilter !== "all") && (
				<Button variant="outline" onClick={() => {
					setSearchTerm("");
					setStatusFilter("all");
				}}>
					Clear Filters
				</Button>
			)}
		</div>
	);

	// Status badge styling
	const getStatusBadge = (status: string) => {
		const statusLower = (status || 'pending').toLowerCase();
		switch (statusLower) {
			case 'approved':
				return 'bg-green-100 text-green-800 border border-green-200';
			case 'rejected':
				return 'bg-red-100 text-red-800 border border-red-200';
			default:
				return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
		}
	};

	const getStatusIcon = (status: string) => {
		const statusLower = (status || 'pending').toLowerCase();
		switch (statusLower) {
			case 'approved':
				return <CheckCircle2 className="h-4 w-4" />;
			case 'rejected':
				return <XCircle className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
	};

	const duration = selectedLeave ? durationDays(selectedLeave.leave_start, selectedLeave.leave_end) : null;

	const StatusBadge = ({ status }: { status: string }) => {
		const statusLower = status?.toLowerCase() || 'pending';
		const styles: Record<string, string> = {
			pending: 'bg-amber-500/10 text-amber-700 border-amber-200',
			submitted: 'bg-blue-500/10 text-blue-700 border-blue-200',
			approved: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
			rejected: 'bg-orange-500/10 text-orange-700 border-orange-200',
		};
		const labels: Record<string, string> = {
			pending: 'Pending',
			submitted: 'Submitted',
			approved: 'Approved',
			rejected: 'Rejected',
		};
		return (
			<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[statusLower] || styles.pending}`}>
				<span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusLower === 'approved' ? 'bg-emerald-500' :
					statusLower === 'rejected' ? 'bg-orange-500' : 'bg-amber-500'
					}`} />
				{labels[statusLower] || 'Pending'}
			</span>
		);
	};

	const decisionForm = useForm<{ app_status: string; remarks: string }>({
		app_status: 'approved',
		remarks: '',
	});

	// Reset form when dialog opens/closes or leave changes
	useEffect(() => {
		if (isDialogOpen && selectedLeave) {
			setApproveStatus(selectedLeave.app_status === 'rejected' ? 'rejected' : 'approved');
			setRemarks('');
			decisionForm.clearErrors();
		}
	}, [isDialogOpen, selectedLeave]);

	// Delete confirmation states
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<any>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteClick = (applicationLeave: any) => {
		setItemToDelete(applicationLeave);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (!itemToDelete) return;


		setIsDeleting(true);
		destroy(ApplicationLeaveController.destroy(itemToDelete.slug_app).url, {
			onSuccess: (page) => {
				const successMessage = (page.props as any).flash?.success || 'Payroll Period deleted successfully';
				toast.success(successMessage);
				setDeleteDialogOpen(false);
				setItemToDelete(null);
				setLeaves(prevLeaves =>
					prevLeaves.filter(leave => leave.slug_app !== itemToDelete.slug_app)
				);
			},
			onError: (errors) => {
				const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete payroll period';
				toast.error(errorMessage);
				setIsDeleting(false);
			},
			onFinish: () => {
				setIsDeleting(false);
			},
		});
	}

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Application Leaves" />

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
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in { animation: slideIn 0.3s ease both; }
            `}</style>

			{/* Page Header */}
			<div className="flex justify-between items-center p-4 mx-4 mt-2 -mb-6 pp-header">
				<CustomHeader
					title="Application Leaves"
					description="List of all application leaves"
					icon={<Clipboard className="h-6 w-6" />}
				/>
			</div>

			<div className="@container/main flex flex-1 flex-col gap-2 p-4">
				{/* Notification Toast */}
				{showNotification && notification && (
					<div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in">
						<Bell className="h-5 w-5 text-green-600" />
						<div>
							<p className="font-medium">{notification.message}</p>
							<p className="text-xs text-green-600">{notification.timestamp}</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="ml-4"
							onClick={() => setShowNotification(false)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				)}

				{/* Empty state for no leaves at all */}
				<div className='mx-4 pp-row'>
					<CustomTable
						title="Application Leave Lists"
						columns={ApplicationLeavesTableConfig.columns}
						actions={ApplicationLeavesTableConfig.actions}
						data={filteredLeaves}
						from={1}
						onDelete={handleDeleteClick}
						onView={handleView}
						onEdit={handleEdit}
						toolbar={<FilterToolbar />}
						filterEmptyState={<FilterEmptyState />}
						emptyState={
							<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
								<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
									<CalendarDays className="h-8 w-8 text-gray-400 dark:text-gray-500" />
								</div>
								<h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
									No application leaves found
								</h3>
								<p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
									There are no leave applications available at the moment.
								</p>
								<Link href={ApplicationLeaveController.create().url}>
									<Button className="gap-2">
										<PlusCircle className="h-4 w-4" />
										Create Leave Application
									</Button>
								</Link>
							</div>
						}
					/>

					<DeleteConfirmationDialog
						isOpen={deleteDialogOpen}
						onClose={() => {
							setDeleteDialogOpen(false);
							setItemToDelete(null);
						}}
						onConfirm={confirmDelete}
						title='Delete application leave'
						itemName={itemToDelete?.name || 'this leave'}
						isLoading={isDeleting}
						confirmText='Delete application leave'
					/>
				</div>
			</div>

			{/* ─── Leave Details Dialog with Approve/Reject Toggle ───────────── */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent
					className="overflow-y-auto rounded-xl shadow-xl border-slate-200 
		           w-[95vw] max-w-none 
		           sm:max-w-[90vw] 
		           md:max-w-4xl 
		           lg:max-w-5xl 
		           xl:max-w-6xl
		           max-h-[90vh]"
				>
					<DialogHeader className="border-b border-slate-100 pb-4 px-6 pt-6 sticky top-0 bg-white z-10">
						<DialogTitle className="text-slate-900 text-lg flex items-center gap-2">
							<Clipboard className="h-5 w-5 text-[#1d4791]" />
							Leave Application Details
						</DialogTitle>
						<DialogDescription className="text-slate-500">
							Review and update the status of this leave application
						</DialogDescription>
					</DialogHeader>

					{selectedLeave && (
						<div className="px-6 pb-6">
							<div className="flex flex-col lg:flex-row gap-6">

								{/* LEFT COLUMN - Employee & Leave Details (Takes 60% width on desktop) */}
								<div className="flex-1 lg:flex-[2] space-y-5">
									{/* Employee Information */}
									<div className="space-y-3">
										<h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
											<User className="h-4 w-4 text-[#1d4791]" />
											Employee Information
										</h3>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Employee Name</label>
												<p className="font-medium text-slate-900 mt-1">
													{selectedLeave.employee?.user?.name || selectedLeave.employee_name || 'N/A'}
												</p>
											</div>
											<div>
												<label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</label>
												<p className="text-slate-700 mt-1">{selectedLeave.employee.user.email || 'N/A'}</p>
											</div>
										</div>
									</div>

									{/* Leave Request Details */}
									<div className="space-y-3">
										<h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
											<CalendarDays className="h-4 w-4 text-[#1d4791]" />
											Leave Request Details
										</h3>

										<div className="grid grid-cols-2 gap-4">
											<div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
												<label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Start Date</label>
												<p className="font-medium text-slate-900 mt-1">{formatDate(selectedLeave.leave_start)}</p>
											</div>
											<div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
												<label className="text-[10px] font-black uppercase tracking-wider text-slate-500">End Date</label>
												<p className="font-medium text-slate-900 mt-1">{formatDate(selectedLeave.leave_end)}</p>
											</div>
										</div>

										{duration && (
											<div className="flex items-center gap-2 text-sm text-slate-600">
												<CalendarDays className="h-3.5 w-3.5 text-[#1d4791]" />
												<span>Duration: <span className="font-medium text-slate-900">{duration} day{duration !== 1 ? 's' : ''}</span></span>
											</div>
										)}

										{/* Current Status Badge */}
										<div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
											<label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Current Status</label>
											<StatusBadge status={selectedLeave.app_status} />
										</div>

										{/* Reason for Leave */}
										<div>
											<label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">Reason for Leave</label>
											<div className="min-h-[60px] rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700">
												{selectedLeave.reason_to_leave || <span className="italic text-slate-400">No reason provided</span>}
											</div>
										</div>
									</div>
								</div>

								{/* RIGHT COLUMN - Approve/Reject Decision Section (Takes 40% width on desktop) */}
								<div className="flex-1 lg:flex-[1.5]">
									{/* Show for pending/submitted statuses */}
									{['pending', 'submitted'].includes(selectedLeave.app_status?.toLowerCase()) && (
										<div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-5 sticky top-4">
											<div className="flex items-center gap-2">
												<div className="h-5 w-5 rounded-full bg-[#1d4791]/10 flex items-center justify-center shrink-0">
													<ShieldCheck className="h-3 w-3 text-[#1d4791]" />
												</div>
												<h4 className="text-sm font-semibold text-slate-800">Update Decision</h4>
											</div>

											{/* Approve / Reject Toggle */}
											<div className="flex items-center gap-2 p-1 bg-white rounded-lg border border-slate-200 w-fit">
												<button
													type="button"
													onClick={() => {
														setApproveStatus('approved');
														if (decisionForm.errors.remarks) decisionForm.clearErrors('remarks');
													}}
													className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${approveStatus === 'approved'
														? 'bg-[#068305] text-white shadow-sm shadow-[#1d4791]/20'
														: 'text-slate-600 hover:bg-slate-50'
														}`}
												>
													<CheckCircle2 className="h-4 w-4" />
													Approve
												</button>
												<button
													type="button"
													onClick={() => {
														setApproveStatus('rejected');
													}}
													className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${approveStatus === 'rejected'
														? 'bg-[#c80000] text-white shadow-sm shadow-[#c80000]/20'
														: 'text-slate-600 hover:bg-slate-50'
														}`}
												>
													<XCircle className="h-4 w-4" />
													Reject
												</button>
											</div>

											{/* Remarks Field - Only shows when Reject is selected */}
											{approveStatus === 'rejected' && (
												<div className="space-y-2 animate-fade-up">
													<label className="text-sm font-medium text-slate-700 flex items-center gap-1">
														<span className="text-[#c80000]">*</span>
														Rejection Reason
														<span className="text-xs font-normal text-slate-400 ml-1">(required)</span>
													</label>
													<textarea
														value={remarks}
														onChange={(e) => {
															setRemarks(e.target.value);
															if (decisionForm.errors.remarks) decisionForm.clearErrors('remarks');
														}}
														placeholder="Explain why this leave is being rejected..."
														className="w-full min-h-[100px] p-3 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c80000]/20 focus:border-[#c80000] resize-y"
														autoFocus
													/>
													<div className="flex justify-between text-xs">
														<span className="text-slate-400">{remarks.length}/500</span>
														{decisionForm.errors.remarks && (
															<span className="text-[#d85e39] font-medium">{decisionForm.errors.remarks}</span>
														)}
													</div>
												</div>
											)}

											{/* Action Buttons */}
											<div className="flex items-center justify-end gap-2 pt-2">
												<Button
													type="button"
													onClick={handleStatusUpdate}
													disabled={isSubmitting || (approveStatus === 'rejected' && !remarks.trim())}
													className={`h-9 min-w-[120px] gap-2 shadow-sm transition-all ${approveStatus === 'rejected'
														? 'bg-[#c80000] hover:bg-[#c80000]/90 text-white shadow-[#c80000]/20'
														: 'bg-[#068305] hover:bg-[#068305]/90 text-white shadow-[#068305]/20'
														} disabled:opacity-50 disabled:cursor-not-allowed`}
												>
													{isSubmitting ? (
														<>
															<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
															Saving...
														</>
													) : (
														<>
															{approveStatus === 'rejected' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
															{approveStatus === 'rejected' ? 'Reject Leave' : 'Approve Leave'}
														</>
													)}
												</Button>
											</div>
										</div>
									)}
								</div>
							</div>
							<Button onClick={() => setIsDialogOpen(false)} className="float-end h-9 border-slate-200">
								<X />
								Close
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</AppLayout >
	);
}