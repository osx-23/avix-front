import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Registro } from '../core/models';

@Component({standalone:true,imports:[CommonModule,RouterLink],templateUrl:'./dashboard.component.html'})
export class DashboardComponent implements OnInit {
  private readonly api=inject(ApiService);
  recientes:Registro[]=[]; total=0; fugas=0; derivados=0; liberados=0; cargando=false; error='';
  ngOnInit(){this.cargar();}
  cargar(){
    this.cargando=true;this.error='';
    this.api.registros({page:0,size:100}).subscribe({
      next:rows=>{
        const activos=rows.filter(r=>!r.anulado);
        this.total=rows.length;this.fugas=activos.filter(r=>r.acciones?.codigo==='FUGA').length;
        this.derivados=activos.filter(r=>r.acciones?.codigo==='DERIVADO').length;
        this.liberados=activos.filter(r=>r.acciones?.codigo==='LIBERADO').length;
        this.recientes=rows.slice(0,8);this.cargando=false;
      },
      error:()=>{this.cargando=false;this.error='No se pudieron cargar los registros. Comprueba que AVIX API esté iniciado.';}
    });
  }
}
