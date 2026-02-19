import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import InputError from '@/components/input-error';
import { update } from '@/actions/App/Http/Controllers/EmployeeController';
import { useEffect, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Edit',
        href: '/employees/edit',
    },
];

interface Props {
    positions: any[];
    branches: any[];
    employee: any;
    site: any[];
}

export default function Update({ positions, branches, employee, site = [] }: Props) {
    const [availableSites, setAvailableSites] = useState<any[]>([]);
    const [positionSearch, setPositionSearch] = useState('');
    const [showPositionDropdown, setShowPositionDropdown] = useState(false);
    
    const { data, setData, put, processing, errors } = useForm({
        name: employee.user.name,
        email: employee.user.email,
        password: '',
        position_id: employee.position_id,
        branch_id: employee.branch_id,
        site_id: employee.site_id,
        employee_number: employee.employee_number,
        emergency_contact_number: employee.emergency_contact_number,
        department: employee.department,
        employee_status: employee.employee_status,
    });

    // Set initial position search value
    useEffect(() => {
        const selectedPos = positions?.find(p => p.id === parseInt(data.position_id));
        if (selectedPos) {
            setPositionSearch(selectedPos.pos_name);
        }
    }, []);

    useEffect(() => {
        if (data.branch_id) {
            const filteredSites = site.filter(
                (site: any) => site.branch_id === parseInt(data.branch_id)
            );
            setAvailableSites(filteredSites);
        } else {
            setAvailableSites([]);
        }
    }, [data.branch_id]);

    // Filter positions based on search, limit to 5
    const filteredPositions = positions
        ?.filter(position => 
            position.pos_name.toLowerCase().includes(positionSearch.toLowerCase())
        )
        .slice(0, 5);

    const selectedPosition = positions?.find(p => p.id === parseInt(data.position_id));

    const handlePhoneChange = (field: 'employee_number' | 'emergency_contact_number', value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        setData(field, digits ? `+63${digits}` : '');
    };

    const getDisplayValue = (field: 'employee_number' | 'emergency_contact_number') => {
        return data[field] ? data[field].replace('+63', '') : '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(update(employee.id).url);
    };

    const selectPosition = (positionId: string, positionName: string) => {
        setData('position_id', positionId);
        setPositionSearch(positionName);
        setShowPositionDropdown(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Employee" />

            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Edit Employee</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - User Details */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">User Details</h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        className="w-full"
                                        placeholder="Enter full name"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full"
                                        placeholder="Enter email address"
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className="w-full"
                                        placeholder="Leave blank to keep current"
                                    />
                                    <p className="text-xs text-gray-500">Leave empty if no change</p>
                                    <InputError message={errors.password} />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Employee Details */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">Employee Details</h2>

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
                                    <select
                                        id="department"
                                        value={data.department}
                                        onChange={e => setData('department', e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        <option value="">Select a Department</option>
                                        <option value="weekender">Weekender</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="semi_monthly">Semi-Monthly</option>
                                    </select>
                                    <InputError message={errors.department} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position_id">Position <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <div 
                                            className="flex items-center border border-input rounded-md cursor-pointer"
                                            onClick={() => setShowPositionDropdown(!showPositionDropdown)}
                                        >
                                            <div className="flex-1 px-3 py-2 text-sm">
                                                {selectedPosition?.pos_name || 'Select a Position'}
                                            </div>
                                            <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                                        </div>
                                        
                                        {showPositionDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-input rounded-md shadow-lg">
                                                <div className="p-2 border-b">
                                                    <div className="relative">
                                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input
                                                            value={positionSearch}
                                                            onChange={(e) => setPositionSearch(e.target.value)}
                                                            placeholder="Search positions..."
                                                            className="pl-8"
                                                            autoFocus
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-60 overflow-auto">
                                                    {filteredPositions.length > 0 ? (
                                                        filteredPositions.map((position) => (
                                                            <div
                                                                key={position.id}
                                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                                onClick={() => selectPosition(position.id.toString(), position.pos_name)}
                                                            >
                                                                {position.pos_name}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-gray-500">
                                                            No positions found
                                                        </div>
                                                    )}
                                                    {filteredPositions.length === 5 && (
                                                        <div className="px-3 py-2 text-xs text-gray-400 border-t">
                                                            Showing top 5 results
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <InputError message={errors.position_id} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="employee_status">Status <span className="text-red-500">*</span></Label>
                                    <select
                                        id="employee_status"
                                        value={data.employee_status}
                                        onChange={e => setData('employee_status', e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
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
                            {processing ? 'Updating...' : 'Update Employee'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>

            {/* Click outside to close dropdown */}
            {showPositionDropdown && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setShowPositionDropdown(false)}
                />
            )}
        </AppLayout>
    );
}