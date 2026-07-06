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

## Email System (EmailService)

### Implementation
- **Service**: `Infrastructure/Email/EmailService.cs` implements `Application.Common.Interfaces.IEmailService`
- **Provider**: Resend (via `IResend` / `ResendClient`)
- **To address (TO-DO)**: Currently hardcoded to `codigoquokka@hotmail.com` in `SendEmailAsync()`. Must change to `userEmail` parameter when a verified domain is configured in Resend.
- **Email failures are non-blocking**: All email sends are wrapped in `try/catch` with `ILogger` logging; they never cause the primary action to fail.

### All EmailService Methods & Wiring

| Method | Triggers when | Wired in |
|--------|--------------|----------|
| `SendConfirmationEmail(userEmail, verificationLink)` | User registers (self-registration) — sends verification link | `AuthService.EnviarEmailDeVerificacion()` |
| `SendPasswordResetEmail(userEmail, link)` | User requests password reset | `AuthService.EnviarEmailDeResetPassword()` |
| `SendNewUserWithCredentialsEmail(userEmail, password)` | Admin creates a user with generated password | `UsuarioService.EnviarMailConCredenciales()` |
| `SendPasswordChangedEmail(userEmail)` | User changes their password successfully | `AuthService.ChangePasswordAsync()` |
| `SendAptoFisicoAprobadoEmail(userEmail)` | Apto físico is approved by admin | `AptoFisicoService.EvaluarAsync()` |
| `SendAptoFisicoRechazadoEmail(userEmail, motivoRechazo)` | Apto físico is rejected by admin | `AptoFisicoService.EvaluarAsync()` |
| `SendReservaConfirmadaEmail(userEmail, nombreActividad, fechaActividad)` | Reservation payment confirmed (RehabiliCoins, MercadoPago, or manual) | `ReservaService.ConfirmarPagoReservaAsync()`, `PagarIntencionConRehabilicoinsAsync()`, `PagarIntencionConMercadoPagoAsync()` |
| `SendPagoRegistradoEmail(userEmail, nombreActividad, fechaActividad, monto)` | Manual payment registered | `ReservaService.ConfirmarPagoReservaAsync()` |
| `SendReservaCanceladaEmail(userEmail, nombreActividad, fechaActividad)` | Reservation cancelled (single or series) | `ReservaService.CancelarReservaAsync()`, `CancelarSerieReservasAsync()` |
| `SendCancelacionDeActividadParaClientesEmail(userEmail, nombreActividad, fechaActividad, motivoCancelacion)` | Activity/series cancelled — notifies clients with reservations | `ActividadService.CancelarActividad()`, `CancelarSerie()` |
| `SendCancelacionDeActividadParaProfesoresEmail(userEmail, nombreActividad, fechaActividad, motivoCancelacion)` | Activity/series cancelled — notifies the assigned professor | `ActividadService.CancelarActividad()`, `CancelarSerie()` |
| `SendOportunidadDeActividadParaProfesoresEmail(userEmail, nombreActividad, fechaActividad)` | Professor removed from an activity | `ActividadService.RemoverProfesorActividad()` |
| `SendProfesorAsignadoEmail(userEmail, nombreActividad, fechaActividad)` | Professor assigned when creating, editing, or explicitly assigning | `ActividadService.CrearActividad()`, `CrearActividadRecurrente()`, `EditarActividad()`, `AsignarProfesorActividad()` |
| `SendCuentaSuspendidaEmail(userEmail)` | User account suspended | `UsuarioService.SuspenderAsync()` |
| `SendCuentaReactivadaEmail(userEmail, ...)` | User account reactivated | `UsuarioService.ReactivarAsync()` |
| `SendActividadModificadaParaClientesEmail(userEmail, nombreActividad, fechaActividad, descripcionCambios)` | Activity modified (name, room, or date/time changes) — notifies enrolled clients | `ActividadService.EditarActividad()` |
| `SendActividadModificadaParaProfesoresEmail(userEmail, nombreActividad, fechaActividad, descripcionCambios)` | Activity modified (name, room, or date/time changes) — notifies assigned professor | `ActividadService.EditarActividad()` |

### Important: Asignar-Profesor vs Editar endpoint
- `PUT /api/actividades/{id}/asignar-profesor` → `AsignarProfesorActividad()` — ONLY works if the activity has no professor yet (returns Conflict otherwise).
- `PUT /api/actividades/{id}` → `EditarActividad()` — used by the frontend edit form. Also triggers the professor-assigned email if `ProfesorId` changes.
- `POST /api/actividades` and `POST /api/actividades/recurrente` also trigger the email when a `ProfesorId` is provided at creation.

### EditarActividad Notification Behavior
- **Blocks editing** if `Estado == EnCurso` or `Finalizada`.
- When editing an activity that has enrolled clients and/or an assigned professor, the following notifications are triggered:

| What changed | Clients (email + tray) | Current professor (email + tray) | Old professor |
|---|---|---|---|
| **Nombre** | ✅ "Actividad modificada" with description | ✅ "Actividad modificada" with description | — |
| **Sala** | ✅ "Actividad modificada" with description | ✅ "Actividad modificada" with description | — |
| **Fecha/Hora** | ✅ "Actividad modificada" with description | ✅ "Actividad modificada" with description | — |
| **Profesor** (new) | ✅ "Actividad modificada" (general) | — | ✅ "Oportunidad de actividad" + tray "Actividad reasignada" |
| **Profesor** (old removed) | same as above | — | ✅ "Oportunidad de actividad" (email) + "Actividad reasignada" (tray) |
| **Combined** (any + profesor) | ✅ "Actividad modificada" with full changes | ✅ Only if non-profesor changes exist | ✅ "Oportunidad de actividad" + tray "Actividad reasignada" |

Notes:
- The new professor also gets the standard `SendProfesorAsignadoEmail` + tray notification (via `EnviarEmailProfesorAsignado`).
- Clients with cancelled reservations are **not** notified.
- Notifications are non-blocking (wrapped in try/catch with `ILogger`), consistent with the rest of the system.

### notificacionAplicacion (In-App Notification Preference)
- **Entity field**: `User.NotificacionAplicacion` (`bool`, default `true`)
- **DB column**: Added via migration `AddNotificacionAplicacion` with `DEFAULT TRUE`
- **Endpoint**: `PUT /api/usuarios/{id}` accepts `notificacionAplicacion` (nullable bool in `EditarUsuarioRequest`)
- **Frontend**: `User.notificacionAplicacion` in types. Synced to `useAuth().user` on login and toggle.
- **ImportantNotification hook** checks this preference: if `false`, shows toast but skips DB save and tray update.

### Missing Email Methods (not yet implemented)
- User deleted
- User profile updated
- Activity created (no email at all — separate from professor assignment notification)
- Activity started / finished
- Room CRUD (create, edit, activate/deactivate, delete)
- Payment registered via RehabiliCoins / MercadoPago (already sends reservation confirmation, but no separate payment notification)

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