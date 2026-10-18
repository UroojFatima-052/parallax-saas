import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from '../context/ToastContext.js'

const DISMISS_AFTER_MS = 4500

const STYLES = {
  success: { bar: 'bg-teal', icon: 'bg-teal/10 text-teal', symbol: '✓' },
  error: { bar: 'bg-rose', icon: 'bg-rose/10 text-rose-dark', symbol: '!' },
  info: { bar: 'bg-peach', icon: 'bg-peach/40 text-deep', symbol: 'i' },
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (type, message, options = {}) => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-3), { id, type, message, action: options.action }])
      setTimeout(() => dismiss(id), options.duration ?? DISMISS_AFTER_MS)
    },
    [dismiss]
  )

  const toast = useMemo(
    () => ({
      success: (message, options) => show('success', message, options),
      error: (message, options) => show('error', message, { duration: 7000, ...options }),
      info: (message, options) => show('info', message, options),
    }),
    [show]
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((item) => {
          const style = STYLES[item.type]
          return (
            <div
              key={item.id}
              role={item.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm animate-toast-in overflow-hidden rounded-xl border border-line bg-white shadow-lg shadow-teal/10"
            >
              <span className={`w-1 shrink-0 ${style.bar}`} />
              <div className="flex flex-1 items-start gap-3 px-4 py-3">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold ${style.icon}`}
                  aria-hidden="true"
                >
                  {style.symbol}
                </span>
                <p className="flex-1 text-sm text-deep">{item.message}</p>

                {item.action && (
                  <button
                    type="button"
                    onClick={() => {
                      dismiss(item.id)
                      item.action.onClick()
                    }}
                    className="shrink-0 text-sm font-semibold text-teal hover:underline"
                  >
                    {item.action.label}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="shrink-0 text-slate/60 hover:text-deep"
                  aria-label="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider