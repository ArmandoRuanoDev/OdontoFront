import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-email.html',
  styleUrls: ['./verify-email.css']
})
export class VerifyEmail implements OnInit, OnDestroy, AfterViewInit {
  email = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  codeExpired = false;

  // Timer
  totalSeconds = 600; // 10 minutos
  secondsLeft = this.totalSeconds;
  timerSubscription?: Subscription;
  canResend = false;   // habilitar reenvío después de 30s o cuando expire

  // Referencias a los inputs OTP (para autofocus y navegación)
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
        this.requestVerificationCode();
      } else {
        this.errorMessage = 'No se encontró el correo a verificar. Por favor, regístrate nuevamente.';
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.otpInputs.first?.nativeElement.focus(), 100);
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  // Solicitar el código al backend
  requestVerificationCode(): void {
    if (!this.email) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.sendVerificationCode(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.startTimer();
        this.successMessage = 'Código enviado. Revisa tu bandeja de entrada o spam.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al enviar el código. Inténtalo de nuevo.';
      }
    });
  }

  // Iniciar cuenta regresiva de 10 minutos
  startTimer(): void {
    this.secondsLeft = this.totalSeconds;
    this.codeExpired = false;
    this.canResend = false;
    if (this.timerSubscription) this.timerSubscription.unsubscribe();
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.secondsLeft > 0) {
        this.secondsLeft--;
        // Habilitar botón de reenvío después de 30 segundos
        if (this.secondsLeft <= this.totalSeconds - 30 && !this.canResend) {
          this.canResend = true;
        }
      } else {
        this.codeExpired = true;
        this.canResend = true;
        this.timerSubscription?.unsubscribe();
      }
    });
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.secondsLeft / 60);
    const seconds = this.secondsLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Barra de progreso (porcentaje)
  getTimerPercentage(): number {
    return (this.secondsLeft / this.totalSeconds) * 100;
  }

  // Manejar entrada en cada input OTP
  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // solo dígitos
    if (value.length > 1) value = value.charAt(0);
    this.otpDigits[index] = value;

    if (value && index < 5) {
      this.otpInputs.get(index + 1)?.nativeElement.focus();
    }
    
    if (this.errorMessage) this.errorMessage = '';
    if (this.successMessage) this.successMessage = '';
  }

  // Soporte para tecla Backspace
  onOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.otpInputs.get(index - 1)?.nativeElement.focus();
    }
  }

  // Pegar código completo (6 dígitos)
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('');
    for (let i = 0; i < digits.length; i++) {
      if (i < 6) this.otpDigits[i] = digits[i];
    }
    // Enfocar el siguiente después del último pegado
    const lastFilledIndex = Math.min(digits.length, 5);
    if (lastFilledIndex < 6) {
      this.otpInputs.get(lastFilledIndex)?.nativeElement.focus();
    } else {
      this.otpInputs.last?.nativeElement.focus();
    }
    this.errorMessage = '';
  }

  // Verificar el código con el backend
  verifyCode(): void {
    const code = this.otpDigits.join('');
    if (code.length !== 6) {
      this.errorMessage = 'Ingresa el código de 6 dígitos.';
      return;
    }
    if (this.codeExpired) {
      this.errorMessage = 'El código ha expirado. Solicita uno nuevo.';
      return;
    }

    this.isLoading = true;
    this.authService.verifyEmail(this.email, code).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.tokens) {
          this.authService.saveTokens(response.tokens.access_token, response.tokens.refresh_token);
        }
        // Mostrar vista de éxito (cambia el estado del componente)
        this.successMessage = '¡Correo verificado exitosamente!';
        setTimeout(() => {
          this.authService.redirectToDashboard();
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 400) {
          this.errorMessage = err.error?.message || 'Código inválido o expirado.';
          this.otpDigits = ['', '', '', '', '', ''];
          this.otpInputs.first?.nativeElement.focus();
        } else {
          this.errorMessage = 'Error en la verificación. Intenta de nuevo.';
        }
      }
    });
  }

  // Reenviar código
  resendCode(): void {
    if (!this.canResend) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.authService.sendVerificationCode(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Nuevo código enviado. Revisa tu correo.';
        // Reiniciar inputs y timer
        this.otpDigits = ['', '', '', '', '', ''];
        this.startTimer();
        this.otpInputs.first?.nativeElement.focus();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'No se pudo reenviar el código.';
      }
    });
  }

  redirectToPlan() {
    window.location.href = 'seleccionar-plan'
  }
}