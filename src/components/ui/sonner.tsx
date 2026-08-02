import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      richColors
      duration={1500}
      gap={8}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-white group-[.toaster]:border-slate-700 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          description: "group-[.toast]:text-slate-300 group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton: "group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300 group-[.toast]:rounded-lg",
          success: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-green-900/90 group-[.toaster]:to-green-800/90 group-[.toaster]:border-green-600/50",
          error: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-red-900/90 group-[.toaster]:to-red-800/90 group-[.toaster]:border-red-600/50",
          warning: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-yellow-900/90 group-[.toaster]:to-yellow-800/90 group-[.toaster]:border-yellow-600/50",
          info: "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-blue-900/90 group-[.toaster]:to-blue-800/90 group-[.toaster]:border-blue-600/50",
        },
      }}
      icons={{
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        error: <XCircle className="w-5 h-5 text-red-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
        loading: <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
