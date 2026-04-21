// components/incentives/incentive-form-modal.tsx (modified)

import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // assuming you have shadcn/ui switch
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/custom-toast';
import { EmployeeSelectionModal } from '@/components/employee-selection-modal';
import { Users, Pencil, Plus, PhilippinePeso, CalendarDays } from 'lucide-react';

// ... interfaces (add is_daily to form data)

interface IncentiveFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    isEditing?: boolean;
    incentive?: any;
    payroll_periods?: any[];
    employees?: any[];
    // External form state (passed from parent)
    formData: {
        incentive_name: string;
        incentive_amount: string;
        payroll_period_id: string;
        employee_ids: number[];
        is_daily: boolean;   // new field
    };
    errors: Record<string, string>;
    processing: boolean;
    onDataChange: (key: string, value: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onShowEmployeeModal: () => void;
    getEmployeeName: (emp: any) => string;
    selectedEmployeesList: any[];
}

export function IncentiveFormModal({
    isOpen,
    onClose,
    isEditing = false,
    incentive,
    payroll_periods = [],
    employees = [],
    formData,
    errors,
    processing,
    onDataChange,
    onSubmit,
    onShowEmployeeModal,
    getEmployeeName,
    selectedEmployeesList,
}: IncentiveFormModalProps) {
    // No internal useForm anymore – all state comes from parent

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
        } catch {
            return 'Invalid date';
        }
    };

    // Helper to toggle the switch
    const handleIsDailyChange = (checked: boolean) => {
        onDataChange('is_daily', checked);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                            <span>{isEditing ? 'Edit Incentive' : 'Add Incentive'}</span>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {isEditing ? 'Edit an existing incentive' : 'Add a new incentive'}
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="flex gap-6 flex-col md:flex-row">
                        {/* Left Column - Incentive Details */}
                        <div className="flex-1 space-y-4">
                            <h2 className="text-lg font-semibold">Incentive Details</h2>

                            {/* Incentive Name */}
                            <div className="space-y-2">
                                <Label htmlFor="incentive_name">Incentive Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="incentive_name"
                                    value={formData.incentive_name}
                                    onChange={e => onDataChange('incentive_name', e.target.value)}
                                    placeholder="Enter incentive name"
                                />
                                <InputError message={errors.incentive_name} />
                            </div>

                            {/* Incentive Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="incentive_amount">
                                    {formData.is_daily ? 'Daily Amount' : 'One-time Amount'}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative w-65">
                                    <PhilippinePeso className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        id="incentive_amount"
                                        value={formData.incentive_amount}
                                        onChange={e => onDataChange('incentive_amount', e.target.value)}
                                        placeholder={formData.is_daily ? "Daily rate" : "Fixed amount"}
                                        className="pl-8"
                                    />
                                </div>
                                <InputError message={errors.incentive_amount} />
                            </div>

                            {/* Is Daily Toggle */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="is_daily" className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4" />
                                        Daily incentive?
                                    </Label>
                                    <Switch
                                        id="is_daily"
                                        checked={formData.is_daily}
                                        onCheckedChange={handleIsDailyChange}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {formData.is_daily
                                        ? "Amount will be multiplied by the number of days worked in the period."
                                        : "Amount will be paid once for the entire period."}
                                </p>
                            </div>

                            {/* Payroll Period */}
                            <div className="space-y-2">
                                <Label htmlFor="payroll_period_id">Payroll Period <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <select
                                        id="payroll_period_id"
                                        value={formData.payroll_period_id}
                                        onChange={e => onDataChange('payroll_period_id', e.target.value)}
                                        className="w-full p-2 pr-8 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 bg-white appearance-none cursor-pointer"
                                        style={{ color: formData.payroll_period_id ? 'black' : '#9CA3AF' }}
                                    >
                                        <option value="" className="text-gray-500 text-sm">Select a payroll period</option>
                                        {payroll_periods && payroll_periods.length > 0 ? (
                                            payroll_periods.map(period => (
                                                <option key={period.id} value={period.id} className="text-gray-900 text-sm">
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

                        {/* Right Column - Employee Selection */}
                        <div className="flex-1 space-y-4">
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
                                        <p className="text-xs text-gray-400 mt-1">Choose employees for this incentive</p>
                                    </div>
                                )}
                            </div>
                            <InputError message={errors.employee_ids} />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button variant="outline" type="button" onClick={onClose}>
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