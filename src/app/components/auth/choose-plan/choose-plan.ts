import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { Plan } from '../../../interfaces/plan.interface';

@Component({
  selector: 'app-choose-plan',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './choose-plan.html',
  styleUrls: ['./choose-plan.css']
})

export class ChoosePlan implements OnInit, OnDestroy, AfterViewInit {

  private readonly API = 'http://localhost:3000/api/sub';

  // Estado general
  planes: Plan[] = [];
  planSeleccionado: Plan | null = null;
  loadingPlanes = true;
  errorPlanes = '';

  // Modal de pago
  showPaymentModal = false;
  procesandoPago = false;
  pagoError = '';
  pagoExito = false;

  // Stripe
  private stripe: any = null;
  private cardElement: any = null;
  private stripeReady = false;
  cardComplete = false;
  cardError = '';

  // UI helpers
  billingAnual = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarPlanes();
    this.cargarStripe();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.cardElement) this.cardElement.destroy();
  }

  // Cargar planes
  cargarPlanes(): void {
    this.loadingPlanes = true;
    this.http.get<Plan[]>(`${this.API}/plans`).subscribe({
      next: (data) => {
        this.planes = data.filter(p => p.activo);
        this.loadingPlanes = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorPlanes = 'No se pudieron cargar los planes. Intenta de nuevo.';
        this.loadingPlanes = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Getters de planes
  get planInicio(): Plan | undefined {
    return this.planes.find(p => !p.requiere_metodo_pago && !p.es_prueba);
  }

  get planPrueba(): Plan | undefined {
    return this.planes.find(p => p.es_prueba);
  }

  get planMensual(): Plan | undefined {
    return this.planes.find(p => p.requiere_metodo_pago && !p.es_prueba && p.duracion_dias === 30);
  }

  get planAnual(): Plan | undefined {
    return this.planes.find(p => p.requiere_metodo_pago && !p.es_prueba && p.duracion_dias === 365);
  }

  // Seleccionar plan
  seleccionarPlan(plan: Plan): void {
    this.planSeleccionado = plan;

    // Plan gratuito: redirigir directamente
    if (!plan.requiere_metodo_pago) {
      window.location.href = '/configure-panel';
      return;
    }

    // Requiere pago: abrir modal
    this.abrirModalPago();
  }

  // Modal de pago
  abrirModalPago(): void {
    this.showPaymentModal = true;
    this.pagoError = '';
    this.pagoExito = false;
    this.cardComplete = false;
    this.cardError = '';
    document.body.style.overflow = 'hidden';

    setTimeout(() => this.montarStripeElement(), 150);
  }

  cerrarModal(): void {
    if (this.procesandoPago) return;
    this.showPaymentModal = false;
    document.body.style.overflow = '';
    if (this.cardElement) {
      this.cardElement.destroy();
      this.cardElement = null;
    }
  }

  // Stripe
  private cargarStripe(): void {
    if ((window as any).Stripe) {
      this.inicializarStripe();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => this.inicializarStripe();
    document.head.appendChild(script);
  }

  private inicializarStripe(): void {
    this.stripe = (window as any).Stripe('pk_test_51TQcB6IsbtJs5Qhy3TRRgcmmz8uLikYnR6junU5Ox8RKlltXt9TjvWIgATVSVK4cnBKu9nGu5Q2a3HbxeROpfqFb00wZZeX2JW');
    this.stripeReady = true;
  }

  private montarStripeElement(): void {
    if (!this.stripeReady || !this.stripe) {
      // Reintentar si Stripe aún no cargó
      setTimeout(() => this.montarStripeElement(), 300);
      return;
    }

    const container = document.getElementById('stripe-card-element');
    if (!container) return;

    const elements = this.stripe.elements({
      locale: 'es'
    });

    this.cardElement = elements.create('card', {
      style: {
        base: {
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: '#1e293b',
          '::placeholder': { color: '#94a3b8' },
          iconColor: '#185FA5',
        },
        invalid: {
          color: '#A32D2D',
          iconColor: '#A32D2D',
        }
      },
      hidePostalCode: false,
    });

    this.cardElement.mount('#stripe-card-element');

    this.cardElement.on('change', (event: any) => {
      this.cardComplete = event.complete;
      this.cardError = event.error ? event.error.message : '';
      this.cdr.detectChanges();
    });
  }

  // Procesar pago
  async procesarPago(): Promise<void> {
    if (!this.planSeleccionado || !this.stripe || !this.cardElement) return;
    if (this.procesandoPago) return;

    this.procesandoPago = true;
    this.pagoError = '';
    this.cdr.detectChanges();

    try {
      // Crear PaymentMethod en Stripe
      const { paymentMethod, error: stripeError } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
      });

      if (stripeError) {
        this.pagoError = stripeError.message || 'Error al procesar la tarjeta.';
        this.procesandoPago = false;
        this.cdr.detectChanges();
        return;
      }

      const payment_method_id: string = paymentMethod.id;
      const plan = this.planSeleccionado;

      // Llamar al endpoint correcto según el plan
      let endpoint: string;
      let body: any;

      if (plan.es_prueba) {
        // Plan de prueba: POST /api/sub/trial
        endpoint = `${this.API}/trial`;
        body = { payment_method_id };
      } else {
        // Plan de pago: POST /api/sub/subscribe
        endpoint = `${this.API}/subscribe`;
        body = {
          price_id: plan.stripe_price_id,
          payment_method_id
        };
      }

      const headers: any = {
        'Authorization': `Bearer ${this.authService.getAccessToken()}`
      };

      this.http.post<any>(endpoint, body, { headers, withCredentials: true }).subscribe({
        next: () => {
          this.procesandoPago = false;
          this.pagoExito = true;
          this.cdr.detectChanges();

          // Redirigir al panel tras 2 segundos
          setTimeout(() => {
            window.location.href = '/configure-panel';
          }, 2000);
        },
        error: (err) => {
          this.procesandoPago = false;
          const msg = err.error?.message || 'Error al activar el plan. Intenta de nuevo.';
          this.pagoError = msg;
          this.cdr.detectChanges();
        }
      });
    } catch (err: any) {
      this.procesandoPago = false;
      this.pagoError = 'Error inesperado. Intenta de nuevo.';
      this.cdr.detectChanges();
    }
  }

  // UI helpers
  formatearPrecio(precio: number, moneda: string = 'MXN'): string {
    if (precio === 0) return 'Gratis';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }

  getPrecioMensualAnual(plan: Plan): string {
    // Para el plan anual mostramos el equivalente mensual
    const mensual = plan.precio / 12;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: plan.moneda,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(mensual);
  }

  getNombreModal(plan: Plan): string {
    if (plan.es_prueba) return 'Prueba gratuita de 14 días';
    return plan.nombre;
  }

  getDescripcionModal(plan: Plan): string {
    if (plan.es_prueba) {
      return 'No se realizará ningún cobro durante los 14 días. Al finalizar, el plan se convertirá automáticamente en Profesional ($399/mes). Puedes cancelar cuando quieras.';
    }
    if (plan.duracion_dias === 365) {
      return `Se realizará un cobro único de ${this.formatearPrecio(plan.precio, plan.moneda)} que cubre 12 meses completos.`;
    }
    return `Se realizará un cobro de ${this.formatearPrecio(plan.precio, plan.moneda)} al mes.`;
  }

  getBadgeTexto(plan: Plan): string {
    if (!plan.requiere_metodo_pago) return 'Gratis para siempre';
    if (plan.es_prueba) return '14 días sin costo';
    if (plan.duracion_dias === 365) return 'Ahorra 25%';
    return 'Más popular';
  }

  isPopular(plan: Plan): boolean {
    return plan.duracion_dias === 30 && !plan.es_prueba && plan.requiere_metodo_pago;
  }

  isAnual(plan: Plan): boolean {
    return plan.duracion_dias === 365;
  }
}