import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
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
    primary: "bg-primary text-blue hover:bg-primary-dark focus:ring-primary",
    secondary: "bg-dark text-white hover:bg-secondary focus:ring-dark",
    outline:
      "border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary",
    ghost: "border border-gray-300 text-dark hover:bg-gray-200 focus:ring-gray-300",
    danger: "bg-red-400 text-white hover:bg-red-800 focus:ring-red-500",
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
