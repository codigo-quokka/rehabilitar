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

- Primary: #6DD3A8, #48B7A5, #309B9B, #2C7E8B
- Secondary: #2F6274, #2F4858
- Backgrounds: #FBFBFB, #F5F5F7, #F9F9FB
- Borders: #E8E8ED

## Authentication

- 5 roles: admin, reception, professor, registered_client, guest
- Role-based route protection
- Token stored in localStorage

## API Configuration

- Base URL: `http://localhost:5000/api` (configurable via VITE_API_URL env var)
- Auth token automatically added via interceptor
- 401 errors auto-redirect to login

## Design Rules

- No pure white (#FFFFFF) - use #FBFBFB instead
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