import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, CalendarDays, CheckCircle2, ListTodo } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { PageTransition, StaggerItem } from '@/components/PageTransition'
import { Skeleton } from '@/components/Skeleton'
import { useErrorToast } from '@/hooks/useErrorToast'
import { projectsApi, tasksApi } from '@/lib/api'
import { PROJECT_STATUS, cn, formatDate, quadrantConfig } from '@/lib/utils'

/** Detalle de proyecto: info + sus tareas (GET /tasks?proyectoId=). */
export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  const projectQuery = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: Boolean(id),
  })
  const tasksQuery = useQuery({
    queryKey: ['tasks', { proyectoId: id }],
    queryFn: () => tasksApi.list({ proyectoId: id }),
    enabled: Boolean(id),
  })

  useErrorToast(projectQuery.error, `project-${id}`)
  useErrorToast(tasksQuery.error, `project-tasks-${id}`)

  const project = projectQuery.data
  const tasks = (tasksQuery.data ?? []).filter((t) => t.estado !== 'eliminada')
  const completadas = tasks.filter((t) => t.estado === 'completada').length

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <Link
          to="/projects"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-400 transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a proyectos
        </Link>

        {projectQuery.isLoading ? (
          <Card className="p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-3 h-4 w-full" />
          </Card>
        ) : !project ? (
          <Card className="py-6">
            <EmptyState
              icon={<ListTodo className="h-7 w-7" />}
              title="Proyecto no encontrado"
              description="Puede que haya sido eliminado o no tengas acceso."
            />
          </Card>
        ) : (
          <>
            <Card className="mb-5 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                    {project.titulo}
                  </h1>
                  <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                    {project.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <Badge className={PROJECT_STATUS[project.estado].className}>
                  {PROJECT_STATUS[project.estado].label}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200/60 pt-4 text-xs text-slate-400 dark:border-white/10">
                <span className="inline-flex items-center gap-1.5">
                  <ListTodo className="h-3.5 w-3.5" /> {tasks.length} tareas
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {completadas} completadas
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Creado el {formatDate(project.creadoEn)}
                </span>
              </div>
            </Card>

            <h2 className="mb-3 text-sm font-bold text-slate-600 dark:text-slate-300">
              Tareas del proyecto
            </h2>
            {tasksQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <Card className="py-4">
                <EmptyState
                  icon={<ListTodo className="h-7 w-7" />}
                  title="Sin tareas todavía"
                  description="Crea tareas en la matriz y asígnalas a este proyecto."
                />
              </Card>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t, i) => {
                  const quad = quadrantConfig(t.cuadrante)
                  return (
                    <StaggerItem key={t.id} index={i}>
                      <Link to={`/tasks/${t.id}`}>
                        <motion.li
                          whileHover={{ x: 3 }}
                          className={cn(
                            'flex items-center gap-3 rounded-xl border border-l-4 bg-white/50 px-4 py-3 transition-colors hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10',
                            quad.border,
                          )}
                          style={{ borderLeftColor: quad.hex }}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'truncate text-sm font-semibold text-slate-700 dark:text-slate-200',
                                t.estado === 'completada' && 'line-through opacity-60',
                              )}
                            >
                              {t.titulo}
                            </p>
                            {t.fechaLimite && (
                              <p className="text-xs text-slate-400">
                                Límite: {formatDate(t.fechaLimite)}
                              </p>
                            )}
                          </div>
                          <Badge className={quad.badge}>{quad.shortLabel}</Badge>
                        </motion.li>
                      </Link>
                    </StaggerItem>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
