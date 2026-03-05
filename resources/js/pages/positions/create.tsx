import { Head, Link, useForm } from '@inertiajs/react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { StaticTable } from '@/components/static-table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

import { Label, } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Create Position',
        href: '/positions/create',
    },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        pos_name: '',
        basic_salary: '',
    })
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/positions');
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <form onSubmit={submit}>
            <div className="p-4 w-1/2">
                <div className="space-y-2 ">
                    <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                    <Input id="name" value={data.pos_name} onChange={e => setData('pos_name', e.target.value)} className="w-full" placeholder="Enter position name" />
                    <InputError message={errors.pos_name} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Basic Salary <span className="text-red-500">*</span></Label>
                    <Input type='number' value={data.basic_salary} onChange={e => setData('basic_salary', e.target.value)} className="w-full" placeholder="Enter basic salary" min={1} />
                    <InputError message={errors.basic_salary} />
                </div>
                <div className="flex justify-right gap-2 mt-4">
                    <Button type="submit" onClick={submit} className="btn btn-primary">Create</Button>
                    <Link href={'/positions'} ><Button variant='outline'>Cancel</Button></Link>
                </div>

            </div>
            </form>
        </AppLayout>
    );
}
