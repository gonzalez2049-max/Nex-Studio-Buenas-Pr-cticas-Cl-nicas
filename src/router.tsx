import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, RoleGate } from '@/components/auth/ProtectedRoute'
import { PERMISSIONS } from '@/lib/domain'
import { LoginPage } from '@/pages/Login'

// El editor (Konva + exportadores) se carga bajo demanda para no penalizar
// el arranque de la aplicación.
const EditorPage = lazy(() =>
  import('@/pages/Editor').then((m) => ({ default: m.EditorPage })),
)

function EditorLoader() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <EditorPage />
    </Suspense>
  )
}
import { DashboardPage } from '@/pages/Dashboard'
import { CreateMaterialPage } from '@/pages/CreateMaterial'
import { MyProjectsPage } from '@/pages/MyProjects'
import { ProjectDetailPage } from '@/pages/ProjectDetail'
import { ReviewPage } from '@/pages/Review'
import { TemplatesPage } from '@/pages/Templates'
import { ResourcesPage } from '@/pages/Resources'
import { ChampionKitPage } from '@/pages/ChampionKit'
import { TransferLogPage } from '@/pages/TransferLog'
import { ProductionPage } from '@/pages/Production'
import { AdminPage } from '@/pages/Administracion'
import { NotificationsPage } from '@/pages/Notifications'
import { SettingsPage } from '@/pages/Settings'
import { NotFoundPage } from '@/pages/NotFound'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/proyectos/:id/editor',
    element: (
      <ProtectedRoute>
        <EditorLoader />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'crear',
        element: (
          <RoleGate allow={PERMISSIONS.canCreateMaterial}>
            <CreateMaterialPage />
          </RoleGate>
        ),
      },
      { path: 'proyectos', element: <MyProjectsPage /> },
      { path: 'proyectos/:id', element: <ProjectDetailPage /> },
      {
        path: 'revision',
        element: (
          <RoleGate allow={PERMISSIONS.canReview}>
            <ReviewPage />
          </RoleGate>
        ),
      },
      { path: 'plantillas', element: <TemplatesPage /> },
      {
        path: 'kit-champion',
        element: (
          <RoleGate allow={PERMISSIONS.canAccessChampionKit}>
            <ChampionKitPage />
          </RoleGate>
        ),
      },
      { path: 'recursos', element: <ResourcesPage /> },
      { path: 'transferencia', element: <TransferLogPage /> },
      {
        path: 'produccion',
        element: (
          <RoleGate allow={PERMISSIONS.canViewProduction}>
            <ProductionPage />
          </RoleGate>
        ),
      },
      {
        path: 'administracion',
        element: (
          <RoleGate allow={PERMISSIONS.canViewProduction}>
            <AdminPage />
          </RoleGate>
        ),
      },
      { path: 'notificaciones', element: <NotificationsPage /> },
      { path: 'configuracion', element: <SettingsPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
])
