import { useEffect, useState } from 'react'
import BookingTicket from './BookingTicket.jsx'
import { apiRequest, newIdempotencyKey } from '../api/client.js'
import { useToast } from '../hooks/useToast.js'

function BookingDetails({ bookingId, token, canEdit, canDelete, onEdit, onSaved, onDeleted }) {
  const toast = useToast()
  const [state, setState] = useState({ status: 'loading', booking: null, error: null })
  const [attempt, setAttempt] = useState(0)
  const [askingDelete, setAskingDelete] = useState(false)
  const [busy, setBusy] = useState(false)

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

  function showError(error, retry) {
    const temporary = error.status === 0 || error.status >= 500
    toast.error(error.message, temporary ? { action: { label: 'Try again', onClick: retry } } : undefined)
  }

  async function handleConfirm(idempotencyKey = newIdempotencyKey()) {
    setBusy(true)
    try {
      const data = await apiRequest(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: { status: 'confirmed' },
        token,
        idempotencyKey,
      })
      setState((current) => ({
        ...current,
        booking: { ...data.booking, createdByName: current.booking.createdByName },
      }))
      onSaved(data.booking, 'confirm')
    } catch (error) {
      showError(error, () => handleConfirm(idempotencyKey))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      await apiRequest(`/api/bookings/${bookingId}`, { method: 'DELETE', token })
      onDeleted()
    } catch (error) {
      setBusy(false)
      showError(error, handleDelete)
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="animate-pulse space-y-4" aria-label="Loading booking">
        <div className="h-56 rounded-2xl bg-paper" />
        <div className="h-24 rounded-2xl bg-mist" />
        <div className="h-11 rounded-xl bg-mist" />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-2xl border border-rose/30 bg-rose/5 p-6 text-center">
        <p className="text-sm font-medium text-rose-dark">{state.error.message}</p>
        <button type="button" onClick={retryLoad} className="mt-3 text-sm font-semibold text-teal hover:underline">
          Try again
        </button>
      </div>
    )
  }

  const { booking } = state
  const canConfirm = canEdit && booking.status === 'pending'

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-paper p-4 sm:p-5">
        <BookingTicket booking={booking} />
      </div>

      <div className="space-y-4 rounded-2xl border border-line px-5 py-4">
        <div>
          <p className="text-[10px] font-bold tracking-wide text-slate uppercase">Notes</p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-deep">
            {booking.notes || <span className="text-slate">No notes</span>}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wide text-slate uppercase">Added by</p>
          <p className="mt-1 text-sm text-deep">{booking.createdByName}</p>
        </div>
      </div>

      {askingDelete ? (
        <div className="rounded-2xl border border-rose/30 bg-rose/5 p-4">
          <p className="text-sm font-semibold text-deep">Delete this booking?</p>
          <p className="mt-1 text-sm text-slate">This can't be undone.</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setAskingDelete(false)}
              className="h-11 flex-1 rounded-xl border border-line bg-white text-sm font-semibold text-deep transition hover:bg-mist"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="h-11 flex-1 rounded-xl bg-rose text-sm font-semibold text-white transition hover:bg-rose-dark disabled:opacity-70"
            >
              {busy ? 'Deleting…' : 'Delete booking'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {canConfirm && (
            <button
              type="button"
              onClick={() => handleConfirm()}
              disabled={busy}
              className="h-12 w-full rounded-xl bg-teal text-sm font-bold text-paper transition hover:bg-deep disabled:opacity-70"
            >
              {busy ? 'Confirming…' : 'Confirm booking'}
            </button>
          )}
          <div className="flex gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(booking)}
                className={`h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                  canConfirm
                    ? 'border border-line bg-white text-deep hover:bg-mist'
                    : 'bg-teal text-paper hover:bg-deep'
                }`}
              >
                Edit booking
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setAskingDelete(true)}
                className="h-11 rounded-xl border border-rose/40 bg-white px-5 text-sm font-semibold text-rose-dark transition hover:bg-rose/5"
              >
                Delete
              </button>
            )}
          </div>
          {!canDelete && <p className="pt-1 text-center text-xs text-slate">Only admins can delete bookings.</p>}
        </div>
      )}
    </div>
  )
}

export default BookingDetails