# Calendario de Adviento

Aplicación web interactiva para vivir el calendario de Adviento en familia. Cada
participante puede descubrir misiones, enviar sus respuestas y recorrer un
pueblo navideño en 3D.

## Funcionalidades

- Calendario con 24 días y misiones asignadas a cada participante.
- Misiones en español y catalán, con posibilidad de responder con texto y/o foto.
- Seguimiento de entregas y valoraciones con estrellas y comentarios.
- Panel de administración para preparar y editar misiones, revisar entregas y
  configurar el modo de prueba del calendario.
- Pueblo navideño en 3D con casas, decoraciones y personajes animados.
- Galería de personajes 3D. Cada usuario ve por defecto los personajes propios
  y puede cambiar entre Jordi, Caty, Ana y Albert.
- Interfaz en español para Jordi y Caty, y en catalán para Ana, Albert y la
  cuenta de administración.

## Tecnologías

- React, TypeScript y Vite.
- React Three Fiber y Three.js para las escenas y modelos 3D.
- Supabase para autenticación, perfiles, misiones, entregas, valoraciones y
  almacenamiento de fotos.
- GitHub Actions y GitHub Pages para compilar y publicar la aplicación.

## Desarrollo local

Necesitas Node.js y npm. Instala las dependencias y configura las variables de
Supabase:

```bash
npm ci
```

Copia `.env.example` a `.env.local` y completa:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Comprobaciones disponibles:

```bash
npm run lint
npm run build
```

La compilación de producción genera `dist/`. Esta carpeta no se versiona: el
workflow de despliegue la crea y la publica automáticamente.

## Supabase

La aplicación necesita un proyecto de Supabase con las tablas, políticas de
Row Level Security, perfiles, autenticación y almacenamiento utilizados por la
aplicación. No incluyas nunca una clave `service_role` en el frontend. La clave
publicable está diseñada para utilizarse en el navegador; el acceso a los datos
debe protegerse con las políticas de Supabase.

Las migraciones disponibles en `supabase/migrations/` añaden la configuración
compartida del calendario y las columnas de texto bilingüe de las misiones.
Aplica las migraciones que aún no estén aplicadas en el proyecto de Supabase
antes de desplegar una versión que las necesite. La migración bilingüe añade
columnas; no crea ni modifica misiones existentes.

## Publicación

El sitio se publica en
[https://lauspace.github.io/calendari_advent/](https://lauspace.github.io/calendari_advent/)
cuando hay cambios en `main`. También se puede iniciar manualmente desde
**Actions → Deploy to GitHub Pages**.

Para configurar el despliegue:

1. En GitHub, habilita Pages y selecciona **GitHub Actions** como origen.
2. En **Settings → Secrets and variables → Actions**, configura
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. En Supabase, añade la URL del sitio a las URL permitidas de autenticación y
   redirección.

El workflow instala dependencias, comprueba la configuración de Supabase,
ejecuta `npm run build` y publica el contenido de `dist/`. Los modelos 3D viven
en `public/`; Vite los copia a `dist/` durante la compilación.
