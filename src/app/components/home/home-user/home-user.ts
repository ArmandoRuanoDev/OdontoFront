import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Appointment {
  id: number;
  dateStr: string;       // 'YYYY-MM-DD'
  time: string;          // 'HH:MM'
  patientName: string;
  treatment: string;
  duration: number;      // minutos
  color: string;
  status: 'confirmada' | 'pendiente' | 'en-sala' | 'cancelada';
}

interface CalCell {
  day: number;
  dateStr: string;
  currentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
}

interface WeekDay {
  dow: string;
  day: number;
  dateStr: string;
  isToday: boolean;
  appointments: Appointment[];
}

interface ListGroup {
  label: string;
  dateStr: string;
  appointments: Appointment[];
}

type CalView = 'month' | 'week' | 'day' | 'list';

// ─── Datos de ejemplo ────────────────────────────────────────────────────────

const TODAY = new Date();
const pad   = (n: number) => String(n).padStart(2, '0');
const fmt   = (d: Date)   => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

function daysAhead(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return fmt(d);
}

const SAMPLE_APPOINTMENTS: Appointment[] = [
  { id: 1,  dateStr: fmt(TODAY),      time: '09:00', patientName: 'María López',     treatment: 'Limpieza dental',   duration: 45,  color: '#378ADD', status: 'confirmada' },
  { id: 2,  dateStr: fmt(TODAY),      time: '10:00', patientName: 'Carlos Herrera',  treatment: 'Ortodoncia',        duration: 60,  color: '#1D9E75', status: 'en-sala'    },
  { id: 3,  dateStr: fmt(TODAY),      time: '11:30', patientName: 'Ana Gutiérrez',   treatment: 'Extracción',        duration: 30,  color: '#fb923c', status: 'pendiente'  },
  { id: 4,  dateStr: daysAhead(1),    time: '09:30', patientName: 'Roberto Sánchez', treatment: 'Blanqueamiento',    duration: 90,  color: '#a78bfa', status: 'confirmada' },
  { id: 5,  dateStr: daysAhead(1),    time: '14:00', patientName: 'Lucía Martínez',  treatment: 'Revisión general',  duration: 30,  color: '#f472b6', status: 'pendiente'  },
  { id: 6,  dateStr: daysAhead(2),    time: '08:00', patientName: 'Felipe Ruiz',     treatment: 'Endodoncia',        duration: 120, color: '#f59e0b', status: 'confirmada' },
  { id: 7,  dateStr: daysAhead(3),    time: '10:00', patientName: 'Valeria Torres',  treatment: 'Prótesis dental',   duration: 60,  color: '#34d399', status: 'confirmada' },
  { id: 8,  dateStr: daysAhead(3),    time: '12:00', patientName: 'Diego Morales',   treatment: 'Limpieza dental',   duration: 45,  color: '#378ADD', status: 'pendiente'  },
  { id: 9,  dateStr: daysAhead(5),    time: '09:00', patientName: 'Sofía Ramírez',   treatment: 'Ortodoncia',        duration: 60,  color: '#1D9E75', status: 'confirmada' },
  { id: 10, dateStr: daysAhead(7),    time: '11:00', patientName: 'Andrés Jiménez',  treatment: 'Implante',          duration: 90,  color: '#ef4444', status: 'confirmada' },
  { id: 11, dateStr: daysAhead(-2),   time: '09:00', patientName: 'Laura Vega',      treatment: 'Blanqueamiento',    duration: 60,  color: '#a78bfa', status: 'confirmada' },
  { id: 12, dateStr: daysAhead(-1),   time: '10:30', patientName: 'José Castro',     treatment: 'Revisión',          duration: 30,  color: '#34d399', status: 'cancelada'  },
];

// ─── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-home-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-user.html',
  styleUrl: './home-user.css',
})
export class HomeUser implements OnInit {

  // ── Estado UI
  profileMenuOpen = false;
  rightPanelOpen  = false;
  selectedDate: string | null = null;

  // ── Calendario
  calView: CalView = 'month';
  currentDate = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1); // primer día del mes visible
  todayStr    = fmt(TODAY);
  _weekAnchor: Date = new Date(TODAY);

  // ── Datos calculados
  monthCells:   CalCell[]   = [];
  weekDays:     WeekDay[]   = [];
  listGroups:   ListGroup[] = [];
  selectedDayAppts: Appointment[] = [];

  // Búsqueda
  searchOpen   = false;
  searchQuery  = '';


  readonly weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly hours    = Array.from({ length: 12 }, (_, i) => {
    const h = i + 8; // 08:00 → 19:00
    return `${pad(h)}:00`;
  });

  // ── Todos los appointments (en prod vendrían del backend)
  private allAppts = SAMPLE_APPOINTMENTS;

  ngOnInit(): void {
    this.buildMonth();
    this.buildWeek();
    this.buildList();
  }

  // ════════════════════════════════════════════ NAVIGACIÓN ═══

  // Reemplaza prevMonth() y nextMonth() con esto:

prevPeriod(): void {
  if (this.calView === 'month') {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.buildMonth();
  } else if (this.calView === 'week') {
    this._weekAnchor.setDate(this._weekAnchor.getDate() - 7);
    this.buildWeek();
  } else if (this.calView === 'day') {
    const d = new Date(this.selectedDate ?? this.todayStr);
    d.setDate(d.getDate() - 1);
    this.selectedDate = fmt(d);
    this.openDetailPanel(this.selectedDate);
  }
  this.buildList();
}

nextPeriod(): void {
  if (this.calView === 'month') {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.buildMonth();
  } else if (this.calView === 'week') {
    this._weekAnchor.setDate(this._weekAnchor.getDate() + 7);
    this.buildWeek();
  } else if (this.calView === 'day') {
    const d = new Date(this.selectedDate ?? this.todayStr);
    d.setDate(d.getDate() + 1);
    this.selectedDate = fmt(d);
    this.openDetailPanel(this.selectedDate);
  }
  this.buildList();
}

  goToToday(): void {
  this.currentDate  = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  this._weekAnchor  = new Date(TODAY);
  this.selectedDate = this.todayStr;
  this.buildMonth();
  this.buildWeek();
  this.buildList();
  this.openDetailPanel(this.todayStr);
}

  setView(v: CalView): void {
  this.calView = v;
  if (v === 'day' && !this.selectedDate) {
    this.selectedDate = this.todayStr;
    this.openDetailPanel(this.todayStr);
  }
}

  get currentPeriodLabel(): string {
  if (this.calView === 'month') {
    return this.currentDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase());
  }
  if (this.calView === 'week') {
    const first = this.weekDays[0];
    const last  = this.weekDays[6];
    if (!first || !last) return '';
    const f = new Date(first.dateStr + 'T00:00:00');
    const l = new Date(last.dateStr  + 'T00:00:00');
    const sameMonth = f.getMonth() === l.getMonth();
    return sameMonth
      ? `${f.getDate()} – ${l.getDate()} ${l.toLocaleString('es-MX', { month: 'long', year: 'numeric' })}`
      : `${f.getDate()} ${f.toLocaleString('es-MX',{month:'short'})} – ${l.getDate()} ${l.toLocaleString('es-MX',{month:'short', year:'numeric'})}`;
  }
  if (this.calView === 'day') {
    const ds = this.selectedDate ?? this.todayStr;
    return this.formatDateLabel(ds);
  }
  return ''; // list — no se muestra
}


get filteredAppts(): Appointment[] {
  if (!this.searchQuery.trim()) return [];
  const q = this.searchQuery.toLowerCase();
  return this.allAppts.filter(a =>
    a.patientName.toLowerCase().includes(q) ||
    a.treatment.toLowerCase().includes(q)   ||
    a.dateStr.includes(q)
  );
}

toggleSearch(): void { this.searchOpen = !this.searchOpen; if (!this.searchOpen) this.searchQuery = ''; }

  // ════════════════════════════════════════ BUILD MONTH ═══

  buildMonth(): void {
    const year  = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);

    // lunes como primer día: JS usa 0=domingo
    let startDow = first.getDay(); // 0-6
    startDow = startDow === 0 ? 6 : startDow - 1; // convert: Mon=0

    const cells: CalCell[] = [];

    // Días del mes anterior
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const ds = fmt(d);
      cells.push({ day: d.getDate(), dateStr: ds, currentMonth: false, isToday: ds === this.todayStr, appointments: this.getAppts(ds) });
    }

    // Días del mes actual
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      const ds   = fmt(date);
      cells.push({ day: d, dateStr: ds, currentMonth: true, isToday: ds === this.todayStr, appointments: this.getAppts(ds) });
    }

    // Rellenar hasta completar 6 semanas (42 celdas)
    let nextDay = 1;
    while (cells.length < 42) {
      const d  = new Date(year, month + 1, nextDay++);
      const ds = fmt(d);
      cells.push({ day: d.getDate(), dateStr: ds, currentMonth: false, isToday: ds === this.todayStr, appointments: this.getAppts(ds) });
    }

    this.monthCells = cells;
  }

  // ════════════════════════════════════════ BUILD WEEK ═══

  buildWeek(): void {
  const anchor = this._weekAnchor;
  const dow    = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - (dow === 0 ? 6 : dow - 1));

  const dowNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  this.weekDays = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = fmt(d);
    return { dow: dowNames[i], day: d.getDate(), dateStr: ds, isToday: ds === this.todayStr, appointments: this.getAppts(ds) };
  });
}

  // ════════════════════════════════════════ BUILD LIST ═══

  buildList(): void {
    const start = new Date(TODAY);
    const end   = new Date(TODAY);
    end.setDate(end.getDate() + 30);

    const groups = new Map<string, Appointment[]>();

    this.allAppts
      .filter(a => {
        const d = new Date(a.dateStr);
        return d >= start && d <= end;
      })
      .sort((a, b) => (a.dateStr + a.time).localeCompare(b.dateStr + b.time))
      .forEach(a => {
        if (!groups.has(a.dateStr)) groups.set(a.dateStr, []);
        groups.get(a.dateStr)!.push(a);
      });

    this.listGroups = Array.from(groups.entries()).map(([ds, appts]) => ({
      label: this.formatDateLabel(ds),
      dateStr: ds,
      appointments: appts,
    }));
  }

  // ════════════════════════════════════════ SELECCIÓN ═══

  selectDate(cell: CalCell | WeekDay): void {
    this.selectedDate = cell.dateStr;
    this.openDetailPanel(cell.dateStr);
  }

  selectDateStr(ds: string): void {
    this.selectedDate = ds;
    this.openDetailPanel(ds);
  }

  openDetailPanel(ds: string): void {
    this.selectedDayAppts = this.getAppts(ds).sort((a, b) => a.time.localeCompare(b.time));
    this.rightPanelOpen   = true;
  }

  closeDetailPanel(): void {
    this.rightPanelOpen = false;
  }

  // ════════════════════════════════════════ PERFIL ═══

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  // ════════════════════════════════════════ UTILIDADES ═══

  getAppts(ds: string): Appointment[] {
    return this.allAppts.filter(a => a.dateStr === ds);
  }

  getDayAppointments(ds: string): Appointment[] {
    return this.getAppts(ds).sort((a, b) => a.time.localeCompare(b.time));
  }

  /** Posición top en px dentro de la grilla de horas (1 hora = 56px, inicio = 08:00) */
  getEventTop(a: Appointment): number {
    const [h, m] = a.time.split(':').map(Number);
    return (h - 8) * 56 + (m / 60) * 56;
  }

  getEventHeight(a: Appointment): number {
    return Math.max((a.duration / 60) * 56, 24);
  }

  getDayOfWeek(ds: string): string {
    const d = new Date(ds + 'T00:00:00');
    return d.toLocaleString('es-MX', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase());
  }

  getDayNum(ds: string): number {
    return new Date(ds + 'T00:00:00').getDate();
  }

  formatSelectedDate(): string {
    if (!this.selectedDate) return '';
    return this.formatDateLabel(this.selectedDate);
  }

  formatDateLabel(ds: string): string {
    const d = new Date(ds + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      confirmada: 'Confirmada',
      pendiente:  'Pendiente',
      'en-sala':  'En sala',
      cancelada:  'Cancelada',
    };
    return labels[status] ?? status;
  }

  

  private isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  // ════════════════════════════════════ CLICK OUTSIDE ═══

  closeAllOnOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-profile')) {
      this.profileMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.rightPanelOpen  = false;
    this.profileMenuOpen = false;
  }
}