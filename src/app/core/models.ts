export type Rol = 'SUPERVISOR' | 'CONTROLADOR' | 'AGENTE';
export type Accion = 'FUGA' | 'DERIVADO' | 'LIBERADO';
export type Cliente = 'WEB' | 'MOVIL';

export interface Usuario {
  id: string;
  codigo: string;
  nombres: string;
  apellidos?: string;
  rol: Rol;
  activo?: boolean;
}
export interface Sesion {
  token: string;
  tipo: string;
  expiraEn: string;
  usuario: Usuario;
}
export interface Plaza { id: number; codigo: string; nombre?: string; activa: boolean; }
export interface Via { id: number; plaza_id: number; numero: number; descripcion?: string; activa: boolean; plazas?: {codigo: string}; }
export interface Catalogo { id: number; codigo: string; activa?: boolean; activo?: boolean; }
export interface Registro {
  id: string;
  idempotencia_id?: string;
  registrado_por?: string;
  plaza_id?: number;
  via_id?: number;
  placa: string;
  ocurrido_en: string;
  fecha_operativa: string;
  origen: string;
  observaciones?: string | null;
  anulado: boolean;
  plazas?: { codigo: string };
  vias?: { numero: number };
  acciones?: { codigo: Accion };
  turnos?: { codigo: string };
  usuarios?: { codigo: string };
}
export interface Cambio {
  id: string; operacion: string; motivo: string; creado_en: string;
  valores_anteriores?: unknown; valores_nuevos?: unknown;
  usuarios?: { codigo: string };
}
