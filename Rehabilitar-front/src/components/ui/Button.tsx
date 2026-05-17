import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "verde" | "naranja" | "rojo";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "verde",
  size = "md",
  loading = false,
  
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed";

  const focusStyles =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary dark:bg-dark-green dark:border-1 dark:border-gray-500",
    secondary: "bg-dark text-white hover:bg-secondary focus:ring-dark",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary",
    ghost: "border border-gray-300 dark:border-gray-600 focus:ring-gray-300 dark:text-gray-100",
    verde:"border border-gray-300 dark:border-gray-600 focus:ring-gray-300 dark:text-gray-100 bg-primary/40 hover:bg-primary/20 text-dark-green dark:hover:bg-darkest-green dark:bg-dark-green",
    naranja:"border border-gray-300 dark:border-gray-600 focus:ring-gray-300 dark:text-gray-100 bg-amber-200 hover:bg-amber-100 text-amber-700 dark:bg-amber-700 dark:hover:bg-amber-900",
    rojo:"border border-gray-300 dark:border-gray-600 focus:ring-gray-300 dark:text-gray-100 bg-red-200 hover:bg-red-100 text-red-800 dark:bg-red-700 dark:hover:bg-red-900",
    danger: "bg-red-400 text-white hover:bg-red-800 focus:ring-red-500 dark:bg-red-600",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${focusStyles} ${variants[variant]} cursor-pointer ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2.5 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
