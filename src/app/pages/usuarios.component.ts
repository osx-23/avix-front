import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { Plaza, Rol, Usuario } from '../core/models';

type Asignacion = { plaza_id:number; activa:boolean; plazas?:{codigo:string;nombre?:string} };
@Component({standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./usuarios.component.html'})
export class UsuariosComponent implements OnInit {
  private readonly api=inject(ApiService);
  usuarios:Usuario[]=[];plazas:Plaza[]=[];asignaciones:Asignacion[]=[];
  nuevo:{codigo:string;nombres:string;apellidos:string;rol:Rol;contrasena:string}=
    {codigo:'',nombres:'',apellidos:'',rol:'AGENTE',contrasena:''};
  seleccionado:Usuario|null=null;
  editor:{nombres:string;apellidos:string;rol:Rol;contrasena:string}=
    {nombres:'',apellidos:'',rol:'AGENTE',contrasena:''};
  nuevaPlaza='';cargando=false;guardando=false;error='';exito='';
  ngOnInit(){
    this.cargar();
    this.api.plazas().subscribe({next:p=>{this.plazas=p;this.nuevaPlaza=p[0]?.codigo||'';},
      error:()=>{}});
  }
  cargar(){
    this.cargando=true;
    this.api.usuarios().subscribe({
      next:u=>{this.usuarios=u;this.cargando=false;},
      error:(e:HttpErrorResponse)=>{this.cargando=false;this.error=e.error?.mensaje||'No se pudieron cargar los usuarios.';}
    });
  }
  crear(){
    if(this.guardando)return;
    if(this.nuevo.rol!=='AGENTE' && this.nuevo.contrasena.length<10){
      this.error='Controladores y supervisores requieren una contraseña de al menos 10 caracteres.';return;
    }
    const payload:Record<string,unknown>={codigo:this.nuevo.codigo.trim(),nombres:this.nuevo.nombres.trim(),
      apellidos:this.nuevo.apellidos.trim(),rol:this.nuevo.rol};
    if(this.nuevo.rol!=='AGENTE')payload['contrasena']=this.nuevo.contrasena;
    this.guardando=true;this.error='';this.exito='';
    this.api.crearUsuario(payload).subscribe({
      next:()=>{this.guardando=false;this.exito='Usuario registrado.';
        this.nuevo={codigo:'',nombres:'',apellidos:'',rol:'AGENTE',contrasena:''};this.cargar();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo crear el usuario.';}
    });
  }
  seleccionar(u:Usuario){
    this.seleccionado=u;
    this.editor={nombres:u.nombres,apellidos:u.apellidos||'',rol:u.rol,contrasena:''};
    this.asignaciones=[];this.error='';this.exito='';
    this.actualizarAsignaciones();
  }
  actualizarAsignaciones(){
    if(!this.seleccionado)return;
    this.api.asignaciones(this.seleccionado.id).subscribe({
      next:p=>this.asignaciones=p,error:(e:HttpErrorResponse)=>this.error=e.error?.mensaje||'No se pudieron consultar las asignaciones.'
    });
  }
  guardar(){
    if(!this.seleccionado||this.guardando)return;
    const cambios:Record<string,unknown>={nombres:this.editor.nombres.trim(),
      apellidos:this.editor.apellidos.trim(),rol:this.editor.rol};
    if(this.editor.contrasena){
      if(this.editor.contrasena.length<10){this.error='La contraseña debe tener al menos 10 caracteres.';return;}
      cambios['contrasena']=this.editor.contrasena;
    }
    this.guardando=true;this.error='';this.exito='';
    this.api.actualizarUsuario(this.seleccionado.id,cambios).subscribe({
      next:(u)=>{this.guardando=false;this.exito='Cambios guardados.';
        this.seleccionado=u;this.editor.contrasena='';this.cargar();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo actualizar el usuario.';}
    });
  }
  activar(u:Usuario){
    if(this.guardando)return;
    const nuevoEstado=!u.activo;
    if(!confirm(nuevoEstado?'¿Activar este usuario?':'¿Desactivar este usuario y revocar sus sesiones?'))return;
    this.guardando=true;this.error='';this.exito='';
    this.api.actualizarUsuario(u.id,{activo:nuevoEstado}).subscribe({
      next:()=>{this.guardando=false;this.exito='Estado de usuario actualizado.';this.cargar();
        if(this.seleccionado?.id===u.id)this.seleccionado=null;},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo cambiar el estado.';}
    });
  }
  asignar(){
    if(!this.seleccionado||!this.nuevaPlaza||this.guardando)return;
    this.guardando=true;this.error='';this.exito='';
    this.api.asignarPlaza(this.seleccionado.id,this.nuevaPlaza).subscribe({
      next:()=>{this.guardando=false;this.exito='Plaza asignada.';this.actualizarAsignaciones();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo asignar la plaza.';}
    });
  }
  cambiarAsignacion(a:Asignacion){
    if(!this.seleccionado||this.guardando)return;
    const plaza=a.plazas?.codigo || this.plazas.find(p=>p.id===a.plaza_id)?.codigo;
    if(!plaza){this.error='No se pudo identificar la plaza.';return;}
    this.guardando=true;this.error='';this.exito='';
    this.api.estadoPlaza(this.seleccionado.id,plaza,!a.activa).subscribe({
      next:()=>{this.guardando=false;this.exito='Asignación actualizada.';this.actualizarAsignaciones();},
      error:(e:HttpErrorResponse)=>{this.guardando=false;this.error=e.error?.mensaje||'No se pudo modificar la asignación.';}
    });
  }
}
