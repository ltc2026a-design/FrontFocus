import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Inbox, Moon, Sun } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { Input, Select } from '@/components/Input'
import { Modal } from '@/components/Modal'
import { PageTransition, StaggerItem } from '@/components/PageTransition'
import { Skeleton, SkeletonCard } from '@/components/Skeleton'
import { Spinner } from '@/components/Spinner'
import { TextArea } from '@/components/TextArea'
import { useToast } from '@/components/Toast'
import { Toggle } from '@/components/Toggle'
import { useTheme } from '@/hooks/useTheme'
import { QUADRANTS } from '@/lib/utils'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {title}
      </h2>
      <Card className="space-y-4 p-5">{children}</Card>
    </section>
  )
}

/** Storybook casero: muestra todos los componentes del design system. */
export function DesignPreviewPage() {
  const toast = useToast()
  const { isDark, toggleTheme } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toggle, setToggle] = useState(true)
  const [text, setText] = useState('')

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient">
              FocusFlow Design System
            </h1>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              Todos los componentes del frontend con sus variantes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Modo claro' : 'Modo oscuro'}
            </Button>
            <Link to="/login">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" /> Ir a login
              </Button>
            </Link>
          </div>
        </div>

        <StaggerItem index={0}>
          <Section title="Botones">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button loading>Cargando</Button>
              <Button disabled>Deshabilitado</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Icono">
                <Inbox className="h-4 w-4" />
              </Button>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem index={1}>
          <Section title="Badges y colores de cuadrante">
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUADRANTS.map((q) => (
                <Badge key={q.id} className={q.badge}>
                  <span className={`h-2 w-2 rounded-full ${q.dot}`} />
                  {q.label}
                </Badge>
              ))}
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem index={2}>
          <Section title="Formulario">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Input normal" placeholder="Escribe algo…" value={text} onChange={(e) => setText(e.target.value)} />
              <Input label="Con error" defaultValue="valor" error="Mensaje de error de ejemplo" />
              <Select label="Select" defaultValue="a">
                <option value="a">Opción A</option>
                <option value="b">Opción B</option>
              </Select>
              <Input label="Deshabilitado" disabled placeholder="—" />
            </div>
            <TextArea label="Text area" placeholder="Texto largo…" />
            <div className="flex items-center gap-3">
              <Toggle checked={toggle} onChange={setToggle} label="Toggle de ejemplo" />
              <span className="text-sm text-slate-500">{toggle ? 'Activado' : 'Desactivado'}</span>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem index={3}>
          <Section title="Modales y diálogos">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setModalOpen(true)}>Abrir Modal</Button>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                ConfirmDialog
              </Button>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem index={4}>
          <Section title="Toasts">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => toast.success('Operación completada con éxito')}>
                Success
              </Button>
              <Button variant="danger" onClick={() => toast.error('Algo salió mal (ejemplo de error)')}>
                Error
              </Button>
              <Button variant="ghost" onClick={() => toast.warning('Cuidado: acción irreversible')}>
                Warning
              </Button>
              <Button variant="ghost" onClick={() => toast.info('Sesión pomodoro iniciada')}>
                Info
              </Button>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem index={5}>
          <Section title="Loading y estados vacíos">
            <div className="flex flex-wrap items-center gap-6">
              <Spinner />
              <Spinner className="h-7 w-7" />
              <div className="w-56">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SkeletonCard />
              <Card className="py-2">
                <EmptyState
                  icon={<Inbox className="h-7 w-7" />}
                  title="Nada por aquí"
                  description="Ejemplo de EmptyState con CTA."
                  action={<Button size="sm">Acción</Button>}
                />
              </Card>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem index={6}>
          <Section title="Números animados">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-xs text-slate-400">Conteo simple</p>
                <p className="text-3xl font-extrabold">
                  <AnimatedNumber value={1234} />
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Con decimales y sufijo</p>
                <p className="text-3xl font-extrabold text-secondary">
                  <AnimatedNumber value={87.5} decimals={1} suffix="%" />
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Racha</p>
                <p className="text-3xl font-extrabold text-warning">
                  <AnimatedNumber value={21} suffix=" días" />
                </p>
              </div>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem index={7}>
          <Section title="Glassmorphism y gradientes">
            <div className="grid gap-4 sm:grid-cols-3">
              <motion.div
                whileHover={{ y: -3, boxShadow: '0 10px 40px -10px rgba(76,111,255,0.5)' }}
                className="glass rounded-2xl p-4 text-sm"
              >
                <p className="font-bold">glass</p>
                <p className="text-xs text-slate-400">bg + backdrop-blur + borde sutil</p>
              </motion.div>
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-4 text-sm text-white shadow-[0_0_30px_rgba(76,111,255,0.4)]"
              >
                <p className="font-bold">Gradiente neón</p>
                <p className="text-xs opacity-80">primary → secondary</p>
              </motion.div>
              <motion.div whileHover={{ y: -3 }} className="glass-strong rounded-2xl p-4 text-sm">
                <p className="font-bold">glass-strong</p>
                <p className="text-xs text-slate-400">para modales y popovers</p>
              </motion.div>
            </div>
          </Section>
        </StaggerItem>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal de ejemplo"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setModalOpen(false)}>Aceptar</Button>
          </>
        }
      >
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Este modal entra con scale + backdrop blur y se cierra con Escape o clic fuera.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar acción"
        message="Ejemplo de diálogo de confirmación para acciones destructivas."
        onConfirm={() => {
          setConfirmOpen(false)
          toast.success('Acción confirmada')
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageTransition>
  )
}
