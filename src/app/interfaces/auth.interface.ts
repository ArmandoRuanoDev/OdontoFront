export interface RegisterRequest {
  nombre_usuario: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  correo_electronico: string;
  numero_telefono: string;
  fecha_nacimiento?: string;
  sexo_usuario?: 'M' | 'F' | 'O';
  contrasena: string;
  acepta_aviso_privacidad: boolean;
  acepta_terminos_condiciones: boolean;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    nombre_usuario: string;
    correo_electronico: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: string;
  };
}

export interface SendVerificationRequest {
  correo: string;
}

export interface VerifyEmailRequest {
  correo: string;
  codigo: string;
}

export interface VerifyEmailResponse {
  message: string;
  user: {
    id: number;
    nombre_usuario: string;
    correo_electronico: string;
    correo_verificado: boolean;
  };
  tokens?: {
    access_token: string;
    refresh_token: string;
    expires_in: string;
  };
}