# Base de datos — NEX Studio

Esquema, seguridad (RLS), almacenamiento y datos semilla de la plataforma en
Supabase (PostgreSQL).

## Migraciones

Se aplican en orden:

| Archivo | Contenido |
| --- | --- |
| `0001_schema.sql` | Enums, tablas, triggers y funciones (creación de perfil al registrarse, `updated_at`). |
| `0002_rls.sql` | Row Level Security por rol para todas las tablas. |
| `0003_storage.sql` | Bucket `materials` y políticas de almacenamiento. |
| `0004_seed.sql` | Plantillas oficiales y recursos base. |

## Cómo aplicarlas

### Opción A — Supabase CLI (recomendada)

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

### Opción B — SQL Editor del panel

Abre el **SQL Editor** de tu proyecto y ejecuta el contenido de cada archivo
`0001` → `0002` → `0003` → `0004`, en ese orden.

## Modelo de datos

- **profiles** — extensión de `auth.users` con rol, unidad y cargo. Se crea
  automáticamente al registrarse mediante el trigger `on_auth_user_created`.
- **templates** — plantillas por formato; las oficiales las gestionan
  administradores y coordinadores.
- **projects** — materiales, con estado del flujo editorial, propietario,
  revisor asignado, etiquetas, vigencia y contenido (`jsonb`).
- **observations** — observaciones de revisión por proyecto.
- **transfer_records** — evidencia de difusión (canal, audiencia, alcance).
- **resources** — biblioteca de recursos y Kit Champion (`is_champion_kit`).
- **notifications** — avisos del flujo por usuario.
- **activity_log** — bitácora de cambios de estado y acciones.

## Roles y seguridad

Los roles (`user_role`) son: `admin_ubpc`, `coordinador`, `profesional_ubpc`,
`champion`, `revisor`, `visualizador`.

Las políticas RLS usan funciones `SECURITY DEFINER` (`current_user_role`,
`is_staff`, `can_view_project`) para evitar recursión al leer el rol del propio
usuario. Resumen:

- **Ver proyectos**: publicados los ve todo el mundo; borradores/en curso los
  ven su propietario, el revisor asignado y el personal de gestión/revisión.
- **Crear proyectos**: `admin_ubpc`, `coordinador`, `profesional_ubpc`.
- **Aprobar/publicar**: `admin_ubpc`, `coordinador` (reforzado en la app).
- **Observaciones**: las crean revisores y gestión; las resuelve el autor, el
  propietario o gestión.
- **Gestión de usuarios/roles**: sólo `admin_ubpc`.

## Primer administrador

Tras registrar tu primera cuenta, promuévela a administrador desde el SQL
Editor:

```sql
update public.profiles
set role = 'admin_ubpc'
where email = 'tu-correo@ubpc.org';
```

A partir de ahí podrás gestionar el resto de roles desde
**Configuración → Usuarios** en la aplicación.
