import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EditorTopbar } from '@/editor/components/EditorTopbar'
import { EditorShell } from '@/editor/components/EditorShell'
import { useEditor } from '@/editor/store'
import { renderPageToDataURL } from '@/editor/export'
import { useProject } from '@/hooks/queries'
import { updateProject, createVersion } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useRole } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/lib/domain'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const role = useRole()
  const { data: project, isLoading } = useProject(id)

  const load = useEditor((s) => s.load)
  const markSaved = useEditor((s) => s.markSaved)
  const dirty = useEditor((s) => s.dirty)

  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [autosave, setAutosave] = useState(true)
  const [preview, setPreview] = useState<string | null>(null)
  const loadedFor = useRef<string | null>(null)

  const canEdit =
    PERMISSIONS.canCreateMaterial(role) &&
    project != null &&
    !['publicado', 'archivado'].includes(project.status)

  // Inicializa el documento del editor cuando llega el proyecto.
  useEffect(() => {
    if (project && loadedFor.current !== project.id) {
      load(project.content, project.format)
      loadedFor.current = project.id
      setLastSavedAt(project.updated_at)
    }
  }, [project, load])

  const save = useCallback(
    async (makeVersion = false) => {
      if (!project || !canEdit) return
      setSaving(true)
      try {
        const doc = useEditor.getState().doc
        const nextStatus =
          project.status === 'borrador' ? 'en_edicion' : project.status
        await updateProject(project.id, {
          content: doc as unknown as Record<string, unknown>,
          status: nextStatus,
        })
        if (makeVersion)
          await createVersion(
            { id: project.id, content: doc as unknown as Record<string, unknown>, status: nextStatus },
            'Guardado manual',
          ).catch(() => undefined)
        markSaved()
        setLastSavedAt(new Date().toISOString())
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'No se pudo guardar',
          description: e instanceof Error ? e.message : 'Error desconocido',
        })
      } finally {
        setSaving(false)
      }
    },
    [project, canEdit, markSaved, toast],
  )

  // Autoguardado con debounce (sin crear versión).
  useEffect(() => {
    if (!autosave || !dirty || !canEdit) return
    const t = setTimeout(() => void save(false), 1500)
    return () => clearTimeout(t)
  }, [autosave, dirty, canEdit, save])

  const share = async () => {
    if (!project) return
    const url = `${window.location.origin}/proyectos/${project.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ variant: 'success', title: 'Enlace copiado', description: url })
    } catch {
      toast({ title: 'Enlace', description: url })
    }
  }

  const openPreview = async () => {
    const s = useEditor.getState()
    try {
      const url = await renderPageToDataURL(s.doc, s.currentPage(), 2)
      setPreview(url)
    } catch {
      toast({ variant: 'destructive', title: 'No se pudo generar la vista previa' })
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-semibold">Editor no disponible</h1>
          <p className="text-sm text-muted-foreground">
            Configura Supabase (.env + migraciones) para abrir y guardar
            materiales en el editor.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <EditorTopbar
        title={project.title}
        saving={saving}
        dirty={dirty}
        lastSavedAt={lastSavedAt}
        autosave={autosave}
        onToggleAutosave={() => setAutosave((a) => !a)}
        onSave={() => save(true)}
        onBack={() => navigate(`/proyectos/${project.id}`)}
        onPreview={openPreview}
        onShare={share}
        onReview={() => navigate(`/proyectos/${project.id}`)}
      />

      {!canEdit && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Modo solo lectura — este material está {project.status} o tu rol no
          permite editarlo. Puedes explorar y exportar.
        </div>
      )}

      <EditorShell onSave={() => save(true)} />

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="max-h-[70vh] overflow-auto">
              <img src={preview} alt="Vista previa" className="mx-auto w-full max-w-xl rounded border shadow-sm" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
