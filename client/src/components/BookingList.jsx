import StatusPill from './StatusPill.jsx'
import { isSameDay, formatLongDate, formatTime, formatDuration } from '../utils/dates.js'

function BookingList({ days, bookings, loading, canCreate, onSelectBooking, onCreate }) {
  if (loading) {
    return <p className="py-16 text-center text-sm text-slate">Loading bookings…</p>
  }

  const groups = days
    .map((day) => ({ day, items: bookings.filter((booking) => isSameDay(new Date(booking.startTime), day)) }))
    .filter((group) => group.items.length > 0)

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
        <p className="font-display text-xl text-deep">No bookings this week</p>
        <p className="mt-1 text-sm text-slate">Your next booking will show up here.</p>
        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 h-10 rounded-lg bg-rose px-5 text-sm font-semibold text-white transition hover:bg-rose-dark"
          >
            New booking
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {groups.map(({ day, items }) => (
        <section key={day.toISOString()}>
          <h2 className="mb-2.5 text-sm font-semibold text-slate">{formatLongDate(day)}</h2>
          <ul className="space-y-2">
            {items.map((booking) => {
              const start = new Date(booking.startTime)
              const end = new Date(booking.endTime)

              return (
                <li key={booking._id}>
                  <button
                    type="button"
                    onClick={() => onSelectBooking(booking)}
                    className="flex w-full flex-col gap-3 rounded-xl border border-line bg-white px-4 py-3.5 text-left transition hover:border-teal/40 hover:shadow-md hover:shadow-teal/5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 shrink-0">
                        <p className="text-sm font-semibold text-teal">{formatTime(start)}</p>
                        <p className="text-xs text-slate">{formatDuration(start, end)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate font-semibold text-deep ${booking.status === 'cancelled' ? 'line-through' : ''}`}>
                          {booking.title}
                        </p>
                        <p className="truncate text-sm text-slate">{booking.customerName}</p>
                      </div>
                    </div>
                    <StatusPill status={booking.status} />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default BookingList