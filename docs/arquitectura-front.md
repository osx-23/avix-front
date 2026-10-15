# Arquitectura AVIX Front

## Organización

    src/app/
      core/
        api.service.ts           API REST compartida; tokens vía interceptor
        auth.service.ts          Sesión WEB
        auth.guard.ts            Protección de rutas
        auth.interceptor.ts      Bearer
        http-error.ts            Normalización de errores de red
        models.ts                Tipos compartidos
        operational-api.service.ts  Adaptador de registros del dashboard
        turnos.ts                Fechas y jornadas operativas (Lima)
      features/
        usuarios/
          data/usuarios.repository.ts  Contratos y acceso HTTP de usuarios
          state/usuarios.store.ts      Señales y orquestación del estado
          usuarios.component.ts       Interacciones y validación de formularios
          usuarios.component.html     Presentación reactiva
          usuarios.component.css      Estilos acotados a usuarios
        vias/
          data/vias.repository.ts      Acceso HTTP de vías
          vias.component.ts           Señales para respuestas asíncronas
          vias.component.html         Presentación
      pages/                   Dashboard, Historial y layout existentes
      app.routes.ts            Rutas lazy, permisos de supervisor

## Problema corregido

Angular v22 sin Zone.js puede recibir una respuesta HTTP pero no actualizar una
plantilla que lee propiedades normales hasta que ocurra una interacción.
Antes, la lista de usuarios y sus estados se asignaban desde \`subscribe()\` a
propiedades de clase; un clic en el selector de rol "despertaba" la vista.

Ahora el store publica \`signal<Usuario[]>\`, y la plantilla lee \`usuarios()\`.
Al completarse una consulta, \`usuarios.set(...)\` notifica a Angular para
redibujar sin clicar ningún select. Lo mismo ocurre con los datos de vías.

## Gestión de usuarios

- Se consultan automáticamente cuentas ACTIVAS al abrir Usuarios; el selector
  Estado cambia entre Activos, Inactivos y Todos sin esperar otro clic.
- El selector Puesto/Rol filtra mediante los parámetros rol y activo del API.
- Paginación del servidor: 25 filas por página; Anterior y Siguiente.
- Las respuestas antiguas se cancelan al cambiar filtros (evita carreras).
- Revalidación automática de la página cada 30 segundos en pestaña visible.
- Creación, cambios de puesto, activación/desactivación y asignación de plazas
  actualizan las señales e invalidan los datos de lista.
- La consulta de asignaciones se cancela al cambiar de usuario para evitar
  mezclar permisos o plazas entre perfiles.
- El store se proporciona en la ruta, no en root, para que el estado no permanezca
  cargado al abandonar la pantalla.
- Se requiere contraseña cuando un agente cambia a un puesto con acceso web.
- El indicador Activo significa "cuenta habilitada" en AVIX, no sesión conectada.

## Compatibilidad y seguridad

- No se modificaron ni el backend ni la base de datos.
- API REST exclusiva: /api/v1/admin, auth WEB por contraseña; AGENTE sin acceso WEB.
- La autorización real sigue validándose en Spring Boot (guard = UX).
- La lógica existente de Dashboard e Historial y sus gráficos queda intacta.
- Se conserva el código de página original como reexport para compatibilidad,
  pero las rutas utilizan las nuevas implementaciones en features/.

## Validación manual recomendada

1. Abrir /usuarios con SUPERVISOR: la lista de cuentas activas debe aparecer
   automáticamente después de la respuesta sin seleccionar ningún campo.
2. Cambiar Estado a "Todos" y "Inactivos"; cambiar Puesto/Rol.
3. Cambiar filtros rápidamente y comprobar que solo aparecen resultados del último filtro.
4. Crear, editar, activar/desactivar un usuario; verificar su estado y que la lista se refresque.
5. Abrir Gestión y consultar asignaciones de dos usuarios consecutivamente.
6. Abrir /vias y comprobar que el catálogo aparezca sin tocar el selector.
7. Entrar como CONTROLADOR: no debe estar disponible la ruta administrativa.
