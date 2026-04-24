// src/app/services/auth.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterRequest, RegisterResponse, VerifyEmailResponse } from '../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  // Registrar usuario (envía la petición con credenciales)
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data, {
      withCredentials: true // Importante para enviar/recibir cookies
    });
  }

  sendVerificationCode(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-verification-code`, { correo: email });
  }

  // Verificar el código y activar la cuenta
  verifyEmail(email: string, code: string): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${this.apiUrl}/verify-email`, { correo: email, codigo: code });
  }

  // Guardar tokens en cookies (accesible desde JS, sin HttpOnly)
  saveTokens(accessToken: string, refreshToken: string): void {
    // Calcular expiración (ejemplo: 7 días para refresh, 1 hora para access)
    const accessExpires = new Date();
    accessExpires.setTime(accessExpires.getTime() + 60 * 60 * 1000); // 1 hora
    const refreshExpires = new Date();
    refreshExpires.setTime(refreshExpires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 días

    this.setCookie('access_token', accessToken, accessExpires);
    this.setCookie('refresh_token', refreshToken, refreshExpires);
  }

  // Obtener un token desde la cookie
  getAccessToken(): string | null {
    return this.getCookie('access_token');
  }

  getRefreshToken(): string | null {
    return this.getCookie('refresh_token');
  }

  // Eliminar cookies (logout)
  clearTokens(): void {
    this.deleteCookie('access_token');
    this.deleteCookie('refresh_token');
  }

  // Redirigir después del registro
  redirectToDashboard(): void {
    window.location.href = '/';
  }

  // --- Utilidades para cookies ---
  private setCookie(name: string, value: string, expires: Date): void {
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  }

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }
}