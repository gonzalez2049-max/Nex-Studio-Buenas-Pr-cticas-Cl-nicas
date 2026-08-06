import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { StateBadge } from '@/components/common/StateBadge'
import { ProjectActionsMenu } from '@/components/projects/ProjectActionsMenu'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { FORMAT_DEFS, FORMAT_LABELS } from '@/lib/domain'
import { relativeDate } from '@/lib/format'
import { initials } from '@/lib/utils'
import type { ProjectWithRelations } from '@/types/database'

const iconFor = (fmt: string) =>
  FORMAT_DEFS.find((f) => f.id === fmt)?.icon ?? 'FileText'

export function ProjectCard({
  project,
  showActions = false,
}: {
  project: ProjectWithRelations
  showActions?: boolean
}) {
  return (
    <Link
      to={`/proyectos/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card surface transition-all hover:-translate-y-0.5 hover:surface-lg"
    >
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-accent">
        <Icon
          name={iconFor(project.format)}
          className="h-10 w-10 text-primary/70"
        />
        <div className="absolute right-2 top-2">
          <StateBadge status={project.status} />
        </div>
        {showActions && (
          <div className="absolute left-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <ProjectActionsMenu project={project} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
            {project.title}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {project.code ? `${project.code} · ` : ''}
          {FORMAT_LABELS[project.format]}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.owner?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px]">
                {initials(project.owner?.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {relativeDate(project.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
