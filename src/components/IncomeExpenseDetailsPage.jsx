import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const incomeLedgerSeed = [
  { id: 'INC-001', category: 'Fees', source: 'Monthly tuition collection', amount: 900000, expected: 950000, date: '2026-02-05' },
  { id: 'INC-002', category: 'Uniform Sale', source: 'School uniform counter', amount: 125000, expected: 130000, date: '2026-02-08' },
  { id: 'INC-003', category: 'Book Sale', source: 'Book store', amount: 88000, expected: 90000, date: '2026-02-10' },
  { id: 'INC-004', category: 'Rent', source: 'Auditorium rent', amount: 45000, expected: 50000, date: '2026-02-13' },
  { id: 'INC-005', category: 'Donation', source: 'Alumni donation', amount: 78000, expected: 70000, date: '2026-02-18' },
]

const expenseLedgerSeed = [
  { id: 'EXP-001', category: 'Salaries', purpose: 'Teacher & staff payroll', amount: 572136, expected: 560000, date: '2026-02-07' },
  { id: 'EXP-002', category: 'Electricity', purpose: 'Electricity bill', amount: 74000, expected: 70000, date: '2026-02-09' },
  { id: 'EXP-003', category: 'Transport', purpose: 'Bus fuel and service', amount: 62000, expected: 65000, date: '2026-02-12' },
  { id: 'EXP-004', category: 'Maintenance', purpose: 'Repair work', amount: 43000, expected: 50000, date: '2026-02-14' },
  { id: 'EXP-005', category: 'Stationary', purpose: 'Exam/admin materials', amount: 24000, expected: 28000, date: '2026-02-17' },
]

const rs = (value) => `Rs ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.max(Number(value) || 0, 0))}`
const toPositiveNumber = (value) => Math.max(Number(value) || 0, 0)
const makeNextId = (prefix, rows) => {
  const max = rows.reduce((largest, row) => {
    const part = Number.parseInt(String(row.id || '').replace(`${prefix}-`, ''), 10)
    if (Number.isNaN(part)) return largest
    return Math.max(largest, part)
  }, 0)
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
const emptyIncomeForm = { category: '', source: '', date: '', amount: '', expected: '' }
const emptyExpenseForm = { category: '', purpose: '', date: '', amount: '', expected: '' }

function IncomeExpenseDetailsPage({
  onBack,
  incomeRows = null,
  expenseRows = null,
  onUpdateIncomeRows = null,
  onUpdateExpenseRows = null,
}) {
  const [localIncomeLedger, setLocalIncomeLedger] = useState(incomeLedgerSeed)
  const [localExpenseLedger, setLocalExpenseLedger] = useState(expenseLedgerSeed)
  const incomeLedger = incomeRows ?? localIncomeLedger
  const expenseLedger = expenseRows ?? localExpenseLedger
  const setIncomeLedger = onUpdateIncomeRows ?? setLocalIncomeLedger
  const setExpenseLedger = onUpdateExpenseRows ?? setLocalExpenseLedger
  const [incomeForm, setIncomeForm] = useState(emptyIncomeForm)
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [editingIncomeId, setEditingIncomeId] = useState('')
  const [editingExpenseId, setEditingExpenseId] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const incomeActual = useMemo(() => incomeLedger.reduce((sum, row) => sum + row.amount, 0), [incomeLedger])
  const incomeExpected = useMemo(() => incomeLedger.reduce((sum, row) => sum + row.expected, 0), [incomeLedger])
  const expenseActual = useMemo(() => expenseLedger.reduce((sum, row) => sum + row.amount, 0), [expenseLedger])
  const expenseExpected = useMemo(() => expenseLedger.reduce((sum, row) => sum + row.expected, 0), [expenseLedger])
  const netActual = useMemo(() => incomeActual - expenseActual, [incomeActual, expenseActual])
  const netExpected = useMemo(() => incomeExpected - expenseExpected, [incomeExpected, expenseExpected])
  const submitIncome = () => {
    if (!incomeForm.category.trim() || !incomeForm.source.trim() || !incomeForm.date) {
      setFormMessage('Income: category, source and date are required.')
      return
    }
    const normalized = {
      id: editingIncomeId || makeNextId('INC', incomeLedger),
      category: incomeForm.category.trim(),
      source: incomeForm.source.trim(),
      date: incomeForm.date,
      amount: toPositiveNumber(incomeForm.amount),
      expected: toPositiveNumber(incomeForm.expected),
    }
    if (editingIncomeId) {
      setIncomeLedger((previous) => previous.map((item) => (item.id === editingIncomeId ? normalized : item)))
      setFormMessage(`Income updated: ${normalized.id}`)
    } else {
      setIncomeLedger((previous) => [normalized, ...previous])
      setFormMessage(`Income added: ${normalized.id}`)
    }
    setIncomeForm(emptyIncomeForm)
    setEditingIncomeId('')
  }
  const submitExpense = () => {
    if (!expenseForm.category.trim() || !expenseForm.purpose.trim() || !expenseForm.date) {
      setFormMessage('Expense: category, purpose and date are required.')
      return
    }
    const normalized = {
      id: editingExpenseId || makeNextId('EXP', expenseLedger),
      category: expenseForm.category.trim(),
      purpose: expenseForm.purpose.trim(),
      date: expenseForm.date,
      amount: toPositiveNumber(expenseForm.amount),
      expected: toPositiveNumber(expenseForm.expected),
    }
    if (editingExpenseId) {
      setExpenseLedger((previous) => previous.map((item) => (item.id === editingExpenseId ? normalized : item)))
      setFormMessage(`Expense updated: ${normalized.id}`)
    } else {
      setExpenseLedger((previous) => [normalized, ...previous])
      setFormMessage(`Expense added: ${normalized.id}`)
    }
    setExpenseForm(emptyExpenseForm)
    setEditingExpenseId('')
  }

  return (
    <motion.section
      key="income-expense-details"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-slate-100 text-slate-900"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">School ERP</p>
              <h1 className="text-2xl font-semibold text-slate-900">Income and Expenses Full Details</h1>
            </div>
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onBack}>
              Back to Dashboard
            </button>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Income (Actual)</p><p className="mt-1 text-2xl font-semibold">{rs(incomeActual)}</p></article>
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Income (Expected)</p><p className="mt-1 text-2xl font-semibold">{rs(incomeExpected)}</p></article>
          <article className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-rose-800">Expense (Actual)</p><p className="mt-1 text-2xl font-semibold">{rs(expenseActual)}</p></article>
          <article className="rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-rose-800">Expense (Expected)</p><p className="mt-1 text-2xl font-semibold">{rs(expenseExpected)}</p></article>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className={`rounded-xl border p-4 shadow-sm ${netActual >= 0 ? 'border-cyan-200 bg-cyan-50' : 'border-amber-200 bg-amber-50'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">Net (Actual)</p>
            <p className="mt-1 text-2xl font-semibold">{rs(Math.abs(netActual))} {netActual >= 0 ? 'Surplus' : 'Deficit'}</p>
          </article>
          <article className={`rounded-xl border p-4 shadow-sm ${netExpected >= 0 ? 'border-cyan-200 bg-cyan-50' : 'border-amber-200 bg-amber-50'}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">Net (Expected)</p>
            <p className="mt-1 text-2xl font-semibold">{rs(Math.abs(netExpected))} {netExpected >= 0 ? 'Surplus' : 'Deficit'}</p>
          </article>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-emerald-900">Income Ledger</h2>
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditingIncomeId('')
                  setIncomeForm(emptyIncomeForm)
                }}
              >
                Reset
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Category" value={incomeForm.category} onChange={(event) => setIncomeForm((prev) => ({ ...prev, category: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Source" value={incomeForm.source} onChange={(event) => setIncomeForm((prev) => ({ ...prev, source: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="date" value={incomeForm.date} onChange={(event) => setIncomeForm((prev) => ({ ...prev, date: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="number" placeholder="Actual Amount" value={incomeForm.amount} onChange={(event) => setIncomeForm((prev) => ({ ...prev, amount: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" type="number" placeholder="Expected Amount" value={incomeForm.expected} onChange={(event) => setIncomeForm((prev) => ({ ...prev, expected: event.target.value }))} />
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700" onClick={submitIncome}>
                {editingIncomeId ? 'Update Income' : 'Add Income'}
              </button>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg border border-emerald-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-emerald-50 text-emerald-800">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Actual</th>
                    <th className="px-3 py-2">Expected</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeLedger.map((item) => (
                    <tr key={item.id} className="border-t border-emerald-100">
                      <td className="px-3 py-2">{item.id}</td>
                      <td className="px-3 py-2">{item.category}</td>
                      <td className="px-3 py-2">{item.source}</td>
                      <td className="px-3 py-2">{item.date}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-800">{rs(item.amount)}</td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{rs(item.expected)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setEditingIncomeId(item.id)
                              setIncomeForm({
                                category: item.category,
                                source: item.source,
                                date: item.date,
                                amount: String(item.amount),
                                expected: String(item.expected),
                              })
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                            onClick={() => {
                              setIncomeLedger((previous) => previous.filter((row) => row.id !== item.id))
                              if (editingIncomeId === item.id) {
                                setEditingIncomeId('')
                                setIncomeForm(emptyIncomeForm)
                              }
                              setFormMessage(`Income removed: ${item.id}`)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-rose-900">Expense Ledger</h2>
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditingExpenseId('')
                  setExpenseForm(emptyExpenseForm)
                }}
              >
                Reset
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Category" value={expenseForm.category} onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Purpose" value={expenseForm.purpose} onChange={(event) => setExpenseForm((prev) => ({ ...prev, purpose: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="date" value={expenseForm.date} onChange={(event) => setExpenseForm((prev) => ({ ...prev, date: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="number" placeholder="Actual Amount" value={expenseForm.amount} onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" type="number" placeholder="Expected Amount" value={expenseForm.expected} onChange={(event) => setExpenseForm((prev) => ({ ...prev, expected: event.target.value }))} />
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700" onClick={submitExpense}>
                {editingExpenseId ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg border border-rose-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-rose-50 text-rose-800">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Purpose</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Actual</th>
                    <th className="px-3 py-2">Expected</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseLedger.map((item) => (
                    <tr key={item.id} className="border-t border-rose-100">
                      <td className="px-3 py-2">{item.id}</td>
                      <td className="px-3 py-2">{item.category}</td>
                      <td className="px-3 py-2">{item.purpose}</td>
                      <td className="px-3 py-2">{item.date}</td>
                      <td className="px-3 py-2 font-semibold text-rose-800">{rs(item.amount)}</td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{rs(item.expected)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setEditingExpenseId(item.id)
                              setExpenseForm({
                                category: item.category,
                                purpose: item.purpose,
                                date: item.date,
                                amount: String(item.amount),
                                expected: String(item.expected),
                              })
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                            onClick={() => {
                              setExpenseLedger((previous) => previous.filter((row) => row.id !== item.id))
                              if (editingExpenseId === item.id) {
                                setEditingExpenseId('')
                                setExpenseForm(emptyExpenseForm)
                              }
                              setFormMessage(`Expense removed: ${item.id}`)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
        {formMessage ? <p className="mt-3 text-sm font-medium text-slate-700">{formMessage}</p> : null}
      </div>
    </motion.section>
  )
}

export default IncomeExpenseDetailsPage
