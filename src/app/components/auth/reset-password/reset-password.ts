import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})

export class ResetPassword implements OnInit, OnDestroy {

  // Estado de la tarjeta
  cardFlipped = false;

  // Cara frontal
  email = '';
  emailTouched = false;
  emailError = '';
  globalError = '';
  isSending = false;
  focusedField = '';

  // Nueva contraseña
  passwordResetVisible = false;
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  confirmError = '';
  showNewPassword = false;
  showConfirmPassword = false;
  isChangingPassword = false;

  // Fortaleza
  passwordStrengthLevel: 'weak' | 'fair' | 'strong' = 'weak';
  passwordStrengthFilled = 0;
  passwordStrengthLabel = '';
  passwordStrengthColor = '#A32D2D';

  get emailMasked(): string {
    if (!this.email) return '';
    const [local, domain] = this.email.split('@');
    if (!domain) return this.email;
    const visible = local.substring(0, 2);
    const masked = '*'.repeat(Math.max(local.length - 2, 3));
    return `${visible}${masked}@${domain}`;
  }

  // Cara trasera — OTP
  digits: string[] = ['', '', '', '', '', ''];
  otpState: 'idle' | 'error' | 'success' = 'idle';
  otpErrorMsg = '';
  isVerifying = false;
  isResending = false;
  resendEnabled = false;

  // Timer
  secondsLeft = 600;
  timerExpired = false;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private readonly TOTAL_SECONDS = 600;

  get timerPercent(): number {
    return (this.secondsLeft / this.TOTAL_SECONDS) * 100;
  }

  get timerDisplay(): string {
    const m = Math.floor(this.secondsLeft / 60);
    const s = this.secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get codeComplete(): boolean {
    return this.digits.every(d => d !== '');
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.clearTimer();
  }

  // Validación unificada de contraseñas
  validatePassword(): void {
    const pwd = this.newPassword;
    this.passwordError = '';
    this.confirmError = '';

    if (!pwd) {
      this.passwordError = 'La contraseña es obligatoria.';
    } else if (pwd.length < 8) {
      this.passwordError = 'Mínimo 8 caracteres.';
    } else if (pwd.length > 70) {
      this.passwordError = 'Máximo 70 caracteres.';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,70}$/.test(pwd)) {
      this.passwordError = 'Debe incluir mayúscula, minúscula, número, símbolo y sin espacios.';
    }

    // Fortaleza
    if (pwd) {
      let s = 0;
      if (pwd.length >= 8) s++;
      if (pwd.length >= 12) s++;
      if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
      if (/[0-9]/.test(pwd)) s++;
      if (/[^A-Za-z0-9]/.test(pwd)) s++;

      this.passwordStrengthLevel = s <= 1 ? 'weak' : s <= 3 ? 'fair' : 'strong';
      this.passwordStrengthFilled = Math.min(s, 4);
      this.passwordStrengthLabel = s <= 1 ? 'Débil' : s <= 3 ? 'Regular' : 'Fuerte';
      this.passwordStrengthColor = s <= 1 ? '#A32D2D' : s <= 3 ? '#854F0B' : '#3B6D11';
    } else {
      this.passwordStrengthLevel = 'weak';
      this.passwordStrengthFilled = 0;
      this.passwordStrengthLabel = '';
      this.passwordStrengthColor = '#A32D2D';
    }

    // Confirmación
    if (this.confirmPassword && this.confirmPassword !== pwd) {
      this.confirmError = 'Las contraseñas no coinciden.';
    }
  }

  isPasswordValid(): boolean {
    return this.newPassword.length >= 8 &&
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,70}$/.test(this.newPassword) &&
      this.newPassword === this.confirmPassword;
  }

  // Validación del correo
  validateEmail(): void {
    if (!this.email) {
      this.emailError = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.emailError = 'Ingresa un correo electrónico válido';
    } else {
      this.emailError = '';
    }
  }

  // Enviar código
  handleSendCode(): void {
    this.emailTouched = true;
    this.validateEmail();
    if (this.emailError) return;

    this.isSending = true;
    this.globalError = '';

    this.authService.sendPasswordResetCode(this.email).subscribe({
      next: () => {
        this.isSending = false;
        this.flipToBack();
      },
      error: (err: any) => {
        this.isSending = false;
        const msg = err?.error?.message || '';
        if (err.status === 403) {
          this.globalError = 'Tu correo aún no esta verificado';
        } else if (err.status === 404) {
          this.globalError = 'No encontramos una cuenta con ese correo electrónico.';
        } else if (err.status === 500) {
          this.globalError = msg || 'Demasiados intentos. Espera unos minutos.';
        } else {
          this.globalError = msg || 'Ocurrió un error al enviar el código.';
        }
      }
    });
  }

  private flipToBack(): void {
    this.digits = ['', '', '', '', '', ''];
    this.otpState = 'idle';
    this.otpErrorMsg = '';
    this.cardFlipped = true;
    this.startTimer();

    setTimeout(() => this.focusInput(0), 650);
  }

  flipBack(): void {
    this.cardFlipped = false;
    this.clearTimer();
    this.digits = ['', '', '', '', '', ''];
    this.otpState = 'idle';
    this.secondsLeft = this.TOTAL_SECONDS;
    this.timerExpired = false;
    this.resendEnabled = false;
  }

  // Timer
  private startTimer(): void {
    this.clearTimer();
    this.secondsLeft = this.TOTAL_SECONDS;
    this.timerExpired = false;
    this.resendEnabled = false;

    this.timerInterval = setInterval(() => {
      this.secondsLeft--;

      if (this.secondsLeft <= 300) {
        this.resendEnabled = true;
      }

      if (this.secondsLeft <= 0) {
        this.secondsLeft = 0;
        this.timerExpired = true;
        this.resendEnabled = true;
        this.clearTimer();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getInputClass(i: number): string {
    const classes = ['otp-input'];
    if (this.otpState === 'error') classes.push('error');
    else if (this.otpState === 'success') classes.push('success');
    else if (this.digits[i]) classes.push('filled');
    return classes.join(' ');
  }

  onDigitKeydown(event: KeyboardEvent, index: number): void {
    const key = event.key;

    // Backspace
    if (key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        this.digits[index - 1] = '';
        this.focusInput(index - 1);
      } else {
        this.digits[index] = '';
      }
      this.resetOtpState();
      event.preventDefault();
      return;
    }

    // Flechas
    if (key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
      event.preventDefault();
      return;
    }
    if (key === 'ArrowRight' && index < 5) {
      this.focusInput(index + 1);
      event.preventDefault();
      return;
    }

    // Solo dígitos
    if (/^\d$/.test(key)) {
      event.preventDefault();
      this.digits[index] = key;
      this.resetOtpState();
      if (index < 5) {
        this.focusInput(index + 1);
      }
    } else {
      event.preventDefault();
    }
  }

  onDigitPaste(event: ClipboardEvent, startIndex: number): void {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!text) return;

    text.split('').forEach((ch, i) => {
      if (startIndex + i < 6) {
        this.digits[startIndex + i] = ch;
      }
    });

    this.resetOtpState();
    const nextIndex = Math.min(startIndex + text.length, 5);
    this.focusInput(nextIndex);
    this.cdr.detectChanges();
  }

  private focusInput(index: number): void {
    setTimeout(() => {
      const el = document.getElementById(`otp-${index}`) as HTMLInputElement;
      el?.focus();
      el?.select();
    }, 0);
  }

  private resetOtpState(): void {
    this.otpState = 'idle';
    this.otpErrorMsg = '';
  }

  // Verificar código
  handleVerifyCode(): void {
    if (!this.codeComplete || this.timerExpired) return;
    const code = this.digits.join('');
    this.isVerifying = true;
    this.otpState = 'idle';

    this.authService.verifyPasswordResetCode(this.email, code).subscribe({
      next: (res: any) => {
        this.isVerifying = false;
        this.otpState = 'success';
        this.clearTimer();

        sessionStorage.setItem('reset_token', res.reset_token);
        sessionStorage.setItem('reset_email', this.email);

        this.passwordResetVisible = true;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isVerifying = false;
        this.otpState = 'error';

        // Shake en los inputs
        this.digits.forEach((_, i) => {
          const el = document.getElementById(`otp-${i}`);
          el?.classList.remove('error');
          setTimeout(() => el?.classList.add('error'), 10);
        });

        if (err.status === 400) {
          this.otpErrorMsg = 'Código incorrecto. Verifica e intenta de nuevo.';
        } else if (err.status === 401) {
          this.otpErrorMsg = 'El código ha expirado. Solicita uno nuevo.';
          this.timerExpired = true;
          this.clearTimer();
        } else {
          this.otpErrorMsg = 'Error al verificar el código. Intenta de nuevo.';
        }

        // Limpiar inputs y regresar el foco tras la animación
        setTimeout(() => {
          this.digits = ['', '', '', '', '', ''];
          this.otpState = 'idle';
          this.focusInput(0);
          this.cdr.detectChanges();
        }, 1400);
      }
    });
  }

  // Reenviar código
  handleResend(): void {
    if (!this.resendEnabled || this.isResending) return;
    this.isResending = true;
    this.otpState = 'idle';
    this.otpErrorMsg = '';

    this.authService.sendPasswordResetCode(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.digits = ['', '', '', '', '', ''];
        this.startTimer();
        this.focusInput(0);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isResending = false;
        this.otpState = 'error';
        this.otpErrorMsg = 'Error al reenviar el código. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  // Cambiar contraseña
  handleChangePassword(): void {
    if (!this.isPasswordValid()) return;
    const token = sessionStorage.getItem('reset_token');
    if (!token) {
      this.globalError = 'Sesión expirada. Vuelve a solicitar el código.';
      return;
    }

    this.isChangingPassword = true;
    this.globalError = '';

    this.authService.resetPassword(token, this.newPassword).subscribe({
      next: () => {
        this.isChangingPassword = false;
        sessionStorage.removeItem('reset_token');
        sessionStorage.removeItem('reset_email');
        this.router.navigate(['/iniciar-sesion']);
      },
      error: (err: any) => {
        this.isChangingPassword = false;
        const msg = err?.error?.message || '';
        if (err.status === 401) {
          this.globalError = 'El enlace expiró. Solicita un nuevo código.';
        } else {
          this.globalError = msg || 'Error al cambiar la contraseña. Intenta de nuevo.';
        }
        this.cdr.detectChanges();
      }
    });
  }
}