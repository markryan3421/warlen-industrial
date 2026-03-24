import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { update } from '@/actions/App/Http/Controllers/PayrollPeriodController';
import { ArrowLeft, Banknote, CalendarDays, LoaderCircle, RefreshCw, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { useEffect, useState } from 'react';

interface FormData {
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: string;
}

interface EditProps {
    payrollPeriod: {
        id: number;
        start_date: string;
        end_date: string;
        pay_date: string;
        payroll_per_status: string;
    };
}

// Extend Inertia's PageProps to include our enums
interface PageProps extends InertiaPageProps {
    payroll_period_enums: Array<{ value: string; label: string; }>;
}

// Helper to get Inertia's base PageProps type
type InertiaPageProps = import('@inertiajs/core').PageProps;

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

export default function Edit({ payrollPeriod }: EditProps) {
    const { payroll_period_enums } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payroll Periods', href: '/payroll-periods' },
        { title: `Period #${payrollPeriod.id}`, href: '#' },
        { title: 'Edit', href: '#' },
    ];

    const { data, setData, errors, processing, put } = useForm<FormData>({
        start_date: payrollPeriod.start_date || '',
        end_date: payrollPeriod.end_date || '',
        pay_date: payrollPeriod.pay_date || '',
        payroll_per_status: payrollPeriod.payroll_per_status || '',
    });

    // State for date range picker (period)
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: data.start_date ? new Date(data.start_date) : undefined,
        to: data.end_date ? new Date(data.end_date) : undefined,
    });

    // State for single date picker (pay date)
    const [payDate, setPayDate] = useState<Date | undefined>(
        data.pay_date ? new Date(data.pay_date) : undefined
    );

    // Sync internal range when form data changes
    useEffect(() => {
        setDateRange({
            from: data.start_date ? new Date(data.start_date) : undefined,
            to: data.end_date ? new Date(data.end_date) : undefined,
        });
    }, [data.start_date, data.end_date]);

    // Sync pay date when form data changes
    useEffect(() => {
        setPayDate(data.pay_date ? new Date(data.pay_date) : undefined);
    }, [data.pay_date]);

    const handleRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        setData('start_date', range?.from ? format(range.from, 'yyyy-MM-dd') : '');
        setData('end_date', range?.to ? format(range.to, 'yyyy-MM-dd') : '');
    };

    const handlePayDateChange = (date: Date | undefined) => {
        setPayDate(date);
        setData('pay_date', date ? format(date, 'yyyy-MM-dd') : '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update(payrollPeriod.id).url);
    };

    const formatDisplayDate = (d: string) =>
        d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Period #${payrollPeriod.id}`} />

            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-section { animation: formFadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
            `}</style>

            <div className="min-h-screen py-8 md:py-10">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md">
                                <RefreshCw className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Payroll</p>
                                <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                                    Edit Period <span className="text-primary">#{payrollPeriod.id}</span>
                                </h1>
                            </div>
                        </div>

                        <Link
                            href="/payroll-periods"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-all duration-200
                                       hover:bg-primary hover:text-primary-foreground active:scale-95
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                    </div>

                    {/* Current values summary card */}
                    <div
                        className="form-section mb-5 rounded-2xl border border-border bg-primary/5 p-5"
                        style={{ animationDelay: '0ms' }}
                    >
                        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Current Values
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start</p>
                                <p className="text-sm font-semibold text-foreground">{formatDisplayDate(payrollPeriod.start_date)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End</p>
                                <p className="text-sm font-semibold text-foreground">{formatDisplayDate(payrollPeriod.end_date)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pay Date</p>
                                <p className="text-sm font-semibold text-foreground">{formatDisplayDate(payrollPeriod.pay_date)}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Period Dates */}
                        <FormSection icon={CalendarDays} title="Period Dates" index={1}>
                            {/* Date Range Picker */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Period Range
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-11 w-full justify-start rounded-xl border-2 px-3 font-normal transition-all focus:border-primary"
                                            disabled={processing}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} –{" "}
                                                        {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={dateRange}
                                            onSelect={handleRangeChange}
                                            numberOfMonths={2}
                                            disabled={(date) => processing}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                    <span>Start: {data.start_date || '—'}</span>
                                    <span>End: {data.end_date || '—'}</span>
                                </div>
                                <div className="space-y-1">
                                    {errors.start_date && <InputError message={errors.start_date} />}
                                    {errors.end_date && <InputError message={errors.end_date} />}
                                </div>
                            </div>

                            {/* Pay Date Picker */}
                            <div className="space-y-1.5">
                                <Label htmlFor="pay_date" className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Pay Date
                                </Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-11 w-full justify-start rounded-xl border-2 px-3 font-normal transition-all focus:border-primary"
                                            disabled={processing}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {payDate ? format(payDate, "LLL dd, y") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={payDate}
                                            onSelect={handlePayDateChange}
                                            disabled={(date) => processing}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <InputError message={errors.pay_date} />
                            </div>
                        </FormSection>

                        {/* Status */}
                        <FormSection icon={Banknote} title="Period Status" index={2}>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">
                                    <span className="text-accent">* </span>Status
                                </Label>
                                <Select
                                    value={data.payroll_per_status}
                                    onValueChange={(v) => setData('payroll_per_status', v)}
                                    disabled={processing}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-2 transition-all focus:border-primary">
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {payroll_period_enums?.map(({ value, label }) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.payroll_per_status} />
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
                                    className="rounded-xl border-2 border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-50 active:scale-95"
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
                                    {processing ? 'Updating…' : 'Update Period'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}