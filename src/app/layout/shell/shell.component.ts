import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly colapsado = signal(this.leerPreferencia());
  readonly menuMovilAbierto = signal(false);

  alternarBarra(): void {
    const nuevoEstado = !this.colapsado();
    this.colapsado.set(nuevoEstado);
    try {
      localStorage.setItem('avix.sidebar.collapsed', String(nuevoEstado));
    } catch {}
  }

  alternarMenuMovil(): void {
    this.menuMovilAbierto.update(abierto => !abierto);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    if (this.menuMovilAbierto()) this.cerrarMenuMovil();
  }

  salir(): void {
    this.cerrarMenuMovil();
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private leerPreferencia(): boolean {
    try {
      return localStorage.getItem('avix.sidebar.collapsed') === 'true';
    } catch {
      return false;
    }
  }
}
