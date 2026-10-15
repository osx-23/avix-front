# Dashboard e historial: compatibilidad con AVIX anterior

Las pantallas de Dashboard e Historial reproducen la presentación, CSS, indicadores, gráficos, filtros y horarios operativos del repositorio Oscar-h23/Avix-front. No reutilizan su API antigua ni su autenticación.

- AVIX Web login sigue usando POST /api/v1/auth/web, con código y contraseña.
- Los datos se obtienen SOLO de osx-23/avix-api por /api/v1/registros y /api/v1/catalogos/plazas.
- La capa src/app/core/operational-api.service.ts traduce registros y consultas a las estructuras visuales anteriores.
- El backend aplica los permisos de supervisor y controlador, y las fechas operativas por America/Lima.
- Los filtros de día/mes, turno y hora operan sobre fechas operativas y consultan con paginación de hasta 100 registros por página, hasta 32 jornadas y un máximo de 50 000 registros por jornada. En volúmenes altos debe implementarse un endpoint agregado específico.
- El historial muestra también la auditoría, requiere motivo para corregir o anular e identifica las entradas anuladas.
- La edición y anulación se hacen por PATCH /api/v1/registros/{id} y /api/v1/registros/{id}/anular.
- Se mantienen las pantallas y rutas propias para usuarios y vías.
- Las imágenes binarias del repositorio de referencia no se copiaron. No se modificaron la base de datos ni el backend.

## Ejecutar en local

Usa Node.js 22 y ejecuta npm install && npm start. El proxy envía /api a http://localhost:8080. Primero inicia avix-api con el proyecto Supabase avix configurado.
