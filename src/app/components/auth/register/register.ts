import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
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

  // Fortaleza de contraseña
  strengthLevel = 'weak';
  strengthFilled = 0;

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

  handleSubmit() {
    if (!this.validarFormulario()) return;
    const btn = document.getElementById('btnSubmit') as HTMLButtonElement;
    if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }
    setTimeout(() => {
      const toast = document.getElementById('successToast');
      if (toast) toast.style.display = 'flex';
      if (btn) { btn.style.background = '#3B6D11'; btn.textContent = '¡Cuenta creada!'; }
    }, 1300);
  }

  handleGoogle() {
    alert('Redirigiendo a Google OAuth...');
  }
}