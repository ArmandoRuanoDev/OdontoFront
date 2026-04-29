import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css']
})

export class VerifyEmail implements OnInit, OnDestroy {
  // Estado
  digits: string[] = ['', '', '', '', '', ''];
  email: string = '';
  emailMasked: string = '';

  otpState: 'idle' | 'error' | 'success' = 'idle';
  otpErrorMsg: string = '';

  isVerifying: boolean = false;
  isResending: boolean = false;
  showSuccess: boolean = false;

  // Timer
  readonly TOTAL_SECONDS = 600; // 10 minutos
  readonly RESEND_COOLDOWN = 30; // segundos antes de habilitar reenvío
  secondsLeft: number = this.TOTAL_SECONDS;
  timerInterval: any = null;
  resendEnabled: boolean = false;

  get timerDisplay(): string {
    const m = Math.floor(this.secondsLeft / 60);
    const s = this.secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timerPercent(): number {
    return (this.secondsLeft / this.TOTAL_SECONDS) * 100;
  }

  get timerExpired(): boolean {
    return this.secondsLeft <= 0;
  }

  // Código completo
  get fullCode(): string {
    return this.digits.join('');
  }

  get codeComplete(): boolean {
    return this.fullCode.length === 6 && this.digits.every(d => d !== '');
  }

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // Lifecycle
  ngOnInit(): void {
    // Recuperar correo guardado desde el registro
    this.email = localStorage.getItem('verify_email') ?? '';
    this.emailMasked = this.maskEmail(this.email);
    this.startTimer();

    // Foco en el primer campo tras renderizar
    setTimeout(() => this.focusInput(0), 100);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // Timer
  startTimer(): void {
    this.stopTimer();
    this.secondsLeft = this.TOTAL_SECONDS;
    this.resendEnabled = false;

    this.timerInterval = setInterval(() => {
      this.secondsLeft--;

      // Habilitar reenvío después del cooldown
      if (this.secondsLeft <= this.TOTAL_SECONDS - this.RESEND_COOLDOWN) {
        this.resendEnabled = true;
      }

      if (this.secondsLeft <= 0) {
        this.stopTimer();
        this.resendEnabled = true;
        this.otpState = 'error';
        this.otpErrorMsg = 'El código expiró. Solicita uno nuevo.';
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Manejo de inputs OTP
  onDigitKeydown(event: KeyboardEvent, index: number): void {
    const key = event.key;

    // Permitir navegación y eliminación sin modificarlas
    if (key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        this.digits[index - 1] = '';
        this.focusInput(index - 1);
      } else {
        this.digits[index] = '';
      }
      this.resetOtpState();
      event.preventDefault(); // evitar que el navegador borre o haga otra cosa
      return;
    }

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

    // Solo aceptar un dígito del 0 al 9
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

  onDigitPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    text.split('').forEach((ch, i) => { if (i < 6) this.digits[i] = ch; });
    this.cdr.detectChanges();
    this.resetOtpState();
    const nextIdx = Math.min(text.length, 5);
    this.focusInput(nextIdx);
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

  // Clases CSS dinámicas
  getInputClass(index: number): string {
    const classes = ['otp-input'];
    if (this.otpState === 'error') classes.push('error');
    else if (this.otpState === 'success') classes.push('success');
    else if (this.digits[index]) classes.push('filled');
    return classes.join(' ');
  }

  // Verificar código
  handleVerify(): void {
    if (!this.codeComplete || this.isVerifying) return;

    this.isVerifying = true;

    this.authService.verifyEmail(this.email, this.fullCode).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.otpState = 'success';
        this.stopTimer();

        // Guardar tokens si vienen en la respuesta
        if (response.tokens?.access_token) {
          this.authService.saveAccessToken(response.tokens.access_token);
        }

        // Limpiar el correo temporal
        localStorage.removeItem('verify_email');

        // Mostrar pantalla de éxito
        setTimeout(() => {
          this.showSuccess = true;
          this.cdr.detectChanges();

          // Redirigir automáticamente después de 2 segundos
          setTimeout(() => {
            this.goToChoosePlan();
          }, 2000);
        }, 500);
      },
      error: (error) => {
        this.isVerifying = false;
        this.otpState = 'error';

        if (error.status === 400 || error.status === 401) {
          this.otpErrorMsg = 'Código incorrecto. Inténtalo de nuevo.';
        } else if (error.status === 410) {
          this.otpErrorMsg = 'El código ha expirado. Solicita uno nuevo.';
          this.stopTimer();
          this.secondsLeft = 0;
          this.resendEnabled = true;
        } else {
          this.otpErrorMsg = 'Error al verificar. Intenta de nuevo.';
        }

        // Limpiar inputs y re-enfocar tras animación
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
    this.resendEnabled = false;
    this.digits = ['', '', '', '', '', ''];
    this.otpState = 'idle';
    this.otpErrorMsg = '';

    this.authService.sendVerificationCode(this.email).subscribe({
      next: () => {
        this.isResending = false;
        this.otpErrorMsg = '¡Código reenviado! Revisa tu bandeja de entrada.';
        this.otpState = 'idle';
        this.startTimer();
        this.focusInput(0);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isResending = false;
        this.otpState = 'error';
        this.otpErrorMsg = 'No se pudo reenviar el código. Intenta de nuevo.';
        this.resendEnabled = true;
        this.cdr.detectChanges();
      }
    });
  }

  // Ir a planes
  goToChoosePlan(): void {
    window.location.href = '/elegir-plan';
  }

  // Volver al registro
  goBack(): void {
    window.location.href = '/registrarme';
  }

  // Utilidades
  private maskEmail(email: string): string {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    const visible = user.slice(0, 2);
    const masked = '*'.repeat(Math.max(user.length - 2, 3));
    return `${visible}${masked}@${domain}`;
  }
}