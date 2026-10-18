export const HOUR_START = 7
export const HOUR_END = 21

const pad = (number) => String(number).padStart(2, '0')

export function startOfWeek(date) {
  const result = new Date(date)
  const daysSinceMonday = (result.getDay() + 6) % 7
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - daysSinceMonday)
  return result
}

export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const hourFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric' })
const dayShortFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })
const dayNumberFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric' })
const longDateFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export const formatTime = (date) => timeFormat.format(date)
export const formatHour = (hour) => hourFormat.format(new Date(2000, 0, 1, hour))
export const formatDayShort = (date) => dayShortFormat.format(date)
export const formatDayNumber = (date) => dayNumberFormat.format(date)
export const formatLongDate = (date) => longDateFormat.format(date)

export function formatWeekRange(weekStart) {
  const weekEnd = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const startText = new Intl.DateTimeFormat('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' }).format(weekStart)
  const endText = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(weekEnd)
  return `${startText} - ${endText}`
}

export function formatDuration(start, end) {
  const minutes = Math.round((end - start) / 60000)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

export function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toTimeInput(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function combineDateTime(dateValue, timeValue) {
  return new Date(`${dateValue}T${timeValue}`)
}