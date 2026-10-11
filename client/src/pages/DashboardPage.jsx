import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client.js'
import { getSession, clearSession } from '../utils/session.js'

const STATUS_STYLES = {
  confirmed: 'bg-teal/10 text-teal',
  pending: 'bg-peach/40 text-deep',
  cancelled: 'bg-line text-slate line-through',
}

const dateFormat = new Intl.DateTimeFormat('en-PK', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

function DashboardPage() {
  const navigate = useNavigate()
  const session = getSession()
  const token = session?.token
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    apiRequest('/api/bookings', { token })
      .then((data) => setBookings(data.bookings))
      .catch((err) => {
        if (err.status === 401) {
          clearSession()
          navigate('/login', { replace: true })
        } else {
          setError(err.message)
        }
      })
  }, [token, navigate])

  if (!session) return <Navigate to="/login" replace />

  const { user } = session

  function signOut() {
    clearSession()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-[3px] border-rose bg-teal">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-display text-xl font-semibold text-paper">Tessera</span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-paper/80 sm:inline">
              {user.name} · <span className="capitalize">{user.role}</span>
            </span>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-paper/30 px-3 py-1.5 text-xs font-semibold text-paper transition hover:bg-paper/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs font-semibold tracking-wide text-rose uppercase">{user.tenant.slug}.tessera.app</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-deep">{user.tenant.name}</h1>
        <p className="mt-1.5 text-sm text-slate">
          Upcoming bookings. Only {user.tenant.name} can see these.
        </p>

        {error && (
          <div role="alert" className="mt-6 rounded-lg border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose-dark">
            {error}
          </div>
        )}

        {!bookings && !error && <p className="mt-8 text-sm text-slate">Loading bookings…</p>}

        {bookings && bookings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <p className="font-display text-lg text-deep">No bookings yet</p>
            <p className="mt-1 text-sm text-slate">Your first booking will show up here.</p>
          </div>
        )}

        {bookings && bookings.length > 0 && (
          <ul className="mt-8 space-y-3">
            {bookings.map((booking) => (
              <li
                key={booking._id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 transition hover:border-teal/30 hover:shadow-md hover:shadow-teal/5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-deep">{booking.title}</p>
                  <p className="mt-0.5 text-sm text-slate">
                    {booking.customerName} · {dateFormat.format(new Date(booking.startTime))}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[booking.status]}`}
                >
                  {booking.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

export default DashboardPage