import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileTextIcon, Loader2, CheckCircle2, Sun, AlertCircle } from 'lucide-react';
import { store } from '@/actions/App/Http/Controllers/EmployeeRole/ApplicationLeaveController';
import { useEffect, useState, useMemo } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { type DateRange } from 'react-day-picker';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leave Applications', href: '/employee/application-leave' },
    { title: 'Create Leave Application', href: '/employee/application-leave/create' },
];

interface FormData {
    leave_start: string;
    leave_end: string;
    reason_to_leave: string;
}

// Fixed leave balance: 5 days per year
const LEAVE_BALANCE = {
    total: 5,
    used: 0,   // This would come from backend; for demo, assume 0 used
    remaining: 5,
};

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

    // Step progress (1: dates, 2: reason, 3: ready)
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
            leave_end: range?.to ? format(range.to, 'yyyy-MM-dd') : ''
        }));
    };

    // Quick date shortcuts: 1,2,3,4 days, and 1 week
    const setQuickRange = (days: number) => {
        const from = new Date();
        const to = addDays(from, days - 1);
        handleRangeChange({ from, to });
    };

    // Calculate number of days
    const daysCount = useMemo(() => {
        if (!data.leave_start || !data.leave_end) return 0;
        return differenceInDays(new Date(data.leave_end), new Date(data.leave_start)) + 1;
    }, [data.leave_start, data.leave_end]);

    // Check if requested days exceed balance
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
        post(store().url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Leave Application" />
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 pb-12 md:p-6 md:pb-16">
                {/* Main Form Card */}
                <Card className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-500 border-t-4 shadow-lg mb-8" style={{ borderTopColor: '#1d4791' }}>
                    <CardHeader className="space-y-2 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold tracking-tight">Leave Application</CardTitle>
                            <Badge variant="outline" className="gap-1 bg-primary/5 text-primary">
                                <Sun className="h-3 w-3" /> Request
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Fill in the details below to submit your leave request.</p>

                        {/* Step Progress Indicator */}
                        <div className="mt-4 flex items-center gap-2">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex flex-1 items-center gap-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${currentStep >= step
                                        ? 'bg-primary text-primary-foreground shadow-md'
                                        : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                                    </div>
                                    {step < 3 && <div className={`h-0.5 flex-1 rounded-full transition-all ${currentStep > step ? 'bg-primary' : 'bg-muted'
                                        }`} />}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>Select Dates</span>
                            <span>Provide Reason</span>
                            <span>Submit</span>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submitApplication} className="space-y-8">
                            {/* Leave Balance Card - Redesigned for 5 days per year */}
                            <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-4 shadow-sm animate-in fade-in duration-300">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Annual Leave Balance</p>
                                        <p className="text-3xl font-bold tracking-tight" style={{ color: '#1d4791' }}>
                                            {LEAVE_BALANCE.remaining}
                                            <span className="text-base font-normal text-muted-foreground"> / {LEAVE_BALANCE.total} days</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">Resets every year on Jan 1</p>
                                    </div>
                                    <div className="rounded-full bg-secondary/10 p-2">
                                        <AlertCircle className="h-5 w-5 text-secondary" style={{ color: '#d85e39' }} />
                                    </div>
                                </div>
                                <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(LEAVE_BALANCE.used / LEAVE_BALANCE.total) * 100}%`,
                                            backgroundColor: '#d85e39'
                                        }}
                                    />
                                </div>
                                {exceedsBalance && (
                                    <div className="mt-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive flex items-center gap-2">
                                        <AlertCircle className="h-3.5 w-3.5" />
                                        <span>Requested {daysCount} days exceeds your available balance ({LEAVE_BALANCE.remaining} days). Please reduce the duration.</span>
                                    </div>
                                )}
                            </div>

                            {/* Date Range Field */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-1">
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                    <span>Period Range</span>
                                    <span className="text-destructive">*</span>
                                </Label>

                                {/* Quick shortcuts - 1,2,3,4 days & 1 week */}
                                <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4].map((days) => (
                                        <Button
                                            key={`${days}day`}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setQuickRange(days)}
                                            disabled={processing}
                                            className="h-8 px-3 text-xs transition-all hover:border-secondary hover:bg-secondary/10"
                                        >
                                            {days} day{days !== 1 ? 's' : ''}
                                        </Button>
                                    ))}
                                    {/* <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setQuickRange(7)}
                                        disabled={processing}
                                        className="h-8 px-3 text-xs transition-all hover:border-secondary hover:bg-secondary/10"
                                    >
                                        1 week
                                    </Button> */}
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-11 w-full justify-start rounded-xl border-2 px-3 font-normal transition-all focus:border-primary focus:ring-1 focus:ring-primary"
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
                                            numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                                            disabled={(date) => processing}
                                            className="rounded-md [&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_range_middle]:bg-primary/20"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                    <div className="flex gap-3 text-muted-foreground">
                                        <span>Start: {data.leave_start ? format(new Date(data.leave_start), "LLL dd, y") : '—'}</span>
                                        <span>End: {data.leave_end ? format(new Date(data.leave_end), "LLL dd, y") : '—'}</span>
                                    </div>
                                    {daysCount > 0 && (
                                        <Badge variant="secondary" className="gap-1" style={{ backgroundColor: '#d85e39', color: 'white' }}>
                                            {daysCount} day{daysCount !== 1 ? 's' : ''}
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {errors.leave_start && <InputError message={errors.leave_start} />}
                                    {errors.leave_end && <InputError message={errors.leave_end} />}
                                </div>
                            </div>

                            {/* Reason Field */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-1">
                                    <FileTextIcon className="h-4 w-4 text-primary" />
                                    <span>Reason for Leave</span>
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    value={data.reason_to_leave}
                                    onChange={e => setData('reason_to_leave', e.target.value)}
                                    placeholder="Please provide a detailed reason for your leave request..."
                                    className="min-h-[120px] resize-y transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                                    maxLength={1000}
                                    aria-invalid={!!errors.reason_to_leave}
                                    disabled={processing}
                                />
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{data.reason_to_leave.length}/1000 characters</span>
                                        <span>{Math.round((data.reason_to_leave.length / 1000) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-300"
                                            style={{
                                                width: `${(data.reason_to_leave.length / 1000) * 100}%`,
                                                backgroundColor: '#1d4791'
                                            }}
                                        />
                                    </div>
                                </div>
                                <InputError message={errors.reason_to_leave} />
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end mb-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                    className="w-full sm:w-auto transition-all hover:scale-105 hover:shadow-md"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !isFormValid}
                                    className="w-full sm:w-auto transition-all hover:scale-105 hover:shadow-md disabled:hover:scale-100"
                                    style={{ backgroundColor: '#1d4791' }}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Submit Leave Application
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Helpful footer */}
                <p className="text-center text-xs text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
                    Your leave request will be reviewed by your manager. You will receive an email notification.
                </p>
            </div>
        </AppLayout>
    );
}