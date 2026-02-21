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
    <div className={`erp-custom-select-wrap ${disabled ? 'erp-custom-select-disabled' : ''}`} ref={wrapperRef}>
      <button
        type="button"
        className={`erp-custom-select-trigger ${open ? 'erp-custom-select-open' : ''}`}
        onClick={() => {
          if (!disabled) {
            setOpen((previous) => !previous)
          }
        }}
        aria-expanded={open}
      >
        <span className={`erp-custom-select-value ${selectedOption ? '' : 'erp-custom-select-placeholder'}`}>
          {selectedOption?.label ?? placeholder}
        </span>
        <svg viewBox="0 0 20 20" fill="none" className={`erp-custom-select-chevron ${open ? 'erp-custom-select-chevron-open' : ''}`} aria-hidden="true">
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
            className="erp-custom-select-menu"
          >
            {normalizedOptions.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`erp-custom-select-item ${option.value === selectedValue ? 'erp-custom-select-item-active' : ''}`}
                onClick={() => selectOption(option.value)}
              >
                {option.icon ? <span className="erp-custom-select-item-icon">{option.icon}</span> : null}
                <span>{option.label}</span>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default CustomSelect
