import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Bell,
  BellRing,
  Camera,
  Check,
  Crown,
  Download,
  FolderKanban,
  Moon,
  Save,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Input, Select } from '@/components/Input'
import { PageTransition } from '@/components/PageTransition'
import { useToast } from '@/components/Toast'
import { useTheme } from '@/hooks/useTheme'
import { apiErrorMessage, authApi, exportApi, paymentsApi, projectsApi, tasksApi } from '@/lib/api'
import { permissionStatus, requestPermission } from '@/platform/notifications'
import { COMMON_TIMEZONES, formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

/** Convierte un archivo de imagen en un data URL cuadrado redimensionado. */
function fileToAvatarDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('El archivo no es una imagen'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagen inválida'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas no disponible'))
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()
  const toast = useToast()
  const { theme, setTheme } = useTheme()
  const fileRef = useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = useState(user?.nombre ?? '')
  const [zonaHoraria, setZonaHoraria] = useState(user?.zonaHoraria || 'UTC')
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null)
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null)
  const [notifPerm, setNotifPerm] = useState<string>('prompt')

  useEffect(() => {
    void permissionStatus().then(setNotifPerm)
  }, [])

  useEffect(() => {
    if (user) {
      setNombre(user.nombre)
      setZonaHoraria(user.zonaHoraria || 'UTC')
      setAvatar(user.avatarUrl ?? null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const subQuery = useQuery({ queryKey: ['subscription-current'], queryFn: () => paymentsApi.currentSubscription() })
  const tasksQuery = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.list() })
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.list() })

  const tareasActivas = (tasksQuery.data ?? []).filter((t) => t.estado !== 'eliminada').length
  const tareasCompletadas = (tasksQuery.data ?? []).filter((t) => t.estado === 'completada').length
  const proyectos = projectsQuery.data?.length ?? 0
  const planActual = subQuery.data?.activa ? subQuery.data.planTipo : 'free'

  const saveProfile = useMutation({
    mutationFn: () =>
      authApi.updateMe({
        nombre: nombre.trim(),
        zonaHoraria,
        avatarUrl: avatar,
      }),
    onSuccess: (updated) => {
      setUser(updated)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Perfil actualizado')
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'No se pudo guardar el perfil')),
  })

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setAvatar(dataUrl)
      toast.success('Foto lista. Pulsa "Guardar cambios" para aplicarla.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo procesar la imagen')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(format)
    try {
      const result = await exportApi.download(format)
      if (!result.ok) throw new Error(result.location)
      toast.success(
        result.where === 'native'
          ? `Guardado en Documentos y listo para compartir`
          : `Exportación ${format.toUpperCase()} descargada`,
      )
    } catch (err) {
      toast.error(apiErrorMessage(err, `No se pudo exportar a ${format.toUpperCase()}`))
    } finally {
      setExporting(null)
    }
  }

  const enableNotifications = async () => {
    const granted = await requestPermission()
    setNotifPerm(await permissionStatus())
    if (granted) toast.success('Notificaciones activadas')
    else toast.info('Permiso de notificaciones no concedido')
  }

  const dirty =
    nombre.trim() !== (user?.nombre ?? '') ||
    zonaHoraria !== (user?.zonaHoraria || 'UTC') ||
    avatar !== (user?.avatarUrl ?? null)

  const initials = (user?.nombre ?? '?').charAt(0).toUpperCase()

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Perfil
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Tu cuenta, foto, preferencias y datos.
          </p>
        </div>

        {/* Resumen de cuenta */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary text-2xl font-extrabold text-white shadow-[0_0_24px_rgba(76,111,255,0.4)]">
                {avatar ? (
                  <img src={avatar} alt="Foto de perfil" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-slate-800 text-white shadow-md transition hover:bg-slate-700"
                aria-label="Cambiar foto"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-slate-800 dark:text-slate-100">{user?.nombre}</p>
                {user?.rol === 'ADMIN' && (
                  <Badge className="bg-warning/15 text-warning border border-warning/30">Admin</Badge>
                )}
              </div>
              <p className="truncate text-sm text-slate-400">{user?.email}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Miembro desde {formatDate(user?.creadoEn)}
              </p>
            </div>
            {avatar && (
              <Button variant="ghost" size="sm" onClick={() => setAvatar(null)} aria-label="Quitar foto">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Plan', value: planActual.replace('_', ' '), icon: Crown },
              { label: 'Tareas activas', value: String(tareasActivas), icon: Check },
              { label: 'Completadas', value: String(tareasCompletadas), icon: Check },
              { label: 'Proyectos', value: String(proyectos), icon: FolderKanban },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200/70 px-3 py-2.5 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <s.icon className="h-3 w-3" /> {s.label}
                </div>
                <p className="mt-1 truncate text-sm font-extrabold capitalize text-slate-700 dark:text-slate-200">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Datos y preferencias */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">
            Datos y preferencias
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (nombre.trim().length < 2) {
                toast.warning('El nombre debe tener al menos 2 caracteres')
                return
              }
              saveProfile.mutate()
            }}
          >
            <Input
              label="Nombre"
              icon={<UserRound className="h-4 w-4" />}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <Select
              label="Zona horaria"
              value={zonaHoraria}
              onChange={(e) => setZonaHoraria(e.target.value)}
            >
              {!COMMON_TIMEZONES.includes(zonaHoraria) && (
                <option value={zonaHoraria}>{zonaHoraria}</option>
              )}
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>

            <motion.div whileHover={{ scale: dirty ? 1.01 : 1 }}>
              <Button type="submit" className="w-full" disabled={!dirty} loading={saveProfile.isPending}>
                <Save className="h-4 w-4" /> Guardar cambios
              </Button>
            </motion.div>
          </form>
        </Card>

        {/* Permisos */}
        <Card className="flex items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              <BellRing className="h-4 w-4 text-primary" /> Permiso de notificaciones
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Necesario para avisos de fin de pomodoro y vencimientos. Estado:{' '}
              <b className="capitalize">{notifPerm}</b>.
            </p>
          </div>
          <Button
            variant={notifPerm === 'granted' ? 'ghost' : 'secondary'}
            size="sm"
            onClick={() => void enableNotifications()}
            disabled={notifPerm === 'unsupported'}
          >
            <Bell className="h-4 w-4" />
            {notifPerm === 'granted' ? 'Activado' : 'Activar'}
          </Button>
        </Card>

        {/* Apariencia */}
        <Card className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">Apariencia</h2>
            <p className="text-xs text-slate-400">Cambia el tema al instante (se guarda en tu dispositivo).</p>
          </div>
          <div className="flex gap-2">
            <Button variant={theme === 'light' ? 'primary' : 'ghost'} size="sm" onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4" /> Claro
            </Button>
            <Button variant={theme === 'dark' ? 'primary' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4" /> Oscuro
            </Button>
          </div>
        </Card>

        {/* Exportar datos */}
        <Card className="p-6">
          <h2 className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">Exportar mis datos</h2>
          <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
            Descarga tus tareas, micro-tareas, sesiones e historial en un formato legible (nombres y
            etiquetas, no solo IDs).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void handleExport('json')} loading={exporting === 'json'} disabled={exporting !== null}>
              <Download className="h-4 w-4" /> Exportar JSON
            </Button>
            <Button variant="secondary" onClick={() => void handleExport('csv')} loading={exporting === 'csv'} disabled={exporting !== null}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </Card>
      </div>
    </PageTransition>
  )
}
