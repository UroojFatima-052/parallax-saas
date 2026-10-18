import { useEffect, useState } from 'react'
import StatusPill from './StatusPill.jsx'
import { apiRequest } from '../api/client.js'
import { useToast } from '../hooks/useToast.js'
import { formatLongDate, formatTime, formatDuration } from '../utils/dates.js'

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm">
      <dt className="text-slate">{label}</dt>
      <dd className="text-deep">{children}</dd>
    </div>
  )
}

function BookingDetails({ bookingId, token, canEdit, canDelete, onEdit, onDeleted }) {
  const toast = useToast()
  const [state, setState] = useState({ status: 'loading', booking: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    apiRequest(`/api/bookings/${bookingId}`, { token })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', booking: data.booking, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'error', booking: null, error })
      })

    return () => {
      cancelled = true
    }
  }, [bookingId, token, attempt])

  function retryLoad() {
    setState({ status: 'loading', booking: null, error: null })
    setAttempt((current) => current + 1)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiRequest(`/api/bookings/${bookingId}`, { method: 'DELETE', token })
      onDeleted()
    } catch (error) {
      setDeleting(false)
      const temporary = error.status === 0 || error.status >= 500
      toast.error(error.message, temporary ? { action: { label: 'Try again', onClick: handleDelete } } : undefined)
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="animate-pulse space-y-4" aria-label="Loading booking">
        <div className="h-6 w-24 rounded-full bg-mist" />
        <div className="h-8 w-3/4 rounded-lg bg-mist" />
        <div className="h-40 rounded-xl bg-mist" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-rose/30 bg-rose/5 p-5 text-center">
        <p className="text-sm font-medium text-rose-dark">{state.error.message}</p>
        <button type="button" onClick={retryLoad} className="mt-3 text-sm font-semibold text-teal hover:underline">
          Try again
        </button>
      </div>
    )
  }

  const { booking } = state
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)

  return (
    <div className="space-y-6">
      <div>
        <StatusPill status={booking.status} />
        <h3 className="mt-3 font-display text-2xl font-semibold leading-snug text-deep">{booking.title}</h3>
      </div>

      <dl className="divide-y divide-line rounded-xl border border-line">
        <Row label="When">
          {formatLongDate(start)}
          <span className="block text-slate">
            {formatTime(start)} to {formatTime(end)} ({formatDuration(start, end)})
          </span>
        </Row>
        <Row label="Customer">
          {booking.customerName}
          {booking.customerEmail && (
            <a href={`mailto:${booking.customerEmail}`} className="block truncate text-teal hover:underline">
              {booking.customerEmail}
            </a>
          )}
        </Row>
        <Row label="Notes">
          {booking.notes ? (
            <span className="whitespace-pre-wrap">{booking.notes}</span>
          ) : (
            <span className="text-slate">No notes</span>
          )}
        </Row>
        <Row label="Created by">{booking.createdByName}</Row>
      </dl>

      {confirming ? (
        <div className="rounded-xl border border-rose/30 bg-rose/5 p-4">
          <p className="text-sm font-semibold text-deep">Delete this booking?</p>
          <p className="mt-1 text-sm text-slate">This can't be undone.</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-10 flex-1 rounded-lg border border-line bg-white text-sm font-semibold text-deep transition hover:bg-mist"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 flex-1 rounded-lg bg-rose text-sm font-semibold text-white transition hover:bg-rose-dark disabled:opacity-70"
            >
              {deleting ? 'Deleting…' : 'Delete booking'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(booking)}
              className="h-11 flex-1 rounded-lg bg-teal text-sm font-semibold text-paper transition hover:bg-deep"
            >
              Edit booking
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="h-11 rounded-lg border border-rose/40 px-5 text-sm font-semibold text-rose-dark transition hover:bg-rose/5"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {!canDelete && <p className="text-xs text-slate">Only admins can delete bookings.</p>}
    </div>
  )
}

export default BookingDetails