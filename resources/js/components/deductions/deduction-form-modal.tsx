import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/custom-toast';
import { EmployeeSelectionModal } from '@/components/employee-selection-modal';
import { Users, Pencil, Plus, PhilippinePeso } from 'lucide-react';

interface Employee {
    id: number;
    emp_code: string | number | null;
    user?: { name: string } | null;
}

interface PayrollPeriod {
    id: number;
    name?: string;
    start_date?: string;
    end_date?: string;
}

interface DeductionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing?: boolean;
    deduction?: {
        id: number;
        deduction_name: string;
        deduction_amount: string | number;
        payroll_period_id?: number;
        payroll_period?: PayrollPeriod;
        employees?: Employee[];
        employee_ids?: number[];
    } | null;
    payroll_periods?: PayrollPeriod[];
    employees?: Employee[];
    onSuccess?: () => void;
}

export function DeductionFormModal({
    isOpen,
    onClose,
    isEditing = false,
    deduction = null,
    payroll_periods = [],
    employees = [],
    onSuccess
}: DeductionFormModalProps) {
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [modalKey, setModalKey] = useState(0); // Force re-render when modal changes

    // Separate form instances for create and edit
    const createForm = useForm({
        deduction_name: '',
        deduction_amount: '',
        payroll_period_id: '',
        employee_ids: [] as number[],
    });

    const editForm = useForm({
        deduction_name: '',
        deduction_amount: '',
        payroll_period_id: '',
        employee_ids: [] as number[],
    });

    // Use the appropriate form based on mode
    const currentForm = isEditing ? editForm : createForm;
    const { data, setData, processing, errors, reset } = currentForm;

    // Initialize edit form when deduction data is available
    useEffect(() => {
        if (isEditing && deduction && isOpen) {
            console.log('Initializing edit form with:', deduction);
            
            // Extract employee IDs from the employees array
            const employeeIds = deduction.employees?.map(emp => emp.id) || [];
            
            console.log('Extracted employee IDs:', employeeIds);
            
            editForm.setData({
                deduction_name: deduction.deduction_name,
                deduction_amount: String(deduction.deduction_amount),
                payroll_period_id: String(deduction.payroll_period?.id || deduction.payroll_period_id || ''),
                employee_ids: employeeIds,
            });
        }
    }, [isEditing, deduction, isOpen]);

    // Reset create form when opening in create mode
    useEffect(() => {
        if (!isEditing && isOpen) {
            console.log('Resetting create form');
            createForm.reset();
            // Force modal to re-render with fresh state
            setModalKey(prev => prev + 1);
        }
    }, [isEditing, isOpen]);

    // Reset ALL forms and states when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Small delay to ensure cleanup happens after animation
            const timer = setTimeout(() => {
                createForm.reset();
                editForm.reset();
                setShowEmployeeModal(false);
                // Force a key change to reset component state
                setModalKey(prev => prev + 1);
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Debug logging
    useEffect(() => {
        if (isOpen) {
            console.log(`=== ${isEditing ? 'Edit' : 'Create'} Deduction Form Modal Debug ===`);
            console.log('Is editing:', isEditing);
            console.log('Deduction data:', deduction);
            console.log('Current form data:', data);
            console.log('Employee IDs:', data.employee_ids);
            console.log('Selected employees count:', employees.filter(emp => data.employee_ids.includes(emp.id)).length);
        }
    }, [isOpen, isEditing, deduction, data, employees]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'No date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const options = {
            onSuccess: () => {
                toast.success(isEditing ? 'Deduction updated successfully!' : 'Deduction created successfully!');
                onClose();
                if (onSuccess) onSuccess();
            },
            onError: (errors) => {
                console.error(isEditing ? 'Update errors:' : 'Creation errors:', errors);
            },
        };

        if (isEditing && deduction) {
            editForm.put(`/deductions/${deduction.id}`, options);
        } else {
            createForm.post('/deductions', options);
        }
    };

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

    const addAllEmployees = (ids: number[]) => {
        setData('employee_ids', [...data.employee_ids, ...ids]);
    };

    const getEmployeeName = (emp: Employee) => {
        return emp.user?.name || 'Unnamed Employee';
    };

    const selectedEmployeesList = employees.filter(emp => data.employee_ids.includes(emp.id));

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <>
            {/* Main Form Modal */}
            <Dialog key={modalKey} open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                                <span>{isEditing ? 'Edit Deduction' : 'Add Deduction'}</span>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {isEditing ? 'Edit an existing deduction' : 'Add a new deduction'}
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-6">
                        {/* Two Column Layout */}
                        <div className="flex gap-6 flex-col md:flex-row">
                            {/* Left Column - Deduction Details */}
                            <div className="flex-1 space-y-4">
                                <h1 className="font-semibold">Deduction Details</h1>

                                {/* Deduction Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="deduction_name">Deduction Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="deduction_name"
                                        value={data.deduction_name}
                                        onChange={e => setData('deduction_name', e.target.value)}
                                        placeholder="Enter deduction name"
                                    />
                                    <InputError message={errors.deduction_name} />
                                </div>

                                {/* Deduction Amount */}
                                <div className="space-y-2">
                                    <Label htmlFor="deduction_amount">Deduction Amount <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <PhilippinePeso className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input
                                            type='number'
                                            id="deduction_amount"
                                            value={data.deduction_amount}
                                            onChange={e => setData('deduction_amount', e.target.value)}
                                            placeholder="Enter deduction amount"
                                            className="pl-8"
                                        />
                                    </div>
                                    <InputError message={errors.deduction_amount} />
                                </div>

                                {/* Payroll Period */}
                                <div className="space-y-2">
                                    <Label htmlFor="payroll_period_id">Payroll Period <span className="text-red-500">*</span></Label>
                                    <div className="relative w-65">
                                        <select
                                            id="payroll_period_id"
                                            value={data.payroll_period_id}
                                            onChange={e => setData('payroll_period_id', e.target.value)}
                                            className="w-full p-2 pr-8 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 bg-white appearance-none cursor-pointer"
                                            style={{ color: data.payroll_period_id ? 'black' : '#9CA3AF' }}
                                        >
                                            <option value="" className="text-gray-500 text-sm" hidden>Select a payroll period</option>
                                            {payroll_periods && payroll_periods.length > 0 ? (
                                                payroll_periods.map(period => (
                                                    <option
                                                        key={period.id}
                                                        value={period.id}
                                                        className="text-gray-900 text-sm hover:cursor-pointer"
                                                    >
                                                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                                                    </option>
                                                ))
                                            ) : (
                                                <option disabled className="text-gray-500">No payroll periods available</option>
                                            )}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
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
                                    onClick={() => setShowEmployeeModal(true)}
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
                                            <p className="text-xs text-gray-400 mt-1">Choose employees for this deduction</p>
                                        </div>
                                    )}
                                </div>

                                <InputError message={errors.employee_ids} />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
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

            {/* Employee Selection Modal */}
            <EmployeeSelectionModal
                isOpen={showEmployeeModal}
                onClose={() => setShowEmployeeModal(false)}
                employees={employees}
                selectedIds={data.employee_ids}
                onToggle={toggleEmployee}
                onRemove={removeEmployee}
                onAddAll={addAllEmployees}
                onRemoveAll={() => setData('employee_ids', [])}
            />
        </>
    );
}