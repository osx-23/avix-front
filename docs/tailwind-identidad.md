# Interfaz AVIX Web

El proyecto usa **Angular standalone y Tailwind CSS 4**. La integración sigue las guías de Angular y Tailwind: \`@tailwindcss/postcss\`, \`.postcssrc.json\` y \`@import "tailwindcss";\` en \`src/styles.css\`.

## Identidad visual

Los archivos \`public/avix-logo.webp\` y \`public/avix-login-panel.avif\` contienen el logo original AVIX y el panel visual de Lima Expresa. Se alojan dentro del repositorio, por lo que el frontend no necesita acceder al repositorio antiguo para mostrarlos.

El login web mantiene los campos \`codigo\` y \`contrasena\` y sigue llamando a \`POST /api/v1/auth/web\`. No se sustituye por el acceso Android de código único.

## Estructura

- \`features/auth/login\`: login responsive maquetado con utilidades Tailwind.
- \`layout/shell\`: navegación con el logotipo original.
- \`features/dashboard\`, \`features/historial\`, \`features/usuarios\`, \`features/vias\`: mantienen las funcionalidades anteriores.
- \`core/\`: autenticación, interceptores y API.
- \`src/styles.css\`: Tailwind en la capa \`utilities\`, con estilos anteriores dentro de \`legacy\` para evitar regresiones mientras se adopta Tailwind por módulos.

## Ejecución

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

El API debe estar funcionando en \`http://localhost:8080\`. El frontend usa el proxy de Angular para las llamadas \`/api/v1\`.
