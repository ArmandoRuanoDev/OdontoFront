import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tratamiento } from '../../../interfaces/tratamiento.interface';
import { Dia } from '../../../interfaces/horario.interface';
import { DocService } from '../../../services/doc';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-configurar-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configure-panel.html',
  styleUrls: ['./configure-panel.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class ConfigurePanel implements OnInit {

  logoPreview: string | null = null;
  archivoLogo: File | null = null;

  diasSemana: Dia[] = [
    { indice: 1, nombre: 'Lun', activo: true },
    { indice: 2, nombre: 'Mar', activo: true },
    { indice: 3, nombre: 'Mié', activo: true },
    { indice: 4, nombre: 'Jue', activo: true },
    { indice: 5, nombre: 'Vie', activo: true },
    { indice: 6, nombre: 'Sáb', activo: false },
    { indice: 0, nombre: 'Dom', activo: false }
  ];

  horaApertura = '08:00';
  horaCierre = '18:00';
  margenFin = 30;

  tratamientos: Tratamiento[] = [];
  nuevoTratamiento = '';

  nuevaDuracionHoras = 0;
  nuevaDuracionMinutos = 30;
  horas = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  minutos = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  nuevaDescripcion = '';
  nuevoCosto: number | null = null;

  private coloresPastel = [
    '#A8E6CF', '#DCEDC1', '#FFD3B6', '#FFAAA5', '#FF8B94',
    '#B5EAD7', '#C7CEEA', '#F0D9FF', '#E6DFF5', '#FFE0B2',
    '#B3E5FC', '#FFF9C4', '#F8BBD0', '#D1C4E9', '#C8E6C9'
  ];
  private colorIndex = 0;

  constructor(
    private doctorService: DocService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarConfigExistente();
  }

  toggleDia(dia: Dia): void {
    dia.activo = !dia.activo;
  }

  triggerFileInput(): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

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
  }

  agregarTratamiento(): void {
    const nombre = this.nuevoTratamiento.trim();
    if (!nombre) return;

    const duracionTotal = (this.nuevaDuracionHoras * 60) + this.nuevaDuracionMinutos;
    if (duracionTotal <= 0) return;

    const color = this.coloresPastel[this.colorIndex % this.coloresPastel.length];
    this.colorIndex++;

    const tratamiento: Tratamiento = {
      nombre,
      duracion_minutos: duracionTotal,
      descripcion: this.nuevaDescripcion.trim() || undefined,
      costo_sugerido: this.nuevoCosto ?? undefined,
      color
    };

    this.tratamientos = [...this.tratamientos, tratamiento];

    this.nuevoTratamiento = '';
    this.nuevaDuracionHoras = 0;
    this.nuevaDuracionMinutos = 30;
    this.nuevaDescripcion = '';
    this.nuevoCosto = null;
  }

  eliminarTratamiento(index: number): void {
    this.tratamientos = this.tratamientos.filter((_, i) => i !== index);
  }

  formatearDuracion(minutos: number): string {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    if (h > 0 && m > 0) return `${h}h ${m} min`;
    if (h > 0) return `${h}h`;
    return `${m} min`;
  }

  guardarEIr(): void {
    this.enviarConfiguracion(true);
  }

  irAlPanel(): void {
    this.logoPreview = null;
    this.archivoLogo = null;
    this.horaApertura = '08:00';
    this.horaCierre = '18:00';
    this.margenFin = 0;
    this.tratamientos = [];
    this.diasSemana.forEach(d => d.activo = true);
    this.enviarConfiguracion(false);
  }

  private enviarConfiguracion(mostrarAlerta: boolean): void {
    const formData = new FormData();

    if (this.archivoLogo) {
      formData.append('logo', this.archivoLogo);
    }

    const diasActivos = this.diasSemana.filter(d => d.activo).map(d => d.indice);
    formData.append('diasActivos', JSON.stringify(diasActivos));
    formData.append('horaApertura', this.horaApertura);
    formData.append('horaCierre', this.horaCierre);
    formData.append('margenFin', this.margenFin.toString());

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

  cargarConfigExistente(): void {
    this.doctorService.obtenerConfiguracion().subscribe({
      next: (resp) => {
        if (resp.logo_url) {
          this.logoPreview = resp.logo_url;
        }
        if (resp.horarios?.length > 0) {
          const hoy = resp.horarios[0];
          this.horaApertura = hoy.hora_inicio;
          this.horaCierre = hoy.hora_fin;
          this.margenFin = hoy.margen_fin_minutos;
          const indicesActivos = resp.horarios.map((h: any) => h.dia_semana);
          this.diasSemana.forEach(dia => {
            dia.activo = indicesActivos.includes(dia.indice);
          });
        }
        if (resp.tratamientos?.length > 0) {
          this.tratamientos = resp.tratamientos.map((t: any) => ({
            nombre: t.nombre,
            duracion_minutos: t.duracion_minutos,
            descripcion: t.descripcion,
            costo_sugerido: t.costo_sugerido,
            color: t.color
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