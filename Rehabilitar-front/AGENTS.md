# AGENTS.md - RehabilitAR Frontend

## Project Overview

- **Project name**: RehabilitAR Frontend
- **Type**: Web application (React SPA)
- **Purpose**: Rehabilitation/physical therapy management system
- **Stack**: React 19 + Vite + TypeScript + React Router + Tailwind CSS + Axios

## Commands

- `npm run dev` - Start development server (port 5173)
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
 ├─ api/           # Axios client and API services
 │   ├─ client.ts      # Centralized Axios instance
 │   ├─ auth.ts        # Authentication API
 │   ├─ usuarios.ts    # Users API
 │   ├─ actividades.ts # Activities API
 │   ├─ reservas.ts    # Reservations API
 │   ├─ salas.ts       # Rooms API
 │   └─ metricas.ts    # Metrics API
 ├─ components/
 │   ├─ layout/       # MainLayout, Sidebar, Header
 │   └─ ui/           # Reusable UI components (Button, Input, Card, Modal, Table, Select, Badge)
 ├─ context/         # React context providers (ThemeContext)
 ├─ features/
 │   ├─ auth/         # Login, Register, PasswordRecovery pages
 │   ├─ usuarios/     # Dashboard, Usuarios, Perfil pages
 │   ├─ actividades/  # Actividades, Calendario pages
 │   ├─ reservas/     # Reservas page
 │   ├─ salas/        # Salas page
 │   └─ metricas/     # Metricas page
 ├─ hooks/           # Custom hooks (useAuth)
 ├─ routes/          # Route configuration with role-based protection
 ├─ types/           # TypeScript interfaces
 └─ App.tsx          # App entry point
```

## Brand Palette

- Primary: #4ABC8F, #3AAC80, #2E9B70, #258A60
- Secondary: #2F6274, #2F4858
- Backgrounds: #EAF2F8, #E0EBF4, #F0F6FB
- Borders: #D8E3ED

## Authentication

- 4 roles: Administrador, Recepción, Profesor, Cliente Registrado
- Role-based route protection
- Token stored in localStorage

## API Configuration

- Base URL: `http://localhost:5000/api` (configurable via VITE_API_URL env var)
- Auth token automatically added via interceptor
- 401 errors auto-redirect to login

## Design Rules

- No pure white (#FFFFFF) - use #FBFBFB (or #EAF2F8 for page bg) instead
- Soft shadows, subtle rounded corners
- Fully responsive
- Apple-inspired minimalist aesthetic

## Skills & Best Practices

This project follows guidelines from these installed skills:

### React Best Practices (vercel-react-best-practices)
- Use `Promise.all()` for parallel independent API calls
- Use functional state updates (`setState(prev => ...)`)
- Implement lazy state initialization for expensive computations
- Use `useCallback` for stable function references in dependencies
- Apply `useMemo` for expensive derived state calculations

### Composition Patterns (vercel-composition-patterns)
- Use compound components for complex UI (e.g., Modal with sub-components)
- Prefer children composition over render props
- Define generic context interfaces for reusable components

### Accessibility (WCAG 2.2)
- All interactive elements are keyboard accessible
- Focus states use `:focus-visible` with visible indicators
- Skip links provided for main content
- Proper ARIA labels on icon-only buttons
- Form inputs have programmatically associated labels
- Color contrast meets AA standards (4.5:1 for normal text)
- Reduced motion respected via `prefers-reduced-motion` media query

### SEO
- Semantic HTML with proper heading hierarchy (single `<h1>` per page)
- Meta description and title tags in index.html
- Proper lang attribute on `<html>` element
- Canonical URL configured

### Tailwind CSS Patterns
- Mobile-first responsive design using `sm:`, `md:`, `lg:` prefixes
- Use design tokens from theme configuration
- Extract repeated patterns into reusable component classes

### Notification & Toast System
- **Hook**: `useNotifications` (src/hooks/useNotifications.tsx) - centralized notification state management
- **NotificationTray**: Bell icon in header with unread indicator (src/components/layout/NotificationTray.tsx)
- **Notitoast**: Reusable toast component (src/components/Notitoast.tsx) with success/error/info variants
  - Props: `type`, `message`, `onClose`, `duration` (default 4000ms)
  - Auto-dismiss, animations, manual close button
- Notifications shared between toast and tray
- **Flow**: All notifications added via `addNotification` first appear as a `Notitoast`. Only after the toast is dismissed (auto or manually) does it get added to `NotificationTray`. This is handled centrally in `NotificationsProvider` via `pendingToast` state and `dismissToast` function.

## Dark mode conventions

### Strategy
- **Class-based Tailwind dark mode**. The `dark` class lives on `<html>` and is managed by `ThemeContext` (`src/context/ThemeContext.tsx`).
- Never use `prefers-color-scheme` media queries for UI colors — always use Tailwind's `dark:` variant.
- The toggle button is in `Header.tsx`; theme persists via `localStorage` key `"rehabilitar-theme"`.

### How to consume
- **Visual styling only**: Use Tailwind `dark:` variants directly on className strings. No JS needed.
- **Programmatic access**: Import `useTheme` from `src/context/ThemeContext` only if the component needs to react to the theme (e.g. conditional rendering of icon variants).

### Color conventions

| Role | Light (default) | Dark |
|---|---|---|
| Page background | `bg-bg-main` (#EAF2F8) | `dark:bg-gray-950` |
| Page gradient | `from-bg-main via-bg-secondary to-bg-surface` | `dark:from-gray-950 dark:via-gray-900 dark:to-gray-950` |
| Surface/Card | `bg-white` | `dark:bg-gray-900` |
| Surface (alt) | `bg-gray-50` / `bg-bg-surface` (#F0F6FB) | `dark:bg-gray-800/50` |
| Hover state | `hover:bg-gray-100` | `dark:hover:bg-gray-700` |
| Table row hover | `hover:bg-gray-50` | `dark:hover:bg-gray-800/50` |
| Primary text | `text-dark` (#2F4858) | `dark:text-gray-100` |
| Secondary text | `text-gray-500` / `text-gray-600` | `dark:text-gray-400` |
| Muted text | `text-gray-700` | `dark:text-gray-300` |
| Borders | `border-border` (#E8E8ED) / `border-gray-200` / `border-gray-300` | `dark:border-gray-700` |
| Modal backdrop | `bg-black/40` | (same) |
| Button ghost | `border-gray-300` `text-dark` `hover:bg-gray-200` | `dark:border-gray-600` `dark:text-gray-100` `dark:hover:bg-gray-700` |
| Button danger | `bg-red-400` | `dark:bg-red-600` |

### Mandatory checklist for every new component
Every background, text, and border color MUST include a `dark:` variant. Specifically:
- Every `bg-*` has a `dark:bg-*` variant.
- Every `text-*` has a `dark:text-*` variant.
- Every `border-*` has a `dark:border-*` variant.
- No hardcoded hex colors in `className` or `style` props unless a `dark:` equivalent is also present.
- Icons must be visible in both modes (use `currentColor` with text color inheritance).
- `"Sin asignar"` / empty-state text must use `text-gray-500 dark:text-gray-400`.

### Existing dark-mode-compatible components (no per-callsite overrides needed)
- `Notitoast` — already handles success/error variants in dark mode
- `ConfirmActionModal` — inherits dark styles from Modal
- `Card` — bg-white borders covered
- `Table` — header, rows, hover all covered
- `Input` — border, background, text all covered
- `Select` — border, background, text all covered
- `Badge` — all 5 variants (default, success, warning, danger, info) covered
- `Button` — all 5 variants (primary, secondary, outline, ghost, danger) covered
- `FilterDropdown` — trigger, dropdown panel, select all covered
- `Modal` — backdrop, container, header, close button, body all covered
- `NotificationTray` — panel, header, item hover all covered
- `PrivacyEye` — icon button covered
- `Sidebar` — nav background, link states all covered

### localStorage key
- `"rehabilitar-theme"` — do not use this key for anything else.

## Auto-Update Documentation

When making significant changes or adding new features, run:

```bash
# Update AGENTS.md and README.md with new information
# Review and manually update as needed
```

**Note**: This command is informational only. Manually update AGENTS.md and README.md when:
- New API endpoints are added
- New features are implemented
- Dependencies change
- Project structure changes
- New skills are installed

## Commit Types Cheatsheet

**Before suggesting a commit type, think carefully about what the change actually does.** Do not default to `feat`. Use `fix` for behavior corrections, `refactor` for restructuring without behavior changes, `style` for cosmetic/formatting only, etc.

Use this reference when creating git commits:

- **feat** – New feature or functionality
- **fix** – Fix a bug in production code
- **perf** – Performance improvements
- **refactor** – Code restructuring without behavior change
- **style** – Formatting and cosmetic changes only
- **test** – Adding or modifying tests
- **docs** – Documentation changes
- **build** – Build process or dependencies (production)
- **ci** – CI/CD configuration changes
- **chore** – Maintenance tasks (dev dependencies, .gitignore, etc.)
- **revert** – Revert a previous commit

Examples:
```
feat(ui): add dark mode toggle
fix: correct null pointer handling
refactor: extract utility functions
chore: organize project structure
```

> When asked for a commit message, always follow this standard: `type(scope): description` in lowercase English.

---

## Current Project State

### Propósito y Stack
- Sistema de gestión para centros de kinesiología/rehabilitación
- **Backend:** .NET 10, ASP.NET Core Web API, SQLite, Entity Framework Core, JWT Bearer auth
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- Enfoque en accesibilidad WCAG 2.2

### Roles de usuario (4)
- `Administrador` - Administrador del sistema
- `Recepción` - Personal de recepción
- `Profesor` - Profesor/Instructor
- `Cliente Registrado` - Cliente registrado

### Componentes y páginas implementadas (Frontend)
| Componente/Página | Descripción |
|-------------------|-------------|
| `LoginPage` | Página de inicio de sesión con verificación de email |
| `RegisterPage` | Registro de nuevos usuarios con validación de contraseña |
| `PasswordRecoveryPage` | Recuperación de contraseña |
| `EmailVerificationPage` | Verificación de email |
| `DashboardPage` | Dashboard principal con métricas y resumen |
| `PerfilPage` | Perfil del usuario con edición |
| `UsuariosPage` | Gestión de usuarios (Administrador/Recepción) |
| `ActividadesPage` | Listado y creación de actividades |
| `CalendarioPage` | Vista de calendario de actividades |
| `ReservasPage` | Gestión de reservas de usuarios |
| `SalasPage` | Gestión de salas (Administrador/Recepción) |
| `MetricasPage` | Métricas y reportes (Administrador/Recepción) |
| `Sidebar` | Navegación con filtros por rol |
| `Header` | Header con logout con confirmación |
| `NotificationTray` | Bandeja de notificaciones |
| `Notitoast` | Componente toast para notificaciones |

### Arquitectura de notificaciones
- **Hook:** `useNotifications` en `src/hooks/useNotifications.tsx`
- **Estado:** Array de objetos `Notification` con estructura `{ id, message, timestamp, read, type }`
- **Notitoast:** Componente visual que acepta `type` (success/error/info), `message`, `onClose`, `duration`
- **Notificaciones compartidas:** Mismo estado para toast y NotificationTray
- **Integración:** Se usa tanto para feedback de acciones como para errores de API

### Convenciones importantes
- **API Base URL:** `http://localhost:5129/api` (configurable via `VITE_API_URL`)
- **CamelCase:** El backend devuelve camelCase (`token`, `user`, `id`, `nombre`) - el frontend debe usar camelCase al acceder a estos campos
- **Estilos:** Tailwind con tokens personalizados en `tailwind.config.js`
- **Colores brand:** Primary (#4ABC8F), Secondary (#2F6274)
- **No usar #FFFFFF:** Usar #FBFBFB en backgrounds
- **Accesibilidad:** Enfoque en keyboard navigation, focus states, skip links, ARIA labels
- **Auth:** Token JWT en localStorage, interceptor auto-añade Bearer token
- **Roles:** Protegido por `ProtectedRoute` con verificación de rol en `routes/index.tsx`
- **Logout:** Incluye diálogo de confirmación antes de cerrar sesión