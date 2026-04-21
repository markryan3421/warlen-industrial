import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw, AlertCircle } from "lucide-react";

interface RestoreConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export function RestoreConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Restore Employee",
  description = "Are you sure you want to restore this employee?",
  itemName,
  isLoading = false,
  confirmText = "Yes, restore employee",
  cancelText = "Cancel",
}: RestoreConfirmationDialogProps) {
  const displayDescription = itemName
    ? `Are you sure you want to restore ${itemName}?`
    : description;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-green-600 dark:text-green-400">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {displayDescription}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            className="me-2 hover:cursor-pointer"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}