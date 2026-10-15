import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mostrarContrasena = signal(false);

  codigo = '';
  contrasena = '';

  constructor() {
    if (this.auth.isAuthenticated) void this.router.navigateByUrl('/dashboard');
  }

  ingresar(): void {
    if (this.cargando() || !this.codigo.trim() || !this.contrasena) return;

    this.cargando.set(true);
    this.error.set('');
    this.auth.login(this.codigo.trim(), this.contrasena)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cargando.set(false);
          void this.router.navigateByUrl('/dashboard');
        },
        error: (response: unknown) => {
          this.cargando.set(false);
          if (response instanceof HttpErrorResponse) {
            if (response.status === 0) {
              this.error.set('No se pudo conectar con AVIX API. Verifica que el backend esté iniciado.');
            } else if (response.status === 401 || response.status === 403) {
              this.error.set('Código o contraseña incorrectos, o acceso web no autorizado.');
            } else {
              this.error.set('No fue posible iniciar sesión. Inténtalo nuevamente.');
            }
          } else {
            this.error.set('No fue posible iniciar sesión. Inténtalo nuevamente.');
          }
        }
      });
  }
}
