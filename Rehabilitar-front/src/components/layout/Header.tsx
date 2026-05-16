import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { NotificationTray } from './NotificationTray';
import { ConfirmActionModal } from '../ConfirmActionModal';
import logo from '../../assets/logo.png';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Saltar al contenido principal
      </a>
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-border dark:border-gray-700 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="RehabilitAR" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-dark dark:text-gray-100 leading-tight">RehabilitAR</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">Centro de Rehabilitación</p>
            </div>
          </Link>
          {title && (
            <div className="hidden md:block h-8 w-px bg-border dark:bg-gray-700 mx-2" />
          )}
          {title && (
            <h2 className="text-xl font-semibold text-dark dark:text-gray-100">{title}</h2>
          )}
        </div>
        <div className="flex items-center gap-4">
          <NotificationTray />
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm" aria-hidden="true">
              <span className="text-sm font-semibold text-white">
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-dark dark:text-gray-100">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.rol?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <ConfirmActionModal
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Confirmar cierre de sesión"
        body="¿Estás seguro de que deseas cerrar sesión?"
        confirmLabel="Cerrar sesión"
      />
    </>
  );
}