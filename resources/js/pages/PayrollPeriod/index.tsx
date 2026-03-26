import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import PayrollPeriodController from '@/actions/App/Http/Controllers/PayrollPeriodController';
import { useState, useMemo, useEffect } from 'react';
import {
    CalendarDays, Plus, Clock, CheckCircle2,
    AlertCircle, Filter, Pencil, Trash2, Eye, Banknote,
} from 'lucide-react';
import { CustomTable } from '@/components/custom-table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CustomToast } from '@/components/custom-toast';
import { CustomHeader } from '@/components/custom-header';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PayrollPeriod {
    id: number;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: 'open' | 'processing' | 'completed';
    created_at?: string;
    updated_at?: string;
}

interface PayrollPeriodProps { payrollPeriods: PayrollPeriod[]; }
interface PageProps {
    payroll_period_enums: Array<{ value: string; label: string; }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll Periods', href: '/payroll-periods' },
];

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    open: { icon: AlertCircle, badge: 'bg-secondary text-secondary-foreground', dot: 'bg-secondary' },
    processing: { icon: Clock, badge: 'bg-primary/10 text-primary border border-primary/20', dot: 'bg-primary' },
    completed: { icon: CheckCircle2, badge: 'bg-accent/10 text-accent border border-accent/20', dot: 'bg-accent' },
} as const;

function StatusBadge({ status, label }: { status: PayrollPeriod['payroll_per_status']; label: string }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

// ── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, count, active, onClick, color }: {
    label: string; count: number; active: boolean;
    onClick: () => void; color: 'primary' | 'secondary' | 'accent' | 'muted';
}) {
    const colorMap = {
        primary: { bg: 'bg-primary', text: 'text-primary-foreground', ring: 'ring-primary' },
        secondary: { bg: 'bg-secondary', text: 'text-secondary-foreground', ring: 'ring-secondary' },
        accent: { bg: 'bg-accent', text: 'text-accent-foreground', ring: 'ring-accent' },
        muted: { bg: 'bg-muted', text: 'text-muted-foreground', ring: 'ring-border' },
    };
    const c = colorMap[color];
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col gap-1 rounded-2xl p-5 text-left shadow-sm transition-all duration-200 ring-2
                ${active ? `${c.bg} ${c.text} ${c.ring} shadow-md scale-[1.02]` : 'bg-card text-foreground ring-border hover:ring-primary/40 hover:shadow-md'}`}
        >
            <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'opacity-70' : 'text-muted-foreground'}`}>
                {label}
            </p>
            <p className="text-3xl font-extrabold">{count}</p>
        </button>
    );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Index({ payrollPeriods }: PayrollPeriodProps) {
    const { delete: destroy } = useForm();
    const { payroll_period_enums } = usePage<PageProps>().props;

    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>(() =>
        localStorage.getItem('payrollPeriods-statusFilter') || 'all'
    );

    useEffect(() => {
        localStorage.setItem('payrollPeriods-statusFilter', statusFilter);
    }, [statusFilter]);

    // Live reload on payroll events
    useEffect(() => {
        if (!window.Echo) return;
        const channel = window.Echo.private('payroll');
        channel.listen('.payroll.completed', () => router.reload({ only: ['payrollPeriods'] }));
        return () => { channel.stopListening('.payroll.completed'); window.Echo.leave('payroll'); };
    }, []);

    const handleDelete = (period: PayrollPeriod) => {
        if (confirm('Are you sure you want to delete this payroll period?')) {
            destroy(PayrollPeriodController.destroy(period.id).url);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const formatStatus = (status: string) => {
        const found = payroll_period_enums?.find((e) => e.value.toLowerCase() === status.toLowerCase());
        return found?.label || status.charAt(0).toUpperCase() + status.slice(1);
    };

    const filteredPeriods = useMemo(() =>
        statusFilter === 'all'
            ? payrollPeriods
            : payrollPeriods.filter((p) => p.payroll_per_status === statusFilter),
        [payrollPeriods, statusFilter]
    );

    const counts = useMemo(() => ({
        all: payrollPeriods.length,
        open: payrollPeriods.filter((p) => p.payroll_per_status === 'open').length,
        processing: payrollPeriods.filter((p) => p.payroll_per_status === 'processing').length,
        completed: payrollPeriods.filter((p) => p.payroll_per_status === 'completed').length,
    }), [payrollPeriods]);

    // ── Column definitions for CustomTable ─────────────────────────────────
    const columns = [
        {
            label: 'Period',
            key: 'start_date',
            render: (row: PayrollPeriod) => (
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">{formatDate(row.start_date)}</p>
                        <p className="text-xs text-muted-foreground">to {formatDate(row.end_date)}</p>
                    </div>
                </div>
            ),
        },
        {
            label: 'Pay Date',
            key: 'pay_date',
            render: (row: PayrollPeriod) => (
                <span className="text-sm text-foreground">{formatDate(row.pay_date)}</span>
            ),
        },
        {
            label: 'Status',
            key: 'payroll_per_status',
            render: (row: PayrollPeriod) => (
                <StatusBadge status={row.payroll_per_status} label={formatStatus(row.payroll_per_status)} />
            ),
        },
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
        },
    ];

    // Actions – these trigger the callbacks passed to CustomTable
    const actions = [
        { label: 'View', icon: 'Eye' as const },
        { label: 'Edit', icon: 'Pencil' as const },
        { label: 'Delete', icon: 'Trash' as const },
    ];

    // Toolbar slot for the filter controls
    const toolbar = (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
                {statusFilter === 'all'
                    ? `Showing all ${filteredPeriods.length} periods`
                    : <>Filtered by <span className="font-semibold text-foreground">{formatStatus(statusFilter)}</span> — {filteredPeriods.length} result{filteredPeriods.length !== 1 ? 's' : ''}</>
                }
            </p>
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-[180px] rounded-xl border-2 text-sm focus:border-primary">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {payroll_period_enums?.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {statusFilter !== 'all' && (
                    <button
                        onClick={() => setStatusFilter('all')}
                        className="rounded-xl border-2 border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:border-accent hover:text-accent active:scale-95"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );

    // Custom empty state when filter returns no results
    const filterEmptyState = (
        <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Filter className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-base font-semibold text-muted-foreground">No periods match this filter</p>
            <button
                onClick={() => setStatusFilter('all')}
                className="mt-4 rounded-xl border-2 border-border px-4 py-2 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
            >
                Clear Filter
            </button>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Periods" />
            <CustomToast />

            {/* style animations */}
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

            <div className="min-h-screen py-8 -mt-9 md:py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* ── Page header ── */}
                    <div className="pp-header mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <CustomHeader
                            icon={<Banknote className="h-6 w-6" />}
                            title="Payroll Periods"
                            description="Manage and organize payroll periods with ease. Create, edit, and close payroll cycles."
                        />

                        <div className="flex flex-col items-start gap-3 sm:items-end">
                            <p className="text-sm text-muted-foreground">
                                <span className="mr-1 mt-2 inline-block rounded-md bg-secondary px-2 py-0.5 text-xs font-black text-secondary-foreground">
                                    {payrollPeriods.length}
                                </span>
                                periods total
                            </p>
                            <Link
                                href={PayrollPeriodController.create().url}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                           active:scale-95 hover:brightness-110 hover:shadow-lg
                                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                            >
                                <Plus className="h-4 w-4" />
                                New Period
                            </Link>
                        </div>
                    </div>

                    {/* ── Stat filter cards (only show if there are periods) ── */}
                    {payrollPeriods.length > 0 && (
                        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <StatCard label="All" count={counts.all} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} color="muted" />
                            <StatCard label="Open" count={counts.open} active={statusFilter === 'open'} onClick={() => setStatusFilter('open')} color="secondary" />
                            <StatCard label="Processing" count={counts.processing} active={statusFilter === 'processing'} onClick={() => setStatusFilter('processing')} color="primary" />
                            <StatCard label="Completed" count={counts.completed} active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} color="accent" />
                        </div>
                    )}

                    {/* ── Data table (or empty states) ── */}
                    {payrollPeriods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                                <CalendarDays className="h-8 w-8 text-primary/50" />
                            </div>
                            <p className="text-lg font-semibold text-muted-foreground">No payroll periods yet</p>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Get started by creating your first payroll period.
                            </p>
                            <Link
                                href={PayrollPeriodController.create().url}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 hover:shadow-lg active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                Create First Period
                            </Link>
                        </div>
                    ) : (
                        <CustomTable
                            title="Payroll Periods"
                            columns={columns}
                            actions={actions}
                            data={filteredPeriods}
                            from={1}
                            onDelete={handleDelete}
                            onView={(period) => { setSelectedPeriod(period); setIsModalOpen(true); }}
                            onEdit={(period) => router.visit(PayrollPeriodController.edit(period.id).url)}
                            toolbar={toolbar}
                            filterEmptyState={filterEmptyState}
                        />
                    )}

                    {/* ── Detail modal ── */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent className="sm:max-w-[480px] rounded-2xl">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                        <CalendarDays className="h-4 w-4 text-primary" />
                                    </div>
                                    Payroll Period Details
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Full details for this payroll period.
                                </DialogDescription>
                            </DialogHeader>

                            {selectedPeriod && (
                                <div className="space-y-3 pt-2">
                                    {/* Period range */}
                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            Period Range
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start</p>
                                                <p className="text-sm font-semibold text-foreground">{formatDate(selectedPeriod.start_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End</p>
                                                <p className="text-sm font-semibold text-foreground">{formatDate(selectedPeriod.end_date)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pay date */}
                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pay Date</p>
                                        <p className="text-sm font-semibold text-foreground">{formatDate(selectedPeriod.pay_date)}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                                        <StatusBadge
                                            status={selectedPeriod.payroll_per_status}
                                            label={formatStatus(selectedPeriod.payroll_per_status)}
                                        />
                                    </div>

                                    {/* Summary */}
                                    <div className="rounded-xl bg-primary/5 p-4">
                                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Summary</p>
                                        <p className="text-sm text-foreground">
                                            {selectedPeriod.payroll_per_status === 'completed'
                                                ? 'This payroll period has been completed and processed.'
                                                : selectedPeriod.payroll_per_status === 'processing'
                                                    ? 'This payroll period is currently being processed.'
                                                    : 'This payroll period is open and pending processing.'}
                                        </p>
                                    </div>

                                    {/* Modal actions */}
                                    <div className="flex gap-2 pt-1">
                                        <Link
                                            href={PayrollPeriodController.edit(selectedPeriod.id).url}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit Period
                                        </Link>
                                        <button
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </AppLayout>
    );
}