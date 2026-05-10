# 🏥 RehabilitAR

> Sistema de gestión integral para centros de kinesiología. 
> Proyecto desarrollado para la cátedra de Ingeniería de Software II (IS2) - UNLP (2026).
> **Equipo:** Código Quokka

---

## 📖 Sobre el Proyecto

RehabilitAR busca digitalizar y optimizar la administración de un centro kinesiológico. Permite a los clientes gestionar sus reservas y abonos, mientras que al personal del centro le brinda herramientas de administración, control de cupos, asistencia y métricas de negocio.

### ✨ Características Principales
- **Gestión de Usuarios y Roles:** Administrador, Recepción, Profesor y Cliente (con autenticación JWT).
- **Gestión de Actividades:** Creación de actividades (frecuentes/recurrentes o esporádicas) con control estricto de cupos y salas.
- **Sistema de Reservas:** Reserva de turnos, listas de espera y pagos (planes de abono y presenciales).
- **Métricas:** Reportes y estadísticas para la toma de decisiones.

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


