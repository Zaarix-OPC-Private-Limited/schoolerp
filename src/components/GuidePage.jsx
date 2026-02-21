import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'

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

function GuidePage({ onBack }) {
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
    <motion.section ref={rootRef} key="guide-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="erp-fees-shell min-h-screen">
      <header className="erp-dashboard-header">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="erp-dashboard-kicker">School ERP</p>
            <h1 className="erp-dashboard-title">ERP Product Guide</h1>
          </div>
          <button type="button" className="erp-nav-button" onClick={onBack}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
        <section className="erp-guide-hero">
          <article className="erp-guide-hero-copy">
            <p className="erp-hero-kicker">Complete School Operating System</p>
            <h2 className="erp-hero-title">One ERP For Web + Student App + Teacher App</h2>
            <p className="erp-hero-subtitle">
              This guide explains exactly what your ERP can do and how web operations connect with mobile apps for teachers and students.
            </p>
            <div className="erp-hero-actions">
              <button type="button" className="erp-nav-button erp-nav-button-attendance">Admin Workflow</button>
              <button type="button" className="erp-nav-button erp-nav-button-notice">App Connected</button>
            </div>
          </article>
          <article className="erp-guide-hero-visual">
            <div className="erp-guide-phone-row">
              {phoneScreens.map((screen, index) => (
                <div key={screen} className={`erp-guide-phone erp-guide-phone-float phone-${index + 1}`}>
                  <img src={screen} alt="ERP mobile preview" />
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="erp-form-section mt-4">
          <h2 className="erp-form-title">Web ERP Features</h2>
          <div className="erp-guide-feature-grid">
            {webFeatures.map((feature) => (
              <article key={feature.title} className="erp-guide-feature">
                <p className="erp-student-name">{feature.title}</p>
                <p className="erp-student-meta">{feature.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="erp-notice-shell mt-4">
          {appFeatures.map((item) => (
            <article key={item.role} className="erp-notice-preview-card erp-guide-feature">
              <h3 className="erp-modal-card-title">{item.role}</h3>
              {item.points.map((point) => (
                <p key={point} className="erp-student-meta">• {point}</p>
              ))}
            </article>
          ))}
        </section>

        <section className="erp-form-section mt-4">
          <h2 className="erp-form-title">How Web and App Connect</h2>
          <div className="erp-guide-flow">
            <article className="erp-guide-feature">
              <p className="erp-student-name">Step 1: Admin Creates Data On Web ERP</p>
              <p className="erp-student-meta">Students, teachers, classes, attendance, marksheet and fee records are managed from web panel.</p>
            </article>
            <article className="erp-guide-feature">
              <p className="erp-student-name">Step 2: Credentials Given To App Users</p>
              <p className="erp-student-meta">Teacher and student login with provided credentials, role-based access controls screen visibility.</p>
            </article>
            <article className="erp-guide-feature">
              <p className="erp-student-name">Step 3: Real-Time Sync Experience</p>
              <p className="erp-student-meta">Attendance, notices, fee updates and report cards can be shown inside mobile app as soon as backend is connected.</p>
            </article>
          </div>
        </section>
      </div>
    </motion.section>
  )
}

export default GuidePage
