import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import InputError from '@/components/input-error';
import { store, edit } from '@/actions/App/Http/Controllers/EmployeeController';

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
}

export default function Create({ positions, branches }: Props) {
    const { data, setData, submit, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        position_id: '',
        branch_id: '',
        employee_number: '',
        emergency_contact_number: '',
        department: 'monthly',
        employee_status: 'active',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submit(store());
    }
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Employee" />

            <div className="w-1/2 p-4">
                <h1 className="text-2xl font-bold mb-6">Create New Employee</h1>

                <form onSubmit={handleSubmit} className="">
                    <div className="">
                        <h2 className="">User Details</h2>

                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} className="" />
                            <InputError message={errors.name} />
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="" />
                            <InputError message={errors.email} />
                        </div>

                        <div>
                            <Label htmlFor="password">Password </Label>
                            <Input id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="" />
                            <InputError message={errors.password} />
                        </div>
                    </div>

                    <div className="">
                        <h2 className="">Employee Details</h2>
                        <div>
                            <Label htmlFor="employee_number">Employee Number </Label>
                            <Input id="employee_number" type="number" value={data.employee_number} onChange={e => setData('employee_number', e.target.value)} onInput={(e) => { e.target.value = e.target.value.slice(0, 11);}} />
                            <InputError message={errors.employee_number} />
                        </div>

                        <div>
                            <Label htmlFor="department">Department *</Label>
                            <select id="department" value={data.department} onChange={e => setData('department', e.target.value)} className="">
                                <option value="">Select a Department</option>
                                <option value="weekender">Weekender</option>
                                <option value="monthly">Monthly</option>
                                <option value="semi_monthly">Semi-Monthly</option>
                            </select>
                            <InputError message={errors.department} />
                        </div>

                        <div>
                            <Label htmlFor="position_id">Position *</Label>
                            <select id="position_id" value={data.position_id} onChange={e => setData('position_id', e.target.value)} className="">
                                <option value="">Select a Branch</option>
                                {positions?.map((position) => (
                                    <option key={position.id} value={position.id}>
                                        {position.pos_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.position_id} />
                        </div>

                        <div>
                            <Label htmlFor="branch_or_site_id">Branch/Site *</Label>
                            <select id="branch_or_site_id" value={data.branch_id} onChange={e => setData('branch_id', e.target.value)} className="">
                                <option value="">Select a Branch</option>
                                {branches?.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branch_name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.branch_id} />
                        </div>

                        <div>
                            <Label htmlFor="emergency_contact_number">Emergency Contact</Label>
                            <Input id="emergency_contact_number" type="number" value={data.emergency_contact_number} onChange={e => setData('emergency_contact_number', e.target.value)} onInput={(e) => { e.target.value = e.target.value.slice(0, 11);}} />
                        </div>

                        <div>
                            <Label htmlFor="employee_status">Status *</Label>
                            <select id="employee_status" value={data.employee_status} onChange={e => setData('employee_status', e.target.value)} className="">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <InputError message={errors.employee_status} />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
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