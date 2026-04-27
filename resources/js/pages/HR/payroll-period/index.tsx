import HrLayout from '@/layouts/hr-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import PayrollPeriodController from '@/actions/App/Http/Controllers/HrRole/PayrollPeriodController';
import { useState, useMemo, useEffect, useRef } from 'react';
import {
    CalendarDays, Plus, Clock, CheckCircle2,
    AlertCircle, Filter, Pencil, Trash2, Eye, Banknote, XCircle, Loader2,
} from 'lucide-react';
import { CustomTable } from '@/components/custom-table';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CustomToast, toast } from '@/components/custom-toast';
import { CustomHeader } from '@/components/custom-header';
import { Button } from '@/components/ui/button';

interface PayrollPeriod {
    id: number;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: string;
    is_paid: boolean;
    created_at?: string;
    updated_at?: string;
}

interface PayrollPeriodProps {
    payrollPeriods: PayrollPeriod[];
}

interface PageProps {
    payroll_period_enums: Array<{ value: string; label: string; }>;
    flash?: { success?: string; error?: string; warning?: string; info?: string };
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll Periods', href: '/payroll-periods' },
];

// Custom toast style helper
const toastStyle = (color: string) => ({
    style: {
        backgroundColor: 'white',
        color: color,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    },
});

// Status config based on enum values
const getStatusConfig = (status: string) => {
    const configs: Record<string, { icon: any; badge: string; dot: string; color: 'primary' | 'secondary' | 'accent' | 'muted' }> = {
        open: { icon: AlertCircle, badge: 'bg-secondary text-secondary-foreground', dot: 'bg-secondary', color: 'secondary' },
        processing: { icon: Clock, badge: 'bg-primary/10 text-primary border border-primary/20', dot: 'bg-primary', color: 'primary' },
        calculated: { icon: CheckCircle2, badge: 'bg-accent/10 text-accent border border-accent/20', dot: 'bg-accent', color: 'accent' },
        completed: { icon: CheckCircle2, badge: 'bg-accent/10 text-accent border border-accent/20', dot: 'bg-accent', color: 'accent' },
        failed: { icon: AlertCircle, badge: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500', color: 'muted' },
    };
    return configs[status] || configs.open;
};

function StatusBadge({ status, label, isProcessing, progress }: { status: string; label: string; isProcessing?: boolean; progress?: number }) {
    if (isProcessing) {
        return (
            <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 bg-primary/10 border border-primary/20">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    {progress !== undefined && progress > 0 ? `${progress}%` : 'Processing'}
                </span>
            </div>
        );
    }

    const cfg = getStatusConfig(status);
    const Icon = cfg.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${cfg.badge}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

function PaymentBadge({ isPaid }: { isPaid: boolean }) {
    return isPaid ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Paid
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-600">
            <XCircle className="h-3 w-3" />
            Unpaid
        </span>
    );
}

// Stat card component
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

export default function Index({ payrollPeriods }: PayrollPeriodProps) {
    const { payroll_period_enums, flash } = usePage<PageProps>().props;

    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>(() =>
        localStorage.getItem('payrollPeriods-statusFilter') || 'all'
    );

    const [processingPeriodId, setProcessingPeriodId] = useState<number | null>(null);
    const [processingProgress, setProcessingProgress] = useState<number>(0);
    const [processingMessage, setProcessingMessage] = useState<string>('');

    // Flash message deduplication
    const lastFlashRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

    useEffect(() => {
        if (!flash) return;

        const flashKey = JSON.stringify(flash);
        const now = Date.now();
        const last = lastFlashRef.current;

        if (last.key === flashKey && (now - last.time) < 500) return;

        lastFlashRef.current = { key: flashKey, time: now };

        if (flash.success) toast.success(flash.success, toastStyle('#16a34a'));
        if (flash.error) toast.error(flash.error, toastStyle('#dc2626'));
        if (flash.warning) toast.warning(flash.warning, toastStyle('#f97316'));
        if (flash.info) toast.info(flash.info, toastStyle('#3b82f6'));
    }, [flash]);

    useEffect(() => {
        localStorage.setItem('payrollPeriods-statusFilter', statusFilter);
    }, [statusFilter]);

    // Echo listeners for real-time processing updates
    useEffect(() => {
        if (!window.Echo) {
            console.warn('Echo is not initialized');
            return;
        }

        console.log('Setting up Echo listeners for payroll channels...');

        const payrollChannel = window.Echo.private('payroll');
        const payrollPeriodChannel = window.Echo.private('payroll-period');

        const handlePayrollEvent = (event: any) => {
            console.log('================== PAYROLL EVENT RECEIVED ==================');
            console.log('Full event:', event);

            if (event.progress !== undefined && event.payroll_period_id) {
                const isStillProcessing = event.progress < 100;

                setProcessingPeriodId(event.payroll_period_id);
                setProcessingProgress(event.progress);
                setProcessingMessage(event.message);

                if (!isStillProcessing) {
                    setTimeout(() => {
                        setProcessingPeriodId(null);
                        setProcessingProgress(0);
                        setProcessingMessage('');
                    }, 3000);
                }
            }

            router.reload({ only: ['payrollPeriods'] });
        };

        payrollChannel.listen('.payroll.completed', handlePayrollEvent);
        payrollPeriodChannel.listen('.payroll.completed', handlePayrollEvent);

        payrollChannel.subscribed(() => console.log('✅ Subscribed to private payroll channel'));
        payrollPeriodChannel.subscribed(() => console.log('✅ Subscribed to private payroll-period channel'));

        payrollChannel.error((error: any) => console.error('❌ Error on payroll channel:', error));
        payrollPeriodChannel.error((error: any) => console.error('❌ Error on payroll-period channel:', error));

        return () => {
            payrollChannel.stopListening('.payroll.completed');
            payrollPeriodChannel.stopListening('.payroll.completed');
        };
    }, []);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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

    const counts = useMemo(() => {
        const countsMap: Record<string, number> = { all: payrollPeriods.length };
        payroll_period_enums?.forEach((enumItem) => {
            countsMap[enumItem.value] = payrollPeriods.filter(
                (p) => p.payroll_per_status === enumItem.value
            ).length;
        });
        return countsMap;
    }, [payrollPeriods, payroll_period_enums]);

    const getStatusColor = (status: string): 'primary' | 'secondary' | 'accent' | 'muted' => {
        return getStatusConfig(status).color;
    };

    // Handle Run Payroll action
    const handleRunPayroll = (period: PayrollPeriod) => {
        if (period.payroll_per_status !== 'open') return;

        router.put(
            PayrollPeriodController.update(period.id).url,
            {
                start_date: period.start_date,
                end_date: period.end_date,
                pay_date: period.pay_date,
                payroll_per_status: 'processing',
                is_paid: period.is_paid,
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Payroll run started.', toastStyle('#16a34a')),
                onError: () => toast.error('Failed to start payroll run.', toastStyle('#dc2626')),
            }
        );
    };

    // Column definitions
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
                <StatusBadge
                    status={row.payroll_per_status}
                    label={formatStatus(row.payroll_per_status)}
                    isProcessing={processingPeriodId === row.id}
                    progress={processingProgress}
                />
            ),
        },
        {
            label: 'Payment',
            key: 'is_paid',
            render: (row: PayrollPeriod) => <PaymentBadge isPaid={row.is_paid} />,
        },
        {
            label: 'Actions',
            key: 'actions',
            isAction: true,
        },
    ];

    const actions = [
        { label: 'View', icon: 'Eye' as const },
        { label: 'Edit', icon: 'Pencil' as const },
        { label: 'Run Payroll', icon: 'Play' as const },
    ];

    const toolbar = (
        <div className="flex flex-wrap items-center justify-between gap-3">
            {processingPeriodId !== null && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm font-medium text-primary">
                        {processingMessage || 'Processing payroll...'}
                    </span>
                    {processingProgress > 0 && (
                        <span className="text-xs font-bold text-primary">{processingProgress}%</span>
                    )}
                </div>
            )}
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
        <HrLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Periods" />
            <CustomToast />

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
                    {/* Page header */}
                    <div className="grid grid-rows-1 justify-center sm:mx-1 md:grid-row-1 md:mx-0 mt-3 lg:flex lg:justify-between items-center lg:mx-0 lg:mt-3 lg:pb-4 lg:-mb-2 pp-header">
                        <CustomHeader
                            icon={<Banknote className="h-6 w-6" />}
                            title="Payroll Periods"
                            description="Manage and organize payroll periods with ease."
                        />

                        <div className="flex flex-row justify-between items-center gap-3 -mt-2 mb-3 lg:flex-col lg:items-end lg:justify-end lg:gap-2 lg:-mt-5">
                            <div className="flex items-center gap-2 lg:order-1">
                                <span className='border px-1.5 py-0.1 rounded-full text-sm bg-primary/10 border-primary/30'>
                                    {payrollPeriods.length}
                                </span>
                                <span className='text-sm font-medium whitespace-nowrap'>
                                    total <span className="text-blue-800 font-bold">{payrollPeriods.length === 1 ? 'period' : 'periods'}</span>
                                </span>
                            </div>

                            <Link href={PayrollPeriodController.create().url} className="lg:order-2">
                                <Button className="bg-[#1d4791] hover:bg-[#1d4791]/90 whitespace-nowrap">
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span>Add Payroll Period</span>
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stat cards */}
                    {payrollPeriods.length > 0 && (
                        <div className="mb-4 mx-1 md:mb-4 lg:mb-8 grid grid-cols-2 md:grid-cols-2 gap-3 lg:grid-cols-4 pp-header">
                            <StatCard
                                label="All"
                                count={counts.all}
                                active={statusFilter === 'all'}
                                onClick={() => setStatusFilter('all')}
                                color="muted"
                            />
                            {payroll_period_enums?.map(({ value, label }) => (
                                <StatCard
                                    key={value}
                                    label={label}
                                    count={counts[value] || 0}
                                    active={statusFilter === value}
                                    onClick={() => setStatusFilter(value)}
                                    color={getStatusColor(value)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Data table or empty state */}
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
                        <div className="pp-row">
                            <CustomTable
                                title="Payroll Period Lists"
                                columns={columns}
                                actions={actions}
                                data={filteredPeriods}
                                from={1}
                                onView={(period) => { setSelectedPeriod(period); setIsModalOpen(true); }}
                                onEdit={(period) => router.visit(PayrollPeriodController.edit(period.id).url)}
                                onRunPayroll={handleRunPayroll}
                                toolbar={toolbar}
                                filterEmptyState={filterEmptyState}
                            />
                        </div>
                    )}

                    {/* Detail Modal */}
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
                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Period Range</p>
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

                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pay Date</p>
                                        <p className="text-sm font-semibold text-foreground">{formatDate(selectedPeriod.pay_date)}</p>
                                    </div>

                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                                        <StatusBadge
                                            status={selectedPeriod.payroll_per_status}
                                            label={formatStatus(selectedPeriod.payroll_per_status)}
                                            isProcessing={processingPeriodId === selectedPeriod.id}
                                            progress={processingProgress}
                                        />
                                    </div>

                                    <div className="rounded-xl border border-border bg-card p-4">
                                        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Status</p>
                                        <PaymentBadge isPaid={selectedPeriod.is_paid} />
                                    </div>

                                    <div className="rounded-xl bg-primary/5 p-4">
                                        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Summary</p>
                                        <p className="text-sm text-foreground">
                                            {processingPeriodId === selectedPeriod.id
                                                ? processingMessage || 'Processing payroll...'
                                                : selectedPeriod.payroll_per_status === 'completed' || selectedPeriod.payroll_per_status === 'calculated'
                                                    ? selectedPeriod.is_paid
                                                        ? 'This payroll period has been completed and the payout has been processed.'
                                                        : 'This payroll period has been completed but payout has not been confirmed.'
                                                    : selectedPeriod.payroll_per_status === 'processing'
                                                        ? 'This payroll period is currently being processed.'
                                                        : selectedPeriod.payroll_per_status === 'failed'
                                                            ? 'This payroll period failed to process. Please check logs for details.'
                                                            : 'This payroll period is open and pending processing.'}
                                        </p>
                                    </div>

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
        </HrLayout>
    );
}