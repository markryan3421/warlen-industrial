import { Head, useForm } from '@inertiajs/react';
import { store } from '@/actions/App/Http/Controllers/HrRole/HRApplicationLeaveController';
import InputError from '@/components/input-error';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import AppLayout from '@/layouts/hr-layout';
import { type BreadcrumbItem } from '@/types';
// import { Textarea } from "@/components/ui/textarea";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leave Applications',
        href: '/hr/application-leave',
    },
    {
        title: 'Create Leave Application',
        href: '/hr/application-leave/create',
    },
];

interface FormData {
    leave_start: string;
    leave_end: string;
    reason_to_leave: string;
}

export default function Create() {
    const { data, setData, errors, processing, post } = useForm<FormData>({
        leave_start: '',
        leave_end: '',
        reason_to_leave: '',
    });

    function submitApplication(e: React.FormEvent) {
        e.preventDefault();
        post(store().url);
    }

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Leave Application" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Leave Application</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitApplication} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Leave Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={data.leave_start}
                                        onChange={e => setData('leave_start', e.target.value)}
                                        min={today}
                                        className="w-full"
                                    />
                                    <InputError message={errors.leave_start} />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Leave End Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={data.leave_end}
                                        onChange={e => setData('leave_end', e.target.value)}
                                        min={data.leave_start || today}
                                        className="w-full"
                                    />
                                    <InputError message={errors.leave_end} />
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Reason for Leave
                                    </label>
                                    <textarea
                                        value={data.reason_to_leave}
                                        onChange={e => setData('reason_to_leave', e.target.value)}
                                        placeholder="Enter your reason for leave"
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        maxLength={1000}
                                    />
                                    <div className="text-sm text-muted-foreground mt-1 flex justify-between">
                                        <span>{data.reason_to_leave.length}/1000 characters</span>
                                        {data.reason_to_leave.length > 0 && (
                                            <span className={data.reason_to_leave.length >= 1000 ? 'text-destructive' : ''}>
                                                {1000 - data.reason_to_leave.length} remaining
                                            </span>
                                        )}
                                    </div>
                                    <InputError message={errors.reason_to_leave} />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'Submitting...' : 'Submit Leave Application'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}