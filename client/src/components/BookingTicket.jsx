import { formatTime, formatDuration } from '../utils/dates.js'

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

const THEMES = {
  pending: {
    top: 'bg-white',
    title: 'text-deep',
    sub: 'text-slate',
    pill: 'bg-peach/30 text-rose-dark',
    label: 'Waiting to confirm',
    seal: 'border-2 border-dashed border-rose',
  },
  confirmed: {
    top: 'bg-teal',
    title: 'text-paper',
    sub: 'text-paper/80',
    pill: 'bg-paper/15 text-peach',
    label: 'Confirmed',
    seal: 'bg-rose shadow-[0_0_0_3px_rgba(217,88,107,0.3)]',
  },
  cancelled: {
    top: 'bg-mist',
    title: 'text-slate line-through',
    sub: 'text-slate',
    pill: 'bg-line text-slate',
    label: 'Cancelled',
    seal: 'bg-line',
  },
}

function TicketFact({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold tracking-wide text-slate uppercase">{label}</dt>
      <dd className="mt-0.5 truncate font-display text-base font-semibold text-deep">{value}</dd>
    </div>
  )
}

function BookingTicket({ booking }) {
  const theme = THEMES[booking.status] || THEMES.pending
  const start = new Date(booking.startTime)
  const end = new Date(booking.endTime)
  const hasValidTimes = !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-teal/10">
      <div className={`px-5 pt-5 pb-6 transition-colors duration-300 ${theme.top}`}>
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${theme.pill}`}>
            {theme.label}
          </span>
          <span className={`h-3.5 w-3.5 rotate-45 ${theme.seal}`} aria-hidden="true" />
        </div>
        <p
          className={`mt-3 font-display text-2xl leading-tight font-semibold break-words ${
            booking.title ? theme.title : 'text-slate/40'
          }`}
        >
          {booking.title || 'Booking title'}
        </p>
        <p className={`mt-1 truncate text-sm ${theme.sub}`}>
          {booking.customerName || 'Customer name'}
          {booking.customerEmail ? ` · ${booking.customerEmail}` : ''}
        </p>
      </div>

      <div className="relative mx-3 border-t-2 border-dashed border-line" aria-hidden="true">
        <span className="absolute -top-2 -left-5 h-3.5 w-3.5 rounded-full bg-paper" />
        <span className="absolute -top-2 -right-5 h-3.5 w-3.5 rounded-full bg-paper" />
      </div>

      <dl className="grid grid-cols-3 gap-2 px-5 pt-3 pb-5">
        <TicketFact label="Day" value={hasValidTimes ? dayFormat.format(start) : '-'} />
        <TicketFact label="Time" value={hasValidTimes ? formatTime(start) : '-'} />
        <TicketFact label="Length" value={hasValidTimes ? formatDuration(start, end) : '-'} />
      </dl>
    </div>
  )
}

export default BookingTicket