import { apiClient } from './client';
import { EmailVerificationData, LoginCredentials, RegisterData, User } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials, {
      // @ts-expect-error
      ignoreAuthInterceptor: true
    });
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      dni: data.dni,
      fechaNacimiento: data.fechaNacimiento,
      telefono: data.telefono,
    });
    return response.data;
  },

  verifyEmail: async (data: EmailVerificationData) => {
    const response = await apiClient.post('/auth/verify-email', {
      userId: data.userId,
      confirmationToken: data.confirmationToken,
    });
    return response.data;
  },
  
  resendVerificationEmail: async (email: string) => {
    const response = await apiClient.post('/auth/resend-verification-email', { email });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  recoverPassword: async (email: string) => {
    const response = await apiClient.post('/auth/recover', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post('/auth/reset', { token, password });
    return response.data;
  },
};