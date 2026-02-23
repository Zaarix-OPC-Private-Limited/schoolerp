import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CustomSelect from '../components/CustomSelect'
import { useAppContext } from '../context/AppContext'

const classLabelMap = {
  '1st': 'First', '2nd': 'Second', '3rd': 'Third', '4th': 'Fourth',
  '5th': 'Fifth', '6th': 'Sixth', '7th': 'Seventh', '8th': 'Eighth',
  '9th': 'Ninth', '10th': 'Tenth', '11th': 'Eleventh', '12th': 'Twelfth',
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
const escHtml = (v) => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
const toCsv = (headers, rows) => {
  const head = headers.map((h) => `"${esc(h)}"`).join(',')
  const body = rows.map((row) => row.map((cell) => `"${esc(cell)}"`).join(',')).join('\n')
  return `${head}\n${body}`
}
const toExcelTable = (title, headers, rows) => {
  const th = headers.map((h) => `<th>${escHtml(h)}</th>`).join('')
  const tr = rows.map((row) => `<tr>${row.map((cell) => `<td>${escHtml(cell)}</td>`).join('')}</tr>`).join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title></head><body><h3>${escHtml(title)}</h3><table border="1"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></body></html>`
}
const printPdfTable = (title, headers, rows) => {
  const th = headers.map((h) => `<th>${escHtml(h)}</th>`).join('')
  const tr = rows.map((row) => `<tr>${row.map((cell) => `<td>${escHtml(cell)}</td>`).join('')}</tr>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px}h2{margin:0 0 12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d1d5db;padding:8px;text-align:left;font-size:12px}th{background:#f8fafc}</style></head><body><h2>${escHtml(title)}</h2><table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>`
  const w = window.open('', '_blank', 'noopener,noreferrer,width=1000,height=720')
  if (!w) return false
  w.document.open(); w.document.write(html); w.document.close()
  return true
}
const normalize = (s) => {
  const expected = n(s.expected || s.totalFee || 55000)
  const collected = Math.min(n(s.collected || s.paidAmount || 0), expected)
  const pending = Math.max(expected - collected, 0)
  return {
    ...s, expected, collected, pending,
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

// Reusable Tailwind primitives
const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
)
const SectionTitle = ({ children }) => <h2 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">{children}</h2>
const KpiCard = ({ label, value }) => (
  <div className="rounded-xl border border-l-4 border-blue-500 bg-white p-3 shadow-sm">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <strong className="mt-1 block text-lg font-bold text-slate-900">{value}</strong>
  </div>
)
const PrimaryBtn = ({ children, onClick, disabled }) => (
  <button type="button" disabled={disabled} onClick={onClick}
    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition">
    {children}
  </button>
)
const SecBtn = ({ children, onClick, disabled }) => (
  <button type="button" disabled={disabled} onClick={onClick}
    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
    {children}
  </button>
)
const TH = ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-600">{children}</th>
const TD = ({ children }) => <td className="border border-slate-200 px-3 py-2 text-xs text-slate-800">{children}</td>
const FormField = ({ label, children, full }) => (
  <label className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
    <span className="text-xs font-semibold text-slate-600">{label}</span>
    {children}
  </label>
)
const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

function FeeManagementPage() {
  const navigate = useNavigate()
  const { studentRecords: contextStudents } = useAppContext()
  const [view, setView] = useState('overview')
  const [rows, setRows] = useState(((contextStudents && contextStudents.length) ? contextStudents : seed).map(normalize))
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
    const g = rows.reduce((a, r) => { a[r.className] = (a[r.className] || 0) + r.collected; return a }, {})
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
    return `conic-gradient(${componentPie.map((s) => { const start = (cur / total) * 100; cur += s.value; return `${s.color} ${start}% ${(cur / total) * 100}%` }).join(',')})`
  }, [componentPie])

  const defaulters = useMemo(
    () => rows.filter((r) => r.pending > 0)
      .filter((r) => cls === 'All Classes' ? true : r.className === cls)
      .filter((r) => sec === 'All Sections' ? true : r.section === sec)
      .filter((r) => r.overdueDays >= n(minOver))
      .filter((r) => r.pending >= n(minDue) && r.pending <= n(maxDue || 999999))
      .sort((a, b) => b.pending - a.pending),
    [rows, cls, sec, minOver, minDue, maxDue],
  )

  const active = rows.find((r) => r.id === selectedId) || rows[0] || null

  const exportDefaulters = (format) => {
    if (!defaulters.length) { setStatus('No defaulters found for selected filters.'); return }
    const headers = ['Student ID', 'Student', 'Class', 'Section', 'Overdue Days', 'Pending Amount', 'Fine']
    const data = defaulters.map((d) => [d.id, d.name, d.className, d.section, d.overdueDays, d.pending, d.fine])
    const dateTag = new Date().toISOString().slice(0, 10)
    if (format === 'csv') { downloadFile(`defaulters-${dateTag}.csv`, toCsv(headers, data), 'text/csv;charset=utf-8'); setStatus(`CSV downloaded: ${defaulters.length} rows.`); return }
    if (format === 'excel') { downloadFile(`defaulters-${dateTag}.xls`, toExcelTable('Defaulters Report', headers, data), 'application/vnd.ms-excel;charset=utf-8'); setStatus(`Excel downloaded: ${defaulters.length} rows.`); return }
    const ok = printPdfTable('Defaulters Report', headers, data)
    setStatus(ok ? 'PDF print window opened.' : 'Please allow popups to export PDF.')
  }

  const pay = () => {
    if (!isHead) return setStatus('Only Head/Principal can edit payments.')
    const a = n(amount)
    if (!active || a <= 0 || a > active.pending) return setStatus('Enter valid amount within pending value.')
    const tx = `TX-${Date.now().toString().slice(-6)}`
    const dt = new Date().toISOString().slice(0, 10)
    setRows((prev) => prev.map((r) => r.id === active.id
      ? { ...r, collected: r.collected + a, pending: Math.max(r.expected - (r.collected + a), 0), ledger: [{ id: tx, date: dt, type: 'payment', amount: a, mode: paymentModes.find((m) => m.value === mode)?.label || 'UPI', note: note || 'Fee payment' }, ...r.ledger] }
      : r))
    setAmount(''); setNote(''); setStatus(`Payment saved with receipt ${tx}.`)
  }

  const linePoints = useMemo(() => {
    const max = Math.max(...trend.map((x) => x.v), 1)
    return trend.map((p, i) => `${20 + i * 40},${160 - Math.round((p.v / max) * 130)}`).join(' ')
  }, [trend])

  return (
    <motion.section key="fees" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">School ERP</p>
            <h1 className="text-xl font-bold text-slate-900">Fees Module (Head Control)</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">Role: {role}</span>
            <SecBtn onClick={() => navigate(-1)}>← Back</SecBtn>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <div className="flex gap-5">
          {/* Sidebar nav */}
          <aside className="w-[200px] shrink-0">
            <div className="sticky top-24 rounded-xl border border-slate-200 bg-white p-2 shadow-sm flex flex-col gap-1">
              {views.map(([id, label]) => (
                <button key={id} type="button"
                  className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold transition ${view === id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => setView(id)}>
                  {label}
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1 flex flex-col gap-4">
            {/* KPI row — always visible */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <KpiCard label="Total Expected" value={rs(kpi.expected)} />
              <KpiCard label="Total Collected" value={rs(kpi.collected)} />
              <KpiCard label="Pending" value={rs(kpi.pending)} />
              <KpiCard label="Overdue" value={rs(kpi.overdue)} />
              <KpiCard label="Today's Collection" value={rs(kpi.today)} />
              <KpiCard label="Monthly %" value={`${kpi.monthPct.toFixed(1)}%`} />
            </div>

            {/* ── Overview ── */}
            {view === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <SectionTitle>Monthly Collection Trend</SectionTitle>
                  <svg className="w-full h-[180px]" viewBox="0 0 500 180">
                    <path d="M20 160 L480 160" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M20 10 L20 160" stroke="#cbd5e1" strokeWidth="1.5" />
                    <polyline points={linePoints} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Card>
                <Card>
                  <SectionTitle>Class-wise Fee Collection</SectionTitle>
                  <div className="flex items-flex-end gap-2" style={{ minHeight: 180, alignItems: 'flex-end' }}>
                    {classBar.map((x) => {
                      const mx = Math.max(...classBar.map((c) => c.v), 1)
                      return (
                        <div key={x.k} className="flex-1 text-center">
                          <div className="mx-auto h-[160px] w-full rounded-lg border border-blue-100 bg-blue-50 p-0.5 flex items-end">
                            <div className="w-full rounded bg-gradient-to-t from-blue-700 to-blue-400 transition-all" style={{ height: `${Math.round((x.v / mx) * 100)}%` }} />
                          </div>
                          <p className="mt-1 text-[10px] font-bold text-slate-600">{x.k}</p>
                        </div>
                      )
                    })}
                  </div>
                </Card>
                <Card className="col-span-2">
                  <SectionTitle>Fee Component Distribution</SectionTitle>
                  <div className="grid grid-cols-[220px_1fr] items-center gap-4">
                    <div className="h-[180px] w-[180px] rounded-full border-8 border-white shadow-lg" style={{ background: pieBg }} />
                    <div className="space-y-2">
                      {componentPie.map((s) => (
                        <p key={s.label} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <span className="inline-block h-3 w-3 rounded-full" style={{ background: s.color }} />
                          {s.label}: {rs(s.value)}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* ── Fee Structure ── */}
            {view === 'structure' && (
              <Card>
                <SectionTitle>Fee Structure Management</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Class-wise Configuration"><CustomSelect options={classOptions.filter((o) => o.value !== 'All Classes')} value={cfg.className} onChange={(v) => setCfg((p) => ({ ...p, className: v }))} /></FormField>
                  <FormField label="Installment Setup"><input className={inputCls} type="number" min="1" max="12" value={cfg.installments} onChange={(e) => setCfg((p) => ({ ...p, installments: e.target.value }))} /></FormField>
                  <FormField label="Late Fine Type"><CustomSelect options={[{ value: 'fixed', label: 'Fixed' }, { value: 'percentage', label: 'Percentage' }]} value={cfg.fineType} onChange={(value) => setCfg((p) => ({ ...p, fineType: value }))} /></FormField>
                  <FormField label="Late Fine Value"><input className={inputCls} type="number" min="0" value={cfg.fineValue} onChange={(e) => setCfg((p) => ({ ...p, fineValue: e.target.value }))} /></FormField>
                  <FormField label="Transport Fee"><input className={inputCls} type="number" min="0" value={cfg.transport} onChange={(e) => setCfg((p) => ({ ...p, transport: e.target.value }))} /></FormField>
                  <FormField label="Hostel Fee"><input className={inputCls} type="number" min="0" value={cfg.hostel} onChange={(e) => setCfg((p) => ({ ...p, hostel: e.target.value }))} /></FormField>
                  <FormField label="Scholarship/Concession Cap %"><input className={inputCls} type="number" min="0" max="100" value={cfg.concessionCap} onChange={(e) => setCfg((p) => ({ ...p, concessionCap: e.target.value }))} /></FormField>
                  <FormField label="Session-wise Clone From"><input className={inputCls} type="text" value={cfg.clone} onChange={(e) => setCfg((p) => ({ ...p, clone: e.target.value }))} /></FormField>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PrimaryBtn disabled={!isHead} onClick={() => setStatus(`Fee structure saved for ${cfg.className}.`)}>Save Structure</PrimaryBtn>
                  <SecBtn disabled={!isHead} onClick={() => setStatus(`Session structure cloned from ${cfg.clone}.`)}>Clone Session</SecBtn>
                </div>
                {status && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{status}</p>}
              </Card>
            )}

            {/* ── Ledger ── */}
            {view === 'ledger' && active && (
              <div className="grid grid-cols-[320px_1fr] gap-4">
                <Card>
                  <SectionTitle>Student Financial Ledger</SectionTitle>
                  <div className="flex flex-col gap-1.5">
                    {rows.map((r) => (
                      <button key={r.id} type="button"
                        className={`w-full text-left rounded-xl border p-2.5 transition ${active.id === r.id ? 'border-transparent bg-blue-600 text-white' : 'border-blue-100 bg-blue-50 text-slate-800 hover:bg-blue-100'}`}
                        onClick={() => setSelectedId(r.id)}>
                        <strong className="block text-sm">{r.name}</strong>
                        <small className={`text-[11px] ${active.id === r.id ? 'text-blue-100' : 'text-slate-500'}`}>{r.id} | {r.className}-{r.section} | Pending {rs(r.pending)}</small>
                      </button>
                    ))}
                  </div>
                </Card>
                <Card>
                  <SectionTitle>Ledger: {active.name}</SectionTitle>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <KpiCard label="Expected" value={rs(active.expected)} />
                    <KpiCard label="Collected" value={rs(active.collected)} />
                    <KpiCard label="Pending" value={rs(active.pending)} />
                    <KpiCard label="Carry Forward" value={rs(active.pending * 0.2)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Payment Amount"><input className={inputCls} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></FormField>
                    <FormField label="Payment Mode"><CustomSelect options={paymentModes} value={mode} onChange={setMode} /></FormField>
                    <FormField label="Remark" full><input className={inputCls} type="text" value={note} onChange={(e) => setNote(e.target.value)} /></FormField>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <PrimaryBtn onClick={pay} disabled={!isHead}>Record Payment</PrimaryBtn>
                    <SecBtn disabled={!isHead}>Waive Fine</SecBtn>
                    <SecBtn disabled={!isHead}>Approve Concession</SecBtn>
                    <SecBtn disabled={!isHead}>Process Refund</SecBtn>
                  </div>
                  <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
                    <table className="w-full border-collapse text-xs">
                      <thead><tr><TH>Txn ID</TH><TH>Date</TH><TH>Type</TH><TH>Amount</TH><TH>Mode</TH><TH>Note</TH></tr></thead>
                      <tbody>{active.ledger.map((e) => <tr key={e.id}><TD>{e.id}</TD><TD>{e.date}</TD><TD>{e.type}</TD><TD>{rs(e.amount)}</TD><TD>{e.mode}</TD><TD>{e.note}</TD></tr>)}</tbody>
                    </table>
                  </div>
                  {status && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{status}</p>}
                </Card>
              </div>
            )}

            {/* ── Defaulters ── */}
            {view === 'defaulters' && (
              <Card>
                <SectionTitle>Defaulters Management</SectionTitle>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <FormField label="Class"><CustomSelect options={classOptions} value={cls} onChange={setCls} /></FormField>
                  <FormField label="Section"><CustomSelect options={sectionOptions} value={sec} onChange={setSec} /></FormField>
                  <FormField label="Overdue Days (min)"><input className={inputCls} type="number" min="0" value={minOver} onChange={(e) => setMinOver(e.target.value)} /></FormField>
                  <FormField label="Amount Range (min)"><input className={inputCls} type="number" min="0" value={minDue} onChange={(e) => setMinDue(e.target.value)} /></FormField>
                  <FormField label="Amount Range (max)"><input className={inputCls} type="number" min="0" value={maxDue} onChange={(e) => setMaxDue(e.target.value)} /></FormField>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <PrimaryBtn onClick={() => setStatus(`Bulk notice generated for ${defaulters.length} defaulters.`)}>Generate Bulk Notice</PrimaryBtn>
                  <SecBtn onClick={() => exportDefaulters('pdf')}>Export PDF</SecBtn>
                  <SecBtn onClick={() => exportDefaulters('excel')}>Export Excel</SecBtn>
                  <SecBtn onClick={() => exportDefaulters('csv')}>Export CSV</SecBtn>
                </div>
                <div className="mt-4 overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead><tr><TH>Student</TH><TH>Class</TH><TH>Overdue Days</TH><TH>Pending</TH><TH>Fine</TH><TH>Action</TH></tr></thead>
                    <tbody>{defaulters.map((d) => <tr key={d.id}><TD>{d.name} ({d.id})</TD><TD>{d.className}-{d.section}</TD><TD>{d.overdueDays}</TD><TD>{rs(d.pending)}</TD><TD>{rs(d.fine)}</TD><TD><SecBtn>Send Notice</SecBtn></TD></tr>)}</tbody>
                  </table>
                </div>
                {status && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{status}</p>}
              </Card>
            )}

            {/* ── Reports ── */}
            {view === 'reports' && (
              <Card>
                <SectionTitle>Financial Reports & Audit Logs</SectionTitle>
                <div className="overflow-auto rounded-lg border border-slate-200 mb-4">
                  <table className="w-full border-collapse">
                    <thead><tr><TH>Report</TH><TH>Metric</TH><TH>Export</TH></tr></thead>
                    <tbody>
                      <tr><TD>Daily Collection</TD><TD>{rs(kpi.today)}</TD><TD><SecBtn onClick={() => { const ok = printPdfTable('Daily Collection', ['Report', 'Metric'], [['Daily Collection', rs(kpi.today)]]); setStatus(ok ? 'PDF opened.' : 'Allow popups.') }}>PDF</SecBtn></TD></tr>
                      <tr><TD>Monthly Collection</TD><TD>{kpi.monthPct.toFixed(1)}%</TD><TD><SecBtn onClick={() => { downloadFile('monthly.xls', toExcelTable('Monthly Collection', ['Report', 'Metric'], [['Monthly Collection', `${kpi.monthPct.toFixed(1)}%`]]), 'application/vnd.ms-excel'); setStatus('Excel downloaded.') }}>Excel</SecBtn></TD></tr>
                      <tr><TD>Class-wise Summary</TD><TD>{classBar.length} classes</TD><TD><SecBtn onClick={() => { downloadFile('classwise.csv', toCsv(['Report', 'Metric'], [['Class-wise Summary', `${classBar.length} classes`]]), 'text/csv'); setStatus('CSV downloaded.') }}>CSV</SecBtn></TD></tr>
                      <tr><TD>Concession Report</TD><TD>{rs(rows.reduce((a, b) => a + n(b.concession), 0))}</TD><TD><SecBtn onClick={() => { const ok = printPdfTable('Concession Report', ['Report', 'Metric'], [['Concession', rs(rows.reduce((a, b) => a + n(b.concession), 0))]]); setStatus(ok ? 'PDF opened.' : 'Allow popups.') }}>PDF</SecBtn></TD></tr>
                      <tr><TD>Refund Report</TD><TD>{rs(rows.reduce((a, b) => a + n(b.refund), 0))}</TD><TD><SecBtn onClick={() => { downloadFile('refunds.xls', toExcelTable('Refund Report', ['Report', 'Metric'], [['Refunds', rs(rows.reduce((a, b) => a + n(b.refund), 0))]]), 'application/vnd.ms-excel'); setStatus('Excel downloaded.') }}>Excel</SecBtn></TD></tr>
                    </tbody>
                  </table>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">Audit Trail</h3>
                <div className="overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full border-collapse">
                    <thead><tr><TH>ID</TH><TH>User</TH><TH>Action</TH><TH>Time</TH></tr></thead>
                    <tbody>
                      <tr><TD>AUD-1</TD><TD>Head/Principal</TD><TD>Fee structure modified (10th)</TD><TD>2026-02-18 10:24</TD></tr>
                      <tr><TD>AUD-2</TD><TD>Head/Principal</TD><TD>Concession approved (STD-104)</TD><TD>2026-02-18 11:10</TD></tr>
                      <tr><TD>AUD-3</TD><TD>Head/Principal</TD><TD>Refund processed (STD-103)</TD><TD>2026-02-18 12:36</TD></tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Access ── */}
            {view === 'access' && (
              <Card>
                <SectionTitle>Strict Role-Based Access Control</SectionTitle>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Head/Principal</h3>
                    <ul className="space-y-1 list-disc pl-4 text-xs text-slate-600">
                      <li>Edit payments</li><li>Waive fines</li><li>Approve concessions</li><li>Modify structures</li><li>Process refunds</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Accounts Staff</h3>
                    <ul className="space-y-1 list-disc pl-4 text-xs text-slate-600">
                      <li>View dashboard</li><li>Generate reports</li><li>No edit rights</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Class Admin</h3>
                    <ul className="space-y-1 list-disc pl-4 text-xs text-slate-600">
                      <li>View class defaulters</li><li>Draft notices only</li><li>No financial approvals</li>
                    </ul>
                  </div>
                </div>
                <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">Financial mutation controls are restricted to Head role only.</p>
              </Card>
            )}
          </main>
        </div>
      </div>
    </motion.section>
  )
}

export default FeeManagementPage
