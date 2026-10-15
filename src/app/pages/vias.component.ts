import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { Plaza, Via } from '../core/models';

@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./vias.component.html'})
export class ViasComponent implements OnInit {
  private readonly api=inject(ApiService);
  plazas:Plaza[]=[]; vias:Via[]=[];
  filtro=''; nuevaPlaza=''; nuevoNumero:number|null=null; descripcion='';
  editando:number|null=null; edit={numero:0,descripcion:''};
  cargando=false; guardando=false; error=''; exito='';
  ngOnInit(){
    this.api.plazas().subscribe({next:p=>{this.plazas=p;this.nuevaPlaza=p[0]?.codigo || '';},
      error:()=>this.error='No se pudo consultar el catálogo de plazas.'});
    this.cargar();
  }
  cargar(){
    this.cargando=true;this.error='';
    this.api.todasVias(this.filtro).subscribe({
      next:rows=>{this.vias=rows;this.cargando=false;},
      error:(e:HttpErrorResponse)=>{this.cargando=false;this.error=e.error?.mensaje||'No se pudieron consultar las vías.';}
    });
  }
  crear(){
    if(this.guardando || !this.nuevaPlaza || !this.nuevoNumero || this.nuevoNumero<1)return;
    this.guardando=true;this.error='';this.exito='';
    this.api.crearVia(this.nuevaPlaza,this.nuevoNumero,this.descripcion.trim()).subscribe({
      next:()=>{this.guardando=false;this.exito='Vía guardada correctamente.';this.nuevoNumero=null;this.descripcion='';this.cargar();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo crear la vía.';}
    });
  }
  editar(v:Via){
    this.editando=v.id;this.edit={numero:v.numero,descripcion:v.descripcion||''};
  }
  guardar(v:Via){
    if(this.guardando)return;
    this.guardando=true;this.error='';this.exito='';
    this.api.actualizarVia(v.id,{numero:this.edit.numero,descripcion:this.edit.descripcion}).subscribe({
      next:()=>{this.guardando=false;this.editando=null;this.exito='Vía actualizada.';this.cargar();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo modificar la vía.';}
    });
  }
  cambiarEstado(v:Via){
    if(this.guardando)return;
    this.guardando=true;this.error='';this.exito='';
    this.api.actualizarVia(v.id,{activa:!v.activa}).subscribe({
      next:()=>{this.guardando=false;this.exito='Estado actualizado.';this.cargar();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo cambiar el estado.';}
    });
  }
}
