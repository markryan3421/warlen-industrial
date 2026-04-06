import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Update Deduction', href: '/deductions/update' }];

interface Employee {
    id: number;
    emp_code: string | number | null;
    user?: { name: string } | null;
}

interface Deduction {
    id: number;
    payroll_period_id: number;
    deduction_name: string;
    deduction_amount: string | number;
    employees?: Employee[];
}

interface Props {
    payroll_periods?: Array<{ id: number; start_date?: string; end_date?: string }>;
    employees?: Employee[];
    deduction: Deduction;
}

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

// Reusable Confirm Modal
function ConfirmModal({ open, onClose, onConfirm, title, description, note, confirmLabel, confirmClass }: {
    open: boolean; onClose: () => void; onConfirm: () => void;
    title: string; description: string; note: string;
    confirmLabel: string; confirmClass: string;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
                            <p className="text-sm text-gray-500">{description}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-6 pl-[68px]">{note}</p>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
                        <Button type="button" size="sm" onClick={onConfirm} className={confirmClass}>{confirmLabel}</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Update({ payroll_periods = [], employees = [], deduction }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [showAllModal, setShowAllModal] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data, setData, put, processing, errors } = useForm({
        deduction_name: deduction.deduction_name || '',
        deduction_amount: deduction.deduction_amount || '',
        payroll_period_id: deduction.payroll_period_id || '',
        employee_ids: deduction.employees?.map(e => e.id) ?? [] as number[],
    });

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredEmployees = employees.filter(emp => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return String(emp.emp_code ?? '').toLowerCase().includes(term) ||
            (emp.user?.name?.toLowerCase() ?? '').includes(term);
    });

    const displayedEmployees = searchTerm ? filteredEmployees : filteredEmployees.slice(0, 5);
    const selectedEmployees = employees.filter(emp => data.employee_ids.includes(emp.id));
    const allFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => data.employee_ids.includes(emp.id));

    const toggleEmployee = (id: number) =>
        setData('employee_ids', data.employee_ids.includes(id)
            ? data.employee_ids.filter(eId => eId !== id)
            : [...data.employee_ids, id]);

    const removeAll = () => {
        setData('employee_ids', []);
        setShowRemoveConfirm(false);
        setShowClearConfirm(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Update Deduction" />
            <form onSubmit={e => { e.preventDefault(); put(`/deductions/${deduction.id}`); }} className="p-4">
                <div className="flex gap-6">

                    {/* Left Column */}
                    <div className="w-1/2 space-y-4">
                        <h2 className="text-lg font-semibold">Deduction Details</h2>

                        <div className="space-y-2">
                            <Label htmlFor="deduction_name">Deduction Name <span className="text-red-500">*</span></Label>
                            <Input id="deduction_name" value={data.deduction_name} onChange={e => setData('deduction_name', e.target.value)} placeholder="Enter deduction name" />
                            <InputError message={errors.deduction_name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deduction_amount">Deduction Amount <span className="text-red-500">*</span></Label>
                            <Input type="number" id="deduction_amount" value={data.deduction_amount} onChange={e => setData('deduction_amount', e.target.value)} placeholder="Enter deduction amount" />
                            <InputError message={errors.deduction_amount} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payroll_period_id">Payroll Period <span className="text-red-500">*</span></Label>
                            <select id="payroll_period_id" value={data.payroll_period_id} onChange={e => setData('payroll_period_id', e.target.value)} className="w-full p-2 border rounded">
                                <option value="">Select Payroll Period</option>
                                {payroll_periods.map(p => (
                                    <option key={p.id} value={p.id}>{formatDate(p.start_date!)} - {formatDate(p.end_date!)}</option>
                                ))}
                            </select>
                            <InputError message={errors.payroll_period_id} />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-1/2 space-y-4" ref={dropdownRef}>
                        <h2 className="text-lg font-semibold">Employee Selection</h2>

                        {/* Selected Tags */}
                        {selectedEmployees.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-500 mb-1">{selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected</p>
                                <div className="flex flex-wrap gap-1.5 p-2 border rounded bg-gray-50 min-h-[40px]">
                                    {selectedEmployees.slice(0, 5).map(emp => (
                                        <div key={emp.id} className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded text-xs border border-blue-200">
                                            <span className="max-w-[150px] truncate">{emp.user?.name ?? 'N/A'}</span>
                                            <button type="button" onClick={() => setData('employee_ids', data.employee_ids.filter(id => id !== emp.id))} className="text-blue-600 hover:text-blue-800">
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedEmployees.length > 5 && (
                                        <button type="button" onClick={() => setShowAllModal(true)} className="bg-gray-200 px-2 py-0.5 rounded text-xs hover:bg-gray-300">
                                            +{selectedEmployees.length - 5} more
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* All Employees Modal */}
                        {showAllModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAllModal(false)}>
                                <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                                    <div className="px-6 py-4 border-b bg-orange-50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 rounded-lg"><Users className="h-5 w-5 text-orange-600" /></div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Selected Employees</h3>
                                                <p className="text-sm text-gray-500">{selectedEmployees.length} employees will have this deduction</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowAllModal(false)} className="p-2 hover:bg-orange-100 rounded-lg"><X className="h-5 w-5" /></button>
                                    </div>

                                    <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] space-y-2">
                                        {selectedEmployees.map((emp, i) => (
                                            <div key={emp.id} className="group flex items-center justify-between h-10 p-3 border rounded-lg hover:shadow-md hover:border-orange-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center justify-center w-7 h-7 bg-orange-100 rounded-full text-sm font-medium">{i + 1}</div>
                                                    <span className="font-medium">{emp.user?.name ?? 'No name'}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{emp.emp_code ?? 'N/A'}</span>
                                                </div>
                                                <button type="button" onClick={() => { setData('employee_ids', data.employee_ids.filter(id => id !== emp.id)); if (selectedEmployees.length === 1) setShowAllModal(false); }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all">
                                                    <X className="h-4 w-4 text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="h-4 w-4 text-orange-600" />
                                            <span className="text-sm"><span className="font-semibold">{selectedEmployees.length}</span> selected</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="destructive" size="sm" onClick={() => setShowRemoveConfirm(true)} disabled={selectedEmployees.length === 0}>Remove All</Button>
                                            <Button type="button" size="sm" onClick={() => setShowAllModal(false)} className="bg-blue-600 hover:bg-blue-700">Done</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirm Modals */}
                        <ConfirmModal
                            open={showRemoveConfirm}
                            onClose={() => setShowRemoveConfirm(false)}
                            onConfirm={() => { removeAll(); setShowAllModal(false); }}
                            title="Remove All Employees"
                            description={`Are you sure you want to remove all ${selectedEmployees.length} selected employees?`}
                            note="This action cannot be undone. You will need to select employees again."
                            confirmLabel="Yes, Remove All"
                            confirmClass="bg-red-600 hover:bg-red-700"
                        />
                        <ConfirmModal
                            open={showClearConfirm}
                            onClose={() => setShowClearConfirm(false)}
                            onConfirm={() => { removeAll(); setIsOpen(false); }}
                            title="Clear All Selections"
                            description={`Are you sure you want to clear all ${data.employee_ids.length} selected employees?`}
                            note="This will remove all employees from your selection. You can select them again later."
                            confirmLabel="Yes, Clear All"
                            confirmClass="bg-yellow-600 hover:bg-yellow-700"
                        />

                        {/* Dropdown */}
                        <div className="relative">
                            <p className="text-sm text-gray-500 mb-1">Choose employees to deduct</p>
                            <div className="flex items-center border rounded cursor-pointer p-2 hover:bg-gray-50" onClick={() => setIsOpen(!isOpen)}>
                                <span className="flex-1">{data.employee_ids.length === 0 ? 'Select employees...' : `${data.employee_ids.length} selected`}</span>
                                <ChevronDown className="h-4 w-4" />
                            </div>

                            {isOpen && (
                                <div className="absolute z-10 w-full mt-1 border rounded bg-white shadow-lg max-h-80 overflow-y-auto">
                                    <div className="p-2 sticky top-0 bg-white border-b">
                                        <div className="flex items-center border rounded px-2">
                                            <Search className="h-4 w-4 text-gray-400" />
                                            <input autoFocus type="text" placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onClick={e => e.stopPropagation()} className="w-full p-1 outline-none" />
                                        </div>
                                        {filteredEmployees.length > 0 && (
                                            <div className="flex justify-between items-center mt-2 px-1">
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input type="checkbox" checked={allFilteredSelected} className="rounded"
                                                        onChange={e => e.target.checked
                                                            ? setData('employee_ids', filteredEmployees.map(e => e.id))
                                                            : setData('employee_ids', data.employee_ids.filter(id => !filteredEmployees.map(e => e.id).includes(id)))
                                                        }
                                                    />
                                                    <span>Select all ({filteredEmployees.length})</span>
                                                </label>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setShowClearConfirm(true)} className="text-xs h-6 px-2" disabled={data.employee_ids.length === 0}>
                                                    Clear all
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="py-1">
                                        {displayedEmployees.map(emp => (
                                            <div key={emp.id} className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2" onClick={() => toggleEmployee(emp.id)}>
                                                <input type="checkbox" checked={data.employee_ids.includes(emp.id)} onChange={() => {}} className="rounded" />
                                                <span>{emp.emp_code ?? 'N/A'} - {emp.user?.name ?? 'No name'}</span>
                                            </div>
                                        ))}
                                        {!searchTerm && employees.length > 5 && (
                                            <p className="p-2 text-center text-sm text-gray-500 border-t">Showed 5 of {employees.length}. Type to search more.</p>
                                        )}
                                        {searchTerm && displayedEmployees.length === 0 && (
                                            <p className="p-4 text-center text-gray-500">No employees found</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <InputError message={errors.employee_ids} />
                    </div>
                </div>

                <div className="flex gap-2 mt-6 pt-4">
                    <Button type="submit" disabled={processing}>{processing ? 'Updating...' : 'Update Deduction'}</Button>
                    <Link href="/deductions"><Button variant="outline" type="button">Cancel</Button></Link>
                </div>
            </form>
        </AppLayout>
    );
}