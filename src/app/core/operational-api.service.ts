import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, from, throwError } from 'rxjs';
import { expand, map, mergeMap, reduce, switchMap, toArray } from 'rxjs/operators';
import { ApiService } from './api.service';
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
  fechaHoraEvento: string;
  textoReconocido: string;
  motivo: string;
}

// Adaptador de presentación: preserva los filtros/gráficos del antiguo AVIX
// sin solicitar /api/avi ni conectar el backend SIGO.
@Injectable({providedIn:'root'})
export class AviApiService {
  private readonly api = inject(ApiService);
  private readonly formatter = new Intl.DateTimeFormat('en-GB',{
    timeZone:'America/Lima', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', hourCycle:'h23'
  });

  listarPlazasConfiguracion(): Observable<AviPlazaConfig[]> {
    return this.api.plazas().pipe(map(plazas=>plazas.map(p=>({
      id:p.id,codigo:p.codigo,descripcion:p.nombre || null
    }))));
  }

  listarRegistros(query: RegistroQuery): Observable<AviRegistro[]> {
    const inicio = query.desde || new Date().toISOString();
    const fin = query.hasta || new Date().toISOString();
    const desde = Date.parse(inicio), hasta = Date.parse(fin);
    if(!Number.isFinite(desde)||!Number.isFinite(hasta)||hasta<=desde)
      return throwError(()=>new Error('Rango de fechas inválido.'));
    const fechaInicial=this.fechaOperativa(desde);
    // El límite es exclusivo en las ventanas por horas.
    const fechaFinal=this.fechaOperativa(hasta-1);
    const fechas:string[]=[];
    for(let d=new Date(fechaInicial+'T12:00:00Z');d<=new Date(fechaFinal+'T12:00:00Z');
        d.setUTCDate(d.getUTCDate()+1)){
      fechas.push(d.toISOString().slice(0,10));
      if(fechas.length>32) return throwError(()=>new Error('Selecciona un período de hasta 32 jornadas.'));
    }
    return this.api.plazas().pipe(
      switchMap(plazas=>{
        const plazaCodigo=query.plazaId===undefined?undefined:
          plazas.find(p=>p.id===query.plazaId)?.codigo;
        // Filtrado de plaza SIEMPRE en el backend, nunca descargar otras plazas
        // si el identificador no está entre las asignadas.
        if(query.plazaId!==undefined && !plazaCodigo) return throwError(
          ()=>new Error('La plaza seleccionada no está disponible.')
        );
        return from(fechas).pipe(
          mergeMap(fecha=>this.paginarFecha(fecha,plazaCodigo,query.accion),3),
          toArray(),
          map(bloques=>bloques.flat()),
          map(rows=>rows.filter(r=>{
            const fecha=Date.parse(r.ocurrido_en);
            return fecha>=desde && fecha<hasta &&
              (query.via===undefined || r.vias?.numero===query.via);
          })),
          map(rows=>rows.map(row=>this.adaptar(row,plazas))),
          map(rows=>rows.sort((a,b)=>Date.parse(b.fechaHoraEvento)-Date.parse(a.fechaHoraEvento)))
        );
      })
    );
  }

  actualizarRegistro(id: string,body: AviRegistroUpdate): Observable<Registro> {
    return this.api.editarRegistro(id,{
      placa:body.placa,via:body.via,accion:body.accion
    },body.motivo);
  }

  anularRegistro(id:string,motivo:string): Observable<Registro> {
    return this.api.anularRegistro(id,motivo);
  }

  auditoria(id:string):Observable<Cambio[]> { return this.api.auditoria(id); }

  private paginarFecha(fecha:string,plaza?:string,accion?:Accion):Observable<Registro[]>{
    const size=100;
    return this.api.registros({page:0,size,fecha,plaza,accion}).pipe(
      expand((rows,index)=>{
        if(rows.length<size) return EMPTY;
        if(index>=499) return throwError(()=>new Error(
          'Demasiados registros para esta jornada. Ajusta los filtros antes de continuar.'
        ));
        return this.api.registros({page:index+1,size,fecha,plaza,accion});
      }),
      reduce((all,chunk)=>{all.push(...chunk);return all;},[] as Registro[])
    );
  }

  private fechaOperativa(when:number):string{
    const parts=this.formatter.formatToParts(new Date(when));
    const get=(type:string)=>parts.find(p=>p.type===type)?.value||'';
    const fecha=get('year')+'-'+get('month')+'-'+get('day');
    const hora=Number(get('hour'));
    if(hora>=6)return fecha;
    const prev=new Date(fecha+'T12:00:00Z');
    prev.setUTCDate(prev.getUTCDate()-1);
    return prev.toISOString().slice(0,10);
  }

  private adaptar(r:Registro, plazas:Plaza[]):AviRegistro{
    const codigo=r.usuarios?.codigo || '—';
    const codigoPlaza=r.plazas?.codigo || '—';
    return {
      id:r.id,
      usuarioId:codigo,
      usuarioCodigo:codigo,
      usuarioNombre:codigo,
      plazaId:plazas.find(p=>p.codigo===codigoPlaza)?.id || -1,
      plazaCodigo:codigoPlaza,
      placa:r.placa,
      via:r.vias?.numero || 0,
      accion:r.acciones?.codigo || 'FUGA',
      fechaHoraEvento:r.ocurrido_en,
      fechaHoraRecepcion:r.ocurrido_en,
      textoReconocido:r.observaciones || null,
      anulado:r.anulado
    };
  }
}
