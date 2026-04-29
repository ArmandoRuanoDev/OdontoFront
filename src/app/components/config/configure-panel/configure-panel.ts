import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tratamiento } from '../../../interfaces/tratamiento.interface';
import { Dia } from '../../../interfaces/horario.interface';

@Component({
  selector: 'app-configurar-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configure-panel.html',
  styleUrls: ['./configure-panel.css']
})

export class ConfigurePanel {

  logoPreview: string | null = null;

  diasSemana: Dia[] = [
    { nombre: 'Lun', activo: true },
    { nombre: 'Mar', activo: true },
    { nombre: 'Mié', activo: true },
    { nombre: 'Jue', activo: true },
    { nombre: 'Vie', activo: true },
    { nombre: 'Sáb', activo: false },
    { nombre: 'Dom', activo: false }
  ];

  horaApertura = '08:00';
  horaCierre = '18:00';

  tratamientos: Tratamiento[] = [];
  nuevoTratamiento = '';
  nuevaDuracion = 30; // minutos por defecto

  toggleDia(dia: Dia): void {
    dia.activo = !dia.activo;
  }

  triggerFileInput(): void {
    // Lógica para abrir el input file
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  eliminarLogo(): void {
    this.logoPreview = null;
  }

  agregarTratamiento(): void {
    const nombre = this.nuevoTratamiento.trim();
    const duracion = Number(this.nuevaDuracion) || 30;
    if (!nombre) return;
    this.tratamientos.push({ nombre, duracion });
    this.nuevoTratamiento = '';
    this.nuevaDuracion = 30;
  }

  eliminarTratamiento(index: number): void {
    this.tratamientos.splice(index, 1);
  }

  guardarEIr(): void {
    this.irAlPanel();
  }

  irAlPanel(): void {
    window.location.href = '/inicio';
  }
}