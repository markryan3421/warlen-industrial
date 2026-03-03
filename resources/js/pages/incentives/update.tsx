import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Update Incentive',
        href: '/incentives/update',
    },
];

interface Employee {
    id: number;
    emp_code: string | number | null;
    user?: { name: string } | null;
}

interface Incentive {
    id: number;
    payroll_period_id: number;
    incentive_name: string;
    incentive_amount: string | number;
    employees?: Employee[]; // Add this if the relationship is loaded
}

interface Props {
    payroll_periods?: Array<{ id: number; name: string; start_date?: string; end_date?: string }>;
    employees?: Employee[];
    incentive: Incentive;
}

export default function Update({ payroll_periods = [], employees = [], incentive }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get initial selected employee IDs from the incentive's employees
    const initialEmployeeIds = incentive.employees?.map(emp => emp.id) || [];

    const { data, setData, put, processing, errors } = useForm({
        incentive_name: incentive.incentive_name || '',
        incentive_amount: incentive.incentive_amount || '',
        payroll_period_id: incentive.payroll_period_id || '',
        employee_ids: initialEmployeeIds,
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/incentives/${incentive.id}`); // Fix: Use correct URL with ID
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter(emp => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const code = emp.emp_code ? String(emp.emp_code).toLowerCase() : '';
        const name = emp.user?.name?.toLowerCase() || '';
        return code.includes(term) || name.includes(term);
    });

    // Show first 10 if no search, otherwise show all filtered
    const displayedEmployees = searchTerm ? filteredEmployees : filteredEmployees.slice(0, 10);

    const toggleEmployee = (id: number) => {
        setData('employee_ids',
            data.employee_ids.includes(id)
                ? data.employee_ids.filter(eId => eId !== id)
                : [...data.employee_ids, id]
        );
    };

    const removeEmployee = (id: number) => {
        setData('employee_ids', data.employee_ids.filter(eId => eId !== id));
    };

    const selectedEmployees = employees.filter(emp => data.employee_ids.includes(emp.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Update Incentive" />
            <form onSubmit={submit} className="p-4 w-1/2">
                {/* Incentive Name */}
                <div className="space-y-2">
                    <Label htmlFor="incentive_name">Incentive Name <span className="text-red-500">*</span></Label>
                    <Input
                        id="incentive_name"
                        value={data.incentive_name}
                        onChange={e => setData('incentive_name', e.target.value)}
                        placeholder="Enter incentive name"
                    />
                    <InputError message={errors.incentive_name} />
                </div>

                {/* Incentive Amount */}
                <div className="space-y-2 mt-4">
                    <Label htmlFor="incentive_amount">Incentive Amount <span className="text-red-500">*</span></Label>
                    <Input
                        type='number'
                        id="incentive_amount"
                        value={data.incentive_amount}
                        onChange={e => setData('incentive_amount', e.target.value)}
                        placeholder="Enter incentive amount"
                    />
                    <InputError message={errors.incentive_amount} />
                </div>

                {/* Payroll Period */}
                <div className="space-y-2 mt-4">
                    <Label htmlFor="payroll_period_id">Payroll Period <span className="text-red-500">*</span></Label>
                    <select
                        id="payroll_period_id"
                        value={data.payroll_period_id}
                        onChange={e => {
                            console.log('Selected payroll period:', e.target.value);
                            setData('payroll_period_id', Number(e.target.value)); // Convert to number
                        }}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Select Payroll Period</option>
                        {payroll_periods.map(period => (
                            <option key={period.id} value={period.id}>
                                {period.name || `${period.start_date} to ${period.end_date}`}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.payroll_period_id} />
                </div>

                {/* Employee Selection */}
                <div className="space-y-2 mt-4" ref={dropdownRef}>
                    <Label>Select Employees <span className="text-red-500">*</span></Label>

                    {/* Selected Tags */}
                    {selectedEmployees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 p-2 border rounded bg-gray-50">
                            {selectedEmployees.map(emp => (
                                <div key={emp.id} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-full text-sm">
                                    <span>{String(emp.emp_code || 'N/A')} - {emp.user?.name || 'No name'}</span>
                                    <button type="button" onClick={() => removeEmployee(emp.id)} className="hover:text-blue-600">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Dropdown */}
                    <div className="relative">
                        <div
                            className="flex items-center border rounded cursor-pointer p-2"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            <span className="flex-1">
                                {data.employee_ids.length === 0 ? 'Select employees...' : `${data.employee_ids.length} selected`}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                        </div>

                        {isOpen && (
                            <div className="absolute z-10 w-full mt-1 border rounded bg-white shadow-lg max-h-80 overflow-y-auto">
                                <div className="p-2 sticky top-0 bg-white border-b">
                                    <div className="flex items-center border rounded px-2">
                                        <Search className="h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full p-1 outline-none"
                                            onClick={e => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="py-1">
                                    {displayedEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                            onClick={() => toggleEmployee(emp.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.employee_ids.includes(emp.id)}
                                                onChange={() => {}}
                                                className="rounded"
                                            />
                                            <span>{String(emp.emp_code || 'N/A')} - {emp.user?.name || 'No name'}</span>
                                        </div>
                                    ))}

                                    {!searchTerm && employees.length > 10 && (
                                        <div className="p-2 text-center text-sm text-gray-500 border-t">
                                            Showed 10 of {employees.length}. Type to search more.
                                        </div>
                                    )}

                                    {searchTerm && displayedEmployees.length === 0 && (
                                        <div className="p-4 text-center text-gray-500">No employees found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <InputError message={errors.employee_ids} />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Updating...' : 'Update Incentive'}
                    </Button>
                    <Link href="/incentives">
                        <Button variant='outline' type="button">Cancel</Button>
                    </Link>
                </div>
            </form>
        </AppLayout>
    );
}