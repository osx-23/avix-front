import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { Accion, Cambio, Plaza, Registro } from '../core/models';

@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./historial.component.html'})
export class HistorialComponent implements OnInit, OnDestroy {
  private readonly api=inject(ApiService);
  private refresco?: ReturnType<typeof setInterval>;
  plazas:Plaza[]=[]; rows:Registro[]=[];
  filtros={plaza:'',accion:'',fecha:''};
  page=0;size=20; cargando=false; error=''; exito='';
  detalle:Registro|null=null; auditoria:Cambio[]=[];
  editor:{placa:string;via:number;accion:Accion;observaciones:string}=
    {placa:'',via:0,accion:'FUGA',observaciones:''};
  motivo=''; guardando=false; cargandoDetalle=false;

  ngOnInit(){
    this.api.plazas().subscribe({next:p=>this.plazas=p,error:()=>{}});
    this.cargar();
    this.refresco=setInterval(()=>{if(!this.detalle && !this.cargando) this.cargar(true);},10_000);
  }
  ngOnDestroy(){if(this.refresco)clearInterval(this.refresco);}
  cargar(silencioso=false){
    if(!silencioso){this.cargando=true;this.error='';}
    this.api.registros({page:this.page,size:this.size,...this.filtros}).subscribe({
      next:rows=>{this.rows=rows;this.cargando=false;},
      error:(e:HttpErrorResponse)=>{
        this.cargando=false;
        if(!silencioso)this.error=e.error?.mensaje || 'No se pudo obtener el historial.';
      }
    });
  }
  buscar(){this.page=0;this.cargar();}
  siguiente(){if(this.rows.length===this.size){this.page++;this.cargar();}}
  anterior(){if(this.page>0){this.page--;this.cargar();}}
  abrir(r:Registro){
    this.detalle=r;
    this.auditoria=[];this.motivo='';this.exito='';
    this.editor={placa:r.placa,via:r.vias?.numero || 0,accion:r.acciones?.codigo || 'FUGA',
      observaciones:r.observaciones || ''};
    this.cargarAuditoria(r.id);
    this.cargandoDetalle=true;
    this.api.registro(r.id).subscribe({
      next:registro=>{this.cargandoDetalle=false;this.detalle=registro;
        this.editor={placa:registro.placa,via:registro.vias?.numero || 0,
          accion:registro.acciones?.codigo || 'FUGA',
          observaciones:registro.observaciones || ''};
      },
      error:(e:HttpErrorResponse)=>{this.cargandoDetalle=false;this.error=e.error?.mensaje || 'No se pudo recuperar el detalle.';}
    });
  }
  cargarAuditoria(id:string) {
    this.api.auditoria(id).subscribe({next:items=>this.auditoria=items,
      error:()=>this.auditoria=[]});
  }
  cerrar(){this.detalle=null;this.motivo='';}
  guardar(){
    if(!this.detalle || this.guardando)return;
    if(this.motivo.trim().length<5){this.error='Indica el motivo de la edición (mínimo 5 caracteres).';return;}
    this.guardando=true;this.error='';this.exito='';
    const id=this.detalle.id;
    const cambios:Record<string,unknown>={
      placa:this.editor.placa.trim().toUpperCase(),accion:this.editor.accion,
      observaciones:this.editor.observaciones
    };
    if(this.editor.via>0)cambios['via']=this.editor.via;
    this.api.editarRegistro(id,cambios,this.motivo).subscribe({
      next:()=>{this.guardando=false;this.exito='Registro modificado con auditoría.';
        this.cargar();this.cargarAuditoria(id);this.detalle=null;},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje || 'No fue posible modificar el registro.';}
    });
  }
  anular(){
    if(!this.detalle || this.guardando)return;
    if(this.motivo.trim().length<5){this.error='Indica el motivo de anulación (mínimo 5 caracteres).';return;}
    if(!confirm('¿Anular este registro? La acción quedará registrada en auditoría.'))return;
    this.guardando=true;this.error='';this.exito='';
    this.api.anularRegistro(this.detalle.id,this.motivo).subscribe({
      next:()=>{this.guardando=false;this.exito='Registro anulado correctamente.';
        this.detalle=null;this.cargar();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje || 'No fue posible anular el registro.';}
    });
  }
}
