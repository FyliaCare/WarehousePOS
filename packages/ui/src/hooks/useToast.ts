import { toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useToast() {
  const showToast = (type: ToastType, message: string, options?: ToastOptions) => {
    const { description, duration = 4000, action } = options || {};

    const toastOptions = {
      description,
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'info':
      default:
        toast.info(message, toastOptions);
        break;
    }
  };

  return {
    success: (message: string, options?: ToastOptions) =>
      showToast('success', message, options),
    error: (message: string, options?: ToastOptions) =>
      showToast('error', message, options),
    warning: (message: string, options?: ToastOptions) =>
      showToast('warning', message, options),
    info: (message: string, options?: ToastOptions) =>
      showToast('info', message, options),
    promise: toast.promise,
    dismiss: toast.dismiss,
  };
}
