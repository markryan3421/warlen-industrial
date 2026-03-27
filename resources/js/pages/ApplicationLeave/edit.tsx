import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { update } from '@/actions/App/Http/Controllers/ApplicationLeaveController';
import {
    ArrowLeft, ClipboardList, User, CalendarDays,
    MessageSquare, ShieldCheck, LoaderCircle, Hash, Mail,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Employee {
    id: number;
    emp_code: string;
    employee_number: string;
    user: { id: number; name: string; email: string; };
}

interface FormData {
    leave_start: string;
    leave_end: string;
    reason_to_leave: string;
    app_status: string;
    remarks: string;
}

interface EditProps {
    applicationLeave: {
        id: number;
        employee: Employee;
        leave_start: string;
        leave_end: string;
        reason_to_leave: string;
        app_status: string;
        remarks: string;
        slug_app: string;
    };
}

interface PageProps {
    applicationLeaveEnum: Array<{ value: string; label: string; }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A';

const durationDays = (start: string, end: string) => {
    if (!start || !end) return null;
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
    return diff > 0 ? diff : null;
};

// ── Section card ──────────────────────────────────────────────────────────────
function FormSection({ icon: Icon, title, children, index = 0 }: {
    icon: React.ElementType; title: string; children: React.ReactNode; index?: number;
}) {
    return (
        <div
            className="form-section space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ── Read-only info row ────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }: {
    label: string; value: string; icon?: React.ElementType;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <div className="flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                <p className="text-sm font-semibold text-foreground">{value || 'N/A'}</p>
            </div>
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Edit({ applicationLeave }: EditProps) {
    const { applicationLeaveEnum } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leave Applications', href: '/application-leaves' },
        { title: applicationLeave.employee?.user?.name ?? 'Leave Application', href: '#' },
        { title: 'Review', href: '#' },
    ];

    const { data, setData, errors, processing, put } = useForm<FormData>({
        leave_start: applicationLeave.leave_start || '',
        leave_end: applicationLeave.leave_end || '',
        reason_to_leave: applicationLeave.reason_to_leave || '',
        app_status: applicationLeave.app_status || '',
        remarks: applicationLeave.remarks || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update(applicationLeave.slug_app).url);
    };

    const duration = durationDays(data.leave_start, data.leave_end);

    // Current status badge styling
    const statusStyle: Record<string, string> = {
        approved: 'bg-primary/10 text-primary border border-primary/20',
        rejected: 'bg-accent/10 text-accent border border-accent/20',
        pending: 'bg-secondary/80 text-secondary-foreground',
    };
    const currentStatus = (applicationLeave.app_status || 'pending').toLowerCase();

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review — ${applicationLeave.employee?.user?.name ?? 'Leave Application'}`} />

            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-section { animation: formFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

                    {/* ── Page header ── */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                                <ClipboardList className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    HR Management
                                </p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                                    Review Leave Application
                                </h1>
                            </div>
                        </div>

                        <Link
                            href="/application-leave"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all duration-200
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* 1. Employee Information — read-only */}
                        {applicationLeave.employee && (
                            <FormSection icon={User} title="Employee Information" index={0}>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <InfoRow
                                        label="Full Name"
                                        value={applicationLeave.employee.user?.name}
                                        icon={User}
                                    />
                                    <InfoRow
                                        label="Email Address"
                                        value={applicationLeave.employee.user?.email}
                                        icon={Mail}
                                    />
                                    <InfoRow
                                        label="Employee Code"
                                        value={applicationLeave.employee.emp_code}
                                        icon={Hash}
                                    />
                                    <InfoRow
                                        label="Employee Number"
                                        value={applicationLeave.employee.employee_number}
                                        icon={Hash}
                                    />
                                </div>
                            </FormSection>
                        )}

                        {/* 2. Leave Request Details — read-only */}
                        <FormSection icon={CalendarDays} title="Leave Request Details" index={1}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Start date */}
                                <div className="rounded-xl border border-border bg-muted/20 p-4">
                                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Start Date
                                    </p>
                                    <p className="text-sm font-bold text-foreground">{fmtDate(data.leave_start)}</p>
                                </div>

                                {/* End date */}
                                <div className="rounded-xl border border-border bg-muted/20 p-4">
                                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        End Date
                                    </p>
                                    <p className="text-sm font-bold text-foreground">{fmtDate(data.leave_end)}</p>
                                </div>
                            </div>

                            {/* Duration pill */}
                            {duration && (
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        Duration:{' '}
                                        <span className="font-black text-foreground">{duration} day{duration !== 1 ? 's' : ''}</span>
                                    </span>
                                </div>
                            )}

                            {/* Current status indicator */}
                            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/10 px-4 py-3">
                                <p className="text-xs font-semibold text-muted-foreground">Current Status</p>
                                <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyle[currentStatus] ?? statusStyle.pending}`}>
                                    {applicationLeave.app_status || 'Pending'}
                                </span>
                            </div>

                            {/* Reason for leave */}
                            <div>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Reason for Leave
                                </p>
                                <div className="min-h-[80px] rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground whitespace-pre-wrap">
                                    {data.reason_to_leave || <span className="italic text-muted-foreground">No reason provided</span>}
                                </div>
                            </div>
                        </FormSection>

                        {/* 3. Approval Decision — editable */}
                        <FormSection icon={ShieldCheck} title="Approval Decision" index={2}>
                            {/* Status radio group */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Application Status
                                </Label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    {applicationLeaveEnum?.map(({ value, label }) => {
                                        const statusKey = value.toLowerCase();
                                        const isSelected = data.app_status === value;

                                        // Define styling based on status
                                        let bgClass = 'bg-muted/30 border-border';
                                        let textClass = 'text-muted-foreground';
                                        let icon = null;

                                        switch (statusKey) {
                                            case 'approved':
                                                bgClass = isSelected ? 'bg-green-100 border-green-500 dark:bg-green-900/30' : 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
                                                textClass = isSelected ? 'text-green-700 dark:text-green-300' : 'text-green-600 dark:text-green-400';
                                                icon = <CheckCircle2 className="h-5 w-5" />;
                                                break;
                                            case 'rejected':
                                                bgClass = isSelected ? 'bg-red-100 border-red-500 dark:bg-red-900/30' : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
                                                textClass = isSelected ? 'text-red-700 dark:text-red-300' : 'text-red-600 dark:text-red-400';
                                                icon = <XCircle className="h-5 w-5" />;
                                                break;
                                            default: // pending
                                                bgClass = isSelected ? 'bg-yellow-100 border-yellow-500 dark:bg-yellow-900/30' : 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
                                                textClass = isSelected ? 'text-yellow-700 dark:text-yellow-300' : 'text-yellow-600 dark:text-yellow-400';
                                                icon = <Clock className="h-5 w-5" />;
                                                break;
                                        }

                                        return (
                                            <label
                                                key={value}
                                                className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${bgClass} ${isSelected ? 'ring-2 ring-primary/30 shadow-md' : 'hover:shadow-sm'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="app_status"
                                                    value={value}
                                                    checked={isSelected}
                                                    onChange={(e) => setData('app_status', e.target.value)}
                                                    className="absolute opacity-0"
                                                />
                                                <div className={`${textClass} transition-colors`}>
                                                    {icon}
                                                </div>
                                                <span className={`text-sm font-bold ${textClass}`}>{label}</span>
                                                {isSelected && (
                                                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-black shadow-sm">
                                                        ✓
                                                    </div>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.app_status} />
                            </div>

                            {/* Remarks (unchanged) */}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                    <Label className="text-sm font-semibold">
                                        Remarks
                                        <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                                    </Label>
                                </div>
                                <textarea
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    placeholder="Add any notes or feedback for the employee..."
                                    disabled={processing}
                                    maxLength={500}
                                    rows={4}
                                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm transition-all
                       placeholder:text-muted-foreground
                       focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
                       disabled:opacity-50"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{data.remarks.length}/500</span>
                                    {data.remarks.length > 0 && (
                                        <span className={data.remarks.length >= 500 ? 'text-accent' : ''}>
                                            {500 - data.remarks.length} remaining
                                        </span>
                                    )}
                                </div>
                                <InputError message={errors.remarks} />
                            </div>
                        </FormSection>

                        {/* Submit */}
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                                <span className="text-accent">*</span> Required fields
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    disabled={processing}
                                    className="rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all
                                               hover:border-primary hover:text-primary active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all duration-200
                                               active:scale-95 hover:brightness-110 hover:shadow-lg
                                               disabled:cursor-not-allowed disabled:opacity-60
                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                                >
                                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {processing ? 'Saving…' : 'Save Decision'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}