import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { update } from '@/actions/App/Http/Controllers/ApplicationLeaveController';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Leave Applications',
        href: '/application-leave',
    },
    {
        title: 'Edit Leave Application',
        href: '/application-leave/edit',
    },
];

interface FormData {
    leave_start: string;
    leave_end: string;
    reason_to_leave: string;
    is_approved: boolean;
    remarks: string;
}

interface EditProps {
    applicationLeave: {
        id: number;
        leave_start: string;
        leave_end: string;
        reason_to_leave: string;
        is_approved: boolean;
        remarks: string;
    };
}

export default function Edit({ applicationLeave }: EditProps) {
    const { data, setData, errors, processing, put, transform } = useForm<FormData>({
        leave_start: applicationLeave.leave_start || '',
        leave_end: applicationLeave.leave_end || '',
        reason_to_leave: applicationLeave.reason_to_leave || '',
        is_approved: applicationLeave.is_approved,
        remarks: applicationLeave.remarks || '',
    });

    // Transform the data before submission to ensure is_approved is properly formatted
    transform((formData) => ({
        ...formData,
        is_approved: formData.is_approved ? 1 : 0, // Convert boolean to integer for backend
    }));

    function submitApplication(e: React.FormEvent) {
        e.preventDefault();
        put(update(applicationLeave.id).url);
    }

    // Handle checkbox change explicitly
    const handleApprovedChange = (checked: boolean | 'indeterminate') => {
        setData('is_approved', checked === true);
    };

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Leave Application" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Leave Application</CardTitle>
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

                                {/* Approval Status Section */}
                                <div className="border-t pt-4 mt-4">
                                    <CardTitle className="text-lg mb-4">Approval Information</CardTitle>
                                    
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Checkbox
                                            id="is_approved"
                                            checked={data.is_approved}
                                            onCheckedChange={handleApprovedChange}
                                        />
                                        <Label 
                                            htmlFor="is_approved" 
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Approved
                                        </Label>
                                    </div>
                                    <InputError message={errors.is_approved} />

                                    <div className="mt-4">
                                        <label className="text-sm font-medium mb-2 block">
                                            Remarks
                                        </label>
                                        <textarea
                                            value={data.remarks}
                                            onChange={e => setData('remarks', e.target.value)}
                                            placeholder="Enter any remarks or comments"
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            maxLength={500}
                                        />
                                        <div className="text-sm text-muted-foreground mt-1 flex justify-between">
                                            <span>{data.remarks.length}/500 characters</span>
                                            {data.remarks.length > 0 && (
                                                <span className={data.remarks.length >= 500 ? 'text-destructive' : ''}>
                                                    {500 - data.remarks.length} remaining
                                                </span>
                                            )}
                                        </div>
                                        <InputError message={errors.remarks} />
                                    </div>
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
                                    {processing ? 'Updating...' : 'Update Leave Application'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}