import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Users, UserPlus, UserMinus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Employee {
    id: number;
    emp_code: string | number | null;
    user?: { name: string } | null;
    name?: string;
}

interface EmployeeSelectorProps {
    employees: Employee[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onRemove: (id: number) => void;
    onAddAll?: (ids: number[]) => void;
    onRemoveAll?: (ids: number[]) => void;
}

export function EmployeeSelector({
    employees,
    selectedIds,
    onToggle,
    onRemove,
    onAddAll,
    onRemoveAll
}: EmployeeSelectorProps) {
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
    const [showAllEmployeesModal, setShowAllEmployeesModal] = useState(false);
    const [showRemoveAllConfirmation, setShowRemoveAllConfirmation] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsEmployeeDropdownOpen(false);
                setEmployeeSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getEmployeeName = (emp: Employee) => {
        return emp.user?.name || emp.name || 'Unnamed Employee';
    };

    const filteredEmployees = employees.filter(emp => {
        if (!employeeSearchTerm) return true;
        const term = employeeSearchTerm.toLowerCase();
        const code = emp.emp_code ? String(emp.emp_code).toLowerCase() : '';
        const name = getEmployeeName(emp).toLowerCase();
        return code.includes(term) || name.includes(term);
    });

    const displayedEmployees = employeeSearchTerm ? filteredEmployees : filteredEmployees.slice(0, 5);
    const selectedEmployees = employees.filter(emp => selectedIds.includes(emp.id));
    const allFilteredSelected = filteredEmployees.length > 0 && filteredEmployees.every(emp => selectedIds.includes(emp.id));

    const selectAll = () => {
        const allEmployeeIds = filteredEmployees.map(emp => emp.id);
        const idsToAdd = allEmployeeIds.filter(id => !selectedIds.includes(id));

        if (idsToAdd.length > 0 && onAddAll) {
            onAddAll(idsToAdd);
        } else {
            idsToAdd.forEach(id => onToggle(id));
        }
    };

    const deselectAll = () => {
        if (selectedIds.length > 0 && onRemoveAll) {
            onRemoveAll(selectedIds);
        } else if (selectedIds.length > 0) {
            selectedIds.forEach(id => onRemove(id));
        }
        setShowAllEmployeesModal(false);
    };

    const handleRemoveEmployee = (id: number, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        // Debug logging
        console.log('Removing single employee with ID:', id);
        console.log('Current selected IDs before removal:', selectedIds);
        
        // Call onRemove with just the single employee ID
        onRemove(id);
        
        // Don't close modal if there are still employees
        if (selectedEmployees.length === 1) {
            setShowAllEmployeesModal(false);
        }
    };

    const handleRemoveAll = () => {
        console.log('Removing ALL employees');
        if (onRemoveAll) {
            onRemoveAll(selectedIds);
        } else {
            selectedIds.forEach(id => onRemove(id));
        }
        setShowRemoveAllConfirmation(false);
        setShowAllEmployeesModal(false);
    };

    // Check if there are no employees at all
    const hasNoEmployees = employees.length === 0;
    const hasNoSelectedEmployees = selectedEmployees.length === 0 && !hasNoEmployees;

    return (
        <>
            <div className="space-y-3">
                {/* No Selected Employees Container */}
                {hasNoSelectedEmployees && (
                    <div className="border rounded-lg p-6 bg-gray-50 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <UserMinus className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="text-sm font-medium text-gray-700 mb-1">No Employees Selected</div>
                            <div className="text-xs text-gray-500 text-center max-w-[250px]">
                                Click the dropdown below to select employees who will receive this incentive.
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Tags - Clickable to open modal */}
                {selectedEmployees.length > 0 && !hasNoEmployees && (
                    <div 
                        className="border rounded-lg p-2 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setShowAllEmployeesModal(true)}
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="text-xs text-gray-500">
                                {selectedEmployees.length} employee{selectedEmployees.length !== 1 ? 's' : ''} selected
                            </div>
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                Click to view all
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                            {selectedEmployees.slice(0, 8).map(emp => (
                                <div key={emp.id} className="inline-flex items-center gap-1 bg-blue-100 px-1.5 py-0.5 rounded-md text-xs">
                                    <span className="max-w-[150px] truncate text-xs">{getEmployeeName(emp)}</span>
                                    <button 
                                        type="button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            handleRemoveEmployee(emp.id, e);
                                        }} 
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                </div>
                            ))}
                            {selectedEmployees.length > 8 && (
                                <div className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs bg-gray-200 text-gray-600">
                                    +{selectedEmployees.length - 8} more
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Employee Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <div
                        className={`flex items-center justify-between border rounded-lg cursor-pointer p-2.5 transition-colors ${
                            hasNoEmployees 
                                ? 'bg-gray-100 cursor-not-allowed opacity-60' 
                                : 'hover:bg-gray-50'
                        }`}
                        onClick={() => !hasNoEmployees && setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                    >
                        <span className="text-sm text-gray-600">
                            {hasNoEmployees 
                                ? 'No employees available' 
                                : selectedIds.length === 0 
                                    ? 'Select employees...' 
                                    : `${selectedIds.length} selected`
                            }
                        </span>
                        {!hasNoEmployees && (
                            <ChevronDown className={`h-4 w-4 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                        )}
                    </div>

                    {isEmployeeDropdownOpen && !hasNoEmployees && (
                        <div className="absolute z-20 w-full mt-1 border rounded-lg bg-white shadow-lg overflow-hidden">
                            <div className="sticky top-0 bg-white border-b p-2">
                                <div className="flex items-center border rounded-md px-2 py-1.5">
                                    <Search className="h-3.5 w-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        value={employeeSearchTerm}
                                        onChange={e => setEmployeeSearchTerm(e.target.value)}
                                        className="w-full ml-2 outline-none text-sm"
                                        autoFocus
                                    />
                                </div>

                                {employees.length > 0 && (
                                    <div className="flex justify-between items-center mt-2 px-1">
                                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={allFilteredSelected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        selectAll();
                                                    } else {
                                                        deselectAll();
                                                    }
                                                }}
                                                className="rounded h-3.5 w-3.5"
                                            />
                                            <span className="font-medium">
                                                {allFilteredSelected ? 'Unselect all' : `Select all (${filteredEmployees.length})`}
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="max-h-[200px] overflow-y-auto">
                                {filteredEmployees.length === 0 && employeeSearchTerm ? (
                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                        <Search className="h-8 w-8 text-gray-300 mb-2" />
                                        <div className="text-sm font-medium text-gray-700">No matching employees</div>
                                        <div className="text-xs text-gray-400 mt-1">No employees found matching "{employeeSearchTerm}"</div>
                                    </div>
                                ) : (
                                    displayedEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            className="flex items-center p-2 hover:bg-gray-50 cursor-pointer gap-2 transition-colors"
                                            onClick={() => onToggle(emp.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(emp.id)}
                                                onChange={() => {}}
                                                className="rounded pointer-events-none h-3.5 w-3.5"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-900 truncate">{getEmployeeName(emp)}</div>
                                                <div className="text-xs text-gray-500">EMP Code: {emp.emp_code || 'N/A'}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {employees.length > 0 && !employeeSearchTerm && employees.length > 5 && filteredEmployees.length > 0 && (
                                <div className="sticky bottom-0 bg-gray-50 border-t p-2 text-center text-xs text-gray-500">
                                    Showing {Math.min(5, filteredEmployees.length)} of {employees.length} employees. Type to search more.
                                </div>
                            )}
                            
                            {employees.length > 0 && employeeSearchTerm && filteredEmployees.length > 0 && filteredEmployees.length > 5 && (
                                <div className="sticky bottom-0 bg-gray-50 border-t p-2 text-center text-xs text-gray-500">
                                    Showing {Math.min(5, filteredEmployees.length)} of {filteredEmployees.length} matching employees
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* No Data Container */}
                {hasNoEmployees && (
                    <div className="border rounded-lg p-2 bg-gray-50 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <UserPlus className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="text-sm font-medium text-gray-700 mb-1">No Employees Available</div>
                            <div className="text-xs text-gray-500 text-center max-w-[200px]">
                                There are no active employees in the system. Please add employees before creating incentives.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* All Selected Employees Modal */}
            <Dialog open={showAllEmployeesModal} onOpenChange={setShowAllEmployeesModal}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Selected Employees ({selectedEmployees.length})
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[calc(85vh-180px)] py-4">
                        <div className="space-y-2">
                            {selectedEmployees.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No employees selected
                                </div>
                            ) : (
                                selectedEmployees.map((emp, index) => (
                                    <div
                                        key={emp.id}
                                        className="group flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-200"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-100 rounded-full text-sm font-medium">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{getEmployeeName(emp)}</span>
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                                                        EMP-{String(emp.emp_code || 'N/A')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEmployee(emp.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200"
                                            title="Remove employee"
                                        >
                                            <X className="h-4 w-4 text-red-500" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{selectedEmployees.length}</span> employees selected
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowRemoveAllConfirmation(true)}
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
                </DialogContent>
            </Dialog>

            {/* Remove All Confirmation Modal */}
            <Dialog open={showRemoveAllConfirmation} onOpenChange={setShowRemoveAllConfirmation}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Remove All Employees</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-red-100 rounded-full flex-shrink-0">
                                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-base text-gray-700 mb-2">
                                    Are you sure you want to remove all employees?
                                </p>
                                <p className="text-sm text-gray-500">
                                    This action cannot be undone. You will need to select employees again.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowRemoveAllConfirmation(false)}>Cancel</Button>
                        <Button onClick={handleRemoveAll} className="bg-red-600 hover:bg-red-700">Yes, Remove All</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}