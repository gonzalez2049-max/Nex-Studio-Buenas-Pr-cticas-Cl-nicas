# NEX Studio · Buenas Prácticas Clínicas

Plataforma institucional para **crear, editar, organizar, validar, compartir y
descargar** materiales de transferencia del conocimiento de la Unidad de Buenas
Prácticas Clínicas (UBPC). No es una biblioteca ni una maqueta: funciona como un
estudio editorial con un flujo de trabajo real, roles, permisos y persistencia.

> **Estado.** Implementados la **arquitectura, la navegación, la base de datos,
> los roles, el flujo editorial y la persistencia real**; el **editor visual**
> por formato (PNG/PDF/PPTX/SVG); y la **gestión editorial completa**: edición,
> duplicado, renombrado, filtros, archivado, eliminación, historial de versiones
> con recuperación, revisión con comentarios y decisiones justificadas,
> compartición con trazabilidad, códigos UBPC automáticos y notificaciones.

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

## Gestión editorial

- **Mis proyectos**: editar, renombrar, duplicar, filtrar (búsqueda, estado,
  formato, alcance, archivados), archivar/restaurar, eliminar y ver historial,
  desde el menú de acciones de cada tarjeta.
- **Historial de versiones**: cada guardado manual y cada cambio de estado crea
  una instantánea; se puede **recuperar** cualquier versión (el estado actual se
  respalda antes de restaurar).
- **Revisión**: los revisores comentan, **solicitan cambios**, **aprueban** o
  **rechazan con justificación** (obligatoria; queda en el hilo y notifica al
  responsable).
- **Flujo**: `Borrador → Revisión → Observaciones → Corrección → Aprobado →
  Publicado` (con rechazo → archivado).
- **Códigos institucionales**: cada material recibe automáticamente
  `UBPC-TIPO-AÑO-CORRELATIVO` (p. ej. `UBPC-INFO-2026-0001`) mediante un
  contador atómico en base de datos.
- **Compartir con trazabilidad**: enlace, nivel de acceso (privado / con enlace
  / restringido), **QR** descargable y **correo**; cada acción se registra en la
  bitácora de actividad.
- **Kit Champion** filtrado por línea de cuidado: **LPP, accesos vasculares,
  dolor y caídas**.
- **Datos de prueba**: Configuración → Administración → «Generar datos de
  prueba» crea materiales reales recorriendo todo el flujo, con versiones,
  observaciones y transferencias.

## Exportaciones

- **Componente actual**: PNG (alta resolución), PDF y **SVG** (vectorial).
- **Documento completo**: PDF de todas las páginas (trípticos listos para
  impresión), PNG por página y **PPTX editable** (objetos nativos de PowerPoint).
- **Kits**: descargables completos o por componente; **checklist editable** en
  el editor; **flujogramas** en PDF/PNG/SVG.

## Despliegue

El repositorio incluye configuración lista para **Vercel** (`vercel.json`) y
**Netlify** (`netlify.toml` + `public/_redirects`), con el enrutamiento SPA ya
resuelto. Para publicar:

1. Importa el repositorio en Vercel o Netlify (framework detectado: Vite).
2. Define las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el
   panel del proveedor.
3. Aplica las migraciones de `supabase/migrations` en tu proyecto de Supabase.

> **Nota honesta:** este entorno no puede aprovisionar hosting ni credenciales,
> así que **no genero un enlace en vivo automáticamente**. Con los pasos
> anteriores el despliegue queda en una URL propia en un par de minutos.

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
