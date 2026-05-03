import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { RegisterRequest, RegisterResponse, VerifyEmailResponse } from '../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })

export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private accessToken: string | null = null; // Se almacena el access token en memoria

  constructor(private http: HttpClient) {}

  /**
   * Se registra a un doctor.
   * Endpoint: POST /api/auth/register
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data);
  }

  /**
   * Envía código de verificación para validar correo
   * Endpoint: POST /api/auth/send-verification-code
   */
  sendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-verification-code`, { correo: email });
  }

  /**
   * Valida el correo mediante el código.
   * Endpoint: POST /api/auth/verify-email
   */
  verifyEmail(email: string, code: string): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(
      `${this.apiUrl}/verify-email`,
      { correo: email, codigo: code },
      { withCredentials: true }
    );
  }

  /**
   * Iniciar sesión en el sistema.
   * Endpoint: POST /api/auth/login
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      { correo: email, contrasena: password },
      { withCredentials: true }
    );
  }

  /**
   * Obtiene un nuevo token a partir del anterior.
   * Endpoint: POST /api/auth/refresh-token
   */
  refreshAccessToken(): Observable<{ access_token: string; expires_in: string }> {
    return this.http.post<{ access_token: string; expires_in: string }>(
      `${this.apiUrl}/refresh-token`,
      null,
      { withCredentials: true } // Envía automáticamente la cookie HttpOnly
    );
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

  /**
   * Guarda el token en session storage.
   */
  saveAccessToken(token: string): void {
    this.accessToken = token;
    sessionStorage.setItem('access_token', token);
  }

  /**
   * Obtiene el token actual.
   */
  getAccessToken(): string | null {
    if (!this.accessToken) {
        this.accessToken = sessionStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  /**
   * Limpia el token actual para cerrar sesión.
   */
  clearSession(): void {
    this.accessToken = null;
    sessionStorage.removeItem('access_token');
  }

  /**
   * Intenta reanudar la sesión usando la cookie de refresh token.
   * Si tiene éxito, guarda el nuevo token y devuelve true.
   * Si falla, elimina cualquier acceso y devuelve false.
   */
  resumeSession(): Observable<boolean> {
    return this.refreshAccessToken().pipe(
      map(res => {
        this.saveAccessToken(res.access_token);
        return true;
      }),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  /**
   * Indica si hay una sesión activa en este momento (solo en memoria/sessionStorage).
   * No intenta refrescar; para eso usar resumeSession() o un guard.
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }
}