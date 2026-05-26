import { apiClient } from './client';
import { EmailVerificationData, ResetPasswordData, LoginCredentials, RegisterData, User, ChangePasswordData } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await apiClient.post('/auth/login', credentials, {
      // @ts-expect-error
      ignoreAuthInterceptor: true
    });
    return response.data;
  },

  scanDni: async (file: File) => {
    const formData = new FormData();
    formData.append('frontImage', file);
    const response = await apiClient.post('/auth/scan-dni', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
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

  resetPassword: async (data: ResetPasswordData) => {
    const response = await apiClient.post('/auth/reset', {
      userId: data.userId,
      passwordResetToken: data.passwordResetToken,
      newPassword: data.newPassword
    });
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },
};