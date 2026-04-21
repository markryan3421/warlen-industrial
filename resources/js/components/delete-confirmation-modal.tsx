import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, AlertCircle, Archive, RotateCcw } from "lucide-react";
import { ReactNode } from "react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  icon?: ReactNode;
  variant?: "destructive" | "warning" | "info";
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  isLoading = false,
  confirmText = "Delete",
  cancelText = "Cancel",
  icon,
  variant = "destructive"
}: DeleteConfirmationDialogProps) {
  const displayDescription = itemName 
    ? `Are you sure you want to delete ${itemName}? This action cannot be undone.`
    : description;

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          bg: "bg-red-100 dark:bg-red-900/20",
          icon: "text-red-600 dark:text-red-400",
          title: "text-red-600 dark:text-red-400",
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
        };
      case "info":
        return {
          bg: "bg-blue-100 dark:bg-blue-900/20",
          icon: "text-blue-600 dark:text-blue-400",
          title: "text-blue-600 dark:text-blue-400",
          button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        };
      default: // destructive
        return {
          bg: "bg-red-100 dark:bg-red-900/20",
          icon: "text-red-600 dark:text-red-400",
          title: "text-red-600 dark:text-red-400",
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
        };
    }
  };

  const styles = getVariantStyles();
  
  // Default icon is Trash2, but can be overridden
  const defaultIcon = <Trash2 className="h-5 w-5" />;
  const headerIcon = icon || defaultIcon;
  
  // Button icon - if custom icon provided, use it, otherwise use Trash2
  const buttonIcon = icon ? (
    <span className="h-4 w-4">{icon}</span>
  ) : (
    <Trash2 className="h-4 w-4" />
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${styles.bg}`}>
              <span className={styles.icon}>{headerIcon}</span>
            </div>
            <DialogTitle className={styles.title}>
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
            onClick={onConfirm}
            disabled={isLoading}
            className={`gap-2 hover:cursor-pointer ${styles.button}`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {confirmText}ing...
              </>
            ) : (
              <>
                {buttonIcon}
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}