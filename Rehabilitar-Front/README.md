# RehabilitAR Frontend

Frontend web application for a rehabilitation/physical therapy management system.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app runs at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Configuration

- API base URL is configurable via `VITE_API_URL` environment variable
- Default: `http://localhost:5000/api`

## Project Structure

```
src/
├── api/           # Axios client and API services
├── components/    # Reusable UI components
│   ├── layout/    # MainLayout, Header, Sidebar
│   └── ui/        # Button, Input, Card, Modal, etc.
├── features/      # Feature-based pages
│   ├── auth/      # Login, Register, Password Recovery
│   ├── usuarios/  # Dashboard, Users, Profile
│   ├── actividades/ # Activities, Calendar
│   ├── reservas/  # Reservations
│   ├── salas/     # Rooms management
│   └── metricas/  # Business metrics
├── hooks/         # Custom hooks (useAuth)
├── routes/        # Route configuration
└── types/         # TypeScript interfaces
```

## Authentication

The app supports 5 roles: `admin`, `reception`, `professor`, `registered_client`, `guest`

Role-based route protection is implemented.

## Development Notes

- The sidebar has been converted to a horizontal top navigation bar
- For local development without backend, user can be manually set in localStorage:
```javascript
localStorage.setItem('token', 'mock-token');
localStorage.setItem('user', JSON.stringify({ id: '1', nombre: 'Test', apellido: 'User', email: 'test@test.com', rol: 'admin', activo: true, fechaAlta: '2026-01-01' }));
location.reload();
```