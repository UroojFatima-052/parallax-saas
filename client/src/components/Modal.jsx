import { useEffect, useRef } from 'react'
import AjrakStrip from './AjrakStrip.jsx'

const SIZES = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-4xl',
}

function Modal({ open, title, size = 'md', bodyClassName = 'p-6 sm:p-8', onClose, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      previouslyFocused?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-deep/50 backdrop-blur-[2px]"
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative flex max-h-[92vh] w-full animate-modal-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl shadow-deep/30 focus:outline-none sm:rounded-3xl ${SIZES[size]}`}
      >
        <header className="flex shrink-0 items-center justify-between bg-teal px-6 py-4">
          <h2 id="modal-title" className="font-display text-xl font-semibold text-paper">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-paper/80 transition hover:bg-paper/10 hover:text-paper"
          >
            ✕
          </button>
        </header>
        <AjrakStrip className="block shrink-0" />

        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  )
}

export default Modal