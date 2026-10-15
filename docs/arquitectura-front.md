# Arquitectura de AVIX Front

```text
src/app/
├── app.component.ts
├── app.config.ts
├── app.routes.ts
├── core/
│   ├── api/api.service.ts
│   ├── auth/
│   │   ├── auth.guard.ts
│   │   ├── auth.interceptor.ts
│   │   └── auth.service.ts
│   ├── errors/http-error.ts
│   └── models/avix.models.ts
├── features/
│   ├── auth/login/
│   │   ├── login.component.ts
│   │   └── login.component.html
│   ├── dashboard/dashboard.component.*
│   ├── historial/historial.component.*
│   ├── registros/data/operational-api.service.ts
│   ├── usuarios/
│   │   ├── data/usuarios.repository.ts
│   │   ├── state/usuarios.store.ts
│   │   └── usuarios.component.*
│   └── vias/
│       ├── data/vias.repository.ts
│       └── vias.component.*
├── layout/shell/
│   ├── shell.component.ts
│   └── shell.component.html
└── shared/utils/turnos.ts
```

Los componentes están agrupados por funcionalidad, el layout está separado y la autenticación, los modelos y la capa HTTP viven en core. El directorio antiguo `pages/` se eliminó junto con sus componentes duplicados.

`compilerOptions.rootDir` se configura como `./src` tanto en `tsconfig.json` como en `tsconfig.app.json`, para compatibilidad con TypeScript 6.

Desarrollo local: `npm install`, `npm start` y AVIX API en `localhost:8080`. El frontend sigue sin depender del backend de SIGO.
