import { Head, Link, router, useForm } from '@inertiajs/react';
import { Briefcase, Pencil, Plus, Coins, Search, ChevronDown, X, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CustomHeader } from '@/components/custom-header';
import { CustomPagination } from '@/components/custom-pagination';
import { CustomTable } from '@/components/custom-table';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import { CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';
import { toast } from '@/components/custom-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Incentives', href: '/incentives' }];

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

interface Incentive {
    id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period_id?: number;
    payroll_period?: PayrollPeriod;
    employees?: Array<{
        id: number;
        user?: { name: string };
        position?: { pos_name: string };
        branch?: { branch_name: string };
    }>;
}

interface Props {
    incentives: Incentive[];
    payroll_periods: PayrollPeriod[];
    employees: Employee[];
    editingIncentive?: Incentive;
    isEditing?: boolean;
}

export default function Index({ incentives, payroll_periods, employees, editingIncentive, isEditing = false }: Props) {
    const { delete: destroy } = useForm();
    const [selected, setSelected] = useState<Incentive | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [showAllEmployeesModal, setShowAllEmployeesModal] = useState(false);
    const [showRemoveAllConfirmation, setShowRemoveAllConfirmation] = useState(false);

    // Form handling for create/edit
    const { data, setData, post, put, processing, errors, reset } = useForm({
        incentive_name: '',
        incentive_amount: '',
        payroll_period_id: '',
        employee_ids: [] as number[],
    });

    // Populate form when editing
    useEffect(() => {
        if (editingIncentive && isEditing) {
            setSelectedIncentive(editingIncentive);
            setIsEditModalOpen(true);
            setData({
                incentive_name: editingIncentive.incentive_name,
                incentive_amount: String(editingIncentive.incentive_amount),
                payroll_period_id: String(editingIncentive.payroll_period_id || ''),
                employee_ids: editingIncentive.employees?.map(emp => emp.id) || [],
            });
        }
    }, [editingIncentive, isEditing]);

    // Debug logging
    useEffect(() => {
        console.log('Employees data:', employees);
        console.log('Employees count:', employees?.length);
        if (employees && employees.length > 0) {
            console.log('Sample employee:', employees[0]);
        }
    }, [employees]);

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Process all data from props
    let allData: Incentive[] = Array.isArray(incentives) ? incentives : [];

    // Frontend filtering logic
    const filteredData = useMemo(() => {
        let filtered = [...allData];

        if (searchTerm.trim()) {
            filtered = filtered.filter(incentive =>
                incentive.incentive_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (dateFrom || dateTo) {
            filtered = filtered.filter(incentive => {
                if (!incentive.payroll_period) return false;
                const startDate = new Date(incentive.payroll_period.start_date);
                const endDate = new Date(incentive.payroll_period.end_date);

                if (dateFrom && dateTo) {
                    return startDate >= dateFrom && endDate <= dateTo;
                } else if (dateFrom) {
                    return startDate >= dateFrom;
                } else if (dateTo) {
                    return endDate <= dateTo;
                }
                return true;
            });
        }

        return filtered;
    }, [allData, searchTerm, dateFrom, dateTo]);

    // Pagination logic
    const totalFilteredCount = filteredData.length;
    const totalPages = Math.ceil(totalFilteredCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (incentive: Incentive) => {
        setItemToDelete(incentive);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        router.delete(`/incentives/${itemToDelete.id}`, {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Incentive deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete incentive.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, dateFrom, dateTo]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
    };

    const handleDateFromChange = (date: Date | undefined) => {
        setDateFrom(date);
    };

    const handleDateToChange = (date: Date | undefined) => {
        setDateTo(date);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setDateFrom(undefined);
        setDateTo(undefined);
        setCurrentPage(1);
    };

    const handlePerPageChange = (value: string | number) => {
        const newPerPage = Number(value);
        setItemsPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleView = (incentive: Incentive) => {
        setSelected(incentive);
    };

    const handleEdit = (incentive: Incentive) => {
        setSelectedIncentive(incentive);
        setData({
            incentive_name: incentive.incentive_name,
            incentive_amount: String(incentive.incentive_amount),
            payroll_period_id: String(incentive.payroll_period_id || ''),
            employee_ids: incentive.employees?.map(emp => emp.id) || [],
        });
        setIsEditModalOpen(true);
    };

    const handleCreate = () => {
        reset();
        setIsCreateModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedIncentive(null);
        setShowEmployeeModal(false);
        reset();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditModalOpen && selectedIncentive) {
            put(`/incentives/${selectedIncentive.id}`, {
                onSuccess: () => {
                    toast.success('Incentive updated successfully');
                    handleCloseModal();
                },
                onError: (errors) => {
                    toast.error('Failed to update incentive');
                }
            });
        } else {
            post('/incentives', {
                onSuccess: () => {
                    toast.success('Incentive created successfully');
                    handleCloseModal();
                },
                onError: (errors) => {
                    toast.error('Failed to create incentive');
                }
            });
        }
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(amount));
    };

    const formatDateSimple = (date: string) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const hasFilters = !!(searchTerm || dateFrom || dateTo);
    const hasNoDataAtAll = allData.length === 0;

    // Helper function to get employee name
    const getEmployeeName = useCallback((emp: Employee) => {
        return emp.user?.name || emp.name || 'Unnamed Employee';
    }, []);

    // Toggle employee function
    const toggleEmployee = useCallback((id: number) => {
        setData('employee_ids',
            data.employee_ids.includes(id)
                ? data.employee_ids.filter(eId => eId !== id)
                : [...data.employee_ids, id]
        );
    }, [data.employee_ids]);

    const removeEmployee = useCallback((id: number) => {
        setData('employee_ids', data.employee_ids.filter(eId => eId !== id));
    }, [data.employee_ids]);

    const addAllEmployees = useCallback((ids: number[]) => {
        setData('employee_ids', [...data.employee_ids, ...ids]);
    }, [data.employee_ids]);
    
    const removeAll = () => {
        setData('employee_ids', []);
        setShowRemoveAllConfirmation(false);
        setShowAllEmployeesModal(false);
    };

    const selectedEmployeesList = employees.filter(emp => data.employee_ids.includes(emp.id));

    const columns = [
        {
            key: 'incentive_name',
            label: 'Incentive Name',
            render: (row: Incentive) => <span className="font-medium">{row.incentive_name}</span>
        },
        {
            key: 'incentive_amount',
            label: 'Amount',
            render: (row: Incentive) => formatCurrency(row.incentive_amount)
        },
        {
            key: 'payroll_period',
            label: 'Payroll Period',
            render: (row: Incentive) => row.payroll_period ? (
                <div>
                    <div>{formatDateSimple(row.payroll_period.start_date)} - {formatDateSimple(row.payroll_period.end_date)}</div>
                    <div className="text-xs text-muted-foreground">Pay: {formatDateSimple(row.payroll_period.pay_date)}</div>
                </div>
            ) : <span className="text-muted-foreground">N/A</span>
        },
        {
            key: 'employees',
            label: 'Employees',
            render: (row: Incentive) => {
                const count = row.employees?.length || 0;
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {count} {count === 1 ? 'Employee' : 'Employees'}
                    </Badge>
                );
            }
        },
        {
            key: 'actions',
            label: 'Actions',
            isAction: true,
        }
    ];

    const actions = [
        {
            label: 'View',
            icon: 'Eye' as const,
            route: '',
        },
        {
            label: 'Edit',
            icon: 'Pencil' as const,
            route: '',
        },
        {
            label: 'Delete',
            icon: 'Trash2' as const,
            route: '',
        }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incentives" />

            <div className="flex flex-1 flex-col gap-4 p-4 mx-4 -mt-3">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <CustomHeader
                        title="Incentives"
                        icon={<Coins className="h-6 w-6" />}
                        description='Manage employee incentives across payroll periods'
                    />
                    <Button onClick={handleCreate} className="bg-[#1d4791] hover:bg-[#1d4791]/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Incentive
                    </Button>
                </div>

                <CardContent className="p-0">
                    <CustomTable
                        columns={columns}
                        actions={actions}
                        data={currentData}
                        from={startIndex + 1}
                        onDelete={handleDeleteClick}
                        onView={handleView}
                        onEdit={handleEdit}
                        title="Incentive Lists"
                        toolbar={
                            <EmployeeFilterBar
                                filters={{
                                    search: true,
                                    position: false,
                                    branch: false,
                                    site: false,
                                    date: true,
                                    status: false,
                                }}
                                searchTerm={searchTerm}
                                onSearchChange={handleSearch}
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                onDateFromChange={handleDateFromChange}
                                onDateToChange={handleDateToChange}
                                onClearAll={clearFilters}
                                searchPlaceholder="Search by incentive name..."
                                dateLabel="Payroll Period Date Range"
                                allPositions={[]}
                                branchesData={[]}
                                selectedPositions={[]}
                                selectedBranch={undefined}
                                selectedSite={undefined}
                                status=""
                                onPositionsChange={() => { }}
                                onBranchChange={() => { }}
                                onSiteChange={() => { }}
                                onStatusChange={() => { }}
                            />
                        }
                        emptyState={
                            hasNoDataAtAll && !hasFilters ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-primary/10 p-6 mb-4">
                                        <Briefcase className="h-12 w-12 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No incentives yet</h3>
                                    <p className="text-muted-foreground mb-4">Create your first incentive to get started</p>
                                    <Button onClick={handleCreate} className="bg-[#1d4791] hover:bg-[#1d4791]/90">Create First Incentive</Button>
                                </div>
                            ) : filteredData.length === 0 && hasFilters ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="rounded-full bg-muted p-6 mb-4">
                                        <Search className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        No incentives match "{searchTerm}" {dateFrom || dateTo ? 'in the selected date range' : ''}
                                    </p>
                                    <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
                                </div>
                            ) : null
                        }
                    />
                    {allData.length > 0 && (
                        <div className="px-6 pb-4">
                            <CustomPagination
                                pagination={{
                                    data: currentData,
                                    total: totalFilteredCount,
                                    from: startIndex + 1,
                                    current_page: currentPage,
                                    last_page: totalPages,
                                    perPage: itemsPerPage
                                }}
                                perPage={String(itemsPerPage)}
                                onPerPageChange={handlePerPageChange}
                                totalCount={allData.length}
                                filteredCount={filteredData.length}
                                search={searchTerm}
                                resourceName="incentive"
                            />
                        </div>
                    )}
                    <DeleteConfirmationDialog
                        isOpen={deleteDialogOpen}
                        onClose={() => {
                            setDeleteDialogOpen(false);
                            setItemToDelete(null);
                        }}
                        onConfirm={confirmDelete}
                        title="Delete Incentive"
                        itemName={itemToDelete?.incentive_name || 'this incentive'}
                        isLoading={isDeleting}
                        confirmText='Delete incentive'
                    />
                </CardContent>
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => !open && handleCloseModal()}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            {isEditModalOpen ? (
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-xl">
                                    <Pencil className="h-5 w-5 text-blue-600" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-900 rounded-xl">
                                    <Plus className="h-5 w-5 text-white" />
                                </div>
                            )}
                            <span>{isEditModalOpen ? 'Edit Incentive' : 'Create Incentive'}</span>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="mt-4">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left Column - Incentive Details */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="incentive_name">Incentive Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="incentive_name"
                                        value={data.incentive_name}
                                        onChange={e => setData('incentive_name', e.target.value)}
                                        placeholder="Enter incentive name"
                                        className="h-10"
                                        autoFocus
                                    />
                                    <InputError message={errors.incentive_name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="incentive_amount">Incentive Amount <span className="text-red-500">*</span></Label>
                                    <Input
                                        type='number'
                                        id="incentive_amount"
                                        value={data.incentive_amount}
                                        onChange={e => setData('incentive_amount', e.target.value)}
                                        placeholder="Enter incentive amount"
                                        className="h-10"
                                    />
                                    <InputError message={errors.incentive_amount} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payroll_period_id">Payroll Period <span className="text-red-500">*</span></Label>
                                    <select
                                        id="payroll_period_id"
                                        value={data.payroll_period_id}
                                        onChange={e => setData('payroll_period_id', e.target.value)}
                                        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                                    >
                                        <option value="">Select Payroll Period</option>
                                        {payroll_periods && payroll_periods.length > 0 ? (
                                            payroll_periods.map(period => (
                                                <option key={period.id} value={period.id}>
                                                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>No payroll periods available</option>
                                        )}
                                    </select>
                                    <InputError message={errors.payroll_period_id} />
                                </div>
                            </div>

                            {/* Right Column - Employee Selection Button */}
                            <div className="space-y-4">
                                <Label className="text-base font-semibold">Employee Selection</Label>

                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                    onClick={() => setShowEmployeeModal(true)}
                                >
                                    {selectedEmployeesList.length > 0 ? (
                                        <div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                {selectedEmployeesList.length} employee{selectedEmployeesList.length !== 1 ? 's' : ''} selected
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 justify-center">
                                                {selectedEmployeesList.slice(0, 3).map(emp => (
                                                    <span key={emp.id} className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-md text-xs">
                                                        {getEmployeeName(emp)}
                                                    </span>
                                                ))}
                                                {selectedEmployeesList.length > 3 && (
                                                    <span className="text-xs text-gray-500">+{selectedEmployeesList.length - 3} more</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-500">Click to select employees</p>
                                            <p className="text-xs text-gray-400 mt-1">Choose who will receive this incentive</p>
                                        </div>
                                    )}
                                </div>

                                <InputError message={errors.employee_ids} />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <Button variant='outline' type="button" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (isEditModalOpen ? 'Updating...' : 'Creating...') : (isEditModalOpen ? 'Update' : 'Create')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Employee Selection Modal - Separate component to prevent re-renders */}
            <Dialog open={showEmployeeModal} onOpenChange={setShowEmployeeModal}>
                <DialogContent className="max-w-4xl h-[420px] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Select Employees</DialogTitle>
                    </DialogHeader>

                    <EmployeeSelector
                        employees={employees}
                        selectedIds={data.employee_ids}
                        onToggle={toggleEmployee}
                        onRemove={removeEmployee}
                        onAddAll={addAllEmployees}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button variant="outline" onClick={() => setShowEmployeeModal(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* All Selected Employees Modal */}
            <Dialog open={showAllEmployeesModal} onOpenChange={setShowAllEmployeesModal}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>Selected Employees ({selectedEmployeesList.length})</DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[calc(85vh-180px)] py-4">
                        <div className="space-y-2">
                            {selectedEmployeesList.map((emp, index) => (
                                <div key={emp.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center justify-center w-7 h-7 bg-blue-100 rounded-full text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{getEmployeeName(emp)}</div>
                                            <div className="text-sm text-gray-500">Employee Code: {emp.emp_code || 'N/A'}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            removeEmployee(emp.id);
                                            if (selectedEmployeesList.length === 1) setShowAllEmployeesModal(false);
                                        }}
                                        className="p-1.5 hover:bg-red-50 rounded-lg"
                                    >
                                        <X className="h-4 w-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-600">
                                <span className="font-semibold">{selectedEmployeesList.length}</span> employees selected
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="destructive" size="sm" onClick={() => setShowRemoveAllConfirmation(true)} disabled={selectedEmployeesList.length === 0}>
                                Remove All
                            </Button>
                            <Button size="sm" onClick={() => setShowAllEmployeesModal(false)}>Done</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Remove All Confirmation Modal */}
            <Dialog open={showRemoveAllConfirmation} onOpenChange={setShowRemoveAllConfirmation}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Remove All Employees</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-red-100 rounded-full flex-shrink-0">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-base text-gray-700 mb-2">
                                    Are you sure you want to remove all employees?
                                </p>
                                <p className="text-sm text-gray-500">
                                    This action cannot be undone. You will need to select employees again.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowRemoveAllConfirmation(false)}>Cancel</Button>
                        <Button onClick={removeAll} className="bg-red-600 hover:bg-red-700">Yes, Remove All</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selected?.incentive_name}</DialogTitle>
                        <div className="mt-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-lg px-4 py-1">
                                {formatCurrency(selected?.incentive_amount ?? 0)}
                            </Badge>
                        </div>
                    </DialogHeader>
                    <div className="mt-4">
                        {selected?.payroll_period && (
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                <h4 className="font-semibold mb-2">Payroll Period</h4>
                                <p className="text-sm">
                                    {formatDateSimple(selected.payroll_period.start_date)} - {formatDateSimple(selected.payroll_period.end_date)}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Payment Date: {formatDateSimple(selected.payroll_period.pay_date)}
                                </p>
                            </div>
                        )}

                        <h4 className="font-semibold mb-3">Assigned Employees ({selected?.employees?.length || 0})</h4>
                        {selected?.employees && selected.employees.length > 0 ? (
                            <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                                {selected.employees.map(emp => (
                                    <div key={emp.id} className="p-3 hover:bg-slate-50">
                                        <div className="font-medium">{emp.user?.name || `Employee #${emp.id}`}</div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {emp.position?.pos_name && <span>{emp.position.pos_name}</span>}
                                            {emp.position?.pos_name && emp.branch?.branch_name && <span> • </span>}
                                            {emp.branch?.branch_name && <span>{emp.branch.branch_name}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground border rounded-md">
                                No employees assigned to this incentive
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

// Separate component for employee selector to prevent re-renders
const EmployeeSelector = ({
    employees,
    selectedIds,
    onToggle,
    onRemove,
    onAddAll
}: {
    employees: Employee[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onRemove: (id: number) => void;
    onAddAll?: (ids: number[]) => void;
}) => {
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsEmployeeDropdownOpen(false);
                setEmployeeSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getEmployeeName = (emp: Employee) => {
        return emp.user?.name || emp.name || 'Unnamed Employee';
    };

    const filteredEmployees = employees.filter(emp => {
        if (!employeeSearchTerm) return true;
        const term = employeeSearchTerm.toLowerCase();
        const code = emp.emp_code ? String(emp.emp_code).toLowerCase() : '';
        const name = getEmployeeName(emp).toLowerCase();
        return code.includes(term) || name.includes(term);
    });

    const displayedEmployees = employeeSearchTerm ? filteredEmployees : filteredEmployees.slice(0, 5);
    const selectedEmployees = employees.filter(emp => selectedIds.includes(emp.id));
    const allFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedIds.includes(emp.id));

    // Fixed selectAll function - adds all filtered employees at once
    const selectAll = () => {
        const allEmployeeIds = filteredEmployees.map(emp => emp.id);
        const idsToAdd = allEmployeeIds.filter(id => !selectedIds.includes(id));

        // Add all unselected employees at once
        if (idsToAdd.length > 0 && onAddAll) {
            onAddAll(idsToAdd);
        } else {
            // Fallback: toggle each unselected employee
            idsToAdd.forEach(id => onToggle(id));
        }
    };

    // Deselect all filtered employees
    const deselectAll = () => {
        const idsToRemove = filteredEmployees.filter(emp => selectedIds.includes(emp.id)).map(emp => emp.id);
        idsToRemove.forEach(id => onRemove(id));
    };

    return (
        <div className="space-y-4">
            {/* Selected Tags */}
            {selectedEmployees.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="text-xs text-gray-500 mb-2">
                        {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                        {selectedEmployees.map(emp => (
                            <div key={emp.id} className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-md text-sm">
                                <span className="max-w-[200px] truncate">{getEmployeeName(emp)}</span>
                                <button type="button" onClick={() => onRemove(emp.id)} className="text-blue-600 hover:text-blue-800">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Employee Dropdown */}
            <div className="relative" ref={dropdownRef}>
                <div
                    className="flex items-center justify-between border rounded-lg cursor-pointer p-3 hover:bg-gray-50"
                    onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                >
                    <span className="text-base text-gray-600">
                        {selectedIds.length === 0 ? 'Select employees...' : `${selectedIds.length} selected`}
                    </span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isEmployeeDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 border rounded-lg bg-white shadow-xl max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-3">
                            <div className="flex items-center border rounded-lg px-3 py-2">
                                <Search className="h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={employeeSearchTerm}
                                    onChange={e => setEmployeeSearchTerm(e.target.value)}
                                    className="w-full ml-2 outline-none text-base"
                                    autoFocus
                                />
                            </div>

                            {employees.length > 0 && (
                                <div className="flex justify-between items-center mt-3 px-1">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allFilteredSelected}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    selectAll();
                                                } else {
                                                    deselectAll();
                                                }
                                            }}
                                            className="rounded"
                                        />
                                        <span className="font-medium">
                                            {allFilteredSelected ? 'Deselect all' : `Select all (${filteredEmployees.length})`}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="divide-y max-h-64 overflow-y-auto">
                            {employees.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No employees found in the system</div>
                            ) : filteredEmployees.length === 0 && employeeSearchTerm ? (
                                <div className="p-8 text-center text-gray-500">No employees matching "{employeeSearchTerm}"</div>
                            ) : filteredEmployees.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">Type to search for employees</div>
                            ) : (
                                displayedEmployees.map(emp => (
                                    <div
                                        key={emp.id}
                                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer gap-3 transition-colors"
                                        onClick={() => onToggle(emp.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(emp.id)}
                                            onChange={() => { }}
                                            className="rounded pointer-events-none h-4 w-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{getEmployeeName(emp)}</div>
                                            <div className="text-sm text-gray-500">Employee Code: {emp.emp_code || 'N/A'}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!employeeSearchTerm && employees.length > 5 && filteredEmployees.length > 0 && (
                            <div className="p-3 text-center text-sm text-gray-500 border-t bg-gray-50">
                                Showing {Math.min(5, filteredEmployees.length)} of {employees.length} employees. Type to search more.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};