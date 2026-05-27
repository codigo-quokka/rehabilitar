# RehabilitAR - Project context

This repository contains a management system for a kinesiology center, divided into two separate applications: a .NET 10 backend and a React 19 frontend.

## Project Structure & Boundaries

- **Not a monorepo**: The backend (`Rehabilitar-back/`) and frontend (`Rehabilitar-front/`) are independent projects. There is no root task runner or workspace file. Commands must be run within their respective directories.
- **Backend API (`Rehabilitar-back/`)**: .NET 10 ASP.NET Core Web API with SQLite & Entity Framework Core. Built with Clean Architecture.
- **Frontend SPA (`Rehabilitar-front/`)**: React 19 + TypeScript + Vite + Tailwind CSS v4. Feature-based structure.

## Backend (.NET 10) Commands & Quirks

- **Run API**: `cd Rehabilitar-back && dotnet run --project src/API/API.csproj` (runs on `http://localhost:5129`).
- **Swagger/Docs**: Available at `/scalar`.
- **Migrations**: `cd Rehabilitar-back && dotnet ef database update --project src/Infrastructure/Infrastructure.csproj --startup-project src/API/API.csproj`.
- **Error Handling (Crucial)**: Uses the `ErrorOr` library for the Result pattern. **Do not throw exceptions for business rules**. Application services return `ErrorOr<T>`.
- **Controllers**: API Controllers inherit from a custom `ApiControllerBase`. Always use the `.Match()` pattern to map `ErrorOr` results to HTTP Status Codes automatically (e.g., `return result.Match(salas => Ok(salas), errores => Problem(errores));`).
- **Data Access**: Repositories must be scoped and managed via `IUnitOfWork`.

## Frontend (React 19) Commands & Quirks

- **Run Dev**: `cd Rehabilitar-front && npm run dev` (runs on `http://localhost:5173`).
- **Lint**: `cd Rehabilitar-front && npm run lint`.
- **Casing**: The .NET backend returns JSON in `camelCase`. Ensure frontend models and API clients expect `camelCase` (e.g., `user.id`, `token`, `nombre`).
- **Dark Mode (Crucial)**: 
  - Managed via Tailwind `dark:` classes (a `dark` class on the `<html>` element). 
  - **Never** use `prefers-color-scheme` CSS media queries for colors. 
  - Every component with a background, text, or border color **must** include a `dark:` equivalent in its class list.
  - Theme state is in `ThemeContext` and persisted to `localStorage` key `"rehabilitar-theme"`.
- **Notifications**: Use the `useNotifications` hook (in `src/hooks/useNotifications.tsx`) for API feedback. All notifications must first appear as a `Notitoast`; only after the toast is dismissed (auto or manually) does it get added to the `NotificationTray`. This is handled centrally in `NotificationsProvider` via the `pendingToast` state and `dismissToast` function.
- **Styling Constraints**: Do not use pure white (`#FFFFFF`); use `#FBFBFB` or the theme's background colors (`#EAF2F8`). Ensure WCAG 2.2 accessibility compliance (keyboard nav, ARIA, focus states).
- **Routing/Auth**: Routes are protected via `ProtectedRoute` checking one of 4 roles (Administrador, Recepción, Profesor, Cliente Registrado). Token is stored in `localStorage` and automatically attached by Axios interceptors.

## General Conventions

- **Commits**: Use conventional commits (`type(scope): description`).
- There are currently no automated test suites configured for either backend or frontend. Focus on manual testing/previewing when making modifications.