import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import * as api from '@/lib/api'
import { isSupabaseConfigured } from '@/lib/supabase'

/** Solo lanzamos consultas si Supabase está configurado. */
const enabled = isSupabaseConfigured

/* --------------------------------------------------------- Proyectos */

export function useProjects(filters: api.ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => api.listProjects(filters),
    enabled,
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
    enabled: enabled && Boolean(id),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.updateProject(id, patch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', data.id] })
    },
  })
}

export function useTransitionProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.transitionProject,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', data.id] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}

export function useDuplicateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.duplicateProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
    },
  })
}

/* --------------------------------------------------------- Plantillas */

export function useTemplates(format?: Parameters<typeof api.listTemplates>[0]) {
  return useQuery({
    queryKey: ['templates', format ?? 'all'],
    queryFn: () => api.listTemplates(format),
    enabled,
  })
}

/* ---------------------------------------------------------- Métricas */

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: api.getDashboardMetrics,
    enabled,
  })
}

export function useActivity(limit = 15) {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: () => api.listActivity(limit),
    enabled,
  })
}

/* ------------------------------------------------------ Observaciones */

export function useObservations(projectId: string | undefined) {
  return useQuery({
    queryKey: ['observations', projectId],
    queryFn: () => api.listObservations(projectId!),
    enabled: enabled && Boolean(projectId),
  })
}

export function useAddObservation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => api.addObservation(projectId, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['observations', projectId] }),
  })
}

export function useResolveObservation(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      api.resolveObservation(id, resolved),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['observations', projectId] }),
  })
}

/* ------------------------------------------------------ Versiones */

export function useVersions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => api.listVersions(projectId!),
    enabled: enabled && Boolean(projectId),
  })
}

export function useRestoreVersion(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (version: Parameters<typeof api.restoreVersion>[1]) =>
      api.restoreVersion(projectId, version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      qc.invalidateQueries({ queryKey: ['versions', projectId] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

/* -------------------------------------------------------- Acceso / compartir */

export function useUpdateProjectAccess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, access }: { id: string; access: Parameters<typeof api.updateProjectAccess>[1] }) =>
      api.updateProjectAccess(id, access),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['project', v.id] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

/* ---------------------------------------------------------- Datos de prueba */

export function useGenerateSampleData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.generateSampleData,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['metrics'] })
      qc.invalidateQueries({ queryKey: ['transfer'] })
      qc.invalidateQueries({ queryKey: ['activity'] })
    },
  })
}

/* ------------------------------------------------------ Transferencia */

export function useTransferRecords() {
  return useQuery({
    queryKey: ['transfer'],
    queryFn: api.listTransferRecords,
    enabled,
  })
}

export function useCreateTransferRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createTransferRecord,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfer'] }),
  })
}

/* ---------------------------------------------------------- Recursos */

export function useResources(championKit = false, category?: string) {
  return useQuery({
    queryKey: ['resources', championKit, category ?? 'all'],
    queryFn: () => api.listResources(championKit, category),
    enabled,
  })
}

/* ----------------------------------------------------- Notificaciones */

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: api.listNotifications,
    enabled,
    refetchInterval: 60_000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read?: boolean }) =>
      api.markNotificationRead(id, read),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

/* ---------------------------------------------------------- Perfiles */

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: api.listProfiles,
    enabled,
  })
}

export function useUpdateProfileRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Parameters<typeof api.updateProfileRole>[1] }) =>
      api.updateProfileRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}
