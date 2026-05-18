import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Role } from "../types";

import { LandingPage } from "../features/landing/pages/LandingPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { PasswordRecoveryPage } from "../features/auth/pages/PasswordRecoveryPage";
import { PasswordResetPage } from "../features/auth/pages/PasswordResetPage";
import { EmailVerificationPage } from "../features/auth/pages/EmailVerificationPage";
import { DashboardPage } from "../features/usuarios/pages/DashboardPage";
import { ActividadesPage } from "../features/actividades/pages/ActividadesPage";
import { CalendarioPage } from "../features/actividades/pages/CalendarioPage";
import { ReservasPage } from "../features/reservas/pages/ReservasPage";
import { ConfirmarPagoPage } from "../features/reservas/pages/ConfirmarPagoPage";
import { UsuariosPage } from "../features/usuarios/pages/UsuariosPage";
import { SalasPage } from "../features/salas/pages/SalasPage";
import { MetricasPage } from "../features/metricas/pages/MetricasPage";
import { PerfilPage } from "../features/usuarios/pages/PerfilPage";
import { MisClasesPage } from "../features/profesor/pages/MisClasesPage";

function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) return null; // espera hidratación

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export const routes = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/recover",
    element: <PasswordRecoveryPage />,
  },
  {
    path: "/reset-password",
    element: <PasswordResetPage />,
  },
  {
    path: "/email-verification",
    element: <EmailVerificationPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/actividades",
        element: <ActividadesPage />,
      },
      {
        path: "/calendario",
        element: <CalendarioPage />,
      },
      {
        path: "reservas",
        children: [
          {
            index: true,
            element: <ReservasPage />,
          },
          {
            path: "confirmar/:reservaId",
            element: <ConfirmarPagoPage />,
          },
        ],
      },
      {
        path: "/mis-clases",
        element: <ProtectedRoute allowedRoles={["Profesor"]} />,
        children: [
          {
            index: true,
            element: <MisClasesPage />,
          },
        ],
      },
      {
        path: "/perfil",
        element: <PerfilPage />,
      },
      {
        path: "/usuarios",
        element: <ProtectedRoute allowedRoles={["Administrador", "Recepción"]} />,
        children: [
          {
            index: true,
            element: <UsuariosPage />,
          },
        ],
      },
      {
        path: "/salas",
        element: <ProtectedRoute allowedRoles={["Administrador", "Recepción"]} />,
        children: [
          {
            index: true,
            element: <SalasPage />,
          },
        ],
      },
      {
        path: "/metricas",
        element: <ProtectedRoute allowedRoles={["Administrador", "Recepción"]} />,
        children: [
          {
            index: true,
            element: <MetricasPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];
