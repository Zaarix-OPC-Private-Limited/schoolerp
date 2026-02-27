import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const normalizeOption = (option) => {
  if (typeof option === 'string') {
    return { value: option, label: option }
  }
  return option
}

function CustomSelect({ options, placeholder = 'Select', value, onChange, required = false, name, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(value ?? '')
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  useEffect(() => {
    const onOutsideClick = (event) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target)) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options])
  const selectedValue = value !== undefined ? value : internalValue
  const selectedOption = normalizedOptions.find((option) => option.value === selectedValue)

  const selectOption = (nextValue) => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
    setOpen(false)
  }

  return (
    <div className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className={`flex w-full items-center justify-between rounded-xl border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10 ${open ? 'border-cyan-500 bg-white ring-4 ring-cyan-500/10' : 'border-slate-300'}`}
        onClick={() => {
          if (!disabled) {
            setOpen((previous) => !previous)
          }
        }}
        aria-expanded={open}
      >
        <span className={`block truncate ${selectedOption ? '' : 'text-slate-400'}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <svg viewBox="0 0 20 20" fill="none" className={`ml-2 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <input type="hidden" name={name} value={selectedValue || ''} required={required} />

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
          >
            {normalizedOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`relative flex w-full cursor-pointer select-none items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-slate-100 ${option.value === selectedValue ? 'bg-cyan-50 text-cyan-700 font-semibold' : 'text-slate-700'}`}
                onClick={() => selectOption(option.value)}
              >
                {option.icon ? <span className="flex h-5 w-5 items-center justify-center">{option.icon}</span> : null}
                <span className="block truncate">{option.label}</span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default CustomSelect
