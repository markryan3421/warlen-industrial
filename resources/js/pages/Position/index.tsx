    import { Head, router, useForm } from '@inertiajs/react';
    import { Briefcase, Eye, Plus, Coins, Search } from 'lucide-react';
    import { useState, useEffect, useMemo, useCallback } from 'react';
    import { CustomHeader } from '@/components/custom-header';
    import { CustomTable } from '@/components/custom-table';
    import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import AppLayout from '@/layouts/app-layout';
    import { CardContent } from '@/components/ui/card';
    import type { BreadcrumbItem } from '@/types';
    import { toast } from '@/components/custom-toast';
    import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';
    import { IncentiveFormModal } from '@/components/incentives/incentive-form-modal';
   // import { EmployeeSelectionModal } from '@/components/incentives/employee-selection-modal';
    import { CustomPagination } from '@/components/custom-pagination';

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

        // Create pagination object for the Pagination component
        const paginationData = {
            data: currentData,
            links: [
                { active: false, label: 'pagination.previous', url: currentPage > 1 ? `?page=${currentPage - 1}` : null },
                ...Array.from({ length: totalPages }, (_, i) => ({
                    active: currentPage === i + 1,
                    label: String(i + 1),
                    url: `?page=${i + 1}`
                })),
                { active: false, label: 'pagination.next', url: currentPage < totalPages ? `?page=${currentPage + 1}` : null }
            ],
            from: totalFilteredCount === 0 ? 0 : startIndex + 1,
            to: Math.min(startIndex + itemsPerPage, totalFilteredCount),
            total: totalFilteredCount,
            current_page: currentPage,
            last_page: totalPages,
            per_page: itemsPerPage
        };

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
                onSuccess: () => {
                    toast.success('Incentive deleted successfully.');
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

        const handlePageChange = (url: string | null) => {
            if (!url) return;
            const pageMatch = url.match(/page=(\d+)/);
            if (pageMatch) {
                setCurrentPage(parseInt(pageMatch[1]));
            }
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
                    onError: () => {
                        toast.error('Failed to update incentive');
                    }
                });
            } else {
                post('/incentives', {
                    onSuccess: () => {
                        toast.success('Incentive created successfully');
                        handleCloseModal();
                    },
                    onError: () => {
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

        const getEmployeeName = useCallback((emp: Employee) => {
            return emp.user?.name || emp.name || 'Unnamed Employee';
        }, []);

        const toggleEmployee = useCallback((id: number) => {
            setData('employee_ids',
                data.employee_ids.includes(id)
                    ? data.employee_ids.filter(eId => eId !== id)
                    : [...data.employee_ids, id]
            );
        }, [data.employee_ids]);

        const removeEmployee = useCallback((id: number) => {
            setData('employee_ids', data.employee_ids.filter(employeeId => employeeId !== id));
        }, [data.employee_ids]);

        const addAllEmployees = useCallback((ids: number[]) => {
            setData('employee_ids', [...data.employee_ids, ...ids]);
        }, [data.employee_ids]);

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
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
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
            { label: 'View', icon: 'Eye' as const, route: '' },
            { label: 'Edit', icon: 'Pencil' as const, route: '' },
            { label: 'Delete', icon: 'Trash2' as const, route: '' }
        ];

        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Incentives" />

                <div className="flex flex-1 flex-col gap-4 p-4 mx-4">
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
                                    onPositionsChange={() => {}}
                                    onBranchChange={() => {}}
                                    onSiteChange={() => {}}
                                    onStatusChange={() => {}}
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
                                    pagination={paginationData}
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

                {/* Incentive Form Modal */}
                <IncentiveFormModal
                    isOpen={isCreateModalOpen || isEditModalOpen}
                    onClose={handleCloseModal}
                    isEditing={isEditModalOpen}
                    incentive={selectedIncentive}
                    payroll_periods={payroll_periods}
                    employees={employees}
                    formData={data}
                    errors={errors}
                    processing={processing}
                    onDataChange={(key, value) => setData(key as any, value)}
                    onSubmit={handleSubmit}
                    onShowEmployeeModal={() => setShowEmployeeModal(true)}
                    getEmployeeName={getEmployeeName}
                    selectedEmployeesList={selectedEmployeesList}
                />

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

                {/* View Dialog */}
                <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-blue-900 rounded-xl">
                                    <Eye className="h-5 w-5 text-white" />
                                </div>
                                <DialogTitle className="text-2xl">
                                    Show Incentive: <span className='text-xl text-gray-500 font-medium'>{selected?.incentive_name}</span>
                                </DialogTitle>
                            </div>
                            <div className="mt-2">
                                <span className='font-semibold'>Incentive Amount: </span>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-md px-4 py-1 ml-2">
                                    {formatCurrency(selected?.incentive_amount ?? 0)}
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div>
                            <h4 className="font-semibold mb-2">Payroll Period</h4>
                            {selected?.payroll_period ? (
                                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm">
                                        {formatDateSimple(selected.payroll_period.start_date)} - {formatDateSimple(selected.payroll_period.end_date)}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Payment Date: {formatDateSimple(selected.payroll_period.pay_date)}
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-4 p-3 bg-slate-50 rounded-lg text-gray-500">
                                    No payroll period assigned
                                </div>
                            )}

                            <h4 className="font-semibold mb-3">Assigned Employees ({selected?.employees?.length || 0})</h4>
                            {selected?.employees && selected.employees.length > 0 ? (
                                <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
                                    {selected.employees.map(emp => (
                                        <div key={emp.id} className="p-3 py-1 hover:bg-slate-50">
                                            <div className="font-medium">{emp.user?.name || `Employee #${emp.id}`}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                <span className="text-sm">Position: </span>
                                                {emp.position?.pos_name && <span>{emp.position.pos_name}</span>}
                                                &nbsp; | &nbsp;
                                                <span className="text-sm">Branch: </span>
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