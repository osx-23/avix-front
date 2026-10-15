import { HttpErrorResponse } from '@angular/common/http';

export function mensajeError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const payload: unknown = error.error;
    if (payload && typeof payload === 'object') {
      const value = payload as Record<string, unknown>;
      for (const field of ['mensaje', 'message', 'detail']) {
        if (typeof value[field] === 'string' && value[field]) return value[field] as string;
      }
    }
    if (error.status === 0) return 'No se pudo conectar con AVIX API. Revisa el backend.';
    if (error.status === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (error.status === 403) return 'No tienes permisos para esta operación.';
    return 'El servidor no pudo completar la solicitud.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}
