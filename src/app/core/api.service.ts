import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Accion, Catalogo, Cambio, Plaza, Registro, Usuario, Via } from './models';

// Ruta relativa: en local Angular la envía por el proxy a avix-api:8080.
const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private params(values: Record<string, string | number | boolean | null | undefined>): HttpParams {
    let result = new HttpParams();
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined && value !== '') result = result.set(key, String(value));
    }
    return result;
  }

  status() { return this.http.get<{api: string; supabaseConfigurado: boolean}>(API + '/status'); }
  plazas() { return this.http.get<Plaza[]>(API + '/catalogos/plazas'); }
  viasDePlaza(plaza: string) { return this.http.get<Via[]>(API + '/catalogos/vias', {params: this.params({plaza})}); }
  acciones() { return this.http.get<Catalogo[]>(API + '/catalogos/acciones'); }
  turnos() { return this.http.get<Catalogo[]>(API + '/catalogos/turnos'); }

  registros(filters: {page: number; size: number; plaza?: string; accion?: string; fecha?: string}): Observable<Registro[]> {
    return this.http.get<Registro[]>(API + '/registros', {params: this.params(filters)});
  }
  registro(id: string) { return this.http.get<Registro>(API + '/registros/' + encodeURIComponent(id)); }
  auditoria(id: string) { return this.http.get<Cambio[]>(API + '/registros/' + encodeURIComponent(id) + '/auditoria'); }
  editarRegistro(id: string, cambios: Record<string, unknown>, motivo: string) {
    return this.http.patch<Registro>(API + '/registros/' + encodeURIComponent(id), {cambios, motivo});
  }
  anularRegistro(id: string, motivo: string) {
    return this.http.patch<Registro>(API + '/registros/' + encodeURIComponent(id) + '/anular', {motivo});
  }

  usuarios(page = 0, size = 50) {
    return this.http.get<Usuario[]>(API + '/admin/usuarios', {params: this.params({page,size})});
  }
  crearUsuario(data: Record<string, unknown>) { return this.http.post<unknown>(API + '/admin/usuarios',data); }
  actualizarUsuario(id: string, data: Record<string, unknown>) {
    return this.http.patch<Usuario>(API + '/admin/usuarios/' + encodeURIComponent(id),data);
  }
  asignaciones(id: string) {
    return this.http.get<Array<{plaza_id: number; activa: boolean; plazas?: {codigo: string; nombre?: string}}>>(API + '/admin/usuarios/' + encodeURIComponent(id) + '/plazas');
  }
  asignarPlaza(id: string, plaza: string) {
    return this.http.post<unknown>(API + '/admin/usuarios/' + encodeURIComponent(id) + '/plazas',{plaza});
  }
  estadoPlaza(id: string, plaza: string, activa: boolean) {
    return this.http.patch<unknown>(API + '/admin/usuarios/' + encodeURIComponent(id) + '/plazas/' + encodeURIComponent(plaza),{activa});
  }
  todasVias(plaza = '', page = 0, size = 100) {
    return this.http.get<Via[]>(API + '/admin/vias',{params:this.params({plaza,page,size})});
  }
  crearVia(plaza: string, numero: number, descripcion: string) {
    return this.http.post<unknown>(API + '/admin/vias',{plaza,numero,descripcion});
  }
  actualizarVia(id: number, cambios: Record<string, unknown>) {
    return this.http.patch<Via[]>(API + '/admin/vias/' + id,cambios);
  }
}
