import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'

const webFeatures = [
  { title: 'Student Management', detail: 'Admissions, profile cards, class-wise search, full profile edit/update.' },
  { title: 'Attendance Intelligence', detail: 'Calendar view, class-wise tracking, quick marking, and monthly analytics.' },
  { title: 'Fee Management', detail: 'Class-wise pending dashboard, defaulter list, payment collection, and history.' },
  { title: 'Teacher Hub', detail: 'Profile, timetable, leave approvals, payroll, appraisals, and reports.' },
  { title: 'Staff Hub', detail: 'Canteen, librarian, transport and support staff records with role-wise details.' },
  { title: 'Marksheet & Reports', detail: 'Stream-based marksheet, auto calculations, print-ready report card, parent send.' },
]

const appFeatures = [
  { role: 'Student App', points: ['Attendance and homework', 'Exam results and report card', 'Fee dues and payment status', 'Notices and school updates'] },
  { role: 'Teacher App', points: ['Class attendance entry', 'Leave apply and status', 'Marksheet/marks upload', 'Notices and timetable access'] },
]

const phoneScreens = [
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=900&q=80',
]

function GuidePage() {
  const navigate = useNavigate()
  const rootRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.erp-guide-hero > *', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' })
      gsap.fromTo('.erp-guide-feature', { opacity: 0, y: 18, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' })
      gsap.fromTo('.erp-guide-phone', { opacity: 0, y: 25, rotateY: 18 }, { opacity: 1, y: 0, rotateY: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' })
      gsap.to('.erp-guide-phone-float', {
        y: -8,
        repeat: -1,
        yoyo: true,
        duration: 2.4,
        ease: 'sine.inOut',
        stagger: 0.15,
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <motion.section ref={rootRef} key="guide-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="min-h-screen bg-white text-slate-800">
      <header className="mb-4 bg-white px-5 py-4 shadow-sm border-b border-slate-200 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">School ERP</p>
            <h1 className="text-xl font-bold text-slate-900">ERP Product Guide</h1>
          </div>
          <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <section className="erp-guide-hero mb-8 flex flex-col lg:flex-row items-center gap-10 rounded-3xl bg-slate-900 p-8 text-white shadow-xl overflow-hidden relative">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-blue-500 blur-[80px] opacity-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-purple-500 blur-[80px] opacity-20 pointer-events-none" />

          <article className="erp-guide-hero-copy flex-1 flex flex-col items-start z-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">Complete School Operating System</p>
            <h2 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">One ERP For Web + Student App + Teacher App</h2>
            <p className="mb-8 text-sm sm:text-base text-slate-300 max-w-xl">
              This guide explains exactly what your ERP can do and how web operations connect with mobile apps for teachers and students.
            </p>
            <div className="flex flex-wrap gap-4">
              <button type="button" className="rounded-xl border border-blue-400 bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/50 hover:bg-blue-500 hover:scale-105 transition duration-300">Admin Workflow</button>
              <button type="button" className="rounded-xl bg-white/10 backdrop-blur-md px-6 py-3 text-sm font-bold text-white shadow-lg border border-white/20 hover:bg-white/20 hover:scale-105 transition duration-300">App Connected</button>
            </div>
          </article>

          <article className="erp-guide-hero-visual flex-1 w-full max-w-md lg:max-w-full z-10 relative h-[300px] sm:h-[400px]">
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              {phoneScreens.map((screen, index) => (
                <div key={screen} className={`erp-guide-phone erp-guide-phone-float phone-${index + 1} overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-800 shadow-2xl relative transition-transform ${index === 1 ? 'z-20 scale-110 -translate-y-4' : 'z-10 translate-y-4 max-h-[250px] sm:max-h-[320px] opacity-70'}`} style={{ width: index === 1 ? '40%' : '30%', aspectRatio: '9/19' }}>
                  <img src={screen} alt={`ERP mobile preview ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Web ERP Features</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {webFeatures.map((feature) => (
              <article key={feature.title} className="erp-guide-feature rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition hover:-translate-y-1">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="mb-2 text-sm font-bold text-slate-900">{feature.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{feature.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {appFeatures.map((item) => (
            <article key={item.role} className="erp-guide-feature rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 pb-3 text-sm font-bold uppercase tracking-wide text-slate-800 border-b border-slate-100 flex items-center gap-2">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                {item.role}
              </h3>
              <ul className="space-y-3">
                {item.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="mb-8">
          <h2 className="mb-6 text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">How Web and App Connect</h2>
          <div className="flex flex-col md:flex-row gap-4 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[28px] left-0 w-full h-[2px] bg-slate-100 z-0"></div>

            <article className="erp-guide-feature flex-1 z-10 relative">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border-2 border-slate-200 text-lg font-bold text-slate-700 shadow-sm mx-auto md:mx-0">
                1
              </div>
              <p className="mb-2 text-sm font-bold text-slate-900 text-center md:text-left">Admin Creates Data On Web ERP</p>
              <p className="text-xs text-slate-600 text-center md:text-left">Students, teachers, classes, attendance, marksheet and fee records are managed from web panel.</p>
            </article>

            <article className="erp-guide-feature flex-1 z-10 relative mt-4 md:mt-0">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border-2 border-blue-200 text-lg font-bold text-blue-700 shadow-sm mx-auto md:mx-0">
                2
              </div>
              <p className="mb-2 text-sm font-bold text-slate-900 text-center md:text-left">Credentials Given To App Users</p>
              <p className="text-xs text-slate-600 text-center md:text-left">Teacher and student login with provided credentials, role-based access controls screen visibility.</p>
            </article>

            <article className="erp-guide-feature flex-1 z-10 relative mt-4 md:mt-0">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 border-2 border-green-200 text-lg font-bold text-green-700 shadow-sm mx-auto md:mx-0">
                3
              </div>
              <p className="mb-2 text-sm font-bold text-slate-900 text-center md:text-left">Real-Time Sync Experience</p>
              <p className="text-xs text-slate-600 text-center md:text-left">Attendance, notices, fee updates and report cards can be shown inside mobile app as soon as backend is connected.</p>
            </article>
          </div>
        </section>
      </div>
    </motion.section>
  )
}

export default GuidePage
