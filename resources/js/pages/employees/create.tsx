import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import InputError from '@/components/input-error';
import { store } from '@/actions/App/Http/Controllers/EmployeeController';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Create',
        href: '/employees/create',
    },
];

interface Props {
    positions: any[];
    branches: any[];
    sites: any[];
}

export default function Create({ positions, branches, sites = [] }: Props) {
    const [availableSites, setAvailableSites] = useState<any[]>([]);
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        position_id: '',
        branch_id: '',
        site_id: '',
        employee_number: '',
        emergency_contact_number: '',
        department: 'monthly',
        employee_status: 'active',
    });

    useEffect(() => {
        if (data.branch_id) {
            const filteredSites = sites.filter(
                (site: any) => site.branch_id === parseInt(data.branch_id)
            );
            setAvailableSites(filteredSites);
        } else {
            setAvailableSites([]);
        }
        // setData('site_id', '');
    }, [data.branch_id]);

    const handlePhoneChange = (field: 'employee_number' | 'emergency_contact_number', value: string) => {
        // Remove non-digits, limit to 10 digits
        const digits = value.replace(/\D/g, '').slice(0, 10);
        // Store with +63 prefix if there are digits
        setData(field, digits ? `+63${digits}` : '');
    };

    // Extract digits for display (remove +63 prefix)
    const getDisplayValue = (field: 'employee_number' | 'emergency_contact_number') => {
        return data[field] ? data[field].replace('+63', '') : '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />

            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Create New Employee</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">User Details</h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                    <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full" placeholder="Enter full name" />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                    <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full" placeholder="Enter email address" />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                    <Input id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full" placeholder="Enter password" />
                                    <InputError message={errors.password} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold pb-2">Employee Details</h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="employee_number">Employee Number <span className="text-red-500">*</span></Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                            +63
                                        </span>
                                        <Input
                                            id="employee_number"
                                            type="text"
                                            value={getDisplayValue('employee_number')}
                                            onChange={e => handlePhoneChange('employee_number', e.target.value)}
                                            className="w-full rounded-l-none"
                                            placeholder="XXX XXX XXXX"
                                            maxLength={10}
                                        />
                                    </div>
                                    <InputError message={errors.employee_number} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
                                    <select id="department" value={data.department} onChange={e => setData('department', e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                        <option value="">Select a Department</option>
                                        <option value="weekender">Weekender</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="semi_monthly">Semi-Monthly</option>
                                    </select>
                                    <InputError message={errors.department} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position_id">Position <span className="text-red-500">*</span></Label>
                                    <select id="position_id" value={data.position_id} onChange={e => setData('position_id', e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                        <option value="">Select a Position</option>
                                        {positions?.map((position) => (
                                            <option key={position.id} value={position.id}>
                                                {position.pos_name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.position_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employee_status">Status <span className="text-red-500">*</span></Label>
                                    <select id="employee_status" value={data.employee_status} onChange={e => setData('employee_status', e.target.value)} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <InputError message={errors.employee_status} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="emergency_contact_number">Emergency Contact</Label>
                                    <div className="flex">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                            +63
                                        </span>
                                        <Input
                                            id="emergency_contact_number"
                                            type="text"
                                            value={getDisplayValue('emergency_contact_number')}
                                            onChange={e => handlePhoneChange('emergency_contact_number', e.target.value)}
                                            className="w-full rounded-l-none"
                                            placeholder="XXX XXX XXXX"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Location Assignment</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="branch_id">Branch <span className="text-red-500">*</span></Label>
                                <select
                                    id="branch_id"
                                    value={data.branch_id}
                                    onChange={e => setData('branch_id', e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                >
                                    <option value="">Select a Branch</option>
                                    {branches?.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.branch_name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.branch_id} />
                            </div>

                            {data.branch_id && (
                                <div className="space-y-2">
                                    <Label htmlFor="site_id">Site <span className="text-red-500">*</span></Label>
                                    <select
                                        id="site_id"
                                        value={data.site_id}
                                        onChange={e => setData('site_id', e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        <option value="">Select a Site</option>
                                        {availableSites?.map((site) => (
                                            <option key={site.id} value={site.id}>
                                                {site.site_name || site.name}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.site_id} />
                                    {availableSites.length === 0 && (
                                        <p className="text-sm text-amber-600 mt-1">
                                            No sites available for this branch
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Employee'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}