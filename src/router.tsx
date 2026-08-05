import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, RoleGate } from '@/components/auth/ProtectedRoute'
import { PERMISSIONS } from '@/lib/domain'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { CreateMaterialPage } from '@/pages/CreateMaterial'
import { MyProjectsPage } from '@/pages/MyProjects'
import { ProjectDetailPage } from '@/pages/ProjectDetail'
import { TemplatesPage } from '@/pages/Templates'
import { ResourcesPage } from '@/pages/Resources'
import { TransferLogPage } from '@/pages/TransferLog'
import { ProductionPage } from '@/pages/Production'
import { NotificationsPage } from '@/pages/Notifications'
import { SettingsPage } from '@/pages/Settings'
import { NotFoundPage } from '@/pages/NotFound'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
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
      { path: 'plantillas', element: <TemplatesPage /> },
      {
        path: 'kit-champion',
        element: (
          <RoleGate allow={PERMISSIONS.canAccessChampionKit}>
            <ResourcesPage championKit />
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
      { path: 'notificaciones', element: <NotificationsPage /> },
      { path: 'configuracion', element: <SettingsPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
])
