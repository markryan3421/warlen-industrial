import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const CustomToast = () => {
    return (
        <Toaster position="top-right" duration={4000} richColors />
    );
}

export { toast };