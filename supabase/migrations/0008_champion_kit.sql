-- =============================================================================
-- NEX Studio · Kit Champion por línea de cuidado
-- Recursos del Kit Champion clasificados por categoría clínica.
-- =============================================================================

insert into public.resources (title, description, kind, category, is_champion_kit, url)
values
  -- LPP (Lesiones por presión)
  ('Kit LPP — Prevención de lesiones por presión',
   'Paquete Champion para la prevención de LPP: cambios posturales y superficies.',
   'guia', 'LPP', true, null),
  ('Escala de Braden — Tarjeta rápida',
   'Tarjeta de bolsillo para valoración del riesgo de LPP.',
   'plantilla', 'LPP', true, null),
  ('Afiche LPP — Reposiciona cada 2 horas',
   'Afiche mural recordatorio de reposicionamiento.',
   'documento', 'LPP', true, null),

  -- Accesos vasculares
  ('Kit Accesos vasculares — Mantenimiento seguro',
   'Buenas prácticas en inserción y mantenimiento de accesos vasculares.',
   'guia', 'Accesos vasculares', true, null),
  ('Checklist de curación de catéter',
   'Lista de verificación editable para curación de accesos vasculares.',
   'documento', 'Accesos vasculares', true, null),
  ('Cápsula — Higiene de manos y bundle CVC',
   'Cápsula formativa sobre el bundle de catéter venoso central.',
   'video', 'Accesos vasculares', true, null),

  -- Dolor
  ('Kit Dolor — Valoración y manejo',
   'Recursos Champion para la valoración sistemática del dolor.',
   'guia', 'Dolor', true, null),
  ('Escala EVA — Tarjeta',
   'Escala visual analógica del dolor para uso a pie de cama.',
   'plantilla', 'Dolor', true, null),

  -- Caídas
  ('Kit Caídas — Prevención de caídas',
   'Paquete Champion para la prevención de caídas del paciente.',
   'guia', 'Caídas', true, null),
  ('Afiche Caídas — Identifica el riesgo',
   'Afiche de señalización del riesgo de caídas.',
   'documento', 'Caídas', true, null),
  ('Checklist de entorno seguro',
   'Lista de verificación editable del entorno para evitar caídas.',
   'documento', 'Caídas', true, null);
