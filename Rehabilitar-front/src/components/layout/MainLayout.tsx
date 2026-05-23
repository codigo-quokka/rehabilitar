import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="transition-colors duration-500  min-h-screen bg-linear-to-br from-dark-green/10 from-10% via-dark-green/30 via-50% to-dark-green/40 to-70% dark:from-0% dark:via-45% dark:to-90% dark:from-gray-700 dark:via-gray-950 dark:to-gray-900 bg-fixed flex flex-col">
      <Header title={title} />
      <Sidebar />
      <main id="main-content" className="flex-1 p-8" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}