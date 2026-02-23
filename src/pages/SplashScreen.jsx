import { motion } from 'framer-motion'

function SplashScreen() {
  return (
    <motion.section
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6 }}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-900 px-6"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(255,255,255,0.2),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(255,255,255,0.14),transparent_34%)]" />
      <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-white/20 blur-3xl" />

      <motion.div
        initial={{ x: '-20%' }}
        animate={{ x: '120%' }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        className="absolute top-16 hidden h-px w-72 bg-white/35 sm:block"
      />
      <motion.div
        initial={{ x: '120%' }}
        animate={{ x: '-20%' }}
        transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        className="absolute bottom-20 hidden h-px w-80 bg-cyan-100/40 sm:block"
      />

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="relative w-full max-w-5xl text-center text-white"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-cyan-100">School ERP</p>
        <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">SchoolERP</h1>
        <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-cyan-50/90 sm:text-lg">
          Centralized command center for directors and principals. Manage academics, compliance, finance, people and
          communication from one secure and beautifully structured digital workspace.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 text-sm text-cyan-100/95 sm:grid-cols-3">
          <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur">Admissions & Fees</div>
          <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur">Attendance & Academics</div>
          <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur">Reports & Governance</div>
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-3 overflow-hidden rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50 backdrop-blur sm:text-sm">
          <motion.span
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            className="whitespace-nowrap"
          >
            Real-time Dashboard • Multi-role Access • Secure Data • Actionable Insights • Parent Communication •
            Examination Workflow
          </motion.span>
        </div>

        <div className="mx-auto mt-7 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
          <div className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">99.9% Session Uptime</div>
          <div className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">Role-based Security</div>
          <div className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5">Leadership Analytics</div>
        </div>

        <motion.div
          className="mx-auto mt-9 h-1.5 w-80 overflow-hidden rounded-full bg-white/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-white via-cyan-100 to-white"
            initial={{ x: '-100%' }}
            animate={{ x: '120%' }}
            transition={{ duration: 1.15, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          />
        </motion.div>

        <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100/85 sm:text-sm">
          Initializing secure school environment
        </p>
      </motion.div>
    </motion.section>
  )
}

export default SplashScreen
