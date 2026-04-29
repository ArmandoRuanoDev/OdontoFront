import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
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
  serverErrors: { [key: string]: string } = {};

  public rules: any = {
    nombre: (v: string) => {
      const value = v.trim().replace(/\s+/g, ' ');
      if (!value) return 'El nombre es obligatorio.';
      if (value.length < 3 || value.length > 50) return 'Debe tener entre 3 y 50 caracteres.';
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+(?:\s[A-Za-zÁÉÍÓÚáéíóúÜüÑñ]+)*$/.test(value))
        return 'Solo letras y espacios.';
      return '';
    },

    ap_pat: (v: string) => {
      if (!v.trim()) return 'El apellido paterno es obligatorio.';
      if (v.trim().length < 5 || v.trim().length > 50)
        return 'Debe tener entre 5 y 50 caracteres.';
      return '';
    },

    ap_mat: (v: string) => {
      if (!v.trim()) return 'El apellido materno es obligatorio.';
      if (v.trim().length < 2 || v.trim().length > 50)
        return 'Debe tener entre 2 y 50 caracteres.';
      if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]+$/.test(v))
        return 'Solo letras.';
      return '';
    },

    correo: (v: string) => {
      const value = v.trim().toLowerCase();
      if (!value) return 'El correo es obligatorio.';
      if (value.length < 10 || value.length > 100)
        return 'Debe tener entre 10 y 100 caracteres.';
      if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(value))
        return 'Correo inválido.';
      return '';
    },

    telefono: (v: string) => {
      const tel = `${this.lada}${v}`.replace(/[^\d+]/g, '');
      if (!v.trim()) return 'El teléfono es obligatorio.';
      if (tel.length < 10 || tel.length > 15)
        return 'Debe tener entre 10 y 15 dígitos.';
      if (!/^\+?[0-9]{10,15}$/.test(tel))
        return 'Formato inválido.';
      return '';
    },

    fecha_nac: (v: string) => {
      if (!v) return 'La fecha es obligatoria.';

      const nacimiento = new Date(v);
      if (isNaN(nacimiento.getTime()))
        return 'Fecha inválida.';

      const hoy = new Date();

      if (nacimiento > hoy)
        return 'No puede ser futura.';

      let edad = hoy.getFullYear() - nacimiento.getFullYear();

      const aunNoCumple =
        hoy.getMonth() < nacimiento.getMonth() ||
        (hoy.getMonth() === nacimiento.getMonth() &&
          hoy.getDate() < nacimiento.getDate());

      if (aunNoCumple) edad--;

      if (edad > 110) return 'Edad no válida.';
      if (edad < 18) return 'Debes ser mayor de edad.';

      return '';
    },

    password: (v: string) => {
      if (!v) return 'La contraseña es obligatoria.';
      if (v.length < 8) return 'Mínimo 8 caracteres.';
      if (v.length > 70) return 'Máximo 70 caracteres.';
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,70}$/.test(v))
        return 'Debe incluir mayúscula, minúscula, número, símbolo y sin espacios.';
      return '';
    },

    password2: (v: string) => {
      if (!v) return 'Confirma tu contraseña.';
      if (v !== this.password) return 'Las contraseñas no coinciden.';
      return '';
    }
  };

  private formatNombre(valor: string): string {
    return valor
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(p =>
      p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join(' ');
  }

  // Fortaleza de contraseña
  strengthLevel = 'weak';
  strengthFilled = 0;

  constructor(private authService: AuthService, private cdr: ChangeDetectorRef) {}

  validarCampo(campo: string, force = false): boolean {
    const valor = (this as any)[campo] ?? '';
    const error = this.rules[campo]?.(valor) ?? '';

    // Si existe un error del servidor para este campo, lo mantenemos
    // a menos que el campo haya sido modificado y ahora sea válido sintácticamente
    if (this.serverErrors[campo]) {
      if (!force && valor === '') {
        // Comportamiento original
      } else {
        // Si el campo ahora es sintácticamente válido, borramos el error del servidor
        if (error === '') {
          this.serverErrors[campo] = '';
        } else {
          // El error del servidor prevalece sobre la validación sintáctica
          this.errorMessages[campo] = this.serverErrors[campo];
          return false;
        }
      }
    }

    this.errorMessages[campo] = error;
    return error === '';
  }

  // Evita espacios innecesarios en nombres
  allowOnlyLetters(event: KeyboardEvent) {
    const key = event.key;

    // Permitir teclas especiales
    if (
      key === 'Backspace' ||
      key === 'Tab' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'Delete'
    ) return;

    // Solo letras y espacio
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]$/.test(key)) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;

    // No permitir espacio al inicio
    if (key === ' ' && input.selectionStart === 0) {
      event.preventDefault();
      return;
    }

    // No permitir doble espacio seguido
    if (key === ' ' && input.value.endsWith(' ')) {
      event.preventDefault();
    }
  }

  // Solo números para teléfono
  allowOnlyNumbers(event: KeyboardEvent) {
    const key = event.key;

    if (
      key === 'Backspace' ||
      key === 'Tab' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'Delete'
    ) return;

    if (!/^\d$/.test(key)) {
      event.preventDefault();
    }
  }

  onInputChange(campo: string) {

    switch (campo) {

      case 'nombre':
      case 'ap_pat':
      case 'ap_mat':
        (this as any)[campo] = (this as any)[campo]
          .replace(/[^A-Za-zÁÉÍÓÚáéíóúÜüÑñ\s]/g, '') // Solo letras
          .replace(/\s{2,}/g, ' ')
          .replace(/^\s+/g, '');
        (this as any)[campo] = this.formatNombre((this as any)[campo]);
      break;

      case 'correo':
        this.correo = this.correo
        .replace(/\s/g, '')
        .toLowerCase();

        // Limpiar error del servidor si el usuario está escribiendo
        if (this.serverErrors['correo']) {
          this.serverErrors['correo'] = '';
        }
      break;

      case 'telefono':
        this.telefono = this.telefono
          .replace(/\D/g, '') // Solo números
          .slice(0, 10); // Máximo 10 números
        break;

      case 'password':
      case 'password2':
        (this as any)[campo] = (this as any)[campo]
          .replace(/\s/g, ''); // Sin espacios
        break;
    }

    this.validarCampo(campo, false);

    if (campo === 'password') {
      this.checkPasswordStrength();
      this.validarCampo('password2', true);
    }

    if (campo === 'password2') {
      this.validarCampo('password2', true);
    }
  }

  onBlur(campo: string) {
    if (typeof (this as any)[campo] === 'string') {
      (this as any)[campo] = (this as any)[campo].trim();

      if (campo === 'nombre' || campo === 'ap_pat' || campo === 'ap_mat') {
        (this as any)[campo] = this.formatNombre((this as any)[campo]);
      }
    }

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

    const requestData = this.mapToRegisterRequest();

    this.authService.register(requestData).subscribe({
      next: (response) => {

        // Guardar correo temporalmente
        localStorage.setItem('verify_email', response.user.correo_electronico);

        // Envíar código al correo ingresado
        this.authService.sendVerificationCode(response.user.correo_electronico)
        .subscribe({
          next: () => {

            const toast = document.getElementById('successToast');
            if (toast) toast.style.display = 'flex';

            if (btn) {
              btn.textContent = 'Cuenta creada';
            }

            setTimeout(() => {
              window.location.href = '/verificar-correo';
            }, 1200);

          },
          error: () => {
            alert('Cuenta creada, pero no se pudo enviar el código.');
          }
        });

      },

      error: (error) => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Crear mi cuenta gratis';
        }

        if (error.status === 400 && error.error?.errors) {
          alert(error.error.errors.join('\n'));
        } else if (error.status === 409) {
          const mensaje = error.error?.message || error.error?.error || 'Este correo ya está registrado.';
          this.serverErrors['correo'] = mensaje;
          this.errorMessages['correo'] = mensaje;
          this.cdr.detectChanges();

          const inputCorreo = document.getElementById('correo') as HTMLInputElement;
          inputCorreo?.focus();
        } else {
          alert('Error inesperado.');
        }
      }
    });
  }

  // Convierte los campos del formulario
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

  handleGoogle() {
    alert('Redirigiendo a Google OAuth...');
  }
}