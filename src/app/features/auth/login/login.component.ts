import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';

@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./login.component.html'})
export class LoginComponent {
  private readonly auth=inject(AuthService);
  private readonly router=inject(Router);
  codigo=''; contrasena=''; cargando=false; error='';
  constructor() {
    if (this.auth.isAuthenticated) void this.router.navigateByUrl('/dashboard');
  }
  ingresar() {
    if (this.cargando || !this.codigo.trim() || !this.contrasena) return;
    this.cargando=true; this.error='';
    this.auth.login(this.codigo.trim(),this.contrasena).subscribe({
      next:()=>{this.cargando=false;void this.router.navigateByUrl('/dashboard');},
      error:(err:unknown)=>{
        this.cargando=false;
        this.error=err instanceof HttpErrorResponse ?
          (err.error?.mensaje || 'Código o contraseña incorrectos, o API no disponible.') :
          'No se pudo iniciar sesión.';
      }
    });
  }
}
