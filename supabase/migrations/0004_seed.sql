-- =============================================================================
-- NEX Studio · Datos semilla
-- Plantillas oficiales y recursos base. No dependen de ningún usuario, de modo
-- que la plataforma es funcional desde el primer arranque.
-- =============================================================================

insert into public.templates (name, description, format, category, is_official, content)
values
  ('Infografía de proceso clínico',
   'Estructura visual para explicar un proceso o guía clínica en pasos.',
   'infografia', 'Procesos', true,
   '{"blocks":[{"type":"title"},{"type":"steps"},{"type":"footer"}]}'::jsonb),

  ('Póster de campaña',
   'Póster mural para campañas de seguridad y buenas prácticas.',
   'poster', 'Campañas', true,
   '{"blocks":[{"type":"headline"},{"type":"image"},{"type":"cta"}]}'::jsonb),

  ('Presentación de sesión formativa',
   'Diapositivas base para capacitaciones de la unidad.',
   'presentacion', 'Formación', true,
   '{"slides":[{"type":"cover"},{"type":"agenda"},{"type":"content"},{"type":"closing"}]}'::jsonb),

  ('Ficha técnica de referencia rápida',
   'Documento breve de una página para consulta inmediata.',
   'ficha_tecnica', 'Referencia', true,
   '{"blocks":[{"type":"header"},{"type":"keypoints"},{"type":"references"}]}'::jsonb),

  ('Boletín mensual UBPC',
   'Formato de boletín periódico de la unidad.',
   'boletin', 'Comunicación', true,
   '{"sections":[{"type":"editorial"},{"type":"news"},{"type":"metrics"}]}'::jsonb),

  ('Lista de verificación de procedimiento',
   'Checklist operativa para verificar cumplimiento de buenas prácticas.',
   'checklist', 'Operación', true,
   '{"items":[]}'::jsonb),

  ('Guion de píldora formativa',
   'Escaleta y guion para un video corto de capacitación.',
   'video_guion', 'Formación', true,
   '{"scenes":[{"type":"intro"},{"type":"development"},{"type":"summary"}]}'::jsonb),

  ('Procedimiento normalizado (SOP)',
   'Documento estructurado de procedimiento operativo estándar.',
   'documento', 'Procedimientos', true,
   '{"sections":[{"type":"objetivo"},{"type":"alcance"},{"type":"procedimiento"},{"type":"responsables"}]}'::jsonb);

insert into public.resources (title, description, kind, category, is_champion_kit, url)
values
  ('Guía de Buenas Prácticas Clínicas (ICH-GCP)',
   'Referencia normativa internacional para la conducción de estudios clínicos.',
   'norma', 'Normativa', false, null),

  ('Manual de identidad visual UBPC',
   'Colores, tipografías y uso del logotipo institucional.',
   'guia', 'Marca', false, null),

  ('Banco de iconografía clínica',
   'Set de iconos para materiales de la unidad.',
   'plantilla', 'Recursos gráficos', false, null),

  ('Checklist de calidad editorial',
   'Criterios de revisión antes de publicar un material.',
   'documento', 'Calidad', false, null),

  ('Kit de arranque Champion',
   'Presentación y guía para presentar buenas prácticas en tu servicio.',
   'guia', 'Adopción', true, null),

  ('Plantillas de difusión para Champions',
   'Mensajes y piezas listas para compartir en canales internos.',
   'plantilla', 'Difusión', true, null),

  ('Argumentario de adopción',
   'Puntos clave para promover la adopción de nuevas prácticas.',
   'documento', 'Adopción', true, null);
