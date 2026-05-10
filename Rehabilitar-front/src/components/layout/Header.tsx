import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NotificationTray } from './NotificationTray';
import { Modal, Button } from '../ui';
import logo from '../../assets/logo.png';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
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
      <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="RehabilitAR" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-dark leading-tight">RehabilitAR</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">Centro de Rehabilitación</p>
            </div>
          </Link>
          {title && (
            <div className="hidden md:block h-8 w-px bg-border mx-2" />
          )}
          {title && (
            <h2 className="text-xl font-semibold text-dark">{title}</h2>
          )}
        </div>
        <div className="flex items-center gap-4">
          <NotificationTray />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm" aria-hidden="true">
              <span className="text-sm font-semibold text-white">
                {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-dark">{user?.nombre} {user?.apellido}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.rol?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="p-2.5 text-gray-500 hover:text-dark hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Confirmar cierre de sesión"
        size="sm"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            ¿Estás seguro de que deseas cerrar sesión?
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}