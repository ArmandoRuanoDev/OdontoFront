import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tratamiento } from '../../../interfaces/tratamiento.interface';
import { Dia } from '../../../interfaces/horario.interface';
import { DocService } from '../../../services/doc';
import { AuthService } from '../../../services/auth';

// ─────────────────────────────────────────────────────────────
// Tipos locales de errores
// ─────────────────────────────────────────────────────────────
interface FormErrores {
  logo?: string;
  dias?: string;
  horario?: string;
  nombreTratamiento?: string;
  duracion?: string;
  descripcion?: string;
  costo?: string;
}

@Component({
  selector: 'app-configurar-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configure-panel.html',
  styleUrls: ['./configure-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurePanel implements OnInit {

  // ── Estado UI
  profileMenuOpen = false;
  
  // ── Logo ──────────────────────────────────────────
  logoPreview: string | null = null;
  archivoLogo: File | null = null;

  // ── Notación ──────────────────────────────────────
  notacionOdontograma = 'FDI';

  readonly notaciones = [
    { valor: 'FDI',       label: 'FDI',       desc: 'Sistema dos dígitos (11–48). Estándar internacional.' },
    { valor: 'UNIVERSAL', label: 'Universal',  desc: 'Numeración del 1 al 32. Común en EE.UU.' },
    { valor: 'PALMER',    label: 'Palmer',     desc: 'Cuadrantes con símbolo gráfico. Uso clínico clásico.' },
    { valor: 'HADERUP',   label: 'Haderup',    desc: 'Variante escandinava con signo + y −.' },
  ];

  // ── Horario ───────────────────────────────────────
  diasSemana: Dia[] = [
    { indice: 1, nombre: 'Lun', activo: true  },
    { indice: 2, nombre: 'Mar', activo: true  },
    { indice: 3, nombre: 'Mié', activo: true  },
    { indice: 4, nombre: 'Jue', activo: true  },
    { indice: 5, nombre: 'Vie', activo: true  },
    { indice: 6, nombre: 'Sáb', activo: false },
    { indice: 0, nombre: 'Dom', activo: false },
  ];

  horaApertura = '08:00';
  horaCierre   = '18:00';
  margenFin    = 0;
  readonly margen  = [0, 5, 10, 15, 20, 25, 30];

  // ── Tratamientos ──────────────────────────────────
  tratamientos: Tratamiento[] = [];

  nuevoTratamiento        = '';
  nuevaDescripcion        = '';
  nuevoCosto: number | null = null;
  nuevoRequiereOdontograma = false;
  nuevaDuracionHoras      = 0;
  nuevaDuracionMinutos    = 30;
  readonly horas   = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  readonly minutos = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // ── Errores ───────────────────────────────────────
  errores: FormErrores = {};

  // ── Colores ───────────────────────────────────────
  private readonly coloresPastel = [
    '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5', '#FF8B94',
    '#B5EAD7', '#C7CEEA', '#F0D9FF', '#E6DFF5', '#FFE0B2',
    '#B3E5FC', '#FFF9C4', '#F8BBD0', '#D1C4E9', '#C8E6C9',
  ];
  private colorIndex = 0;

  constructor(
    private doctorService: DocService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarConfigExistente();
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }
  // ═══════════════════════════════════════════════════
  // DÍAS
  // ═══════════════════════════════════════════════════

  toggleDia(dia: Dia): void {
    dia.activo = !dia.activo;
    this.validarDias();
  }

  // ═══════════════════════════════════════════════════
  // LOGO
  // ═══════════════════════════════════════════════════

  triggerFileInput(): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0] ?? null;
    if (!file) return;

    // ── Validar tipo ──────────────────────────────
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!tiposPermitidos.includes(file.type)) {
      this.errores = { ...this.errores, logo: 'Solo se permiten archivos PNG, JPG o SVG.' };
      this.cdr.markForCheck();
      return;
    }

    // ── Validar tamaño (2 MB = 2 * 1024 * 1024 bytes) ──
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      this.errores = { ...this.errores, logo: `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El límite es 2 MB.` };
      this.cdr.markForCheck();
      return;
    }

    this.errores = { ...this.errores, logo: undefined };
    this.archivoLogo = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  eliminarLogo(): void {
    this.logoPreview = null;
    this.archivoLogo = null;
    this.errores = { ...this.errores, logo: undefined };
  }

  // ═══════════════════════════════════════════════════
  // VALIDACIONES DE HORARIO
  // ═══════════════════════════════════════════════════

  validarDias(): boolean {
    const hayActivo = this.diasSemana.some(d => d.activo);
    if (!hayActivo) {
      this.errores = { ...this.errores, dias: 'Debes tener al menos un día laboral.' };
      return false;
    }
    this.errores = { ...this.errores, dias: undefined };
    return true;
  }

  validarHorario(): boolean {
    if (!this.horaApertura || !this.horaCierre) {
      this.errores = { ...this.errores, horario: 'Completa ambas horas.' };
      return false;
    }
    if (this.horaApertura >= this.horaCierre) {
      this.errores = { ...this.errores, horario: 'La hora de apertura debe ser anterior a la de cierre.' };
      return false;
    }
    this.errores = { ...this.errores, horario: undefined };
    return true;
  }

  // ═══════════════════════════════════════════════════
  // VALIDACIONES DE TRATAMIENTO — en tiempo real
  // ═══════════════════════════════════════════════════

  /**
   * Impide espacios al inicio y al final mientras se escribe.
   * Permite letras, números y espacios intermedios.
   */
  onNombreChange(valor: string): void {
    // Bloquear espacio al inicio
    if (valor.startsWith(' ')) {
      this.nuevoTratamiento = valor.trimStart();
    } else {
      this.nuevoTratamiento = valor;
    }
    // Bloquear doble espacio consecutivo (opcional, UX más limpia)
    // No cortamos el trailing space aquí — lo validamos al agregar.
    this.validarNombreTratamiento(false);
  }

  onDescripcionChange(valor: string): void {
    if (valor.startsWith(' ')) {
      this.nuevaDescripcion = valor.trimStart();
    } else {
      this.nuevaDescripcion = valor;
    }
    this.validarDescripcion(false);
  }

  /** @param alAgregar true = valida estricto (para submit), false = valida suave (tiempo real) */
  validarNombreTratamiento(alAgregar = true): boolean {
    const nombre = alAgregar ? this.nuevoTratamiento.trim() : this.nuevoTratamiento;

    if (!nombre) {
      if (alAgregar) {
        this.errores = { ...this.errores, nombreTratamiento: 'El nombre es obligatorio.' };
        return false;
      }
      this.errores = { ...this.errores, nombreTratamiento: undefined };
      return true;
    }

    // Mínimo 3 caracteres (sin contar espacios al inicio/fin)
    if (nombre.trim().length < 3) {
      this.errores = { ...this.errores, nombreTratamiento: 'Mínimo 3 caracteres.' };
      return false;
    }

    // Máximo 50 caracteres
    if (nombre.trim().length > 50) {
      this.errores = { ...this.errores, nombreTratamiento: 'Máximo 50 caracteres.' };
      return false;
    }

    // Solo letras, números y espacios
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9 ]+$/.test(nombre.trim())) {
      this.errores = { ...this.errores, nombreTratamiento: 'Solo se permiten letras, números y espacios.' };
      return false;
    }

    this.errores = { ...this.errores, nombreTratamiento: undefined };
    return true;
  }

  validarDescripcion(alAgregar = true): boolean {
    const desc = alAgregar ? this.nuevaDescripcion.trim() : this.nuevaDescripcion;

    // Campo opcional: si está vacío, ok
    if (!desc) {
      this.errores = { ...this.errores, descripcion: undefined };
      return true;
    }

    if (desc.trim().length < 5) {
      this.errores = { ...this.errores, descripcion: 'Si escribes una descripción, debe tener al menos 5 caracteres.' };
      return false;
    }

    if (desc.trim().length > 255) {
      this.errores = { ...this.errores, descripcion: 'Máximo 255 caracteres.' };
      return false;
    }

    this.errores = { ...this.errores, descripcion: undefined };
    return true;
  }

  validarDuracion(): boolean {
    const total = (Number(this.nuevaDuracionHoras) * 60) + Number(this.nuevaDuracionMinutos);
    if (total <= 0) {
      this.errores = { ...this.errores, duracion: 'La duración debe ser mayor a 0 minutos.' };
      return false;
    }
    this.errores = { ...this.errores, duracion: undefined };
    return true;
  }

  validarCosto(): boolean {
    const costo = this.nuevoCosto;

    // Opcional
    if (costo === null || costo === undefined || String(costo) === '') {
      this.errores = { ...this.errores, costo: undefined };
      return true;
    }

    if (costo < 0) {
      this.errores = { ...this.errores, costo: 'El costo no puede ser negativo.' };
      return false;
    }

    // Máximo 8 dígitos enteros (sin decimales): 99,999,999
    const parteEntera = Math.floor(Math.abs(costo));
    if (String(parteEntera).length > 8) {
      this.errores = { ...this.errores, costo: 'El costo no puede superar 8 dígitos (99,999,999).' };
      return false;
    }

    this.errores = { ...this.errores, costo: undefined };
    return true;
  }

  // ═══════════════════════════════════════════════════
  // AGREGAR TRATAMIENTO
  // ═══════════════════════════════════════════════════

  agregarTratamiento(): void {
    // Bloquear espacios al final antes de validar
    this.nuevoTratamiento  = this.nuevoTratamiento.trim();
    this.nuevaDescripcion  = this.nuevaDescripcion.trim();

    const nombreTrim = this.nuevoTratamiento; // ya está trimmeado
    if (this.tratamientos.some(t => t.nombre.trim().toLowerCase() === nombreTrim.toLowerCase())) {
      this.errores = { ...this.errores, nombreTratamiento: 'Ya existe un tratamiento con ese nombre.' };
      return; // detiene la ejecución
    }

    const okNombre    = this.validarNombreTratamiento(true);
    const okDuracion  = this.validarDuracion();
    const okDesc      = this.validarDescripcion(true);
    const okCosto     = this.validarCosto();

    if (!okNombre || !okDuracion || !okDesc || !okCosto) return;

    const color = this.coloresPastel[this.colorIndex % this.coloresPastel.length];
    this.colorIndex++;

    const tratamiento: Tratamiento = {
      nombre:               this.nuevoTratamiento,
      duracion_minutos: (Number(this.nuevaDuracionHoras) * 60) + Number(this.nuevaDuracionMinutos),
      descripcion:          this.nuevaDescripcion || undefined,
      costo_sugerido:       this.nuevoCosto ?? undefined,
      color,
      requiere_odontograma: this.nuevoRequiereOdontograma,
    };

    this.tratamientos = [...this.tratamientos, tratamiento];

    // Limpiar
    this.nuevoTratamiento        = '';
    this.nuevaDescripcion        = '';
    this.nuevoCosto              = null;
    this.nuevaDuracionHoras      = 0;
    this.nuevaDuracionMinutos    = 30;
    this.nuevoRequiereOdontograma = false;
    this.errores = {
      ...this.errores,
      nombreTratamiento: undefined,
      duracion:          undefined,
      descripcion:       undefined,
      costo:             undefined,
    };
  }

  eliminarTratamiento(index: number): void {
    this.tratamientos = this.tratamientos.filter((_, i) => i !== index);
  }

  // ═══════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════

  formatearDuracion(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0 && m > 0) return `${h}h ${m} min`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
  }

  get duracionPreview(): string | null {
  const horas = Number(this.nuevaDuracionHoras ?? 0);
  const minutos = Number(this.nuevaDuracionMinutos ?? 0);
  const total = horas * 60 + minutos;
  if (total <= 0) {
    return null;
  }
  return this.formatearDuracion(total);
}

  // ═══════════════════════════════════════════════════
  // GUARDAR / OMITIR
  // ═══════════════════════════════════════════════════

  guardarEIr(): void {
    // Validar todo antes de enviar
    const okDias    = this.validarDias();
    const okHorario = this.validarHorario();
    if (!okDias || !okHorario) return;

    this.enviarConfiguracion(true);
  }

  irAlPanel(): void {
    // Configuración por defecto al omitir
    this.logoPreview          = null;
    this.archivoLogo          = null;
    this.notacionOdontograma  = 'FDI';
    this.horaApertura         = '08:00';
    this.horaCierre           = '18:00';
    this.margenFin            = 0;
    this.tratamientos         = [];
    this.diasSemana.forEach(d => d.activo = true);
    this.enviarConfiguracion(false);
  }

  private enviarConfiguracion(mostrarAlerta: boolean): void {
    const formData = new FormData();

    if (this.archivoLogo) {
      formData.append('logo', this.archivoLogo);
    }

    formData.append('notacion_odontograma', this.notacionOdontograma);

    const diasActivos = this.diasSemana.filter(d => d.activo).map(d => d.indice);
    formData.append('diasActivos',  JSON.stringify(diasActivos));
    formData.append('horaApertura', this.horaApertura);
    formData.append('horaCierre',   this.horaCierre);
    formData.append('margenFin',    this.margenFin.toString());

    const tratamientosValidos = this.tratamientos.filter(t => t.nombre.trim() !== '');
    if (tratamientosValidos.length > 0) {
      formData.append('tratamientos', JSON.stringify(tratamientosValidos));
    }

    this.doctorService.configurarConsultorio(formData).subscribe({
      next: (resp) => {
        if (mostrarAlerta) {
          console.log('Configuración guardada:', resp);
          alert('Consultorio configurado exitosamente');
        }
        window.location.href = '/inicio';
      },
      error: (err) => {
        console.error('Error al guardar configuración:', err);
        if (mostrarAlerta) {
          alert('Ocurrió un error al guardar la configuración. Inténtalo de nuevo.');
        } else {
          window.location.href = '/inicio';
        }
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // CARGAR CONFIG EXISTENTE
  // ═══════════════════════════════════════════════════

  cargarConfigExistente(): void {
    this.doctorService.obtenerConfiguracion().subscribe({
      next: (resp) => {
        if (resp.logo_url) {
          this.logoPreview = resp.logo_url;
        }
        if (resp.notacion_odontograma) {
          this.notacionOdontograma = resp.notacion_odontograma;
        }
        if (resp.horarios?.length > 0) {
          const hoy = resp.horarios[0];
          this.horaApertura = hoy.hora_inicio;
          this.horaCierre   = hoy.hora_fin;
          this.margenFin    = hoy.margen_fin_minutos;
          const indicesActivos = resp.horarios.map((h: any) => h.dia_semana);
          this.diasSemana.forEach(dia => {
            dia.activo = indicesActivos.includes(dia.indice);
          });
        }
        if (resp.tratamientos?.length > 0) {
          this.tratamientos = resp.tratamientos.map((t: any) => ({
            nombre:               t.nombre,
            duracion_minutos:     t.duracion_minutos,
            descripcion:          t.descripcion,
            costo_sugerido:       t.costo_sugerido,
            color:                t.color,
            requiere_odontograma: t.requiere_odontograma,
          }));
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar configuración existente:', err);
      }
    });
  }
}