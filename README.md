# AVIX Web

Panel web independiente de SIGO para el proyecto **AVIX**, conectado exclusivamente al API propio **osx-23/avix-api**.

**Tecnología:** Angular 22, TypeScript, CSS, HttpClient con interceptor de token y rutas protegidas por rol.

## Arranque local

Requisitos: Node.js 22 y npm.

1. Inicia AVIX API Spring Boot en el puerto 8080, con sus variables de Supabase configuradas.
2. Clona este repositorio y ejecuta:

    git clone https://github.com/osx-23/avix-front.git
    cd avix-front
    git switch develop
    npm install
    npm start

3. Abre http://localhost:4200

El archivo **proxy.conf.json** ya redirige /api a http://localhost:8080: no hay URL de Railway ni de SIGO en el proxy. No es necesario usar CORS para llamadas del proxy durante desarrollo local.

**Importante:** la ruta /api/v1/status devuelve supabaseConfigurado:true cuando la clave backend tiene un formato válido, pero no comprueba por sí sola el acceso a PostgreSQL.

## Inicio de sesión

AVIX Web utiliza POST /api/v1/auth/web con código y contraseña; solo CONTROLADOR y SUPERVISOR pueden acceder. Los agentes no pueden acceder al panel web y nunca reciben contraseña web.

Para primera configuración se necesita crear SUP001 con POST /api/v1/setup/supervisor utilizando el secreto AVIX_SETUP_SECRET, después quitar ese secreto del entorno.

## Funcionalidades

- Login web seguro con control de sesión, interceptor Bearer y cierre de sesión.
- Panel con indicadores calculados sobre últimos 100 registros disponibles, sin afirmar que sean totales globales.
- Historial con filtros de plaza, acción y fecha, paginación de 20 y actualización cada 10 segundos.
- Detalle, edición, anulación con motivo y auditoría de registros.
- Administración de usuarios: alta, edición, cambio de rol/contraseña y activación/desactivación.
- Gestión de asignaciones a plazas por usuario.
- Gestión de vías: alta, edición, desactivación/activación.

Todos los privilegios deben verificarse también en Spring Boot. El almacenamiento en sessionStorage es únicamente para la sesión actual del navegador; no guardar claves secretas de Supabase en Angular.

## Publicación

Este repositorio está preparado para **desarrollo local**. Para publicar en Vercel se necesitará que el endpoint /api sea accesible a través del dominio de producción (rewrite/proxy hacia Railway o configuración de URL pública). No se puede apuntar a localhost:8080 desde una web pública.

## Repositorios

- Backend: https://github.com/osx-23/avix-api
- Frontend oficial: https://github.com/osx-23/avix-front
- AVIX Android: Oscar-h23/AVIX-MOVIL, por separado

Los archivos de este frontend no dependen del backend SIGO.
