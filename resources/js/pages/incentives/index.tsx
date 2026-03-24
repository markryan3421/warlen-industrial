import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Briefcase, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CustomTable } from '@/components/custom-table';
import { EmployeeFilterBar } from '@/components/employee/employee-filter-bar';
import { CustomPagination } from '@/components/custom-pagination';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Incentives', href: '/incentives' }];

interface Incentive {
    id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period?: {
        start_date: string;
        end_date: string;
        pay_date: string;
    };
    employees?: Array<{
        id: number;
        user?: { name: string };
        position?: { pos_name: string };
        branch?: { branch_name: string };
    }>;
}

interface Props {
    incentives: {
        data: Incentive[];
        perPage: number;
        total: number;
        from: number;
        current_page: number;
        last_page: number;
        links: any[];
    };
    filters?: { date_from?: string; date_to?: string; search?: string };
    totalCount: number;
    filteredCount: number;
}

export default function Index({ incentives, filters = {}, totalCount, filteredCount }: Props) {
    const [selected, setSelected] = useState<Incentive | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined
    );

    // Debug: Log the incoming data
    useEffect(() => {
        console.log('Incentives data:', incentives);
        console.log('Incentives data array:', incentives?.data);
        console.log('Total count:', totalCount);
        console.log('Filtered count:', filteredCount);
    }, [incentives]);

    let searchTimer: NodeJS.Timeout;

    const applyFilters = (overrides: any = {}) => {
        const params: any = {};
        const s = overrides.search ?? search;
        const from = overrides.from ?? dateFrom;
        const to = overrides.to ?? dateTo;
        const perPage = overrides.perPage ?? String(incentives.perPage ?? 10);

        if (s?.trim()) params.search = s.trim();
        if (from) params.date_from = format(from, 'yyyy-MM-dd');
        if (to) params.date_to = format(to, 'yyyy-MM-dd');
        if (perPage && perPage !== '10') params.perPage = perPage;

        router.get('/incentives', params, { preserveState: true, replace: true });
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => applyFilters({ search: value }), 300);
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom(undefined);
        setDateTo(undefined);
        router.get('/incentives', {}, { preserveState: true, replace: true });
    };

    const handleDelete = (id: string | number) => {
        if (confirm('Delete this incentive?')) {
            router.delete(`/incentives/${id}`);
        }
    };

    const handleView = (incentive: Incentive) => {
        setSelected(incentive);
    };

    const handleEdit = (incentive: Incentive) => {
        router.get(`/incentives/${incentive.id}/edit`);
    };

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(amount));
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });

    const columns = [
        { 
            key: 'incentive_name', 
            label: 'Incentive Name',
            render: (row: Incentive) => <span className="font-medium">{row.incentive_name}</span>
        },
        { 
            key: 'incentive_amount', 
            label: 'Amount',
            isBadge: true,
            render: (row: Incentive) => formatCurrency(row.incentive_amount)
        },
        {
            key: 'payroll_period', 
            label: 'Payroll Period',
            render: (row: Incentive) => row.payroll_period ? (
                <div>
                    <div>{formatDate(row.payroll_period.start_date)} - {formatDate(row.payroll_period.end_date)}</div>
                    <div className="text-xs text-muted-foreground">Pay: {formatDate(row.payroll_period.pay_date)}</div>
                </div>
            ) : <span className="text-muted-foreground">N/A</span>
        },
        { 
            key: 'employees', 
            label: 'Employees',
            isBadge: true,
            render: (row: Incentive) => String(row.employees?.length || 0)
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

    const data = incentives?.data ?? [];
    const hasFilters = !!(search || dateFrom || dateTo);

    console.log('Data being passed to CustomTable:', data);
    console.log('Data length:', data.length);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Incentives" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Incentives</h1>
                        <p className="text-muted-foreground mt-1">Manage employee incentives across payroll periods</p>
                    </div>
                    <Link href="/incentives/create">
                        <Button><Briefcase className="h-4 w-4 mr-2" />Add Incentive</Button>
                    </Link>
                </div>

                {incentives?.total === 0 && !hasFilters ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center py-16">
                            <div className="rounded-full bg-primary/10 p-6 mb-4">
                                <Briefcase className="h-12 w-12 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No incentives yet</h3>
                            <Link href="/incentives/create">
                                <Button>Create First Incentive</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        
                        <CardContent className="p-0">
                            <CustomTable
                                columns={columns}
                                actions={actions}
                                data={data}
                                from={incentives?.from ?? 1}
                                onDelete={handleDelete}
                                onView={handleView}
                                onEdit={handleEdit}
                                title="Incentives"
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
                                        searchTerm={search}
                                        onSearchChange={handleSearch}
                                        dateFrom={dateFrom}
                                        dateTo={dateTo}
                                        onDateFromChange={setDateFrom}
                                        onDateToChange={setDateTo}
                                        onClearAll={clearFilters}
                                        searchPlaceholder="Search by incentive name..."
                                        dateLabel="Date Range"
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
                            />
                            {data.length > 0 && (
                                <div className="px-6 pb-4">
                                    <CustomPagination
                                        pagination={incentives}
                                        perPage={String(incentives?.perPage ?? 10)}
                                        onPerPageChange={(v) => applyFilters({ perPage: v })}
                                        totalCount={totalCount}
                                        filteredCount={filteredCount}
                                        search={search}
                                        resourceName="incentive"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selected?.incentive_name}</DialogTitle>
                            <Badge variant="secondary">{formatCurrency(selected?.incentive_amount ?? 0)}</Badge>
                        </DialogHeader>
                        <div>
                            <h4 className="font-medium mb-2">Assigned Employees ({selected?.employees?.length || 0})</h4>
                            {selected?.employees?.length ? (
                                <div className="border rounded-md divide-y">
                                    {selected.employees.map(emp => (
                                        <div key={emp.id} className="p-3 text-sm">
                                            <div className="font-medium">{emp.user?.name || `Employee #${emp.id}`}</div>
                                            <div className="text-muted-foreground">
                                                {emp.position?.pos_name} • {emp.branch?.branch_name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">No employees assigned</div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}