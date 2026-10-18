import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AppHeader from '../components/AppHeader.jsx'
import WeekCalendar from '../components/WeekCalendar.jsx'
import BookingList from '../components/BookingList.jsx'
import Drawer from '../components/Drawer.jsx'
import BookingDetails from '../components/BookingDetails.jsx'
import BookingForm from '../components/BookingForm.jsx'
import { apiRequest } from '../api/client.js'
import { getSession, clearSession } from '../utils/session.js'
import { useToast } from '../hooks/useToast.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import {
  startOfWeek,
  addDays,
  isSameDay,
  formatWeekRange,
  formatDayShort,
  formatDayNumber,
} from '../utils/dates.js'

function todayAtMidnight() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function nextFullHour() {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return date
}

function BookingsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [session] = useState(getSession)
  const token = session?.token

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDay, setSelectedDay] = useState(todayAtMidnight)
  const [view, setView] = useState('calendar')
  const [result, setResult] = useState({ key: null, bookings: [], error: null })
  const [reloadCount, setReloadCount] = useState(0)
  const [panel, setPanel] = useState(null)

  const rangeKey = weekStart.toISOString()
  const loading = result.key !== rangeKey

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const from = weekStart.toISOString()
    const to = addDays(weekStart, 7).toISOString()

    apiRequest(`/api/bookings?from=${from}&to=${to}`, { token })
      .then((data) => {
        if (!cancelled) setResult({ key: from, bookings: data.bookings, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        if (error.status === 401) {
          clearSession()
          navigate('/login', { replace: true })
          return
        }
        setResult({ key: from, bookings: [], error })
      })

    return () => {
      cancelled = true
    }
  }, [weekStart, token, reloadCount, navigate])

  const closePanel = useCallback(() => setPanel(null), [])

  if (!session) return <Navigate to="/login" replace />

  const { user } = session
  const can = (permission) => user.permissions.includes(permission)
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const calendarDays = isDesktop ? days : days.filter((day) => isSameDay(day, selectedDay))
  const activeCount = result.bookings.filter((booking) => booking.status !== 'cancelled').length

  function goToWeek(date) {
    const start = startOfWeek(date)
    const today = todayAtMidnight()
    setWeekStart(start)
    setSelectedDay(isSameDay(start, startOfWeek(today)) ? today : start)
  }

  function refresh() {
    setReloadCount((count) => count + 1)
  }

  function retryLoad() {
    setResult((current) => ({ ...current, key: null }))
    refresh()
  }

  function openCreate(start = nextFullHour()) {
    setPanel({ type: 'create', start })
  }

  function handleSaved(booking, mode) {
    toast.success(mode === 'create' ? 'Booking created' : 'Changes saved')
    const bookingStart = new Date(booking.startTime)

    if (startOfWeek(bookingStart).getTime() !== weekStart.getTime()) {
      goToWeek(bookingStart)
    } else {
      refresh()
    }
    setPanel({ type: 'details', id: booking._id })
  }

  function handleDeleted() {
    toast.success('Booking deleted')
    setPanel(null)
    refresh()
  }

  function signOut() {
    clearSession()
    navigate('/login')
  }

  const panelTitle =
    panel?.type === 'create' ? 'New booking' : panel?.type === 'edit' ? 'Edit booking' : 'Booking details'

  return (
    <div className="min-h-screen bg-white">
      <AppHeader user={user} onSignOut={signOut} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-rose">{user.tenant.slug}.tessera.app</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-deep">Bookings</h1>
            <p className="mt-1 text-sm text-slate">
              {loading
                ? 'Loading this week…'
                : `${activeCount} active ${activeCount === 1 ? 'booking' : 'bookings'} this week`}
            </p>
          </div>

          {can('bookings:create') && (
            <button
              type="button"
              onClick={() => openCreate()}
              className="h-11 rounded-lg bg-rose px-5 text-sm font-semibold text-white shadow-sm shadow-rose/30 transition hover:bg-rose-dark focus:outline-none focus:ring-4 focus:ring-rose/20"
            >
              New booking
            </button>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToWeek(addDays(weekStart, -7))}
              aria-label="Previous week"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-lg text-deep transition hover:bg-mist"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goToWeek(new Date())}
              className="h-9 rounded-lg border border-line px-3 text-sm font-semibold text-deep transition hover:bg-mist"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => goToWeek(addDays(weekStart, 7))}
              aria-label="Next week"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-lg text-deep transition hover:bg-mist"
            >
              ›
            </button>
            <p className="ml-2 font-display text-lg font-medium text-deep">{formatWeekRange(weekStart)}</p>
          </div>

          <div role="tablist" aria-label="View" className="inline-flex w-fit rounded-lg border border-line bg-mist p-1">
            {[
              { value: 'calendar', label: 'Calendar' },
              { value: 'list', label: 'List' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={view === option.value}
                onClick={() => setView(option.value)}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                  view === option.value ? 'bg-white text-teal shadow-sm' : 'text-slate hover:text-deep'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {view === 'calendar' && !isDesktop && (
          <div className="mt-4 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const selected = isSameDay(day, selectedDay)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-pressed={selected}
                  className={`rounded-lg py-2 text-center transition ${
                    selected ? 'bg-teal text-paper' : 'text-deep hover:bg-mist'
                  }`}
                >
                  <span className="block text-[11px] font-medium opacity-80">{formatDayShort(day)}</span>
                  <span className="block font-display text-base font-semibold">{formatDayNumber(day)}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-4">
          {result.error && !loading ? (
            <div className="rounded-2xl border border-rose/30 bg-rose/5 px-6 py-12 text-center">
              <p className="font-display text-lg text-deep">Couldn't load bookings</p>
              <p className="mt-1 text-sm text-slate">{result.error.message}</p>
              <button
                type="button"
                onClick={retryLoad}
                className="mt-4 h-10 rounded-lg bg-teal px-5 text-sm font-semibold text-paper transition hover:bg-deep"
              >
                Try again
              </button>
            </div>
          ) : view === 'calendar' ? (
            <WeekCalendar
              days={calendarDays}
              bookings={result.bookings}
              loading={loading}
              canCreate={can('bookings:create')}
              onSelectBooking={(booking) => setPanel({ type: 'details', id: booking._id })}
              onSelectSlot={openCreate}
            />
          ) : (
            <BookingList
              days={days}
              bookings={result.bookings}
              loading={loading}
              canCreate={can('bookings:create')}
              onSelectBooking={(booking) => setPanel({ type: 'details', id: booking._id })}
              onCreate={() => openCreate()}
            />
          )}
        </div>
      </main>

      <Drawer open={Boolean(panel)} title={panelTitle} onClose={closePanel}>
        {panel?.type === 'details' && (
          <BookingDetails
            key={panel.id}
            bookingId={panel.id}
            token={token}
            canEdit={can('bookings:update')}
            canDelete={can('bookings:delete')}
            onEdit={(booking) => setPanel({ type: 'edit', booking })}
            onDeleted={handleDeleted}
          />
        )}
        {panel?.type === 'create' && (
          <BookingForm key="create" start={panel.start} token={token} onSaved={handleSaved} onCancel={closePanel} />
        )}
        {panel?.type === 'edit' && (
          <BookingForm
            key={`edit-${panel.booking._id}`}
            booking={panel.booking}
            token={token}
            onSaved={handleSaved}
            onCancel={() => setPanel({ type: 'details', id: panel.booking._id })}
          />
        )}
      </Drawer>
    </div>
  )
}

export default BookingsPage