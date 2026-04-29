import {
  Component, OnInit, OnDestroy,
  HostListener, ElementRef, ViewChild,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})

export class Login implements OnInit, OnDestroy {

  @ViewChild('sceneRef') sceneRef!: ElementRef;

  // Formulario
  email    = '';
  password = '';
  showPassword = false;

  // UI
  focusedField     = '';
  isPasswordFocused = false;
  isLoading        = false;

  // Errores
  emailError    = '';
  passwordError = '';
  globalError   = '';
  emailTouched    = false;
  passwordTouched = false;

  // Ojos del diente
  // Traslación de cada pupila (máx ±5px)
  pupilTransform = 'translate(0,0)';

  private mouseX = 0;
  private mouseY = 0;
  private curX   = 0;
  private curY   = 0;
  private rafId: number | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  // Lifecycle
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.startEyeLoop();
    }
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  // Mouse tracking
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const scene = this.sceneRef?.nativeElement as HTMLElement;
    if (!scene) return;
    const r  = scene.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    this.mouseX = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth  / 2)));
    this.mouseY = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
  }

  // Smooth eye animation loop
  private startEyeLoop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;  // No hacer nada en el servidor
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const MAX = 5;

    const tick = () => {
      const tX = this.isPasswordFocused ? 0 : this.mouseX;
      const tY = this.isPasswordFocused ? 1 : this.mouseY;
      this.curX = lerp(this.curX, tX, 0.08);
      this.curY = lerp(this.curY, tY, 0.08);
      this.pupilTransform = `translate(${(this.curX * MAX).toFixed(2)}px,${(this.curY * MAX).toFixed(2)}px)`;
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  // Validaciones
  validateEmail(): void {
    if (!this.email)
      this.emailError = 'El correo electrónico es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email))
      this.emailError = 'Ingresa un correo electrónico válido.';
    else
      this.emailError = '';
  }

  validatePassword(): void {
    if (!this.password)
      this.passwordError = 'La contraseña es requerida.';
    else if (this.password.length < 6)
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres.';
    else
      this.passwordError = '';
  }

  private isFormValid(): boolean {
    this.emailTouched    = true;
    this.passwordTouched = true;
    this.validateEmail();
    this.validatePassword();
    return !this.emailError && !this.passwordError;
  }

  // Submit
  handleLogin(): void {
    this.globalError = '';
    if (!this.isFormValid()) return;
    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (res: any) => {
        this.authService.saveAccessToken(res.access_token);
        this.router.navigate(['/inicio']);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || '';
        if (err.status === 401)
          this.globalError = 'Correo o contraseña incorrectos. Verifica tus datos.';
        else if (err.status === 423)
          this.globalError = msg || 'Tu cuenta está bloqueada temporalmente. Intenta más tarde.';
        else if (err.status === 403)
          this.globalError = 'Debes verificar tu correo electrónico antes de ingresar.';
        else if (err.status === 429)
          this.globalError = 'Demasiados intentos. Espera un momento antes de intentar de nuevo.';
        else
          this.globalError = 'Ocurrió un error al iniciar sesión. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  loginWithGoogle(): void {
    window.location.href = 'http://localhost:3000/api/auth/google';
  }
}