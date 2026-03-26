import { Head, Link, useForm } from '@inertiajs/react';
import { SectionCards } from '@/components/section-cards';
import { ChartAreaInteractive } from '@/components/section-chart';
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { StaticTable } from '@/components/static-table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // Import Switch component

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Update Position',
        href: '/positions/update',
    },
];

interface Position {
    pos_slug: string;
    id: number;
    pos_name: string;
    basic_salary: number;
    is_salary_fixed: boolean;
}

interface PageProps {
    position: Position;
}

export default function Update({ position }: PageProps) {
    const { data, setData, put, processing, errors } = useForm({
        pos_name: position.pos_name,
        basic_salary: position.basic_salary,
        is_salary_fixed: position.is_salary_fixed,
    })
    
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/positions/${position.pos_slug}`);
    };

    // Handle salary toggle
    const handleSalaryToggle = (checked: boolean) => {
        setData('is_salary_fixed', checked);
        if (checked) {
            console.log('Salary is now fixed');
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Update Position" />
            <form onSubmit={submit}>
                <div className="p-4 w-1/2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                        <Input 
                            id="name" 
                            value={data.pos_name} 
                            onChange={e => setData('pos_name', e.target.value)} 
                            className="w-full" 
                            placeholder="Enter position name" 
                        />
                        <InputError message={errors.pos_name} />
                    </div>
                    
                    {/* Toggle Button for Fixed Salary */}
                    <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="salary-fixed">Fixed Salary</Label>
                            <Switch
                                id="salary-fixed"
                                checked={data.is_salary_fixed}
                                onCheckedChange={handleSalaryToggle}
                            />
                        </div>
                        <p className="text-sm text-gray-500">
                            Toggle on if this position has a fixed salary amount
                        </p>
                    </div>

                    <div className="space-y-2 mt-4">
                        <Label htmlFor="basic-salary">
                            Basic Salary <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                            type='number' 
                            value={data.basic_salary} 
                            onChange={e => setData('basic_salary', e.target.value)} 
                            className="w-full" 
                            placeholder="Enter basic salary" 
                            min={1}
                            step={data.is_salary_fixed ? "1" : "0.01"}
                        />
                        <InputError message={errors.basic_salary} />
                        {data.is_salary_fixed && (
                            <p className="text-sm text-blue-500">
                                Note: This salary is fixed for this position
                            </p>
                        )}
                    </div>
                    
                    <div className="flex justify-right gap-2 mt-4">
                        <Button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Updating...' : 'Submit'}
                        </Button>
                        <Link href={'/positions'}>
                            <Button variant='outline'>Cancel</Button>
                        </Link>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}