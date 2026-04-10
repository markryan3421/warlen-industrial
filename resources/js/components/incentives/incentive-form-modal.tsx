// components/incentives/incentive-form-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Users, Pencil, Plus } from 'lucide-react';
import { EmployeeSelector } from './employee-selector';

interface Employee {
    id: number;
    emp_code: string | number | null;
    user?: { name: string } | null;
    name?: string;
}

interface PayrollPeriod {
    id: number;
    start_date: string;
    end_date: string;
    pay_date: string;
    payroll_per_status: string;
}

interface Incentive {
    id: number;
    incentive_name: string;
    incentive_amount: string | number;
    payroll_period_id?: number;
    payroll_period?: PayrollPeriod;
    employees?: Array<{ id: number }>;
}

interface IncentiveFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
    incentive?: Incentive | null;
    payroll_periods: PayrollPeriod[];
    employees: Employee[];
    formData: {
        incentive_name: string;
        incentive_amount: string;
        payroll_period_id: string;
        employee_ids: number[];
    };
    errors: Record<string, string>;
    processing: boolean;
    onDataChange: (key: string, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onShowEmployeeModal: () => void;
    getEmployeeName: (emp: Employee) => string;
    selectedEmployeesList: Employee[];
}

export function IncentiveFormModal({
    isOpen,
    onClose,
    isEditing,
    incentive,
    payroll_periods,
    employees,
    formData,
    errors,
    processing,
    onDataChange,
    onSubmit,
    onShowEmployeeModal,
    getEmployeeName,
    selectedEmployeesList
}: IncentiveFormModalProps) {
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        {isEditing ? (
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-900 rounded-xl">
                                <Pencil className="h-5 w-5 text-white" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-900 rounded-xl">
                                <Plus className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <div>
                            <span>{isEditing ? 'Edit Incentive' : 'Add Incentive'}</span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {isEditing ? 'Edit an existing incentive' : 'Add a new incentive'}
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="mt-4">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column - Incentive Details */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="incentive_name">Incentive Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="incentive_name"
                                    value={formData.incentive_name}
                                    onChange={e => onDataChange('incentive_name', e.target.value)}
                                    placeholder="Enter incentive name"
                                    className="h-10"
                                    autoFocus
                                />
                                <InputError message={errors.incentive_name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="incentive_amount">Incentive Amount <span className="text-red-500">*</span></Label>
                                <Input
                                    type='number'
                                    id="incentive_amount"
                                    value={formData.incentive_amount}
                                    onChange={e => onDataChange('incentive_amount', e.target.value)}
                                    placeholder="Enter incentive amount"
                                    className="h-10"
                                />
                                <InputError message={errors.incentive_amount} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payroll_period_id">Payroll Period <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <select
                                        id="payroll_period_id"
                                        value={formData.payroll_period_id}
                                        onChange={e => onDataChange('payroll_period_id', e.target.value)}
                                        className="min-w-full p-2 pr-6 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 bg-white appearance-none cursor-pointer"
                                        style={{ color: formData.payroll_period_id ? 'black' : '#9CA3AF' }}
                                    >
                                        <option value="" className="text-gray-500 text-sm" hidden>Select a payroll period</option>
                                        {payroll_periods && payroll_periods.length > 0 ? (
                                            payroll_periods.map(period => (
                                                <option
                                                    key={period.id}
                                                    value={period.id}
                                                    className="text-gray-900 text-sm hover:cursor-pointer rounded-xl border border-gray-200 my-1 px-2 py-1"
                                                    style={{ borderRadius: '30px', border: '1px solid #ffffff', margin: '2px 0', padding: '4px 8px' }}
                                                >
                                                    {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled className="text-gray-500">No payroll periods available</option>
                                        )}
                                    </select>
                                    <div className="absolute inset-y-0 -right-8 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError message={errors.payroll_period_id} />
                            </div>
                        </div>

                        {/* Right Column - Employee Selection Button */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Employee Selection</Label>

                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                onClick={onShowEmployeeModal}
                            >
                                {selectedEmployeesList.length > 0 ? (
                                    <div>
                                        <div className="text-sm text-gray-600 mb-2">
                                            {selectedEmployeesList.length} employee{selectedEmployeesList.length !== 1 ? 's' : ''} selected
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 justify-center">
                                            {selectedEmployeesList.slice(0, 3).map(emp => (
                                                <span key={emp.id} className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-md text-xs">
                                                    {getEmployeeName(emp)}
                                                </span>
                                            ))}
                                            {selectedEmployeesList.length > 3 && (
                                                <span className="text-xs text-gray-500">+{selectedEmployeesList.length - 3} more</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Click to select employees</p>
                                        <p className="text-xs text-gray-400 mt-1">Choose who will receive this incentive</p>
                                    </div>
                                )}
                            </div>

                            <InputError message={errors.employee_ids} />
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button variant='outline' type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}