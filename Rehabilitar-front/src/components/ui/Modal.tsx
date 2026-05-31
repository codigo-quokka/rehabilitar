import { ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'l' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    l: 'max-w-4xl',
    xl: 'max-w-5xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] focus:outline-none`}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border dark:border-gray-700">
            <h2 id="modal-title" className="text-xl font-semibold text-dark dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-dark dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Cerrar modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}