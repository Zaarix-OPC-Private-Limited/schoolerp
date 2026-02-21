import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import CustomSelect from './CustomSelect'

const classLabelMap = {
  '1st': 'First',
  '2nd': 'Second',
  '3rd': 'Third',
  '4th': 'Fourth',
  '5th': 'Fifth',
  '6th': 'Sixth',
  '7th': 'Seventh',
  '8th': 'Eighth',
  '9th': 'Ninth',
  '10th': 'Tenth',
  '11th': 'Eleventh',
  '12th': 'Twelfth',
}
const classOptions = ['All Classes', 'Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((v) => ({ value: v, label: classLabelMap[v] || v }))
const sectionOptions = ['All Sections', 'A', 'B', 'C'].map((v) => ({ value: v, label: v }))
const paymentModes = [{ value: 'upi', label: 'UPI' }, { value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transfer' }]
const views = [
  ['overview', 'Executive Dashboard'],
  ['structure', 'Fee Structure'],
  ['ledger', 'Student Ledger'],
  ['defaulters', 'Defaulters Control'],
  ['reports', 'Financial Reports'],
  ['access', 'Head Access'],
]

const seed = [
  { id: 'STD-101', name: 'Aarav', className: '10th', section: 'A', expected: 76000, collected: 52000, dueDate: '2026-01-20', concession: 2000, fine: 1200, refund: 0 },
  { id: 'STD-102', name: 'Diya', className: '8th', section: 'B', expected: 67000, collected: 64000, dueDate: '2026-02-10', concession: 3000, fine: 0, refund: 0 },
  { id: 'STD-103', name: 'Reyansh', className: '12th', section: 'A', expected: 86000, collected: 43000, dueDate: '2026-01-14', concession: 0, fine: 1800, refund: 500 },
  { id: 'STD-104', name: 'Sara', className: '5th', section: 'C', expected: 58000, collected: 37000, dueDate: '2026-02-04', concession: 1500, fine: 650, refund: 0 },
]

const n = (v) => Number.parseFloat(String(v ?? 0)) || 0
const rs = (v) => `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(n(v), 0))}`
const daysOverdue = (date) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000))
const esc = (v) => String(v ?? '').replaceAll('"', '""')
const escHtml = (v) =>
  String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const toCsv = (headers, rows) => {
  const head = headers.map((h) => `"${esc(h)}"`).join(',')
  const body = rows.map((row) => row.map((cell) => `"${esc(cell)}"`).join(',')).join('\n')
  return `${head}\n${body}`
}

const toExcelTable = (title, headers, rows) => {
  const th = headers.map((h) => `<th>${escHtml(h)}</th>`).join('')
  const tr = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escHtml(cell)}</td>`).join('')}</tr>`)
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title></head><body><h3>${escHtml(title)}</h3><table border="1"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></body></html>`
}

const printPdfTable = (title, headers, rows) => {
  const th = headers.map((h) => `<th>${escHtml(h)}</th>`).join('')
  const tr = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escHtml(cell)}</td>`).join('')}</tr>`)
    .join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px}h2{margin:0 0 12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d1d5db;padding:8px;text-align:left;font-size:12px}th{background:#f8fafc}</style></head><body><h2>${escHtml(title)}</h2><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`
  const w = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=720')
  if (!w) return false
  w.document.open()
  w.document.write(html)
  w.document.close()
  return true
}

const normalize = (s) => {
  const expected = n(s.expected || s.totalFee || 55000)
  const collected = Math.min(n(s.collected || s.paidAmount || 0), expected)
  const pending = Math.max(expected - collected, 0)
  return {
    ...s,
    expected,
    collected,
    pending,
    overdueDays: pending > 0 ? daysOverdue(s.dueDate || '2026-02-05') : 0,
    ledger: [
      { id: `${s.id}-P1`, date: '2025-06-15', type: 'payment', amount: Math.round(collected * 0.6), mode: 'UPI', note: 'Installment 1' },
      { id: `${s.id}-P2`, date: '2025-10-15', type: 'payment', amount: Math.round(collected * 0.4), mode: 'Bank', note: 'Installment 2' },
      ...(n(s.fine) ? [{ id: `${s.id}-F1`, date: '2026-02-01', type: 'fine', amount: n(s.fine), mode: '-', note: 'Late fee' }] : []),
      ...(n(s.concession) ? [{ id: `${s.id}-C1`, date: '2025-05-20', type: 'concession', amount: n(s.concession), mode: '-', note: 'Approved concession' }] : []),
      ...(n(s.refund) ? [{ id: `${s.id}-R1`, date: '2025-12-02', type: 'refund', amount: n(s.refund), mode: 'Bank', note: 'Fee adjustment' }] : []),
    ],
  }
}

function FeeManagementPage({ students = [], onBack }) {
  const [view, setView] = useState('overview')
  const [rows, setRows] = useState((students.length ? students : seed).map(normalize))
  const [cls, setCls] = useState('All Classes')
  const [sec, setSec] = useState('All Sections')
  const [minDue, setMinDue] = useState('0')
  const [maxDue, setMaxDue] = useState('999999')
  const [minOver, setMinOver] = useState('0')
  const [selectedId, setSelectedId] = useState('')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('upi')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [cfg, setCfg] = useState({ className: '10th', installments: '3', fineType: 'percentage', fineValue: '3', transport: '15000', hostel: '46000', concessionCap: '25', clone: '2024-2025' })
  const role = 'Head/Principal'
  const isHead = role === 'Head/Principal'

  const kpi = useMemo(() => {
    const expected = rows.reduce((a, b) => a + b.expected, 0)
    const collected = rows.reduce((a, b) => a + b.collected, 0)
    const pending = Math.max(expected - collected, 0)
    const overdue = rows.filter((r) => r.overdueDays > 0).reduce((a, b) => a + b.pending, 0)
    const monthPct = expected ? (collected / expected) * 100 : 0
    return { expected, collected, pending, overdue, today: 0, monthPct }
  }, [rows])

  const trend = useMemo(() => ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((m, i) => ({ m, v: Math.round((kpi.expected * (52 + i * 4)) / 100) })), [kpi.expected])
  const classBar = useMemo(() => {
    const g = rows.reduce((a, r) => {
      a[r.className] = (a[r.className] || 0) + r.collected
      return a
    }, {})
    return Object.entries(g).map(([k, v]) => ({ k, v }))
  }, [rows])
  const componentPie = useMemo(() => {
    const tuition = Math.round(rows.reduce((a, r) => a + r.expected * 0.7, 0))
    const transport = rows.length * 12000
    const hostel = rows.filter((r) => ['10th', '12th'].includes(r.className)).length * 46000
    const fine = rows.reduce((a, r) => a + n(r.fine), 0)
    return [
      { label: 'Tuition', value: tuition, color: '#2563eb' },
      { label: 'Transport', value: transport, color: '#0f766e' },
      { label: 'Hostel', value: hostel, color: '#b45309' },
      { label: 'Fine', value: fine, color: '#d97706' },
    ]
  }, [rows])
  const pieBg = useMemo(() => {
    const total = componentPie.reduce((a, b) => a + b.value, 0) || 1
    let cur = 0
    return `conic-gradient(${componentPie
      .map((s) => {
        const start = (cur / total) * 100
        cur += s.value
        return `${s.color} ${start}% ${(cur / total) * 100}%`
      })
      .join(',')})`
  }, [componentPie])

  const defaulters = useMemo(
    () =>
      rows
        .filter((r) => r.pending > 0)
        .filter((r) => (cls === 'All Classes' ? true : r.className === cls))
        .filter((r) => (sec === 'All Sections' ? true : r.section === sec))
        .filter((r) => r.overdueDays >= n(minOver))
        .filter((r) => r.pending >= n(minDue) && r.pending <= n(maxDue || 999999))
        .sort((a, b) => b.pending - a.pending),
    [rows, cls, sec, minOver, minDue, maxDue],
  )

  const active = rows.find((r) => r.id === selectedId) || rows[0] || null
  const reportRows = useMemo(
    () => [
      { report: 'Daily Collection', metric: rs(kpi.today) },
      { report: 'Monthly Collection', metric: `${kpi.monthPct.toFixed(1)}%` },
      { report: 'Class-wise Summary', metric: `${classBar.length} classes` },
      { report: 'Concession Report', metric: rs(rows.reduce((a, b) => a + n(b.concession), 0)) },
      { report: 'Refund Report', metric: rs(rows.reduce((a, b) => a + n(b.refund), 0)) },
    ],
    [kpi.today, kpi.monthPct, classBar.length, rows],
  )
  const linePoints = useMemo(() => {
    const max = Math.max(...trend.map((x) => x.v), 1)
    return trend.map((p, i) => `${20 + i * 40},${160 - Math.round((p.v / max) * 130)}`).join(' ')
  }, [trend])

  const exportDefaulters = (format) => {
    if (!defaulters.length) {
      setStatus('No defaulters found for selected filters.')
      return
    }
    const headers = ['Student ID', 'Student', 'Class', 'Section', 'Overdue Days', 'Pending Amount', 'Fine']
    const data = defaulters.map((d) => [d.id, d.name, d.className, d.section, d.overdueDays, d.pending, d.fine])
    const dateTag = new Date().toISOString().slice(0, 10)
    if (format === 'csv') {
      downloadFile(`defaulters-${dateTag}.csv`, toCsv(headers, data), 'text/csv;charset=utf-8')
      setStatus(`CSV downloaded: ${defaulters.length} rows.`)
      return
    }
    if (format === 'excel') {
      downloadFile(
        `defaulters-${dateTag}.xls`,
        toExcelTable('Defaulters Report', headers, data),
        'application/vnd.ms-excel;charset=utf-8',
      )
      setStatus(`Excel downloaded: ${defaulters.length} rows.`)
      return
    }
    const ok = printPdfTable('Defaulters Report', headers, data)
    setStatus(ok ? 'PDF print window opened. Save as PDF from print dialog.' : 'Please allow popups to export PDF.')
  }

  const exportReport = (reportName, format) => {
    const headers = ['Report', 'Metric']
    const row = reportRows.find((r) => r.report === reportName)
    if (!row) return
    const data = [[row.report, row.metric]]
    const dateTag = new Date().toISOString().slice(0, 10)
    if (format === 'csv') {
      downloadFile(`${reportName.toLowerCase().replaceAll(' ', '-')}-${dateTag}.csv`, toCsv(headers, data), 'text/csv;charset=utf-8')
      setStatus(`CSV downloaded for "${reportName}".`)
      return
    }
    if (format === 'excel') {
      downloadFile(
        `${reportName.toLowerCase().replaceAll(' ', '-')}-${dateTag}.xls`,
        toExcelTable(reportName, headers, data),
        'application/vnd.ms-excel;charset=utf-8',
      )
      setStatus(`Excel downloaded for "${reportName}".`)
      return
    }
    const ok = printPdfTable(reportName, headers, data)
    setStatus(ok ? `PDF print window opened for "${reportName}".` : 'Please allow popups to export PDF.')
  }

  const pay = () => {
    if (!isHead) return setStatus('Only Head/Principal can edit payments.')
    const a = n(amount)
    if (!active || a <= 0 || a > active.pending) return setStatus('Enter valid amount within pending value.')
    const tx = `TX-${Date.now().toString().slice(-6)}`
    const dt = new Date().toISOString().slice(0, 10)
    setRows((prev) =>
      prev.map((r) =>
        r.id === active.id
          ? { ...r, collected: r.collected + a, pending: Math.max(r.expected - (r.collected + a), 0), ledger: [{ id: tx, date: dt, type: 'payment', amount: a, mode: paymentModes.find((m) => m.value === mode)?.label || 'UPI', note: note || 'Fee payment' }, ...r.ledger] }
          : r,
      ),
    )
    setAmount('')
    setNote('')
    setStatus(`Payment saved with receipt ${tx}.`)
  }

  return (
    <motion.section key="fees" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="erp-fees-shell">
      <header className="erp-dashboard-header">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="erp-dashboard-kicker">School ERP</p>
            <h1 className="erp-dashboard-title">Fees Module (Head Control)</h1>
          </div>
          <div className="erp-fees-head-actions">
            <span className="erp-fees-role-badge">Role: {role}</span>
            <button type="button" className="erp-nav-button" onClick={onBack}>Back to Dashboard</button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <div className="erp-fees-layout">
          <aside className="erp-fees-sidebar">
            {views.map(([id, label]) => (
              <button key={id} type="button" className={`erp-fees-side-btn ${view === id ? 'erp-fees-side-btn-active' : ''}`} onClick={() => setView(id)}>{label}</button>
            ))}
          </aside>

          <main className="erp-fees-main">
            <section className="erp-fees-kpi-grid">
              <article className="erp-fees-kpi-card"><p>Total Expected Collection</p><strong>{rs(kpi.expected)}</strong></article>
              <article className="erp-fees-kpi-card"><p>Total Collected Amount</p><strong>{rs(kpi.collected)}</strong></article>
              <article className="erp-fees-kpi-card"><p>Pending Amount</p><strong>{rs(kpi.pending)}</strong></article>
              <article className="erp-fees-kpi-card"><p>Overdue Amount</p><strong>{rs(kpi.overdue)}</strong></article>
              <article className="erp-fees-kpi-card"><p>Today&apos;s Collection</p><strong>{rs(kpi.today)}</strong></article>
              <article className="erp-fees-kpi-card"><p>Monthly Collection %</p><strong>{kpi.monthPct.toFixed(1)}%</strong></article>
            </section>

            {view === 'overview' && (
              <div className="erp-fees-section-grid">
                <section className="erp-form-section">
                  <h2 className="erp-form-title">Monthly Collection Trend</h2>
                  <svg className="erp-fees-chart" viewBox="0 0 500 180">
                    <path d="M20 160 L480 160" className="erp-fees-axis" />
                    <path d="M20 10 L20 160" className="erp-fees-axis" />
                    <polyline points={linePoints} className="erp-fees-line" />
                  </svg>
                </section>
                <section className="erp-form-section">
                  <h2 className="erp-form-title">Class-wise Fee Collection</h2>
                  <div className="erp-fees-bar-wrap">
                    {classBar.map((x) => {
                      const mx = Math.max(...classBar.map((c) => c.v), 1)
                      return <article key={x.k} className="erp-fees-bar-item"><div className="erp-fees-bar-outer"><div className="erp-fees-bar-fill" style={{ height: `${Math.round((x.v / mx) * 100)}%` }} /></div><p>{x.k}</p></article>
                    })}
                  </div>
                </section>
                <section className="erp-form-section erp-fees-span-2">
                  <h2 className="erp-form-title">Fee Component Distribution</h2>
                  <div className="erp-fees-pie-layout">
                    <div className="erp-fees-pie" style={{ background: pieBg }} />
                    <div className="erp-fees-pie-legend">
                      {componentPie.map((s) => <p key={s.label}><span style={{ background: s.color }} />{s.label}: {rs(s.value)}</p>)}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {view === 'structure' && (
              <section className="erp-form-section">
                <h2 className="erp-form-title">Fee Structure Management</h2>
                <div className="erp-form-grid">
                  <label className="erp-form-field"><span>Class-wise Configuration</span><CustomSelect options={classOptions.filter((o) => o.value !== 'All Classes')} value={cfg.className} onChange={(v) => setCfg((p) => ({ ...p, className: v }))} /></label>
                  <label className="erp-form-field"><span>Installment Setup</span><input type="number" min="1" max="12" value={cfg.installments} onChange={(e) => setCfg((p) => ({ ...p, installments: e.target.value }))} /></label>
                  <label className="erp-form-field"><span>Late Fine Type</span><CustomSelect options={[{ value: 'fixed', label: 'Fixed' }, { value: 'percentage', label: 'Percentage' }]} value={cfg.fineType} onChange={(value) => setCfg((p) => ({ ...p, fineType: value }))} /></label>
                  <label className="erp-form-field"><span>Late Fine Value</span><input type="number" min="0" value={cfg.fineValue} onChange={(e) => setCfg((p) => ({ ...p, fineValue: e.target.value }))} /></label>
                  <label className="erp-form-field"><span>Transport Fee</span><input type="number" min="0" value={cfg.transport} onChange={(e) => setCfg((p) => ({ ...p, transport: e.target.value }))} /></label>
                  <label className="erp-form-field"><span>Hostel Fee</span><input type="number" min="0" value={cfg.hostel} onChange={(e) => setCfg((p) => ({ ...p, hostel: e.target.value }))} /></label>
                  <label className="erp-form-field"><span>Scholarship/Concession Cap %</span><input type="number" min="0" max="100" value={cfg.concessionCap} onChange={(e) => setCfg((p) => ({ ...p, concessionCap: e.target.value }))} /></label>
                  <label className="erp-form-field"><span>Session-wise Clone From</span><input type="text" value={cfg.clone} onChange={(e) => setCfg((p) => ({ ...p, clone: e.target.value }))} /></label>
                </div>
                <div className="erp-fees-action-row">
                  <button type="button" className="erp-form-primary-button" disabled={!isHead} onClick={() => setStatus(`Fee structure saved for ${cfg.className}.`)}>Save Structure</button>
                  <button type="button" className="erp-nav-button" disabled={!isHead} onClick={() => setStatus(`Session structure cloned from ${cfg.clone}.`)}>Clone Session</button>
                </div>
                {status ? <p className="erp-notice-status">{status}</p> : null}
              </section>
            )}

            {view === 'ledger' && active && (
              <div className="erp-fees-ledger-layout">
                <section className="erp-form-section">
                  <h2 className="erp-form-title">Student Financial Ledger</h2>
                  <div className="erp-fees-ledger-list">
                    {rows.map((r) => <button key={r.id} type="button" className={`erp-fees-ledger-item ${active.id === r.id ? 'erp-fees-ledger-item-active' : ''}`} onClick={() => setSelectedId(r.id)}><strong>{r.name}</strong><small>{r.id} | {r.className}-{r.section} | Pending {rs(r.pending)}</small></button>)}
                  </div>
                </section>
                <section className="erp-form-section">
                  <h2 className="erp-form-title">Ledger: {active.name}</h2>
                  <div className="erp-fees-kpi-grid erp-fees-kpi-grid-tight">
                    <article className="erp-fees-kpi-card"><p>Expected</p><strong>{rs(active.expected)}</strong></article>
                    <article className="erp-fees-kpi-card"><p>Collected</p><strong>{rs(active.collected)}</strong></article>
                    <article className="erp-fees-kpi-card"><p>Pending</p><strong>{rs(active.pending)}</strong></article>
                    <article className="erp-fees-kpi-card"><p>Carry Forward</p><strong>{rs(active.pending * 0.2)}</strong></article>
                  </div>
                  <div className="erp-form-grid mt-4">
                    <label className="erp-form-field"><span>Payment Amount</span><input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                    <label className="erp-form-field"><span>Payment Mode</span><CustomSelect options={paymentModes} value={mode} onChange={setMode} /></label>
                    <label className="erp-form-field erp-form-field-full"><span>Remark</span><input type="text" value={note} onChange={(e) => setNote(e.target.value)} /></label>
                  </div>
                  <div className="erp-fees-action-row">
                    <button type="button" className="erp-form-primary-button" onClick={pay} disabled={!isHead}>Record Payment</button>
                    <button type="button" className="erp-nav-button" disabled={!isHead}>Waive Fine</button>
                    <button type="button" className="erp-nav-button" disabled={!isHead}>Approve Concession</button>
                    <button type="button" className="erp-nav-button" disabled={!isHead}>Process Refund</button>
                  </div>
                  <div className="erp-fees-structure-table-wrap">
                    <table className="erp-fees-table">
                      <thead><tr><th>Txn ID</th><th>Date</th><th>Type</th><th>Amount</th><th>Mode</th><th>Note</th></tr></thead>
                      <tbody>{active.ledger.map((e) => <tr key={e.id}><td>{e.id}</td><td>{e.date}</td><td>{e.type}</td><td>{rs(e.amount)}</td><td>{e.mode}</td><td>{e.note}</td></tr>)}</tbody>
                    </table>
                  </div>
                  {status ? <p className="erp-notice-status">{status}</p> : null}
                </section>
              </div>
            )}

            {view === 'defaulters' && (
              <section className="erp-form-section">
                <h2 className="erp-form-title">Defaulters Management</h2>
                <div className="erp-form-grid">
                  <label className="erp-form-field"><span>Class</span><CustomSelect options={classOptions} value={cls} onChange={setCls} /></label>
                  <label className="erp-form-field"><span>Section</span><CustomSelect options={sectionOptions} value={sec} onChange={setSec} /></label>
                  <label className="erp-form-field"><span>Overdue Days (min)</span><input type="number" min="0" value={minOver} onChange={(e) => setMinOver(e.target.value)} /></label>
                  <label className="erp-form-field"><span>Amount Range (min)</span><input type="number" min="0" value={minDue} onChange={(e) => setMinDue(e.target.value)} /></label>
                  <label className="erp-form-field"><span>Amount Range (max)</span><input type="number" min="0" value={maxDue} onChange={(e) => setMaxDue(e.target.value)} /></label>
                </div>
                <div className="erp-fees-action-row">
                  <button type="button" className="erp-form-primary-button" onClick={() => setStatus(`Bulk notice generated for ${defaulters.length} defaulters.`)}>Generate Bulk Notice</button>
                  <button type="button" className="erp-nav-button" onClick={() => exportDefaulters('pdf')}>Export PDF</button>
                  <button type="button" className="erp-nav-button" onClick={() => exportDefaulters('excel')}>Export Excel</button>
                  <button type="button" className="erp-nav-button" onClick={() => exportDefaulters('csv')}>Export CSV</button>
                </div>
                <div className="erp-fees-structure-table-wrap">
                  <table className="erp-fees-table">
                    <thead><tr><th>Student</th><th>Class</th><th>Overdue Days</th><th>Pending</th><th>Fine</th><th>Action</th></tr></thead>
                    <tbody>{defaulters.map((d) => <tr key={d.id}><td>{d.name} ({d.id})</td><td>{d.className}-{d.section}</td><td>{d.overdueDays}</td><td>{rs(d.pending)}</td><td>{rs(d.fine)}</td><td><button type="button" className="erp-nav-button">Send Notice</button></td></tr>)}</tbody>
                  </table>
                </div>
                {status ? <p className="erp-notice-status">{status}</p> : null}
              </section>
            )}

            {view === 'reports' && (
              <section className="erp-form-section">
                <h2 className="erp-form-title">Financial Reports & Audit Logs</h2>
                <div className="erp-fees-structure-table-wrap">
                  <table className="erp-fees-table">
                    <thead><tr><th>Report</th><th>Metric</th><th>Export</th></tr></thead>
                    <tbody>
                      <tr><td>Daily Collection</td><td>{rs(kpi.today)}</td><td><button type="button" className="erp-nav-button" onClick={() => exportReport('Daily Collection', 'pdf')}>PDF</button></td></tr>
                      <tr><td>Monthly Collection</td><td>{kpi.monthPct.toFixed(1)}%</td><td><button type="button" className="erp-nav-button" onClick={() => exportReport('Monthly Collection', 'excel')}>Excel</button></td></tr>
                      <tr><td>Class-wise Summary</td><td>{classBar.length} classes</td><td><button type="button" className="erp-nav-button" onClick={() => exportReport('Class-wise Summary', 'csv')}>CSV</button></td></tr>
                      <tr><td>Concession Report</td><td>{rs(rows.reduce((a, b) => a + n(b.concession), 0))}</td><td><button type="button" className="erp-nav-button" onClick={() => exportReport('Concession Report', 'pdf')}>PDF</button></td></tr>
                      <tr><td>Refund Report</td><td>{rs(rows.reduce((a, b) => a + n(b.refund), 0))}</td><td><button type="button" className="erp-nav-button" onClick={() => exportReport('Refund Report', 'excel')}>Excel</button></td></tr>
                    </tbody>
                  </table>
                </div>
                <h3 className="erp-modal-card-title mt-4">Audit Trail</h3>
                <div className="erp-fees-structure-table-wrap">
                  <table className="erp-fees-table">
                    <thead><tr><th>ID</th><th>User</th><th>Action</th><th>Time</th></tr></thead>
                    <tbody>
                      <tr><td>AUD-1</td><td>Head/Principal</td><td>Fee structure modified (10th)</td><td>2026-02-18 10:24</td></tr>
                      <tr><td>AUD-2</td><td>Head/Principal</td><td>Concession approved (STD-104)</td><td>2026-02-18 11:10</td></tr>
                      <tr><td>AUD-3</td><td>Head/Principal</td><td>Refund processed (STD-103)</td><td>2026-02-18 12:36</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {view === 'access' && (
              <section className="erp-form-section">
                <h2 className="erp-form-title">Strict Role-Based Access Control</h2>
                <div className="erp-fees-access-grid">
                  <article className="erp-fees-access-card"><h3>Head/Principal</h3><ul><li>Edit payments</li><li>Waive fines</li><li>Approve concessions</li><li>Modify structures</li><li>Process refunds</li></ul></article>
                  <article className="erp-fees-access-card"><h3>Accounts Staff</h3><ul><li>View dashboard</li><li>Generate reports</li><li>No edit rights</li></ul></article>
                  <article className="erp-fees-access-card"><h3>Class Admin</h3><ul><li>View class defaulters</li><li>Draft notices only</li><li>No financial approvals</li></ul></article>
                </div>
                <p className="erp-notice-status">Financial mutation controls are restricted to Head role only.</p>
              </section>
            )}
          </main>
        </div>
      </div>
    </motion.section>
  )
}

export default FeeManagementPage
