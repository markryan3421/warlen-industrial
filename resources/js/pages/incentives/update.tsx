import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Users, UserCheck, AlertTriangle } from 'lucide-react';
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
    employees?: Employee[];
}

interface Props {
    payroll_periods?: Array<{ id: number; name: string; start_date?: string; end_date?: string }>;
    employees?: Employee[];
    incentive: Incentive;
}

export default function Update({ payroll_periods = [], employees = [], incentive }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showAllEmployeesModal, setShowAllEmployeesModal] = useState(false);
    const [showRemoveAllConfirmation, setShowRemoveAllConfirmation] = useState(false);
    const [showClearAllConfirmation, setShowClearAllConfirmation] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get initial selected employee IDs from the incentive's employees
    const initialEmployeeIds = incentive.employees?.map(emp => emp.id) || [];

    const { data, setData, put, processing, errors } = useForm({
        incentive_name: incentive.incentive_name || '',
        incentive_amount: incentive.incentive_amount || '',
        payroll_period_id: incentive.payroll_period_id || '',
        employee_ids: initialEmployeeIds,
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

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
        put(`/incentives/${incentive.id}`);
    };

    // Filter employees based on search
    const filteredEmployees = employees.filter(emp => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const code = emp.emp_code ? String(emp.emp_code).toLowerCase() : '';
        const name = emp.user?.name?.toLowerCase() || '';
        return code.includes(term) || name.includes(term);
    });

    // Show first 5 if no search, otherwise show all filtered
    const displayedEmployees = searchTerm ? filteredEmployees : filteredEmployees.slice(0, 5);

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

    const selectAll = () => {
        const allEmployeeIds = filteredEmployees.map(emp => emp.id);
        setData('employee_ids', allEmployeeIds);
    };

    const removeAll = () => {
        setData('employee_ids', []);
        setShowRemoveAllConfirmation(false);
        setShowClearAllConfirmation(false);
    };

    const selectedEmployees = employees.filter(emp => data.employee_ids.includes(emp.id));
    const allFilteredSelected = filteredEmployees.length > 0 &&
        filteredEmployees.every(emp => data.employee_ids.includes(emp.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Update Incentive" />
            <form onSubmit={submit} className="p-4">
                {/* Two Column Layout */}
                <div className="flex gap-6">
                    {/* Left Column - Incentive Details */}
                    <div className="w-1/2 space-y-4">
                        <h2 className="text-lg font-semibold mb-4">Incentive Details</h2>

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
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                            <Label htmlFor="payroll_period_id">Payroll Period <span className="text-red-500">*</span></Label>
                            <select
                                id="payroll_period_id"
                                value={data.payroll_period_id}
                                onChange={e => {
                                    console.log('Selected payroll period:', e.target.value);
                                    setData('payroll_period_id', e.target.value);
                                }}
                                className="w-full p-2 border rounded"
                            >
                                <option value="">Select Payroll Period</option>
                                {payroll_periods.map(period => (
                                    <option key={period.id} value={period.id}>
                                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.payroll_period_id} />
                        </div>
                    </div>

                    {/* Right Column - Employee Selection */}
                    <div className="w-1/2 space-y-4" ref={dropdownRef}>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold mb-2">Employee Selection</h2>
                            </div>

                            {/* Selected Tags - Only show first 5, rest in modal */}
                            {selectedEmployees.length > 0 && (
                                <div className="mb-3">
                                    {/* Selected count indicator */}
                                    <div className="text-xs text-gray-500 mb-1">
                                        {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                                    </div>

                                    {/* Selected tags - max 5 displayed */}
                                    <div className="flex flex-wrap gap-1.5 p-2 border rounded bg-gray-50 min-h-[40px]">
                                        {selectedEmployees.slice(0, 5).map(emp => (
                                            <div key={emp.id} className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded text-xs border border-blue-200">
                                                <span className="max-w-[150px] truncate">
                                                    {String(emp.user?.name || 'N/A')}
                                                </span>
                                                <button type="button" onClick={() => removeEmployee(emp.id)} className="text-blue-600 hover:text-blue-800">
                                                    <X className="h-2.5 w-2.5" />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Show more indicator */}
                                        {selectedEmployees.length > 5 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAllEmployeesModal(true)}
                                                className="flex items-center gap-1 bg-gray-200 px-2 py-0.5 rounded text-xs hover:bg-gray-300 transition-colors"
                                            >
                                                <span>+{selectedEmployees.length - 5} more</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Beautiful Modal for viewing all selected employees */}
                            {showAllEmployeesModal && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAllEmployeesModal(false)}>
                                    <div
                                        className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* Modal Header */}
                                        <div className="px-6 py-4 border-b bg-gradient-to-r from-orange-50 to-orange-50">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-100 rounded-lg">
                                                        <Users className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-lg text-gray-900">Selected Employees</h3>
                                                        <p className="text-sm text-gray-500">{selectedEmployees.length} employees will receive this incentive</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowAllEmployeesModal(false)}
                                                    className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Modal Body */}
                                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                                            <div className="space-y-2">
                                                {selectedEmployees.map((emp, index) => (
                                                    <div
                                                        key={emp.id}
                                                        className="group flex items-center justify-between h-10 p-3 bg-white border rounded-lg hover:shadow-md transition-all duration-200 hover:border-orange-200"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-orange-100 to-orange-100 rounded-full text-sm font-medium">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-gray-900">{emp.user?.name || 'No name'}</span>
                                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                                                                        {String(emp.emp_code || 'N/A')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                removeEmployee(emp.id);
                                                                if (selectedEmployees.length === 1) {
                                                                    setShowAllEmployeesModal(false);
                                                                }
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200"
                                                            title="Remove employee"
                                                        >
                                                            <X className="h-4 w-4 text-red-500" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="px-6 py-4 border-t bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <UserCheck className="h-4 w-4 text-orange-600" />
                                                    <span className="text-sm text-gray-600">
                                                        <span className="font-semibold text-gray-900">{selectedEmployees.length}</span> selected
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setShowRemoveAllConfirmation(true)}
                                                        className="text-xs"
                                                        disabled={selectedEmployees.length === 0}
                                                    >
                                                        Remove All
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => setShowAllEmployeesModal(false)}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        Done
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Remove All Confirmation Modal */}
                            {showRemoveAllConfirmation && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowRemoveAllConfirmation(false)}>
                                    <div
                                        className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 bg-red-100 rounded-full">
                                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900">Remove All Employees</h3>
                                                    <p className="text-sm text-gray-500">Are you sure you want to remove all {selectedEmployees.length} selected employees?</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-6 pl-[68px]">
                                                This action cannot be undone. You will need to select employees again.
                                            </p>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowRemoveAllConfirmation(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        removeAll();
                                                        setShowAllEmployeesModal(false);
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Yes, Remove All
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dropdown */}
                            <div className="relative">
                                <span className="text-md text-gray-500">
                                    Choose who will receive this incentive
                                </span>
                                <div
                                    className="flex items-center border rounded cursor-pointer p-2 hover:bg-gray-50"
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

                                            {/* Quick Actions in Dropdown */}
                                            {filteredEmployees.length > 0 && (
                                                <div className="flex justify-between items-center mt-2 px-1">
                                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={allFilteredSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    selectAll();
                                                                } else {
                                                                    const filteredIds = filteredEmployees.map(emp => emp.id);
                                                                    setData('employee_ids',
                                                                        data.employee_ids.filter(id => !filteredIds.includes(id))
                                                                    );
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                        <span>Select all ({filteredEmployees.length})</span>
                                                    </label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowClearAllConfirmation(true)}
                                                        className="text-xs h-6 px-2"
                                                        disabled={data.employee_ids.length === 0}
                                                    >
                                                        Clear all
                                                    </Button>
                                                </div>
                                            )}
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
                                                        onChange={() => { }}
                                                        className="rounded"
                                                    />
                                                    <span>{String(emp.emp_code || 'N/A')} - {emp.user?.name || 'No name'}</span>
                                                </div>
                                            ))}

                                            {!searchTerm && employees.length > 5 && (
                                                <div className="p-2 text-center text-sm text-gray-500 border-t">
                                                    Showed 5 of {employees.length}. Type to search more.
                                                </div>
                                            )}

                                            {searchTerm && displayedEmployees.length === 0 && (
                                                <div className="p-4 text-center text-gray-500">No employees found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Clear All Confirmation Modal */}
                            {showClearAllConfirmation && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setShowClearAllConfirmation(false)}>
                                    <div
                                        className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 bg-yellow-100 rounded-full">
                                                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900">Clear All Selections</h3>
                                                    <p className="text-sm text-gray-500">Are you sure you want to clear all {data.employee_ids.length} selected employees?</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-6 pl-[68px]">
                                                This will remove all employees from your selection. You can select them again later.
                                            </p>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowClearAllConfirmation(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        removeAll();
                                                        setShowClearAllConfirmation(false);
                                                        setIsOpen(false);
                                                    }}
                                                    className="bg-yellow-600 hover:bg-yellow-700"
                                                >
                                                    Yes, Clear All
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <InputError message={errors.employee_ids} />
                        </div>
                    </div>
                </div>

                {/* Buttons - Full width at bottom */}
                <div className="flex gap-2 mt-6 pt-4">
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