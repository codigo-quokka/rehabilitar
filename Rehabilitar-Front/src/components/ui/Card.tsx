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
    <div className={`bg-white rounded-2xl border border-border shadow-lg ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}