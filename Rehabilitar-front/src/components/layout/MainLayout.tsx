import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 via-gray-400/80 to-gray-100 dark:from-gray-700 dark:via-gray-950 dark:to-gray-800  flex flex-col">
      <Header title={title} />
      <Sidebar />
      <main id="main-content" className="flex-1 p-8" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}