export type Role = 'Administrador' | 'Recepción' | 'Profesor' | 'Cliente Registrado';

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
  especialidad?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type TipoEspecialidad = 'TrenSuperior' | 'TrenMedio' | 'TrenInferior';
export type FrecuenciaActividad = 'Recurrente' | 'Esporadica';
export type EstadoActividad = 'Propuesta' | 'Aprobada' | 'EnCurso' | 'Finalizada' | 'Cancelada';

export interface Actividad {
  id: string;
  nombre: string;
  descripcion: string;
  fechaYHora: string;
  tipo: string;
  frecuencia: string;
  estado: string;
  cupoMaximo: number;
  cupoDisponible: number;
  salaId: string;
  salaNombre: string;
  profesorId: string;
  profesorNombre: string | null;
  serieId: string;
}

export interface CreateActividadRequest {
  nombre: string;
  descripcion: string;
  tipo: TipoEspecialidad;
  frecuencia: FrecuenciaActividad;
  estado: EstadoActividad;
  fechaYHora: string;
  cupoMaximo: number;
  salaId: string;
  profesorId?: string;
  serieId?: string;
}

export interface CreateActividadRecurrenteRequest {
  actividadBase: CreateActividadRequest;
  fechaFinRecurrente: string;
}

export type EstadoDeReserva = 'PendienteDePago' | 'Activa' | 'EnEspera' | 'Cancelada';
export type TipoCliente = 'noAbonado' | 'Abonado';

export interface Reserva {
  id: string;
  clienteId: string;
  nombreCliente?: string;
  actividadId: string;
  fechaReserva: string;
  tipoCliente: TipoCliente;
  estadoDeReserva: EstadoDeReserva;
  montoTotal: number;
  montoPendiente: number;
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

export interface EmailVerificationData {
  userId: string;
  confirmationToken: string;
}

export interface ResetPasswordData {
  userId: string;
  passwordResetToken: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
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