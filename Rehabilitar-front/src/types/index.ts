export type Role = 'admin' | 'reception' | 'professor' | 'registered_client' | 'guest';

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: Role;
  telefono?: string;
  fechaNacimiento?: string;
  documento?: string;
  aptitudFisica?: boolean;
  fechaAptitud?: string;
  activo: boolean;
  fechaAlta: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Actividad {
  id: string;
  nombre: string;
  descripcion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  capacidadMaxima: number;
  inscritoss: number;
  profesorId: string;
  salaId: string;
  categoria: string;
  activo: boolean;
}

export interface Reserva {
  id: string;
  usuarioId: string;
  actividadId: string;
  fechaReserva: string;
  estado: 'confirmada' | 'cancelada' | 'completada' | 'asistio' | 'no_asistio';
  fechaCancelacion?: string;
  metodoPago?: string;
  monto?: number;
  observaciones?: string;
}

export interface Sala {
  id: string;
  nombre: string;
  capacidad: number;
  descripcion?: string;
  activo: boolean;
}

export interface Metricas {
  totalUsuarios: number;
  usuariosActivos: number;
  totalReservas: number;
  reservasConfirmadas: number;
  reservasCanceladas: number;
  reservasDia: number;
  ingresosTotales: number;
  actividadesDia: number;
  ocupacionSalas: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dni: string;
  fechaNacimiento: string;
  telefono?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: 'success' | 'error' | 'info';
}