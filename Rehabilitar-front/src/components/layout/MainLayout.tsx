import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-main dark:bg-gray-800 flex flex-col">
      <Header title={title} />
      <Sidebar />
      <main id="main-content" className="flex-1 p-8" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}