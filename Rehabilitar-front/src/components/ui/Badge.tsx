import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    success: 'bg-green-300/80 dark:bg-green-900/50 text-green-800 dark:text-green-400',
    warning: 'bg-yellow-200/80 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-400',
    info: 'bg-primary/20 dark:bg-primary/10 text-primary-dark dark:text-primary',
    amber: 'bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}