import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { update } from '@/actions/App/Http/Controllers/PayrollPeriodController';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Periods',
        href: '/payroll-periods',
    },
    {
        title: 'Edit Payroll Period',
        href: '/payroll-period/edit',
    },
];

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

interface PageProps {
    payroll_period_enums: {
        statuses: Array<{
            value: string;
            label: string;
        }>;
    };
}

export default function Edit({ payrollPeriod }: EditProps) {
    const { payroll_period_enums } = usePage<{ payroll_period_enums: PageProps['payroll_period_enums'] }>().props;

    const { data, setData, errors, processing, put } = useForm<FormData>({
        start_date: payrollPeriod.start_date || '',
        end_date: payrollPeriod.end_date || '',
        pay_date: payrollPeriod.pay_date || '',
        payroll_per_status: payrollPeriod.payroll_per_status || '',
    });

    function submitPayrollPeriod(e: React.FormEvent) {
        e.preventDefault();
        put(update(payrollPeriod.id).url);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Payroll Period" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Payroll Period Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitPayrollPeriod} className="space-y-6">
                            <div className="space-y-4">
                                {/* Start Date */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={data.start_date}
                                        onChange={e => setData('start_date', e.target.value)}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>

                                {/* End Date */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        End Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={data.end_date}
                                        onChange={e => setData('end_date', e.target.value)}
                                    />
                                    <InputError message={errors.end_date} />
                                </div>

                                {/* Pay Date */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Pay Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={data.pay_date}
                                        onChange={e => setData('pay_date', e.target.value)}
                                    />
                                    <InputError message={errors.pay_date} />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Status
                                    </label>
                                    <select
                                        value={data.payroll_per_status}
                                        onChange={e => setData('payroll_per_status', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="" disabled>Select a status</option>
                                        {payroll_period_enums.map(({ value, label }) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.payroll_per_status} />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'Updating...' : 'Update Payroll Period'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}