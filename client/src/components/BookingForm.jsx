import { useState } from 'react'
import { z } from 'zod'
import FormField from './FormField.jsx'
import FormAlert from './FormAlert.jsx'
import { apiRequest, newIdempotencyKey } from '../api/client.js'
import { getFieldErrors } from '../utils/validation.js'
import { useToast } from '../hooks/useToast.js'
import { toDateInput, toTimeInput, combineDateTime } from '../utils/dates.js'

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const bookingFormSchema = z
  .object({
    title: z.string().trim().min(2, 'Enter a title').max(120, 'Use 120 characters or fewer'),
    customerName: z.string().trim().min(2, "Enter the customer's name").max(120, 'Use 120 characters or fewer'),
    customerEmail: z.union([z.string().trim().email('Enter a valid email'), z.literal('')]),
    date: z.string().min(1, 'Pick a date'),
    startTime: z.string().min(1, 'Pick a start time'),
    endTime: z.string().min(1, 'Pick an end time'),
    status: z.enum(['pending', 'confirmed', 'cancelled']),
    notes: z.string().max(2000, 'Notes are too long'),
  })
  .refine((values) => !values.startTime || !values.endTime || values.endTime > values.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  })

function initialValues(booking, start) {
  if (booking) {
    const bookingStart = new Date(booking.startTime)
    const bookingEnd = new Date(booking.endTime)
    return {
      title: booking.title,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail || '',
      date: toDateInput(bookingStart),
      startTime: toTimeInput(bookingStart),
      endTime: toTimeInput(bookingEnd),
      status: booking.status,
      notes: booking.notes || '',
    }
  }

  const end = new Date(start.getTime() + 60 * 60 * 1000)
  return {
    title: '',
    customerName: '',
    customerEmail: '',
    date: toDateInput(start),
    startTime: toTimeInput(start),
    endTime: toTimeInput(end),
    status: 'pending',
    notes: '',
  }
}

function BookingForm({ booking, start, token, onSaved, onCancel }) {
  const toast = useToast()
  const isEdit = Boolean(booking)
  const [values, setValues] = useState(() => initialValues(booking, start))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  async function save(payload, idempotencyKey) {
    setSaving(true)
    try {
      const data = await apiRequest(isEdit ? `/api/bookings/${booking._id}` : '/api/bookings', {
        method: isEdit ? 'PATCH' : 'POST',
        body: payload,
        token,
        idempotencyKey,
      })
      onSaved(data.booking, isEdit ? 'edit' : 'create')
    } catch (error) {
      const { body, ...fieldErrors } = error.fieldErrors || {}
      if (body) setFormError(body)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        return
      }

      const temporary = error.status === 0 || error.status >= 500
      if (temporary) {
        toast.error(error.message, { action: { label: 'Try again', onClick: () => save(payload, idempotencyKey) } })
      } else if (!body) {
        setFormError(error.message)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const fieldErrors = getFieldErrors(bookingFormSchema, values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    const payload = {
      title: values.title.trim(),
      customerName: values.customerName.trim(),
      customerEmail: values.customerEmail.trim(),
      startTime: combineDateTime(values.date, values.startTime).toISOString(),
      endTime: combineDateTime(values.date, values.endTime).toISOString(),
      status: values.status,
      notes: values.notes.trim(),
    }

    save(payload, newIdempotencyKey())
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormAlert message={formError} />

      <FormField
        id="title"
        label="What's the booking for?"
        value={values.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="General checkup"
        autoComplete="off"
      />
      <FormField
        id="customerName"
        label="Customer name"
        value={values.customerName}
        onChange={handleChange}
        error={errors.customerName}
        placeholder="Hamza Ali"
        autoComplete="off"
      />
      <FormField
        id="customerEmail"
        label="Customer email (optional)"
        type="email"
        value={values.customerEmail}
        onChange={handleChange}
        error={errors.customerEmail}
        placeholder="customer@mail.com"
        autoComplete="off"
      />
      <FormField id="date" label="Date" type="date" value={values.date} onChange={handleChange} error={errors.date} />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="startTime"
          label="Starts"
          type="time"
          value={values.startTime}
          onChange={handleChange}
          error={errors.startTime}
        />
        <FormField
          id="endTime"
          label="Ends"
          type="time"
          value={values.endTime}
          onChange={handleChange}
          error={errors.endTime}
        />
      </div>

      <fieldset className="mb-3.5">
        <legend className="mb-1.5 block text-xs font-semibold text-deep">Status</legend>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-mist p-1">
          {STATUSES.map((status) => (
            <label
              key={status.value}
              className={`cursor-pointer rounded-md px-2 py-2 text-center text-xs font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal/30 ${
                values.status === status.value ? 'bg-white text-teal shadow-sm' : 'text-slate hover:text-deep'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={status.value}
                checked={values.status === status.value}
                onChange={handleChange}
                className="sr-only"
              />
              {status.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-3.5">
        <label htmlFor="notes" className="mb-1 block text-xs font-semibold text-deep">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={values.notes}
          onChange={handleChange}
          placeholder="Anything the team should know"
          aria-invalid={Boolean(errors.notes)}
          className={`w-full resize-none rounded-lg border-[1.5px] bg-mist px-3.5 py-2.5 text-sm text-deep placeholder:text-slate/50 transition focus:bg-white focus:outline-none focus:ring-4 ${
            errors.notes ? 'border-rose focus:ring-rose/10' : 'border-line focus:border-teal focus:ring-teal/10'
          }`}
        />
        {errors.notes && <p className="mt-1 text-xs font-medium text-rose-dark">{errors.notes}</p>}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 flex-1 rounded-lg border border-line bg-white text-sm font-semibold text-deep transition hover:bg-mist"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-11 flex-[2] rounded-lg bg-rose text-sm font-semibold text-white transition hover:bg-rose-dark focus:outline-none focus:ring-4 focus:ring-rose/20 disabled:cursor-wait disabled:opacity-70"
        >
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create booking'}
        </button>
      </div>
    </form>
  )
}

export default BookingForm