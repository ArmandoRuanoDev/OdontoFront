import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest, RegisterResponse, VerifyEmailResponse } from '../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private accessToken: string | null = null; // Se almacena el access token en memoria

  constructor(private http: HttpClient) {}

  // Registro
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  // Enviar código de verificación
  sendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-verification-code`, { correo: email });
  }

  // Verificar email
  verifyEmail(email: string, code: string): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(
      `${this.apiUrl}/verify-email`,
      { correo: email, codigo: code },
      { withCredentials: true }
    );
  }

  // Login
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      { correo: email, contrasena: password },
      { withCredentials: true }
    );
  }

  // Refrescar token
  refreshAccessToken(): Observable<{ access_token: string; expires_in: string }> {
    return this.http.post<{ access_token: string; expires_in: string }>(
      `${this.apiUrl}/refresh-token`,
      null,
      { withCredentials: true } // Envía automáticamente la cookie HttpOnly
    );
  }

  // Guardar / obtener los access token
  saveAccessToken(token: string): void {
    this.accessToken = token;
    sessionStorage.setItem('access_token', token);
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
        this.accessToken = sessionStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  // Cerrar sesión
  clearSession(): void {
    this.accessToken = null;
    sessionStorage.removeItem('access_token');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Envía un código de 6 dígitos al correo registrado.
   * Endpoint: POST /api/auth/send-password-reset-code
   */
  sendPasswordResetCode(correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-password-reset-code`, { correo });
  }

  /**
   * Verifica el código de 6 dígitos.
   * Endpoint: POST /api/auth/verify-password-code
   * Retorna { message, reset_token, expires_in }
   */
  verifyPasswordResetCode(correo: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-password-code`, { correo, codigo });
  }

  /**
   * Cambia la contraseña usando el reset_token obtenido en la verificación.
   * Endpoint: POST /api/auth/reset-password
   */
  resetPassword(resetToken: string, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      reset_token: resetToken,
      nueva_contrasena: nuevaContrasena
    });
  }

}