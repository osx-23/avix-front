import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/api/api.service';
import { Plaza, Rol, Usuario } from '../../../core/models/avix.models';


export type EstadoUsuariosFiltro = 'ACTIVOS' | 'INACTIVOS' | 'TODOS';
export type RolUsuariosFiltro = Rol | '';

export interface AsignacionUsuario {
  plaza_id: number;
  activa: boolean;
  plazas?: { codigo: string; nombre?: string };
}

export interface AltaUsuario {
  codigo: string;
  nombres: string;
  apellidos: string;
  rol: Rol;
  contrasena?: string;
}

export interface CambioUsuario {
  nombres?: string;
  apellidos?: string;
  rol?: Rol;
  activo?: boolean;
  contrasena?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosRepository {
  private readonly api = inject(ApiService);

  listar(page: number, size: number, rol: RolUsuariosFiltro, estado: EstadoUsuariosFiltro) {
    const activo = estado === 'TODOS' ? undefined : estado === 'ACTIVOS';
    return this.api.usuarios(page, size, rol || undefined, activo);
  }

  plazas() { return this.api.plazas(); }
  crear(data: AltaUsuario) { return this.api.crearUsuario({ ...data }); }
  actualizar(id: string, cambios: CambioUsuario) { return this.api.actualizarUsuario(id, { ...cambios }); }

  asignaciones(id: string) { return this.api.asignaciones(id); }
  asignar(id: string, plaza: string) { return this.api.asignarPlaza(id, plaza); }
  cambiarAsignacion(id: string, plaza: string, activa: boolean) {
    return this.api.estadoPlaza(id, plaza, activa);
  }
}
