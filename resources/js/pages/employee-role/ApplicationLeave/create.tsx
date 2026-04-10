import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    CalendarIcon, FileTextIcon, Loader2, CheckCircle2,
    AlertCircle, SendHorizonal,
} from 'lucide-react';
import { store } from '@/actions/App/Http/Controllers/EmployeeRole/ApplicationLeaveController';
import { useEffect, useState, useMemo } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import AppLayout from '@/layouts/emp-layout';
import { toast } from 'sonner';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Applications', href: '/employee/application-leave' },
    { title: 'Create Leave Application', href: '/employee/application-leave/create' },
];

interface FormData {
    leave_start: string;
    leave_end: string;
    reason_to_leave: string;
}

const LEAVE_BALANCE = { total: 5, used: 0, remaining: 5 };

export default function Create() {
    const { data, setData, errors, processing, post } = useForm<FormData>({
        leave_start: '',
        leave_end: '',
        reason_to_leave: '',
    });

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: data.leave_start ? new Date(data.leave_start) : undefined,
        to: data.leave_end ? new Date(data.leave_end) : undefined,
    });

    const [isFormValid, setIsFormValid] = useState(false);

    const currentStep = useMemo(() => {
        if (!data.leave_start || !data.leave_end) return 1;
        if (!data.reason_to_leave.trim()) return 2;
        return 3;
    }, [data]);

    const handleRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        setData(prev => ({
            ...prev,
            leave_start: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
            leave_end: range?.to ? format(range.to, 'yyyy-MM-dd') : '',
        }));
    };

    const setQuickRange = (days: number) => {
        const from = new Date();
        handleRangeChange({ from, to: addDays(from, days - 1) });
    };

    const daysCount = useMemo(() => {
        if (!data.leave_start || !data.leave_end) return 0;
        return differenceInDays(new Date(data.leave_end), new Date(data.leave_start)) + 1;
    }, [data.leave_start, data.leave_end]);

    const exceedsBalance = daysCount > LEAVE_BALANCE.remaining;

    useEffect(() => {
        setIsFormValid(
            !!data.leave_start && !!data.leave_end &&
            data.reason_to_leave.trim().length > 0 &&
            !exceedsBalance
        );
    }, [data, exceedsBalance]);

    function submitApplication(e: React.FormEvent) {
        e.preventDefault();
        post(store().url, {
            onSuccess: (page) => {
                const msg = (page.props as any).flash?.success || 'Leave application submitted.';
                toast.success(msg, {
                    style: { backgroundColor: 'white', color: '#16a34a', border: '1px solid #d5d8d5' }
                });
            },
            onError: (errs) => {
                const msg = Object.values(errs).flat()[0] || 'Failed to submit application.';
                toast.error(msg as string, {
                    style: { backgroundColor: 'white', color: '#d85e39', border: '1px solid #d5d8d5' }
                });
            },
        });
    }

    const stepLabels = ['Select Dates', 'Provide Reason', 'Submit'];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Leave Application" />

            <style>{`
                @keyframes formFadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .form-fade-up { animation: formFadeUp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.05) both; }
            `}</style>

            <div className="flex flex-1 flex-col items-center gap-6 p-4 pb-12 md:p-6 md:pb-16">
                <div className="w-full max-w-2xl form-fade-up">

                    {/* Card — navy header matches CustomTable */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">

                        {/* Navy header */}
                        <div className="bg-[#1d4791] px-5 py-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-base font-semibold text-white tracking-tight">Leave Application</h1>
                                    <p className="text-xs text-white/60 mt-0.5">Fill in the details below to submit your request.</p>
                                </div>
                                <div className="rounded-lg bg-white/10 p-2">
                                    <SendHorizonal className="h-4 w-4 text-white" />
                                </div>
                            </div>

                            {/* Step progress */}
                            <div className="flex items-center gap-2">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex flex-1 items-center gap-2">
                                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all shrink-0
                                            ${currentStep > step
                                                ? 'bg-white text-[#1d4791]'
                                                : currentStep === step
                                                    ? 'bg-white text-[#1d4791] ring-2 ring-white/40'
                                                    : 'bg-white/20 text-white/60'
                                            }`}>
                                            {currentStep > step ? <CheckCircle2 className="h-3.5 w-3.5" /> : step}
                                        </div>
                                        {step < 3 && (
                                            <div className={`h-px flex-1 rounded-full transition-all ${currentStep > step ? 'bg-white/80' : 'bg-white/20'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-1.5 px-0.5">
                                {stepLabels.map((label) => (
                                    <span key={label} className="text-[10px] text-white/50">{label}</span>
                                ))}
                            </div>
                        </div>

                        {/* Form body */}
                        <div className="bg-white px-5 py-5">
                            <form onSubmit={submitApplication} className="space-y-6">

                                {/* Leave Balance */}
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Annual Leave Balance</p>
                                            <p className="mt-1 text-2xl font-semibold text-slate-900">
                                                {LEAVE_BALANCE.remaining}
                                                <span className="text-sm font-normal text-slate-400"> / {LEAVE_BALANCE.total} days</span>
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">Resets every year on Jan 1</p>
                                        </div>
                                        <div className="rounded-lg bg-[#d85e39]/10 p-2 shrink-0">
                                            <AlertCircle className="h-4 w-4 text-[#d85e39]" />
                                        </div>
                                    </div>
                                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(LEAVE_BALANCE.used / LEAVE_BALANCE.total) * 100}%`,
                                                backgroundColor: '#d85e39',
                                            }}
                                        />
                                    </div>
                                    {exceedsBalance && (
                                        <div className="mt-3 rounded-md border border-[#d85e39]/20 bg-[#d85e39]/5 p-2.5 text-xs text-[#d85e39] flex items-center gap-2">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            <span>
                                                Requested {daysCount} days exceeds your available balance ({LEAVE_BALANCE.remaining} days). Please reduce the duration.
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Date Range Field */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <CalendarIcon className="h-3.5 w-3.5 text-[#1d4791]" />
                                        Period Range <span className="text-[#d85e39]">*</span>
                                    </p>

                                    {/* Quick shortcuts */}
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4].map((days) => (
                                            <button
                                                key={`${days}day`}
                                                type="button"
                                                onClick={() => setQuickRange(days)}
                                                disabled={processing}
                                                className="h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-all
                                                    hover:border-[#1d4791]/30 hover:bg-[#1d4791]/5 hover:text-[#1d4791]
                                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {days} day{days !== 1 ? 's' : ''}
                                            </button>
                                        ))}
                                    </div>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                disabled={processing}
                                                className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 transition-all
                                                    hover:border-[#1d4791]/40 focus:outline-none focus:ring-1 focus:ring-[#1d4791] focus:border-[#1d4791]
                                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                                {dateRange?.from ? (
                                                    dateRange.to ? (
                                                        <span>{format(dateRange.from, "LLL dd, y")} – {format(dateRange.to, "LLL dd, y")}</span>
                                                    ) : (
                                                        <span>{format(dateRange.from, "LLL dd, y")}</span>
                                                    )
                                                ) : (
                                                    <span className="text-slate-400">Pick a date range</span>
                                                )}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                                            <Calendar
                                                mode="range"
                                                selected={dateRange}
                                                onSelect={handleRangeChange}
                                                numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                                                disabled={() => processing}
                                                className="rounded-xl [&_.rdp-day_selected]:bg-[#1d4791] [&_.rdp-day_selected]:text-white [&_.rdp-day_range_middle]:bg-[#1d4791]/10"
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex gap-3 text-xs text-slate-400">
                                            <span>Start: {data.leave_start ? format(new Date(data.leave_start), "LLL dd, y") : '—'}</span>
                                            <span>End: {data.leave_end ? format(new Date(data.leave_end), "LLL dd, y") : '—'}</span>
                                        </div>
                                        {daysCount > 0 && (
                                            <span className="rounded-md bg-[#d85e39]/10 px-2 py-0.5 text-xs font-semibold text-[#d85e39]">
                                                {daysCount} day{daysCount !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        {errors.leave_start && <InputError message={errors.leave_start} />}
                                        {errors.leave_end && <InputError message={errors.leave_end} />}
                                    </div>
                                </div>

                                {/* Reason Field */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                        <FileTextIcon className="h-3.5 w-3.5 text-[#1d4791]" />
                                        Reason for Leave <span className="text-[#d85e39]">*</span>
                                    </p>
                                    <Textarea
                                        value={data.reason_to_leave}
                                        onChange={e => setData('reason_to_leave', e.target.value)}
                                        placeholder="Please provide a detailed reason for your leave request..."
                                        className="min-h-[120px] resize-y rounded-lg border-slate-200 text-sm transition-all focus:border-[#1d4791] focus:ring-1 focus:ring-[#1d4791]"
                                        maxLength={1000}
                                        aria-invalid={!!errors.reason_to_leave}
                                        disabled={processing}
                                    />
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>{data.reason_to_leave.length}/1000 characters</span>
                                            <span>{Math.round((data.reason_to_leave.length / 1000) * 100)}%</span>
                                        </div>
                                        <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${(data.reason_to_leave.length / 1000) * 100}%`,
                                                    backgroundColor: '#1d4791',
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <InputError message={errors.reason_to_leave} />
                                </div>

                                {/* Hairline divider + Actions */}
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={() => window.history.back()}
                                            disabled={processing}
                                            className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-all
                                                hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || !isFormValid}
                                            className="h-9 rounded-lg px-5 text-sm font-medium text-white shadow-sm shadow-[#1d4791]/20 transition-all
                                                bg-[#1d4791] hover:bg-[#1d4791]/90
                                                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                        >
                                            {processing ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Submitting…
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Submit Leave Application
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>

                            </form>
                        </div>
                    </div>

                    <p className="mt-4 text-center text-xs text-slate-400">
                        Your leave request will be reviewed by your manager. You will receive an email notification.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}