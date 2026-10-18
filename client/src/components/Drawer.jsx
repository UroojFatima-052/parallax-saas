import { useEffect } from 'react'

function Drawer({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-deep/40"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative flex h-full w-full max-w-md animate-drawer-in flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b-[3px] border-rose bg-teal px-6 py-4">
          <h2 id="drawer-title" className="font-display text-xl font-semibold text-paper">
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

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </aside>
    </div>
  )
}

export default Drawer