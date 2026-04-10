// components/incentives/employee-selection-modal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmployeeSelector } from './employee-selector';

interface Employee {
    id: number;
    emp_code: string | number | null;
    user?: { name: string } | null;
    name?: string;
}

interface EmployeeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    onRemove: (id: number) => void;
    onAddAll?: (ids: number[]) => void;
    onRemoveAll?: (ids: number[]) => void;
}

export function EmployeeSelectionModal({
    isOpen,
    onClose,
    employees,
    selectedIds,
    onToggle,
    onRemove,
    onAddAll,
    onRemoveAll
}: EmployeeSelectionModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="min-w-[500px] h-fit flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Select Employees</DialogTitle>
                </DialogHeader>

                <EmployeeSelector
                    employees={employees}
                    selectedIds={selectedIds}
                    onToggle={onToggle}
                    onRemove={onRemove}
                    onAddAll={onAddAll}
                    onRemoveAll={onRemoveAll}
                />

                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <Button variant="outline" onClick={onClose}>
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}