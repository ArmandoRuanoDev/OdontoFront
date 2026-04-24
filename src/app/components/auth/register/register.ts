import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; // <-- Importante para standalone
import { AuthService } from '../../../services/auth';
import { RegisterRequest } from '../../../interfaces/auth.interface';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})

export class Register {

  // Datos del formulario
  nombre = '';
  ap_pat = '';
  ap_mat = '';
  correo = '';
  telefono = '';
  fecha_nac = '';
  password = '';
  password2 = '';
  sexo = '';
  lada = '+52';
  privacidad = false;
  terminos = false;

  showPwStrength = false;
  errorMessages: { [key: string]: string } = {};

  private rules: any = {
    nombre: (v: string) => !v ? 'El nombre es obligatorio.' : v.length < 2 ? 'Mínimo 2 caracteres.' : /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/.test(v) ? 'Solo letras y espacios.' : '',
    ap_pat: (v: string) => !v ? 'El apellido paterno es obligatorio.' : v.length < 2 ? 'Mínimo 2 caracteres.' : /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/.test(v) ? 'Solo letras.' : '',
    ap_mat: (v: string) => !v ? 'El apellido materno es obligatorio.' : v.length < 2 ? 'Mínimo 2 caracteres.' : /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/.test(v) ? 'Solo letras.' : '',
    correo: (v: string) => !v ? 'El correo es obligatorio.' : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Correo inválido. Ej: nombre@dominio.com',
    telefono: (v: string) => !v ? 'El teléfono es obligatorio.' : /^\d{7,15}$/.test(v.replace(/\s/g, '')) ? '' : 'Ingresa entre 7 y 15 dígitos numéricos.',
    fecha_nac: (v: string) => {
      if (!v) return 'La fecha de nacimiento es obligatoria.';
      const d = new Date(v);
      const n = new Date();
      const age = Math.floor((n.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
      return age < 0 || age > 110 ? 'Fecha fuera de rango.' : age < 18 ? 'Debes tener al menos 18 años para registrarte.' : '';
    },
    password: (v: string) => !v ? 'La contraseña es obligatoria.' : v.length < 8 ? 'Mínimo 8 caracteres.' : /[A-Za-z]/.test(v) && /[0-9]/.test(v) ? '' : 'Debe tener letras y al menos un número.',
    password2: (v: string) => !v ? 'Confirma tu contraseña.' : v === this.password ? '' : 'Las contraseñas no coinciden.'
  };

  // Fortaleza de contraseña
  strengthLevel = 'weak';
  strengthFilled = 0;

  constructor(private authService: AuthService) {}

  validarCampo(campo: string, force = false): boolean {
    const valor = (this as any)[campo] || '';
    const error = this.rules[campo]?.(valor) || '';
    if (force || valor) {
      this.errorMessages[campo] = error;
      return !error;
    }
    return !error;
  }

  onInputChange(campo: string) {
    this.validarCampo(campo, false);
    if (campo === 'password') {
      this.checkPasswordStrength();
      this.validarCampo('password2', true);
    }
    if (campo === 'password2') this.validarCampo('password2', true);
  }

  onBlur(campo: string) {
    this.validarCampo(campo, true);
  }

  checkPasswordStrength() {
    const v = this.password;
    if (!v) {
      this.showPwStrength = false;
      return;
    }
    this.showPwStrength = true;
    let s = 0;
    if (v.length >= 8) s++;
    if (v.length >= 12) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    this.strengthLevel = s <= 1 ? 'weak' : s <= 3 ? 'fair' : 'strong';
    this.strengthFilled = s <= 1 ? 1 : s <= 2 ? 2 : s <= 3 ? 3 : 4;
  }

  getBarClass(barIndex: number): string {
    if (!this.showPwStrength) return 'pw-bar';
    if (barIndex <= this.strengthFilled) return `pw-bar ${this.strengthLevel}`;
    return 'pw-bar';
  }

  getStrengthLabel(): string {
    if (!this.showPwStrength) return '';
    if (this.strengthLevel === 'weak') return 'Contraseña débil';
    if (this.strengthLevel === 'fair') return 'Contraseña regular';
    return 'Contraseña fuerte';
  }

  getStrengthColor(): string {
    if (this.strengthLevel === 'weak') return '#A32D2D';
    if (this.strengthLevel === 'fair') return '#854F0B';
    return '#3B6D11';
  }

  setSexo(val: string) {
    this.sexo = val;
    if (val) this.errorMessages['sexo'] = '';
  }

  togglePrivacidad() {
    this.privacidad = !this.privacidad;
    if (this.privacidad) this.errorMessages['privacidad'] = '';
  }

  toggleTerminos() {
    this.terminos = !this.terminos;
    if (this.terminos) this.errorMessages['terminos'] = '';
  }

  togglePassword(fieldId: string) {
    const input = document.getElementById(fieldId) as HTMLInputElement;
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  }

  validarFormulario(): boolean {
    let ok = true;
    const campos = ['nombre', 'ap_pat', 'ap_mat', 'correo', 'telefono', 'fecha_nac', 'password', 'password2'];
    for (let campo of campos) if (!this.validarCampo(campo, true)) ok = false;
    if (!this.sexo) { this.errorMessages['sexo'] = 'Selecciona tu sexo.'; ok = false; }
    if (!this.privacidad) { this.errorMessages['privacidad'] = 'Debes aceptar el aviso de privacidad.'; ok = false; }
    if (!this.terminos) { this.errorMessages['terminos'] = 'Debes aceptar los términos y condiciones.'; ok = false; }
    return ok;
  }

  // Registrar al usuario
  handleSubmit() {
    if (!this.validarFormulario()) return;

    const btn = document.getElementById('btnSubmit') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creando cuenta...';
    }

    // Mapear los datos del formulario al formato que espera el backend
    const requestData: RegisterRequest = this.mapToRegisterRequest();

    this.authService.register(requestData).subscribe({
      next: (response) => {
        // Guardar tokens
        this.authService.saveTokens(response.tokens.access_token, response.tokens.refresh_token);

        // Enviar correo
        this.authService.sendVerificationCode(response.user.correo_electronico);

        // Mostrar toast de éxito
        const toast = document.getElementById('successToast');
        if (toast) toast.style.display = 'flex';

        if (btn) {
          btn.style.background = '#3B6D11';
          btn.textContent = '¡Cuenta creada!';
        }

        // Redirigir después de 1.5 segundos
        setTimeout(() => {
          window.location.href = '/verificar-correo'
        }, 1500);
      },
      error: (error) => {
        // Restaurar botón
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Crear mi cuenta gratis';
          btn.style.background = '';
        }

        // Mostrar errores devueltos por el backend
        if (error.status === 400 && error.error?.errors) {

          const errores = error.error.errors;
          alert(errores.join('\n'));
        } else if (error.status === 409) {
          alert('El correo o teléfono ya está registrado.');
        } else {
          alert('Ocurrió un error inesperado. Revisa tu conexión o intenta más tarde.');
        }
      }
    });
  }

  // Convierte los campos del formulario al objeto que espera el backend
  private mapToRegisterRequest(): RegisterRequest {
    const nombreCompleto = `${this.nombre}`.trim();

    // Concatena lada + teléfono (eliminando espacios)
    const telefonoCompleto = `${this.lada}${this.telefono.replace(/\s/g, '')}`;

    // Mapeo de sexo: 'M', 'F' o 'O'
    let sexoMapping: 'M' | 'F' | 'O' | undefined = undefined;
    if (this.sexo === 'M') sexoMapping = 'M';
    if (this.sexo === 'F') sexoMapping = 'F';
    if (this.sexo === 'O') sexoMapping = 'O';

    return {
      nombre_usuario: nombreCompleto,
      apellido_paterno: this.ap_pat || undefined,
      apellido_materno: this.ap_mat || undefined,
      correo_electronico: this.correo,
      numero_telefono: telefonoCompleto,
      fecha_nacimiento: this.fecha_nac || undefined,
      sexo_usuario: sexoMapping,
      contrasena: this.password,
      acepta_aviso_privacidad: this.privacidad,
      acepta_terminos_condiciones: this.terminos
    };
  }

  // Mantén el método handleGoogle igual
  handleGoogle() {
    alert('Redirigiendo a Google OAuth...');
  }
}