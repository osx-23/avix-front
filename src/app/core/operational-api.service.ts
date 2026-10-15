import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, expand, map, reduce, shareReplay, switchMap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Accion, Cambio, Plaza, Registro } from './models';

export type AviAccion = Accion;

export interface AviRegistro {
  id: string;
  usuarioId: string;
  usuarioCodigo: string;
  usuarioNombre: string;
  plazaId: number;
  plazaCodigo: string;
  placa: string;
  via: number;
  accion: AviAccion;
  fechaHoraEvento: string;
  fechaHoraRecepcion: string;
  textoReconocido: string | null;
  anulado: boolean;
}
export interface AviPlazaConfig { id: number; codigo: string; descripcion: string | null }
export interface RegistroQuery {
  desde?: string;
  hasta?: string;
  plazaId?: number;
  via?: number;
  accion?: AviAccion;
}
export interface AviRegistroUpdate {
  placa: string; via: number; accion: AviAccion;
  fechaHoraEvento: string; textoReconocido: string; motivo: string;
}

/**
 * Adaptador AVIX Web independiente de SIGO.
 * Optimización:
 *  - El backend filtra directamente por instante, plaza, vía y acción.
 *  - Una consulta mensual sin datos ocupa una sola página, no ~31 peticiones.
 *  - Catálogo de plazas compartido y cacheado únicamente para la sesión actual.
 */
@Injectable({providedIn:'root'})
export class AviApiService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private catalogoCache?: { token: string; observable: Observable<Plaza[]> };

  listarPlazasConfiguracion(): Observable<AviPlazaConfig[]> {
    return this.plazasAutorizadas().pipe(map(plazas=>plazas.map(p=>({
      id:p.id,codigo:p.codigo,descripcion:p.nombre || null
    }))));
  }

  listarRegistros(query: RegistroQuery): Observable<AviRegistro[]> {
    const inicio=query.desde || new Date().toISOString();
    const fin=query.hasta || new Date().toISOString();
    const desde=Date.parse(inicio),hasta=Date.parse(fin);
    if(!Number.isFinite(desde)||!Number.isFinite(hasta)||hasta<=desde)
      return throwError(()=>new Error('Rango de fechas inválido.'));
    if(hasta-desde>33*24*60*60*1000)
      return throwError(()=>new Error('Selecciona un intervalo de hasta 33 días.'));

    return this.plazasAutorizadas().pipe(
      switchMap(plazas=>{
        const codigoPlaza=query.plazaId===undefined?undefined:
          plazas.find(p=>p.id===query.plazaId)?.codigo;
        if(query.plazaId!==undefined && !codigoPlaza)
          return throwError(()=>new Error('La plaza seleccionada no está autorizada.'));

        const pagina={page:0,size:500,desde:inicio,hasta:fin,
          plaza:codigoPlaza,accion:query.accion,via:query.via};
        return this.api.registrosRango(pagina).pipe(
          expand((rows,index)=>{
            if(rows.length<pagina.size)return EMPTY;
            if(index>=199) return throwError(()=>new Error(
              'Esta consulta tiene demasiados registros. Reduce el intervalo o filtra una plaza.'
            ));
            return this.api.registrosRango({...pagina,page:index+1});
          }),
          reduce((todos,lote)=>{todos.push(...lote);return todos;},[] as Registro[]),
          map(rows=>rows.map(row=>this.adaptar(row,plazas))),
          map(rows=>rows.sort((a,b)=>Date.parse(b.fechaHoraEvento)-Date.parse(a.fechaHoraEvento)))
        );
      })
    );
  }

  actualizarRegistro(id:string,body:AviRegistroUpdate):Observable<Registro>{
    return this.api.editarRegistro(id,{
      placa:body.placa,via:body.via,accion:body.accion
    },body.motivo);
  }

  anularRegistro(id:string,motivo:string):Observable<Registro>{
    return this.api.anularRegistro(id,motivo);
  }
  auditoria(id:string):Observable<Cambio[]> {return this.api.auditoria(id);}

  private plazasAutorizadas():Observable<Plaza[]>{
    const token=this.auth.token() || '';
    if(this.catalogoCache?.token===token)return this.catalogoCache.observable;
    const observable=this.api.plazas().pipe(
      catchError(error=>{
        if(this.catalogoCache?.token===token)this.catalogoCache=undefined;
        return throwError(()=>error);
      }),
      shareReplay({bufferSize:1,refCount:false})
    );
    this.catalogoCache={token,observable};
    return observable;
  }

  private adaptar(r:Registro,plazas:Plaza[]):AviRegistro{
    const codigo=r.usuarios?.codigo || '—';
    const plazaCodigo=r.plazas?.codigo || '—';
    return {
      id:r.id,usuarioId:codigo,usuarioCodigo:codigo,usuarioNombre:codigo,
      plazaId:plazas.find(p=>p.codigo===plazaCodigo)?.id ?? -1,
      plazaCodigo,placa:r.placa,via:r.vias?.numero || 0,
      accion:r.acciones?.codigo || 'FUGA',fechaHoraEvento:r.ocurrido_en,
      fechaHoraRecepcion:r.ocurrido_en,textoReconocido:r.observaciones || null,
      anulado:r.anulado
    };
  }
}
