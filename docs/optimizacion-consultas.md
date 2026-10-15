# Optimización de consultas — AVIX

## Problema identificado

La implementación anterior del frontend hacía una petición independiente por jornada operativa: hasta 31 consultas HTTP para un mes sin registros, más la consulta de catálogo y la validación de sesión por llamada. Con datos abundantes, cada jornada llevaba su propia cadena de páginas de 100 filas.

## Implementación

- API: **GET /api/v1/registros/consulta** con parámetros desde/hasta ISO-8601 con zona, plaza, accion, via, page, size.
- PostgREST aplica el rango sobre ocurrido_en con extremos [desde, hasta) y todos los filtros y permisos antes de paginar; orden estable por ocurrido_en DESC, id DESC.
- Hasta 500 filas por página; si una página tiene 500 filas exactas, el frontend solicita la siguiente hasta encontrar una página incompleta.
- El frontend reutiliza plazas en una caché en memoria cuyo identificador de sesión es el token actual. No persiste esta caché en localStorage ni entre usuarios.
- El backend comparte una instancia RestClient y no vuelve a crearla para cada llamada.
- Rango máximo: 33 días; permite mes de 31 días y el límite exacto del turno C.
- Se evitan ~30 consultas innecesarias para un mes vacío; el rendimiento real depende de latencia, registros e infraestructura.

## Ejemplo

GET /api/v1/registros/consulta?desde=2026-10-01T06%3A00%3A00-05%3A00&hasta=2026-11-01T06%3A00%3A00-05%3A00&page=0&size=500

Header: Authorization: Bearer <token>

## Observaciones

- La base ya dispone de índices por ocurrido_en, fecha_operativa y plaza, por lo que no se añadieron índices.
- El API existente /api/v1/registros se mantiene compatible para Android y clientes anteriores.
- Ambos repositorios cambian coordinadamente. Para probarlo en local se deben usar **develop** de avix-api y **develop** de avix-front.
- No se ha medido la latencia con tráfico real ni se ha conectado desde un dispositivo; GitHub Actions valida pruebas y compilación.
- En períodos con un número masivo de eventos, convendría un endpoint de agregados calculados en base de datos y paginación por cursor para evitar transferir todos los registros al navegador.
