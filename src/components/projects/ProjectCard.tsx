import { Link } from 'react-router-dom'
import { Icon } from '@/components/common/Icon'
import { StateBadge } from '@/components/common/StateBadge'
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

export function ProjectCard({ project }: { project: ProjectWithRelations }) {
  return (
    <Link
      to={`/proyectos/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-accent">
        <Icon
          name={iconFor(project.format)}
          className="h-10 w-10 text-primary/70"
        />
        <div className="absolute right-2 top-2">
          <StateBadge status={project.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
            {project.title}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
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
