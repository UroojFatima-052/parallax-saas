import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import AuthLayout from '../components/AuthLayout.jsx'
import FormField from '../components/FormField.jsx'
import FormAlert from '../components/FormAlert.jsx'
import SubmitButton from '../components/SubmitButton.jsx'
import { getFieldErrors } from '../utils/validation.js'
import { apiRequest } from '../api/client.js'
import { saveSession } from '../utils/session.js'

const loginSchema = z.object({
  orgSlug: z.string().trim().min(1, 'Enter your organisation URL'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

function LoginPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ orgSlug: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const fieldErrors = getFieldErrors(loginSchema, values)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setLoading(true)
    try {
      const data = await apiRequest('/api/auth/login', { method: 'POST', body: values })
      saveSession(data)
      navigate('/dashboard')
    } catch (error) {
      setErrors(error.fieldErrors || {})
      setFormError(Object.keys(error.fieldErrors || {}).length ? '' : error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout caption="Your clients trust you with their time." subcaption="We help you keep that promise.">
      <h1 className="font-display text-3xl font-semibold text-deep">Welcome back</h1>
      <p className="mt-1.5 mb-7 text-sm text-slate">Sign in to your organisation</p>

      <form onSubmit={handleSubmit} noValidate>
        <FormAlert message={formError} />

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
        <FormField
          id="password"
          label="Password"
          type="password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="-mt-1 mb-4 text-right">
          <Link to="/reset-password" className="text-xs font-semibold text-teal hover:underline">
            Forgot password?
          </Link>
        </div>

        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>

      <div className="mt-7 space-y-1.5 text-center text-sm text-slate">
        <p>
          New business?{' '}
          <Link to="/onboard" className="font-semibold text-teal hover:underline">
            Create an organisation
          </Link>
        </p>
        <p>
          Joining your team?{' '}
          <Link to="/register" className="font-semibold text-teal hover:underline">
            Join an organisation
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage