import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })

export class DocService {
  private apiUrl = 'http://localhost:3000/api/doc';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Envía la configuración del consultorio (logo, horarios, tratamientos).
   * Espera un FormData porque el logo es un archivo.
   * Endpoint: POST /api/doc/configure
   */
  configurarConsultorio(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/configure`, formData, {
      headers: {
        Authorization: `Bearer ${this.authService.getAccessToken()}`
      }
    });
  }

  /**
   * Obtiene la configuración actual del consultorio (logo_url, horarios, tratamientos).
   * Endpoint: GET /api/doc/configure
   */
  obtenerConfiguracion(): Observable<{
    logo_url: string | null;
    horarios: any[];
    tratamientos: any[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/configure`, {
      headers: {
        Authorization: `Bearer ${this.authService.getAccessToken()}`
      }
    });
  }
}