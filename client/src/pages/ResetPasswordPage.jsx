import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { getFieldErrors } from '../utils/validation.js'

const resetSchema = z.object({
  orgSlug: z.string().trim().min(1, 'Enter your organisation URL'),
  email: z.string().trim().email('Enter a valid email'),
})

function ResetPasswordPage() {
  const [values, setValues] = useState({ orgSlug: '', email: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const fieldErrors = getFieldErrors(resetSchema, values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSent(true)
  }

  return (
    <AuthLayout caption="Getting locked out happens to everyone." subcaption="We'll get you back in.">
      {sent ? (
        <div>
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-teal">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-paper" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-semibold text-deep">Check your inbox</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate">
            If <span className="font-semibold text-deep">{values.email}</span> has an account at{' '}
            <span className="font-semibold text-deep">{values.orgSlug}</span>, we've sent a link to reset your
            password. It expires in 30 minutes.
          </p>

          <Link
            to="/login"
            className="mt-8 flex h-11 w-full items-center justify-center rounded-lg bg-rose text-sm font-semibold text-white transition hover:bg-rose-dark"
          >
            Back to sign in
          </Link>

          <p className="mt-5 text-center text-sm text-slate">
            Didn't get it?{' '}
            <button type="button" onClick={() => setSent(false)} className="font-semibold text-teal hover:underline">
              Try again
            </button>
          </p>
        </div>
      ) : (
        <>
          <h1 className="font-display text-3xl font-semibold text-deep">Reset your password</h1>
          <p className="mt-1.5 mb-7 text-sm text-slate">We'll email you a link to set a new one</p>

          <form onSubmit={handleSubmit} noValidate>
            <FormField
              id="orgSlug"
              label="Organisation URL"
              value={values.orgSlug}
              onChange={handleChange}
              error={errors.orgSlug}
              placeholder="city-clinic"
              autoComplete="organization"
            />
            <FormField
              id="email"
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@business.com"
              autoComplete="email"
            />

            <SubmitButton>Send reset link</SubmitButton>
          </form>

          <p className="mt-7 text-center text-sm text-slate">
            Remembered it?{' '}
            <Link to="/login" className="font-semibold text-teal hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

export default ResetPasswordPage