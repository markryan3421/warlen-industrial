import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface Employee {
    id: number;
    emp_code: string;
    employee_number: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
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

export default function Edit({ applicationLeave }: EditProps) {
    const { data, setData, errors, processing, put } = useForm<FormData>({
        leave_start: applicationLeave.leave_start || '',
        leave_end: applicationLeave.leave_end || '',
        reason_to_leave: applicationLeave.reason_to_leave || '',
        app_status: applicationLeave.app_status || '',
        remarks: applicationLeave.remarks || '',
    });


    function submitApplication(e: React.FormEvent) {
        e.preventDefault();
        put(update(applicationLeave.slug_app).url);
    }

    // Handle checkbox change explicitly
    // const handleApprovedChange = (checked: boolean | 'indeterminate') => {
    //     setData('is_approved', checked === true);
    // };

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split('T')[0];

    // Format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Leave Application" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Leave Application</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Employee Information Display Section - Read Only */}
                        {applicationLeave.employee && (
                            <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
                                <h3 className="text-lg font-semibold mb-3 text-primary">Employee Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium">Full Name</label>
                                        <p className="font-semibold text-base">
                                            {applicationLeave.employee.user?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium">Employee Code</label>
                                        <p className="font-medium">
                                            {applicationLeave.employee.emp_code || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium">Employee Number</label>
                                        <p className="font-medium">
                                            {applicationLeave.employee.employee_number || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium">Email Address</label>
                                        <p className="font-medium">
                                            {applicationLeave.employee.user?.email || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={submitApplication} className="space-y-6">
                            <div className="space-y-4">
                                {/* Leave Details Section - Read Only Display */}
                                <div className="mb-4 p-4 bg-muted/10 rounded-lg">
                                    <h3 className="text-md font-semibold mb-3 text-muted-foreground">Leave Request Details</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Leave Start Date - Read Only */}
                                        <div>
                                            <label className="text-sm font-medium mb-2 block text-muted-foreground">
                                                Leave Start Date
                                            </label>
                                            <div className="p-2 bg-background border rounded-md">
                                                {formatDate(data.leave_start)}
                                            </div>
                                        </div>

                                        {/* Leave End Date - Read Only */}
                                        <div>
                                            <label className="text-sm font-medium mb-2 block text-muted-foreground">
                                                Leave End Date
                                            </label>
                                            <div className="p-2 bg-background border rounded-md">
                                                {formatDate(data.leave_end)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason for Leave - Read Only */}
                                    <div className="mt-4">
                                        <label className="text-sm font-medium mb-2 block text-muted-foreground">
                                            Reason for Leave
                                        </label>
                                        <div className="p-3 bg-background border rounded-md min-h-[80px] whitespace-pre-wrap">
                                            {data.reason_to_leave || 'No reason provided'}
                                        </div>
                                    </div>
                                </div>

                                {/* Approval Status Section - Editable */}
                                <div className="border-t pt-4 mt-4">
                                    <CardTitle className="text-lg mb-4">Approval Information</CardTitle>
                                    <div className="space-y-2 w-1/2">
                                        <Label htmlFor="pay_frequency">Application Leave Status<span className="text-red-500">*</span></Label>
                                        <select id="pay_frequency" value={data.app_status} onChange={e => setData('app_status', e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                            <option value="">Select a Status</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <InputError message={errors.app_status} />
                                    </div>

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
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4 border-t">
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
                                    className="min-w-[150px]"
                                >
                                    {processing ? 'Updating...' : 'Update Status'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}