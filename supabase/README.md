# Configuración de Supabase

Esta carpeta contiene el esquema de base de datos que necesita la aplicación.
La migración inicial crea los perfiles, misiones, asignaciones, respuestas,
evaluaciones, configuración compartida del calendario, políticas de Row Level
Security (RLS) y el bucket privado para fotos.

## Crear un proyecto desde cero

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor** y ejecuta
   [`migrations/20261121130000_initial_schema.sql`](./migrations/20261121130000_initial_schema.sql).
3. En **Authentication → Users**, crea y confirma una cuenta para cada usuario
   con estas direcciones, que son las que reconoce la pantalla de acceso:
   - Jordi: `jordi@adventcalendar.invalid`
   - Caty: `caty@adventcalendar.invalid`
   - Ana: `ana@adventcalendar.invalid`
   - Albert: `albert@adventcalendar.invalid`
   - Administración: `admin@adventcalendar.invalid`
4. Después de crear las cuentas, vuelve al **SQL Editor** y ejecuta:

   ```sql
   with accounts (email, username, display_name, role) as (
     values
       ('jordi@adventcalendar.invalid', 'jordi', 'Jordi', 'participant'),
       ('caty@adventcalendar.invalid', 'caty', 'Caty', 'participant'),
       ('ana@adventcalendar.invalid', 'ana', 'Ana', 'participant'),
       ('albert@adventcalendar.invalid', 'albert', 'Albert', 'participant'),
       ('admin@adventcalendar.invalid', 'admin', 'Administración', 'admin')
   )
   insert into public.profiles (id, username, display_name, role)
   select auth_user.id, account.username, account.display_name, account.role
   from accounts account
   join auth.users auth_user on lower(auth_user.email) = account.email
   on conflict (id) do update
   set username = excluded.username,
       display_name = excluded.display_name,
       role = excluded.role;
   ```

   El `id` de cada perfil se enlaza automáticamente con su usuario de Auth.
5. Asigna una contraseña a cada cuenta. Las direcciones `.invalid` son
   identificadores internos y no reciben correo; crea y confirma las cuentas
   desde el panel de Supabase en lugar de depender de una confirmación por
   correo.
6. Copia el **Project URL** y la **Publishable key** a `.env.local` como
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Para GitHub Actions,
   guarda esos mismos valores como secrets del repositorio.

Las contraseñas no se guardan en `profiles`, no se incluyen en esta carpeta ni
se deben añadir al repositorio. La cuenta de administración se reconoce por el
`role = 'admin'` en la base de datos; las políticas RLS aplican ese rol también
en Supabase, no solo en la interfaz.

La migración no añade misiones iniciales: se crean desde el panel de
administración. El bucket `mission-photos` es privado; las imágenes se sirven
mediante URL firmadas y cada participante solo puede acceder a sus propias
fotos.

## Cambios posteriores

Cada archivo SQL nuevo debe representar una migración incremental y llevar un
nombre con fecha y hora, por ejemplo `YYYYMMDDHHMMSS_descripcion.sql`. En un
proyecto existente, aplica solo las migraciones que todavía no se hayan
ejecutado; no vuelvas a ejecutar la migración inicial sobre un esquema ya
creado.
