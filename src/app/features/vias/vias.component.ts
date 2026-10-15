import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Plaza, Via } from '../../core/models';
import { ViasRepository } from './data/vias.repository';
import { mensajeError } from '../../core/http-error';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vias.component.html'
})
export class ViasComponent implements OnInit {
  private readonly repository = inject(ViasRepository);
  private readonly destroyRef = inject(DestroyRef);
  private consulta?: Subscription;

  // Angular zoneless: cada respuesta asíncrona publica un Signal.
  readonly plazas = signal<Plaza[]>([]);
  readonly vias = signal<Via[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  filtro = '';
  nuevaPlaza = '';
  nuevoNumero: number | null = null;
  descripcion = '';
  editando: number | null = null;
  edit = { numero: 0, descripcion: '' };

  ngOnInit() {
    this.repository.plazas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: p => {
        this.plazas.set(p);
        if (!this.nuevaPlaza) this.nuevaPlaza = p[0]?.codigo || '';
      },
      error: e => this.error.set('No se pudo consultar el catálogo de plazas. ' + mensajeError(e))
    });
    this.cargar();
  }

  cargar() {
    this.consulta?.unsubscribe();
    this.cargando.set(true);
    this.error.set('');
    this.consulta = this.repository.listar(this.filtro)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: rows => { this.vias.set(rows); this.cargando.set(false); },
        error: e => {
          this.cargando.set(false);
          this.error.set('No se pudieron consultar las vías. ' + mensajeError(e));
        }
      });
  }

  crear() {
    if (this.guardando() || !this.nuevaPlaza || !Number.isInteger(this.nuevoNumero) ||
        (this.nuevoNumero ?? 0) < 1) return;
    this.guardando.set(true); this.error.set(''); this.exito.set('');
    this.repository.crear(this.nuevaPlaza, this.nuevoNumero!, this.descripcion.trim())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.guardando.set(false); this.exito.set('Vía guardada correctamente.');
          this.nuevoNumero = null; this.descripcion = ''; this.cargar();
        },
        error: e => { this.guardando.set(false); this.error.set(mensajeError(e)); }
      });
  }

  editar(v: Via) {
    this.editando = v.id;
    this.edit = { numero: v.numero, descripcion: v.descripcion || '' };
  }

  guardar(v: Via) {
    if (this.guardando()) return;
    this.guardando.set(true); this.error.set(''); this.exito.set('');
    this.repository.actualizar(v.id, { numero: this.edit.numero, descripcion: this.edit.descripcion })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.guardando.set(false); this.editando = null;
          this.exito.set('Vía actualizada.'); this.cargar();
        },
        error: e => { this.guardando.set(false); this.error.set(mensajeError(e)); }
      });
  }

  cambiarEstado(v: Via) {
    if (this.guardando()) return;
    this.guardando.set(true); this.error.set(''); this.exito.set('');
    this.repository.actualizar(v.id, { activa: !v.activa })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.guardando.set(false);
          this.exito.set('Estado actualizado.');
          this.vias.update(rows => rows.map(item => item.id === v.id ?
            { ...item, activa: !v.activa } : item));
        },
        error: e => { this.guardando.set(false); this.error.set(mensajeError(e)); }
      });
  }
}
