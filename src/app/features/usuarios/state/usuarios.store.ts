import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { mensajeError } from '../../../core/http-error';
import { Observable, Subscription, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Plaza, Usuario } from '../../../core/models';
import {
  AltaUsuario, AsignacionUsuario, CambioUsuario, EstadoUsuariosFiltro,
  RolUsuariosFiltro, UsuariosRepository
} from '../data/usuarios.repository';


/**
 * Estado de la pantalla mediante Signals:
 * las respuestas HTTP actualizan inmediatamente la vista, sin esperar un clic
 * sobre inputs/selects (Angular zoneless).
 *
 * El store vive solo durante la ruta Usuarios: no comparte datos sensibles
 * entre sesiones ni guarda un caché persistente de cuentas.
 */
@Injectable()
export class UsuariosStore {
  private readonly repository = inject(UsuariosRepository);
  private readonly destroyRef = inject(DestroyRef);
  private listadoSub?: Subscription;
  private plazasSub?: Subscription;
  private asignacionesSub?: Subscription;
  private mutationSub?: Subscription;

  readonly usuarios = signal<Usuario[]>([]);
  readonly plazas = signal<Plaza[]>([]);
  readonly asignaciones = signal<AsignacionUsuario[]>([]);
  readonly seleccionado = signal<Usuario | null>(null);

  readonly filtroRol = signal<RolUsuariosFiltro>('');
  readonly filtroEstado = signal<EstadoUsuariosFiltro>('ACTIVOS');
  readonly pagina = signal(0);
  readonly tamano = 25;

  readonly cargando = signal(false);
  readonly cargandoPlazas = signal(false);
  readonly cargandoAsignaciones = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');
  readonly errorAsignaciones = signal('');

  readonly haySiguiente = computed(() => this.usuarios().length === this.tamano);
  readonly activosPagina = computed(() => this.usuarios().filter(u => u.activo === true).length);
  readonly inactivosPagina = computed(() => this.usuarios().filter(u => u.activo === false).length);

  iniciar(): void {
    this.cargar();
    this.cargarPlazas();

    // Sincroniza cambios realizados en otras sesiones mientras la vista está abierta.
    timer(30_000, 30_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!this.cargando() && !this.guardando()) this.cargar(true);
    });
  }

  cargar(silencioso = false): void {
    this.listadoSub?.unsubscribe(); // filtros rápidos: nunca aplicar respuestas antiguas
    if (!silencioso) this.cargando.set(true);
    if (!silencioso) this.error.set('');

    const pagina = this.pagina();
    this.listadoSub = this.repository.listar(
      pagina, this.tamano, this.filtroRol(), this.filtroEstado()
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: users => {
        this.usuarios.set(users);
        this.cargando.set(false);
        const selected = this.seleccionado();
        if (selected) {
          const refreshed = users.find(u => u.id === selected.id);
          if (refreshed) this.seleccionado.set(refreshed);
        }
      },
      error: error => {
        this.cargando.set(false);
        // Un refresco automático no debe vaciar resultados válidos previos.
        this.error.set(mensajeError(error));
      }
    });
  }

  cargarPlazas(): void {
    this.plazasSub?.unsubscribe();
    this.cargandoPlazas.set(true);
    this.plazasSub = this.repository.plazas()
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: plazas => { this.plazas.set(plazas); this.cargandoPlazas.set(false); },
        error: error => {
          this.cargandoPlazas.set(false);
          this.error.set('No se pudieron cargar las plazas. ' + mensajeError(error));
        }
      });
  }

  cambiarRol(rol: RolUsuariosFiltro): void {
    this.filtroRol.set(rol);
    this.pagina.set(0);
    this.cargar();
  }

  cambiarEstado(estado: EstadoUsuariosFiltro): void {
    this.filtroEstado.set(estado);
    this.pagina.set(0);
    this.cargar();
  }

  avanzar(): void {
    if (this.cargando() || !this.haySiguiente()) return;
    this.pagina.update(p => p + 1);
    this.cargar();
  }

  retroceder(): void {
    if (this.cargando() || this.pagina() === 0) return;
    this.pagina.update(p => p - 1);
    this.cargar();
  }

  seleccionar(usuario: Usuario): void {
    this.asignacionesSub?.unsubscribe();
    this.seleccionado.set(usuario);
    this.asignaciones.set([]);
    this.errorAsignaciones.set('');
    this.cargarAsignaciones(usuario.id);
  }

  cerrarDetalle(): void {
    this.asignacionesSub?.unsubscribe();
    this.seleccionado.set(null);
    this.asignaciones.set([]);
    this.errorAsignaciones.set('');
    this.cargandoAsignaciones.set(false);
  }

  cargarAsignaciones(id = this.seleccionado()?.id): void {
    if (!id) return;
    this.asignacionesSub?.unsubscribe();
    this.cargandoAsignaciones.set(true);
    this.errorAsignaciones.set('');
    this.asignacionesSub = this.repository.asignaciones(id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: items => {
          // Evita que una respuesta obsoleta de otro usuario sustituya esta lista.
          if (this.seleccionado()?.id === id) this.asignaciones.set(items);
          this.cargandoAsignaciones.set(false);
        },
        error: error => {
          this.cargandoAsignaciones.set(false);
          if (this.seleccionado()?.id === id) this.errorAsignaciones.set(mensajeError(error));
        }
      });
  }

  crear(datos: AltaUsuario, ok: () => void): void {
    this.ejecutar(this.repository.crear(datos), 'Usuario creado correctamente.', ok);
  }

  guardarUsuario(id: string, cambios: CambioUsuario, ok: () => void): void {
    this.ejecutar(this.repository.actualizar(id, cambios), 'Datos del usuario actualizados.', () => {
      // Actualización inmediata sin depender de la siguiente consulta.
      this.seleccionado.update(current => current?.id === id
        ? { ...current, ...this.soloCamposPublicos(cambios) } : current);
      ok();
    });
  }

  cambiarEstadoUsuario(usuario: Usuario): void {
    const activo = !usuario.activo;
    this.ejecutar(
      this.repository.actualizar(usuario.id, { activo }),
      activo ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.',
      () => {
        if (this.seleccionado()?.id === usuario.id) this.cerrarDetalle();
        // Si se visualizan solo los activos, recargar elimina al desactivado.
      }
    );
  }

  asignarPlaza(id: string, plaza: string): void {
    this.ejecutar(this.repository.asignar(id, plaza), 'Plaza asignada correctamente.',
      () => this.cargarAsignaciones(id));
  }

  cambiarAsignacion(id: string, plaza: string, activa: boolean): void {
    this.ejecutar(
      this.repository.cambiarAsignacion(id, plaza, activa),
      'Asignación actualizada.',
      () => this.cargarAsignaciones(id)
    );
  }

  limpiarMensajes(): void {
    this.error.set('');
    this.exito.set('');
  }

  private soloCamposPublicos(cambios: CambioUsuario): Partial<Usuario> {
    const { nombres, apellidos, rol, activo } = cambios;
    return {
      ...(nombres !== undefined ? { nombres } : {}),
      ...(apellidos !== undefined ? { apellidos } : {}),
      ...(rol !== undefined ? { rol } : {}),
      ...(activo !== undefined ? { activo } : {})
    };
  }

  private ejecutar(operacion: Observable<unknown>, mensaje: string, onSuccess?: () => void): void {
    if (this.guardando()) return;
    this.mutationSub?.unsubscribe();
    this.guardando.set(true);
    this.limpiarMensajes();
    this.mutationSub = operacion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.guardando.set(false);
        this.exito.set(mensaje);
        onSuccess?.();
        this.cargar(true);
      },
      error: error => {
        this.guardando.set(false);
        this.error.set(mensajeError(error));
      }
    });
  }
}
