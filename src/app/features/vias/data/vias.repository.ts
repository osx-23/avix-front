import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/api.service';

@Injectable({ providedIn: 'root' })
export class ViasRepository {
  private readonly api = inject(ApiService);

  plazas() { return this.api.plazas(); }
  listar(plaza: string) { return this.api.todasVias(plaza, 0, 100); }
  crear(plaza: string, numero: number, descripcion: string) {
    return this.api.crearVia(plaza, numero, descripcion);
  }
  actualizar(id: number, cambios: { numero?: number; descripcion?: string; activa?: boolean }) {
    return this.api.actualizarVia(id, { ...cambios });
  }
}
