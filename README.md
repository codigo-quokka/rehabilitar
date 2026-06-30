# 🏥 RehabilitAR

> Sistema de gestión integral para centros de kinesiología. 
> Proyecto desarrollado para la cátedra de Ingeniería de Software II (IS2) - UNLP (2026).
> **Equipo:** Código Quokka

---

## 📖 Sobre el Proyecto

RehabilitAR busca digitalizar y optimizar la administración de un centro kinesiológico. Permite a los clientes gestionar sus reservas y abonos, mientras que al personal del centro le brinda herramientas de administración, control de cupos, asistencia y métricas de negocio.

### ✨ Características Principales
- **Gestión de Usuarios y Roles:** Administrador, Recepción, Profesor y Cliente (con autenticación JWT y sistema de suspensión por inasistencias).
- **Gestión de Actividades:** Creación de actividades con control estricto de cupos, salas y ciclo de vida (Iniciar/Finalizar clase).
- **Sistema de Reservas:** Reserva de turnos, listas de espera priorizadas y pagos con descuentos automáticos por cancelaciones previas.
- **Métricas:** Reportes y estadísticas para la toma de decisiones.

---

## 🧪 Pruebas Unitarias

El proyecto cuenta con una suite de pruebas robusta (xUnit + FluentAssertions) para asegurar la integridad de las reglas de negocio.

Para ejecutar las pruebas del backend:
```bash
dotnet test Rehabilitar-back/Application.UnitTests/Application.UnitTests.csproj
```

---

## 📧 Sistema de Notificaciones

### Email (Resend)
El backend envía emails transaccionales mediante **Resend**. Actualmente están hardcodeados a `codigoquokka@hotmail.com` — cuando se configure un dominio verificado se cambiará al destinatario real.

Se envían emails en: registro, reseteo de contraseña, cambio de contraseña, asignación de profesor, cancelación de actividad/reserva, suspensión/reactivación de cuenta, y evaluación de apto físico. Todos los envíos son no-bloqueantes (wrapped en `try/catch` con logging).

### notificacionAplicacion (Preferencia In-App)
Cada usuario tiene una preferencia `notificacionAplicacion` (`bool`, default `true`) que controla si las notificaciones dentro del sistema se persisten en la base de datos y aparecen en la bandeja de notificaciones. Si está en `false`, el toast sigue mostrándose, pero no se guarda ni aparece en el tray. Se sincroniza server-side (columna en Users table) y se refleja en el frontend al hacer login o editar el perfil.

---

## 🛠️ Stack Tecnológico

El proyecto está dividido en dos aplicaciones principales y sigue los principios de **Clean Architecture** en el backend y una estructura **Feature-based** en el frontend.

**Backend (`/Rehabilitar-back`)**
- **Framework:** .NET 10 (ASP.NET Core Web API)
- **Base de Datos:** SQLite + Entity Framework Core
- **Autenticación:** ASP.NET Identity + JWT Bearer
- **API Documentation:** Scalar

**Frontend (`/Rehabilitar-front`)**
- **Librería:** React 19 + TypeScript
- **Bundler:** Vite
- **Estilos:** Tailwind CSS v4
- **Calidad:** Fuerte enfoque en accesibilidad web (WCAG 2.2)

---

## 🚀 Guía de Instalación (Local)

### Requisitos Previos
- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v20+)
- Git

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd rehabilitar
```

### 2. Levantar el Backend (API)
Navega a la carpeta del backend, aplica las migraciones y ejecuta el servidor:
```bash
cd Rehabilitar-back
dotnet ef database update --project src/Infrastructure/Infrastructure.csproj --startup-project src/API/API.csproj
dotnet run --project src/API/API.csproj
```
> La API estará disponible en `http://localhost:5000` (o el puerto configurado) y la documentación en `/scalar/v1`.

### 3. Levantar el Frontend (Cliente)
En una nueva terminal, navega a la carpeta del frontend, instala las dependencias y levanta el entorno de desarrollo:
```bash
cd Rehabilitar-front
npm install
npm run dev
```
> La aplicación web estará disponible en `http://localhost:5173`.

---

## 📁 Estructura del Repositorio

```text
/
├── Rehabilitar-back/          # Backend solution (.NET 10)
│   ├── src/
│   │   ├── API/               # Entry point, Controllers
│   │   ├── Application/       # Logic, DTOs & Interfaces
│   │   ├── Domain/            # Business Entities & Rules
│   │   └── Infrastructure/    # DB, EF Core & Identity Setup
│   └── docs/                  # Documentación oficial (SRS + PGP)
└── Rehabilitar-front/         # Frontend application (React 19)
    └── src/
        ├── api/               # API clients (Axios/Fetch)
        ├── components/        # Reusable UI components
        ├── features/          # Feature-based modules (actividades, auth, etc.)
        └── hooks/             # Custom React hooks
```


