import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Rol, Usuario } from '../../core/models/avix.models';
import { AltaUsuario, AsignacionUsuario, CambioUsuario, RolUsuariosFiltro, EstadoUsuariosFiltro } from './data/usuarios.repository';
import { UsuariosStore } from './state/usuarios.store';

interface UsuarioFormulario {
  codigo: string;
  nombres: string;
  apellidos: string;
  rol: Rol;
  contrasena: string;
}

function formularioVacio(): UsuarioFormulario {
  return { codigo: '', nombres: '', apellidos: '', rol: 'AGENTE', contrasena: '' };
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [UsuariosStore],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  readonly store = inject(UsuariosStore);
  readonly errorFormulario = signal('');
  nuevo = formularioVacio();
  editor = formularioVacio();
  plazaSeleccionada = '';

  ngOnInit(): void { this.store.iniciar(); }

  get plazaPorDefecto(): string {
    return this.plazaSeleccionada || this.store.plazas()[0]?.codigo || '';
  }

  cambiarFiltroRol(rol: RolUsuariosFiltro): void {
    this.store.cambiarRol(rol);
  }

  cambiarFiltroEstado(estado: EstadoUsuariosFiltro): void {
    this.store.cambiarEstado(estado);
  }

  crear(): void {
    this.errorFormulario.set('');
    const codigo = this.nuevo.codigo.trim();
    const nombres = this.nuevo.nombres.trim();
    if (!codigo || !nombres) {
      this.errorFormulario.set('El código y los nombres son obligatorios.');
      return;
    }
    if (this.nuevo.rol !== 'AGENTE' && this.nuevo.contrasena.length < 10) {
      this.errorFormulario.set('El puesto de controlador o supervisor requiere una contraseña de 10 caracteres como mínimo.');
      return;
    }
    const nuevo: AltaUsuario = {
      codigo, nombres,
      apellidos: this.nuevo.apellidos.trim(),
      rol: this.nuevo.rol
    };
    if (nuevo.rol !== 'AGENTE') nuevo.contrasena = this.nuevo.contrasena;
    this.store.crear(nuevo, () => {
      this.nuevo = formularioVacio();
      this.errorFormulario.set('');
    });
  }

  seleccionar(usuario: Usuario): void {
    this.errorFormulario.set('');
    this.editor = {
      codigo: usuario.codigo,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos || '',
      rol: usuario.rol,
      contrasena: ''
    };
    this.store.seleccionar(usuario);
  }

  guardar(): void {
    const usuario = this.store.seleccionado();
    if (!usuario) return;
    this.errorFormulario.set('');
    const nombres = this.editor.nombres.trim();
    if (!nombres) {
      this.errorFormulario.set('El nombre es obligatorio.');
      return;
    }
    const necesitaClave = usuario.rol === 'AGENTE' && this.editor.rol !== 'AGENTE';
    if (necesitaClave && !this.editor.contrasena) {
      this.errorFormulario.set('Para habilitar el acceso web debes asignar una contraseña.');
      return;
    }
    if (this.editor.contrasena && this.editor.contrasena.length < 10) {
      this.errorFormulario.set('La contraseña debe contener al menos 10 caracteres.');
      return;
    }
    const cambios: CambioUsuario = {
      nombres,
      apellidos: this.editor.apellidos.trim(),
      rol: this.editor.rol
    };
    if (this.editor.contrasena) cambios.contrasena = this.editor.contrasena;
    this.store.guardarUsuario(usuario.id, cambios, () => {
      this.editor.contrasena = '';
    });
  }

  cambiarEstado(usuario: Usuario): void {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    if (!confirm('¿Deseas ' + accion + ' al usuario ' + usuario.codigo + '?')) return;
    this.store.cambiarEstadoUsuario(usuario);
  }

  asignarPlaza(): void {
    const usuario = this.store.seleccionado();
    const plaza = this.plazaPorDefecto;
    if (!usuario || !plaza) return;
    this.store.asignarPlaza(usuario.id, plaza);
  }

  cambiarAsignacion(asignacion: AsignacionUsuario): void {
    const usuario = this.store.seleccionado();
    if (!usuario) return;
    const plaza = asignacion.plazas?.codigo
      || this.store.plazas().find(item => item.id === asignacion.plaza_id)?.codigo;
    if (!plaza) {
      this.errorFormulario.set('No se pudo identificar la plaza.');
      return;
    }
    this.store.cambiarAsignacion(usuario.id, plaza, !asignacion.activa);
  }
}
