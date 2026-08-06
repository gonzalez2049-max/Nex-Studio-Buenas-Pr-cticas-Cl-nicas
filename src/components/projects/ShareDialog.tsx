import * as React from 'react'
import { Icon } from '@/components/common/Icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useUpdateProjectAccess } from '@/hooks/queries'
import { logShare } from '@/lib/api'
import { qrDataUrl } from '@/editor/assets'
import type { Project, ProjectAccess } from '@/types/database'

const ACCESS_LABELS: Record<ProjectAccess, string> = {
  privado: 'Privado — solo la unidad',
  enlace: 'Con enlace — cualquiera con el vínculo',
  restringido: 'Restringido — enlace con registro',
}

export function ShareDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { toast } = useToast()
  const updateAccess = useUpdateProjectAccess()
  const url = `${window.location.origin}/proyectos/${project.id}`
  const qr = React.useMemo(() => qrDataUrl(url), [url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      await logShare(project.id, 'enlace')
      toast({ variant: 'success', title: 'Enlace copiado', description: url })
    } catch {
      toast({ title: 'Enlace', description: url })
    }
  }

  const email = async () => {
    await logShare(project.id, 'correo')
    const subject = encodeURIComponent(`Material NEX Studio: ${project.title}`)
    const body = encodeURIComponent(
      `Comparto el material «${project.title}» (${project.code ?? ''}).\n\n${url}`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const downloadQr = async () => {
    await logShare(project.id, 'qr')
    const a = document.createElement('a')
    a.href = qr
    a.download = `qr-${project.code ?? project.id}.svg`
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir material</DialogTitle>
          <DialogDescription>
            {project.code ? `${project.code} · ` : ''}Cada acción queda
            registrada para trazabilidad.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nivel de acceso</Label>
            <Select
              value={project.access}
              onValueChange={(v) =>
                updateAccess.mutate(
                  { id: project.id, access: v as ProjectAccess },
                  {
                    onSuccess: () =>
                      toast({ variant: 'success', title: 'Acceso actualizado' }),
                  },
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCESS_LABELS) as ProjectAccess[]).map((a) => (
                  <SelectItem key={a} value={a}>
                    {ACCESS_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Enlace</Label>
            <div className="flex gap-2">
              <Input readOnly value={url} className="text-xs" />
              <Button size="icon" variant="outline" onClick={copy} title="Copiar">
                <Icon name="Copy" className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border p-3">
            <img src={qr} alt="Código QR" className="h-24 w-24" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Código QR</p>
              <Button size="sm" variant="outline" onClick={downloadQr}>
                <Icon name="Download" className="h-4 w-4" />
                Descargar QR
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={copy}>
              <Icon name="Link" className="h-4 w-4" />
              Copiar enlace
            </Button>
            <Button variant="outline" onClick={email}>
              <Icon name="Mail" className="h-4 w-4" />
              Enviar por correo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
