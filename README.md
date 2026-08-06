# NEX Studio · Buenas Prácticas Clínicas

Plataforma institucional para **crear, editar, organizar, validar, compartir y
descargar** materiales de transferencia del conocimiento de la Unidad de Buenas
Prácticas Clínicas (UBPC). No es una biblioteca ni una maqueta: funciona como un
estudio editorial con un flujo de trabajo real, roles, permisos y persistencia.

> **Estado.** Implementados la **arquitectura, la navegación, la base de datos,
> los roles, los proyectos, el flujo editorial y la persistencia real**, además
> del **editor visual funcional** con lienzo, capas, herramientas y exportación
> propias de cada formato (PNG/PDF/PPTX).

## Stack

- **React 18 + TypeScript** con **Vite**
- **Tailwind CSS** + componentes tipo **shadcn/ui** (Radix UI)
- **Supabase**: autenticación, PostgreSQL, RLS y almacenamiento
- **TanStack Query** para datos y persistencia
- **React Router** para la navegación
- **Konva / react-konva** para el lienzo del editor
- **Zustand** para el estado del editor (historial, selección, capas)
- **PptxGenJS · jsPDF · html-to-image** para la exportación

## Editor

Cada formato tiene **dimensiones, estructura, herramientas y exportación
propias** (`src/editor/formats.ts`): no se comparte un lienzo genérico.

- **Barra superior**: guardar, autoguardado, deshacer/rehacer, vista previa,
  compartir, revisar y descargar (PNG / PDF / PPTX editable).
- **Panel izquierdo**: estructura del formato, texto, figuras, iconos clínicos,
  imágenes, logos, QR, tablas, gráficos, fondos y recursos.
- **Lienzo central** (Konva): arrastrar, redimensionar, rotar, duplicar,
  agrupar, bloquear, alinear, distribuir, capas, guías de alineación, marco de
  selección y zoom.
- **Panel derecho**: tipografía, tamaño, color, opacidad, bordes, sombras,
  posición, dimensiones, recorte y editores de tabla/gráfico.
- **Presentaciones y kits** tienen panel de páginas/diapositivas con miniaturas,
  reordenar, duplicar y añadir.

Todo permanece **editable**: el diseño se guarda como JSON en
`projects.content` y nunca se aplana a imagen. El PPTX se exporta con objetos
**nativos** de PowerPoint (cuadros de texto, formas, imágenes, tablas y
gráficos), de modo que sigue siendo editable tras la descarga.

Formatos con editor: presentación, infografía, tríptico/díptico, Kit Champion,
checklist, boletín EVI, cápsula, afiche, tarjeta/ficha, flujograma, mapa mental,
reloj de posición y documento.

## Secciones

| Ruta | Sección |
| --- | --- |
| `/` | Inicio: métricas, proyectos recientes, pendientes y accesos rápidos |
| `/crear` | Crear material (formato → plantilla o desde cero → detalles) |
| `/proyectos` | Mis proyectos, con filtros por estado, formato y alcance |
| `/proyectos/:id` | Detalle del material: flujo, vista previa, revisión |
| `/plantillas` | Plantillas por formato |
| `/kit-champion` | Kit Champion |
| `/recursos` | Recursos institucionales |
| `/transferencia` | Registro de transferencia (evidencia y alcance) |
| `/produccion` | Producción UBPC (tablero por estado) |
| `/notificaciones` | Notificaciones del flujo |
| `/configuracion` | Perfil, apariencia, roles y gestión de usuarios |

## Roles

`Administrador UBPC` · `Coordinador` · `Profesional UBPC` · `Champion` ·
`Revisor` · `Visualizador`. Los permisos de la interfaz están en
`src/lib/domain.ts` y se refuerzan con RLS en la base de datos.

## Flujo editorial

```
Seleccionar formato → plantilla o desde cero → editar → guardar →
vista previa → enviar a revisión → recibir observaciones → corregir →
aprobar → publicar → compartir o descargar
```

Estados: `Borrador`, `En edición`, `Pendiente de revisión`, `Con observaciones`,
`Aprobado`, `Publicado`, `Archivado`, `Vencido`. Las transiciones válidas y las
acciones asociadas se definen en `src/lib/domain.ts` (`STATE_TRANSITIONS`).

## Puesta en marcha

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Configurar Supabase**

   ```bash
   cp .env.example .env
   ```

   Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los datos de tu
   proyecto (Supabase → Project Settings → API).

3. **Aplicar las migraciones** de `supabase/migrations` (ver
   [`supabase/README.md`](supabase/README.md)).

4. **Arrancar**

   ```bash
   npm run dev
   ```

5. **Crear el primer administrador**: regístrate en la app y luego ejecuta en el
   SQL Editor:

   ```sql
   update public.profiles set role = 'admin_ubpc'
   where email = 'tu-correo@ubpc.org';
   ```

> Sin credenciales de Supabase la aplicación arranca en **modo configuración**:
> la interfaz es navegable, pero la autenticación y la persistencia están
> deshabilitadas hasta completar el `.env`.

## Estructura del proyecto

```
src/
  components/
    ui/          Componentes base (shadcn/ui)
    layout/      AppShell, Sidebar, Topbar
    common/      Icon, badges, cabeceras, estados vacíos
    projects/    Tarjeta, barra de flujo y panel de observaciones
    auth/        Guardas de ruta y de rol
  contexts/      Autenticación y tema
  editor/        Motor del editor: modelo, formatos, store, componentes y exportación
  hooks/         Hooks de React Query y de toast
  lib/           Dominio (roles/estados/formatos), API, Supabase, utilidades
  pages/         Una página por sección
  types/         Tipos del esquema de base de datos
supabase/
  migrations/    Esquema, RLS, almacenamiento y semilla
```

## Scripts

```bash
npm run dev        # desarrollo
npm run build      # comprobación de tipos + build de producción
npm run preview    # servir el build
npm run typecheck  # sólo comprobación de tipos
```
