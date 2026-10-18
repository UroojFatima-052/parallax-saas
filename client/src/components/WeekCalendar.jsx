import {
  HOUR_START,
  HOUR_END,
  isSameDay,
  formatDayShort,
  formatDayNumber,
  formatHour,
  formatTime,
  formatLongDate,
} from '../utils/dates.js'

const HOUR_HEIGHT = 56
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, index) => HOUR_START + index)

const BLOCK_STYLES = {
  confirmed: 'border-deep bg-teal text-paper hover:bg-deep',
  pending: 'border-rose bg-peach/60 text-deep hover:bg-peach',
  cancelled: 'border-line bg-mist text-slate line-through hover:bg-line/60',
}

function minutesIntoGrid(date) {
  return (date.getHours() - HOUR_START) * 60 + date.getMinutes()
}

function blockPosition(booking) {
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)

  const top = Math.min(Math.max(minutesIntoGrid(start), 0), TOTAL_MINUTES - 30)
  const rawBottom = isSameDay(start, end) ? Math.min(minutesIntoGrid(end), TOTAL_MINUTES) : TOTAL_MINUTES
  const bottom = Math.max(rawBottom, top + 30)

  return {
    top: (top / 60) * HOUR_HEIGHT + 1,
    height: ((bottom - top) / 60) * HOUR_HEIGHT - 3,
  }
}

function NowLine() {
  const minutes = minutesIntoGrid(new Date())
  if (minutes < 0 || minutes > TOTAL_MINUTES) return null

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
      style={{ top: (minutes / 60) * HOUR_HEIGHT }}
      aria-hidden="true"
    >
      <span className="-ml-1 h-2 w-2 rounded-full bg-rose" />
      <span className="h-px flex-1 bg-rose" />
    </div>
  )
}

function WeekCalendar({ days, bookings, loading, canCreate, onSelectBooking, onSelectSlot }) {
  const today = new Date()
  const columns = `52px repeat(${days.length}, minmax(0, 1fr))`

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-teal/5">
      <div className="grid border-b border-line bg-mist/70" style={{ gridTemplateColumns: columns }}>
        <div />
        {days.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="border-l border-line px-1 py-3 text-center">
              <p className={`text-xs font-semibold ${isToday ? 'text-rose' : 'text-slate'}`}>{formatDayShort(day)}</p>
              <p
                className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full font-display text-lg font-semibold ${
                  isToday ? 'bg-teal text-paper' : 'text-deep'
                }`}
              >
                {formatDayNumber(day)}
              </p>
            </div>
          )
        })}
      </div>

      <div className="max-h-[620px] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div>
            {HOURS.map((hour) => (
              <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                {hour !== HOUR_START && (
                  <span className="absolute -top-2 right-2 text-[11px] text-slate">{formatHour(hour)}</span>
                )}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const isToday = isSameDay(day, today)
            const dayBookings = bookings.filter((booking) => isSameDay(new Date(booking.startTime), day))

            return (
              <div key={day.toISOString()} className={`relative border-l border-line ${isToday ? 'bg-teal/[0.03]' : ''}`}>
                {HOURS.map((hour) => {
                  const slot = new Date(day)
                  slot.setHours(hour, 0, 0, 0)

                  return canCreate ? (
                    <button
                      key={hour}
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      aria-label={`New booking on ${formatLongDate(slot)} at ${formatTime(slot)}`}
                      className="block w-full border-t border-line/70 transition hover:bg-teal/5 focus:bg-teal/5 focus:outline-none"
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ) : (
                    <div key={hour} className="border-t border-line/70" style={{ height: HOUR_HEIGHT }} />
                  )
                })}

                {isToday && <NowLine />}

                {dayBookings.map((booking) => {
                  const position = blockPosition(booking)
                  const compact = position.height < 44

                  return (
                    <button
                      key={booking._id}
                      type="button"
                      onClick={() => onSelectBooking(booking)}
                      className={`absolute inset-x-1 z-20 overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left text-xs shadow-sm transition ${
                        BLOCK_STYLES[booking.status]
                      }`}
                      style={{ top: position.top, height: position.height }}
                    >
                      <p className="truncate font-semibold">{booking.title}</p>
                      {!compact && (
                        <p className="truncate opacity-80">
                          {formatTime(new Date(booking.startTime))} · {booking.customerName}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-white/70 text-sm font-medium text-slate">
          Loading bookings…
        </div>
      )}
    </div>
  )
}

export default WeekCalendar