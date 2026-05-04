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
      bg: "bg-teal-50",
      border: "border-teal-200",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      text: "text-teal-800",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      text: "text-red-800",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`fixed top-4 right-4 z-100 transition-all duration-300 ${
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
            <svg className={`w-4 h-4 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className={`w-4 h-4 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <p className={`text-sm font-medium ${style.text}`}>{message}</p>
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