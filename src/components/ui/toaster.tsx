import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: string, title?: React.ReactNode) => {
    const titleStr = String(title || '').toLowerCase();
    if (variant === 'destructive' || titleStr.includes('error') || titleStr.includes('خطأ') || titleStr.includes('فشل')) {
      return <XCircle className="w-5 h-5 text-red-400 shrink-0" />;
    }
    if (titleStr.includes('warning') || titleStr.includes('تحذير')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />;
    }
    if (titleStr.includes('success') || titleStr.includes('تم') || titleStr.includes('نجاح')) {
      return <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />;
    }
    return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
  };

  return (
    <ToastProvider duration={1500}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-3">
              {getIcon(variant, title)}
              <div className="grid gap-0.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
