import { useEffect, useState, useCallback } from "react";

interface NotitoastProps {
  type: "success" | "error";
  message: string;
  onClose?: () => void;
  duration?: number;
}

export function Notitoast({ type, message, onClose, duration = 4000 }: NotitoastProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, handleClose]);

  const styles = {
  success: {
    bg: "bg-teal-200/30 dark:bg-teal-800/30 backdrop-blur-md",
    border: "border border-teal-300/40 dark:border-teal-600/40",
    iconBg: "bg-teal-300/30 dark:bg-teal-700/30",
    iconColor: "text-teal-700 dark:text-teal-300",
    text: "text-teal-900 dark:text-teal-100",
  },
  error: {
    bg: "bg-red-200/30 dark:bg-red-800/30 backdrop-blur-md",
    border: "border border-red-300/40 dark:border-red-600/40",
    iconBg: "bg-red-300/30 dark:bg-red-700/30",
    iconColor: "text-red-700 dark:text-red-300",
    text: "text-red-900 dark:text-red-100",
  },
};

  const style = styles[type];

  return (
    <div
      className={`fixed left-5 top-30 z-100 transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 translate-x-8"
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${style.bg} ${style.border} shadow-lg`}
        role="alert"
      >
        <div className={`p-1.5 rounded-full ${style.iconBg}`}>
          {type === "success" ? (
            
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            
          ) : (
            
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            
          )}
        </div>
        <p className={`whitespace-pre-line text-sm font-medium ${style.text}`}>{message}</p>
        <button
          onClick={handleClose}
          className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${style.text} opacity-60 hover:opacity-100`}
          aria-label="Cerrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}