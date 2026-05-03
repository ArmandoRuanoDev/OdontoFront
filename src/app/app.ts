import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('OdontoApp');
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Intentamos reanudar si no hay token en memoria
    if (!this.authService.getAccessToken()) {
      this.authService.resumeSession().subscribe(ok => {
        if (!ok) {
          // Si el refresh falla, redirigimos al login (si no está ya en una ruta pública)
          this.router.navigate(['/login']);
        }
        // Si ok, la aplicación sigue normalmente (el guard de rutas también verificará)
      });
    }
  }
}
