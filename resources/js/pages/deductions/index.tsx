import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Briefcase, HandCoins, Plus, Search } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { parseISO } from 'date-fns';
import { CustomTable } from '@/components/custom-table';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { CustomPagination } from '@/components/custom-pagination';
import type { BreadcrumbItem } from '@/types';
import { CustomHeader } from '@/components/custom-header';
import DeductionController from '@/actions/App/Http/Controllers/DeductionController';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-modal';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Deductions', href: '/deductions' }];

interface Employee {
    id: number;
    user?: { name: string };
    position?: { pos_name: string };
    branch?: { branch_name: string };
}

interface Deduction {
    id: number;
    deduction_name: string;
    deduction_amount: string | number;
    payroll_period?: { start_date: string; end_date: string; pay_date: string };
    employees?: Employee[];
}

interface Props {
    deductions: { data: Deduction[]; perPage: number; total: number; from: number; current_page: number; last_page: number; links: any[] } | Deduction[];
}

const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(amount));

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default function Index({ deductions }: Props) {
    const { delete: destroy } = useForm();
    const [selected, setSelected] = useState<Deduction | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState<Date | undefined>();
    const [dateTo, setDateTo] = useState<Date | undefined>();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Delete confirmation states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (deduction: Deduction) => {
        setItemToDelete(deduction);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        destroy(DeductionController.destroy(itemToDelete.id).url, {
            onSuccess: (page) => {
                const successMessage = (page.props as any).flash?.success || 'Deduction deleted successfully.';
                toast.success(successMessage);
                setDeleteDialogOpen(false);
                setItemToDelete(null);
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).flat()[0] || 'Failed to delete deduction.';
                toast.error(errorMessage);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    }

    const allData: Deduction[] = Array.isArray(deductions) ? deductions : deductions?.data ?? [];

    const filteredData = useMemo(() => {
        return allData.filter(item => {
            const matchesSearch = !searchTerm.trim() ||
                item.deduction_name.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDate = (() => {
                if (!dateFrom && !dateTo) return true;
                if (!item.payroll_period) return false;
                const start = parseISO(item.payroll_period.start_date);
                const end = parseISO(item.payroll_period.end_date);
                if (dateFrom && dateTo) return start >= dateFrom && end <= dateTo;
                if (dateFrom) return start >= dateFrom;
                return end <= dateTo!;
            })();

            return matchesSearch && matchesDate;
        });
    }, [allData, searchTerm, dateFrom, dateTo]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, dateFrom, dateTo]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const paginationData = {
        data: currentData,
        perPage: itemsPerPage,
        total: filteredData.length,
        from: startIndex + 1,
        current_page: currentPage,
        last_page: totalPages,
        links: [],
    };

    const clearFilters = () => {
        setSearchTerm('');
        setDateFrom(undefined);
        setDateTo(undefined);
        setCurrentPage(1);
    };

    const columns = [
        {
            key: 'deduction_name',
            label: 'Deduction Name',
            render: (row: Deduction) => <span className="font-medium">{row.deduction_name}</span>,
        },
        {
            key: 'deduction_amount',
            label: 'Amount',
            render: (row: Deduction) => formatCurrency(row.deduction_amount),
        },
        {
            key: 'payroll_period',
            label: 'Payroll Period',
            render: (row: Deduction) => row.payroll_period ? (
                <div>
                    <div>{formatDate(row.payroll_period.start_date)} - {formatDate(row.payroll_period.end_date)}</div>
                    <div className="text-xs text-muted-foreground">Pay: {formatDate(row.payroll_period.pay_date)}</div>
                </div>
            ) : <span className="text-muted-foreground">N/A</span>,
        },
        {
            key: 'employees',
            label: 'Employees',
            render: (row: Deduction) => {
                const count = row.employees?.length ?? 0;
                return (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {count} {count === 1 ? 'Employee' : 'Employees'}
                    </Badge>
                );
            },
        },
        { key: 'actions', label: 'Actions', isAction: true },
    ];

    const actions = [
        { label: 'View', icon: 'Eye' as const, route: '' },
        { label: 'Edit', icon: 'Pencil' as const, route: '' },
        { label: 'Delete', icon: 'Trash2' as const, route: '' },
    ];

    const hasFilters = !!(searchTerm || dateFrom || dateTo);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deductions" />

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


            {/* Header */}
            <div className="grid grid-rows-1 justify-center mx-8 md:grid-cols-2 md:mx-8 mt-3 lg:flex lg:justify-between items-center lg:mx-8 lg:mt-4 lg:-mb-2 pp-header">
                <div>
                    <CustomHeader
                        title='Deductions'
                        icon={<HandCoins className="h-6 w-6" />}
                        description='Manage and track employee deductions'
                    />
                </div>
                <Link href="/deductions/create" className='ml-auto'>
                    <Button className="bg-[#1d4791] hover:bg-[#1d4791]/90 ">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deduction
                    </Button>
                </Link>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4 pp-row mx-4">
                {/* Table */}
                <CustomTable
                    columns={columns}
                    actions={actions}
                    data={currentData}
                    from={startIndex + 1}
                    onDelete={handleDeleteClick}
                    onView={setSelected}
                    onEdit={(item) => router.get(`/deductions/${item.id}/edit`)}
                    title="Deductions List"
                    toolbar={
                        <EmployeeFilterBar
                            filters={{ search: true, position: false, branch: false, site: false, date: true, status: false }}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                            onDateFromChange={setDateFrom}
                            onDateToChange={setDateTo}
                            onClearAll={clearFilters}
                            searchPlaceholder="Search by deduction name..."
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
                />

                {allData.length > 0 && (
                    <div className="px-6 pb-4">
                        <CustomPagination
                            pagination={paginationData}
                            perPage={String(itemsPerPage)}
                            onPerPageChange={(val) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}
                            totalCount={allData.length}
                            filteredCount={filteredData.length}
                            search={searchTerm}
                            resourceName="deduction"
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
                    title='Delete deduction'
                    itemName={itemToDelete?.deduction_name || 'this deduction'}
                    isLoading={isDeleting}
                    confirmText='Delete deduction'
                />
            </div>

            {/* View Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selected?.deduction_name}</DialogTitle>
                        <Badge variant="secondary" className="w-fit bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-lg px-4 py-1 mt-2">
                            {formatCurrency(selected?.deduction_amount ?? 0)}
                        </Badge>
                    </DialogHeader>

                    {selected?.payroll_period && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <h4 className="font-semibold mb-2">Payroll Period</h4>
                            <p className="text-sm">{formatDate(selected.payroll_period.start_date)} - {formatDate(selected.payroll_period.end_date)}</p>
                            <p className="text-sm text-muted-foreground mt-1">Payment Date: {formatDate(selected.payroll_period.pay_date)}</p>
                        </div>
                    )}

                    <h4 className="font-semibold">Assigned Employees ({selected?.employees?.length ?? 0})</h4>
                    {selected?.employees?.length ? (
                        <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
                            {selected.employees.map(emp => (
                                <div key={emp.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="font-medium">{emp.user?.name ?? `Employee #${emp.id}`}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {[emp.position?.pos_name, emp.branch?.branch_name].filter(Boolean).join(' • ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground border rounded-md">
                            No employees assigned to this deduction
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}