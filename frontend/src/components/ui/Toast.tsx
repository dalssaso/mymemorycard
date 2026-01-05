import { toast } from "sonner";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast(): { showToast: (message: string, type?: ToastType) => void } {
  const showToast = (message: string, type: ToastType = "info") => {
    if (type === "success") {
      toast.success(message);
      return;
    }
    if (type === "error") {
      toast.error(message);
      return;
    }
    if (type === "warning") {
      toast.warning(message);
      return;
    }
    toast.message(message);
  };

  return { showToast };
}
