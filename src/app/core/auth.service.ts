import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Sesion, Usuario } from './models';

const KEY = 'avix.web.session';
@Injectable({providedIn:'root'})
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly usuario = signal<Usuario | null>(this.readUser());
  token(): string | null { return sessionStorage.getItem(KEY + '.token'); }
  get isAuthenticated() { return !!this.token() && !!this.usuario(); }
  get isSupervisor() { return this.usuario()?.rol === 'SUPERVISOR'; }

  login(codigo: string, contrasena: string) {
    return this.http.post<Sesion>('/api/v1/auth/web', {codigo, contrasena}).pipe(
      tap(response => {
        if (!['SUPERVISOR','CONTROLADOR'].includes(response.usuario.rol)) {
          throw new Error('Este rol no puede ingresar al panel web.');
        }
        sessionStorage.setItem(KEY + '.token',response.token);
        sessionStorage.setItem(KEY + '.user',JSON.stringify(response.usuario));
        this.usuario.set(response.usuario);
      })
    );
  }
  clear() {
    sessionStorage.removeItem(KEY + '.token');
    sessionStorage.removeItem(KEY + '.user');
    this.usuario.set(null);
  }
  logout() {
    const token = this.token();
    if (!token) { this.clear(); return; }
    this.http.post<void>('/api/v1/auth/salir',{}).subscribe({error:()=>{}});
    this.clear();
  }
  private readUser(): Usuario | null {
    try {
      const raw=sessionStorage.getItem(KEY + '.user');
      const user=raw?JSON.parse(raw) as Usuario:null;
      return user && ['SUPERVISOR','CONTROLADOR'].includes(user.rol) ? user : null;
    } catch { return null; }
  }
}
