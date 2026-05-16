import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-5',
    md: 'p-8',
    lg: 'p-10',
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-border dark:border-gray-700 shadow-lg dark:shadow-gray-900/50 ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}